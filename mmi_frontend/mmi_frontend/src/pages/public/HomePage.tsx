import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n/i18n'

/** Retourne le titre/contenu dans la langue active, avec fallback FR */
function getLang(obj: any, field: string): string {
  const lang = i18n.language
  if (lang === 'ar' && obj?.[field + '_ar']) return obj[field + '_ar']
  if (lang === 'en' && obj?.[field + '_en']) return obj[field + '_en']
  return obj?.[field] || ''
}
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { BarChart3, ChevronRight, Calendar, ArrowRight, FileText, Scale, Briefcase } from 'lucide-react'
import { portailAPI, autorisationsAPI } from '@/utils/api'
import L from 'leaflet'

const createIcon = (color: string) => L.divIcon({
  html: `<div style="width:28px;height:36px">
    <svg viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
})

const iconVert   = createIcon('#1B6B30')
const iconOrange = createIcon('#F97316')

interface Actualite {
  id: number; titre: string; image: string
  date_publication: string; slug: string; contenu: string
}
interface GeoFeature {
  geometry: { coordinates: [number, number] }
  properties: { id: number; numero_auto: string; type: string; wilaya: string; adresse: string }
}
interface Stats { total: number; par_type: { type: string; count: number }[] }

type FiltreType = 'tous' | 'usines' | 'boulangeries'

// ── Composant qui gère UNIQUEMENT le scroll molette ───────────
// La carte est TOUJOURS interactive (drag, zoom +/−, double-clic).
// Seul le scroll molette est désactivé par défaut pour ne pas
// capturer le scroll de la page. Un clic sur la carte l'active.
function ScrollWheelGuard() {
  const map = useMap()
  const [wheelActive, setWheelActive] = useState(false)

  useEffect(() => {
    // Désactiver scroll molette au démarrage
    map.scrollWheelZoom.disable()

    const container = map.getContainer()

    const onContainerClick = () => {
      map.scrollWheelZoom.enable()
      setWheelActive(true)
    }

    const onDocClick = (e: MouseEvent) => {
      if (!container.contains(e.target as Node)) {
        map.scrollWheelZoom.disable()
        setWheelActive(false)
      }
    }

    container.addEventListener('click', onContainerClick)
    document.addEventListener('click', onDocClick)

    return () => {
      container.removeEventListener('click', onContainerClick)
      document.removeEventListener('click', onDocClick)
    }
  }, [map])

  // Indicateur visuel discret quand scroll molette inactif
  if (wheelActive) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        background: 'rgba(0,0,0,0.55)',
        color: 'white',
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 20,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      Cliquer pour activer le zoom molette
    </div>
  )
}

export default function HomePage() {
  const { t, i18n: _i18n } = useTranslation()  // re-render au changement de langue
  const [actualites, setActualites] = useState<Actualite[]>([])
  const [features, setFeatures]     = useState<GeoFeature[]>([])
  const [stats, setStats]           = useState<Stats | null>(null)
  const [loading, setLoading]       = useState(true)
  const [activeDoc, setActiveDoc]   = useState<'juridique' | 'projet' | 'annexe'>('juridique')
  const [filtreType, setFiltreType] = useState<FiltreType>('tous')

  useEffect(() => {
    // Charger chaque section indépendamment — un échec ne bloque pas les autres
    const loadActualites = async () => {
      try {
        // Essayer avec filtre langue, fallback sans filtre si 500
        let res
        try {
          res = await portailAPI.actualites({ page_size: 6, langue: i18n.language })
        } catch {
          res = await portailAPI.actualites({ page_size: 6 })
        }
        setActualites(res.data.results || res.data)
      } catch { /* silencieux */ }
    }

    const loadGeo = async () => {
      try {
        const res = await autorisationsAPI.geojson()
        setFeatures(res.data.features || [])
      } catch { /* silencieux */ }
    }

    const loadStats = async () => {
      try {
        const res = await autorisationsAPI.stats()
        setStats(res.data)
      } catch { /* silencieux */ }
      finally { setLoading(false) }
    }

    loadActualites()
    loadGeo()
    loadStats()
  }, [])

  const usines       = stats?.par_type.find(p => p.type === 'UNITE' || p.type === 'USINE_EAU')?.count ?? 0
  const boulangeries = stats?.par_type.find(p => p.type === 'BP')?.count ?? 0
  const total        = stats?.total ?? 0

  const featuresFiltrees = features.filter(f => {
    if (filtreType === 'tous') return true
    if (filtreType === 'boulangeries') return f.properties.type === 'BP'
    return f.properties.type !== 'BP'
  })

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO BANNER ───────────────────────────────────── */}
      <div className="w-full overflow-hidden bg-mmi-green" style={{ maxHeight: 320 }}>
        <img
          src="/images/banner_mmi.jpg"
          alt="Ministère des Mines et de l'Industrie"
          className="w-full h-full object-cover object-center block"
          style={{ maxHeight: 320 }}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      </div>

      {/* ── ACTUALITÉS ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title text-2xl">{t('home.actualites')}</h2>
            <p className="text-gray-500 text-sm mt-2">{t('home.actualites_sub')}</p>
            <div className="h-0.5 w-48 bg-mmi-green mt-2 rounded" />
          </div>
          <Link to="/actualites" className="flex items-center gap-1 text-mmi-green text-sm font-medium hover:underline">
            Voir tout <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-44 bg-gray-200 rounded-t-xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : actualites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actualites.map((actu, i) => (
              <article key={actu.id} className={`card animate-fadeInUp stagger-${Math.min(i+1,3)}`}>
                <div className="h-44 bg-gray-100 rounded-t-xl overflow-hidden">
                  {actu.image ? (
                    <img src={actu.image} alt={getLang(actu, 'titre')} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-mmi-green-lt">
                      <FileText size={40} className="text-mmi-green opacity-30" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Calendar size={12} />
                    {new Date(actu.date_publication).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-3 line-clamp-2">
                    {getLang(actu, 'titre')}
                  </h3>
                  <Link to={`/actualites/${actu.slug}`}
                        className="text-mmi-green text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">
                    Lire la suite <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p>Aucune actualité disponible</p>
          </div>
        )}
      </section>

      {/* ── ESPACE DOCUMENTAIRE ─────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="section-title text-2xl mb-8">Espace documentaire & projets</h2>
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {[
              { key: 'juridique', label: 'Documents juridiques', icon: Scale },
              { key: 'projet',    label: 'Banque des projets',   icon: Briefcase },
              { key: 'annexe',    label: 'Documents annexes',    icon: FileText },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveDoc(tab.key as typeof activeDoc)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${activeDoc === tab.key
                    ? 'border-mmi-green text-mmi-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
          <DocumentSection categorie={activeDoc.toUpperCase() as 'JURIDIQUE' | 'PROJET' | 'ANNEXE'} />
        </div>
      </section>

      {/* ── CARTOGRAPHIE ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="section-title text-2xl mb-6">{t('home.carto_title')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Carte */}
          <div className="lg:col-span-3 space-y-2">
            <div style={{
              position: 'relative', height: 450, borderRadius: 12,
              overflow: 'hidden', border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <MapContainer
                center={[20.5, -10.5]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                touchZoom={true}
                doubleClickZoom={true}
                dragging={true}
                zoomControl={true}
                keyboard={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />
                <ScrollWheelGuard />
                {featuresFiltrees.map(f => (
                  <Marker
                    key={f.properties.id}
                    position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
                    icon={f.properties.type === 'BP' ? iconOrange : iconVert}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold text-mmi-green">{f.properties.numero_auto}</p>
                        <p className="text-gray-600">{f.properties.type}</p>
                        <p className="text-gray-500 text-xs">{f.properties.wilaya}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Glissez pour naviguer · Boutons <strong>+</strong> / <strong>−</strong> pour zoomer · Cliquez sur la carte pour activer le zoom molette
            </p>
          </div>

          {/* Panel statistiques */}
          <div className="lg:col-span-1">
            <div className="card p-5">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">
                <BarChart3 size={18} className="text-mmi-green" />
                Statistiques
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setFiltreType('tous')}
                  className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer
                    ${filtreType === 'tous'
                      ? 'bg-mmi-green-lt border-mmi-green ring-2 ring-mmi-green/20'
                      : 'bg-mmi-green-lt border-green-200 hover:border-mmi-green hover:shadow-sm'}`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-mmi-green mb-1">
                    <div className="w-3 h-3 rounded-full bg-mmi-green flex-shrink-0" />
                    <span>Toutes autorisées</span>
                    {filtreType === 'tous' && (
                      <span className="ml-auto text-xs bg-mmi-green text-white px-1.5 py-0.5 rounded-full">actif</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-mmi-green">{total.toLocaleString()}</p>
                </button>

                <button
                  onClick={() => setFiltreType('usines')}
                  className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer
                    ${filtreType === 'usines'
                      ? 'bg-green-50 border-mmi-green ring-2 ring-mmi-green/20'
                      : 'bg-gray-50 border-gray-200 hover:border-mmi-green hover:shadow-sm'}`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
                    <div className="w-3 h-3 rounded-full bg-mmi-green flex-shrink-0" />
                    <span>Usines industrielles</span>
                    {filtreType === 'usines' && (
                      <span className="ml-auto text-xs bg-mmi-green text-white px-1.5 py-0.5 rounded-full">actif</span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-gray-800">{usines}</p>
                </button>

                <button
                  onClick={() => setFiltreType('boulangeries')}
                  className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer
                    ${filtreType === 'boulangeries'
                      ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200'
                      : 'bg-gray-50 border-gray-200 hover:border-orange-400 hover:shadow-sm'}`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
                    <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
                    <span>Boulangeries / BP</span>
                    {filtreType === 'boulangeries' && (
                      <span className="ml-auto text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">actif</span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-gray-800">{boulangeries}</p>
                </button>

                <div className="pt-2 border-t border-gray-100 text-center text-xs text-gray-400">
                  {featuresFiltrees.length} marqueur(s) affiché(s)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

// Sous-composant documents
function DocumentSection({ categorie }: { categorie: 'JURIDIQUE' | 'PROJET' | 'ANNEXE' }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setItems([])
    const fetchDocs = async () => {
      if (categorie === 'PROJET') {
        const r = await portailAPI.projets({})
        return r.data.results || r.data
      }
      // Filtrer par langue active — si aucun résultat, ne rien afficher
      const lang = i18n.language
      const r = await portailAPI.documents({ categorie, langue: lang })
      return r.data.results || r.data
    }

    fetchDocs()
      .then(items => setItems(items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [categorie])

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>
  )

  if (!items.length) return (
    <div className="text-center py-10 text-gray-400">
      <FileText size={36} className="mx-auto mb-2 opacity-20" />
      <p className="text-sm">Aucun élément disponible pour le moment.</p>
    </div>
  )

  if (categorie === 'PROJET') return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((p: any) => (
        <div key={p.id}
             className="card p-4 hover:shadow-md transition-all border border-gray-100 hover:border-mmi-green">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase size={17} className="text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 leading-snug">{p.titre}</p>
              <p className="text-xs text-green-600 font-medium mt-0.5">{p.secteur}</p>
              {p.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {p.budget_estime && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                    {Number(p.budget_estime).toLocaleString('fr-FR')} MRU
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full
                  ${p.statut === 'ouvert'   ? 'bg-green-100 text-green-700' :
                    p.statut === 'en_cours' ? 'bg-blue-100 text-blue-700'   :
                    'bg-gray-100 text-gray-500'}`}>
                  {p.statut === 'ouvert' ? 'Ouvert' : p.statut === 'en_cours' ? 'En cours' : 'Clôturé'}
                </span>
              </div>
              {p.fichier && (
                <a href={p.fichier} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1 text-xs text-mmi-green hover:underline mt-2">
                  <FileText size={11} /> Télécharger la fiche
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((doc: any) => (
        <a key={doc.id}
           href={doc.fichier}
           target="_blank"
           rel="noreferrer"
           className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-mmi-green hover:bg-mmi-green-lt transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-red-50 group-hover:bg-white flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{doc.titre}</p>
            <p className="text-xs text-gray-400 mt-0.5 uppercase">{doc.langue || 'FR'}</p>
          </div>
        </a>
      ))}
    </div>
  )
}
