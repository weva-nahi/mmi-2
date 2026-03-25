import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle, Ruler } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { api, autorisationsAPI } from '@/utils/api'
import L from 'leaflet'
import toast from 'react-hot-toast'

const iconRouge  = L.divIcon({
  html: `<div style="width:20px;height:26px"><svg viewBox="0 0 28 36" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#EF4444"/><circle cx="14" cy="14" r="6" fill="white"/></svg></div>`,
  className: '', iconSize: [20, 26], iconAnchor: [10, 26],
})
const iconOrange = L.divIcon({
  html: `<div style="width:20px;height:26px"><svg viewBox="0 0 28 36" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#F97316"/><circle cx="14" cy="14" r="6" fill="white"/></svg></div>`,
  className: '', iconSize: [20, 26], iconAnchor: [10, 26],
})

interface Boulangerie {
  id: number
  numero_auto: string
  latitude: number
  longitude: number
  wilaya: string
  adresse: string
  distance?: number
}

export default function Distance500m() {
  const { id } = useParams()
  const [demande, setDemande]         = useState<any>(null)
  const [boulangeries, setBoulangeries] = useState<Boulangerie[]>([])
  const [proches, setProches]         = useState<(Boulangerie & { distance: number })[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get(`/demandes/${id}/`),
      autorisationsAPI.geojson(),
    ]).then(([dRes, geoRes]) => {
      const d = dRes.data
      setDemande(d)
      const features = geoRes.data.features || []
      const bps = features
        .filter((f: any) => f.properties.type === 'BP')
        .map((f: any) => ({
          id:         f.properties.id,
          numero_auto: f.properties.numero_auto,
          latitude:   f.geometry.coordinates[1],
          longitude:  f.geometry.coordinates[0],
          wilaya:     f.properties.wilaya,
          adresse:    f.properties.adresse,
        }))
      setBoulangeries(bps)

      // Calculer distances si GPS disponible
      if (d.latitude && d.longitude) {
        const withDist = bps.map((b: Boulangerie) => ({
          ...b,
          distance: haversine(d.latitude, d.longitude, b.latitude, b.longitude),
        }))
        const sorted = withDist.sort((a: any, b: any) => a.distance - b.distance)
        setProches(sorted.slice(0, 10))
      }
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [id])

  // Formule Haversine — distance en mètres entre 2 coordonnées GPS
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  const plusProche = proches[0]
  const conforme   = !plusProche || plusProche.distance > 500

  const enregistrer = async () => {
    if (!plusProche) { toast.error('Aucune boulangerie existante pour comparaison'); return }
    setSaving(true)
    try {
      await api.post('/distances-boulangerie/', {
        demande:         id,
        distance_metres: Math.round(plusProche.distance),
        conforme_500m:   conforme,
        reference_auto:  plusProche.numero_auto,
        latitude_ref:    plusProche.latitude,
        longitude_ref:   plusProche.longitude,
      })
      toast.success('Distance enregistrée dans le dossier')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/ddpi/dossier/${id}`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-mmi-green">
          <ArrowLeft size={16} /> Retour au dossier
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-700">Vérification distance 500m</span>
      </div>

      {/* Résultat principal */}
      <div className={`card p-6 mb-6 border-l-4 ${conforme ? 'border-green-500' : 'border-red-500'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
            ${conforme ? 'bg-green-100' : 'bg-red-100'}`}>
            {conforme
              ? <CheckCircle size={28} className="text-green-600" />
              : <AlertTriangle size={28} className="text-red-600" />
            }
          </div>
          <div>
            <p className={`text-xl font-bold ${conforme ? 'text-green-700' : 'text-red-700'}`}>
              {conforme ? 'Conforme — Distance > 500m' : 'Non conforme — Distance < 500m'}
            </p>
            {plusProche && (
              <p className="text-gray-600 text-sm mt-1">
                Boulangerie la plus proche : <strong>{plusProche.numero_auto}</strong> —{' '}
                <strong className={conforme ? 'text-green-600' : 'text-red-600'}>
                  {Math.round(plusProche.distance)} m
                </strong>
              </p>
            )}
            {!demande?.latitude && (
              <p className="text-amber-600 text-sm mt-1">
                ⚠️ Coordonnées GPS du demandeur non renseignées
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Carte */}
        {demande?.latitude && (
          <div className="lg:col-span-2 rounded-xl overflow-hidden border border-gray-200 shadow-sm"
               style={{ height: 400 }}>
            <MapContainer
              center={[demande.latitude, demande.longitude]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Marqueur demande courante */}
              <Marker position={[demande.latitude, demande.longitude]} icon={iconRouge}>
                <Popup>
                  <p className="font-semibold text-red-600">📍 Nouvelle boulangerie</p>
                  <p className="text-sm">{demande.raison_sociale}</p>
                </Popup>
              </Marker>

              {/* Cercle 500m */}
              <Circle
                center={[demande.latitude, demande.longitude]}
                radius={500}
                pathOptions={{ color: conforme ? '#16a34a' : '#dc2626', fillOpacity: 0.08, weight: 2 }}
              />

              {/* Boulangeries existantes */}
              {proches.slice(0, 5).map(b => (
                <Marker key={b.id} position={[b.latitude, b.longitude]} icon={iconOrange}>
                  <Popup>
                    <p className="font-semibold text-orange-600">{b.numero_auto}</p>
                    <p className="text-sm">{b.adresse}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Distance : <strong>{Math.round(b.distance)} m</strong>
                    </p>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Liste des proches */}
        <div className={`lg:col-span-${demande?.latitude ? 1 : 3}`}>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <Ruler size={16} className="text-mmi-green" />
              Boulangeries les plus proches
            </h3>

            {proches.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                Aucune boulangerie autorisée dans la base
              </p>
            ) : (
              <div className="space-y-2">
                {proches.slice(0, 8).map((b, i) => (
                  <div key={b.id}
                       className={`flex items-center justify-between p-3 rounded-lg text-sm
                         ${i === 0 && b.distance < 500 ? 'bg-red-50 border border-red-200' :
                           i === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-medium text-gray-800 text-xs">{b.numero_auto}</p>
                      <p className="text-xs text-gray-500">{b.wilaya}</p>
                    </div>
                    <span className={`font-bold text-sm ${b.distance < 500 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.round(b.distance)} m
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton enregistrer */}
            {plusProche && (
              <button
                onClick={enregistrer}
                disabled={saving}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-sm"
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><MapPin size={14} /> Enregistrer dans le dossier</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}