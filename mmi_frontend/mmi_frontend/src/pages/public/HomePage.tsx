import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { BarChart3, ChevronRight, Calendar, ArrowRight, FileText, Scale, Briefcase } from 'lucide-react'
import { portailAPI, autorisationsAPI } from '@/utils/api'
import L from 'leaflet'

// Marqueurs Leaflet personnalisés
const createIcon = (color: string) => L.divIcon({
  html: `<div style="width:28px;height:36px;position:relative">
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
  id: number
  titre: string
  image: string
  date_publication: string
  slug: string
  contenu: string
}

interface GeoFeature {
  geometry: { coordinates: [number, number] }
  properties: { id: number; numero_auto: string; type: string; wilaya: string; adresse: string }
}

interface Stats { total: number; par_type: { type: string; count: number }[] }

export default function HomePage() {
  const { t } = useTranslation()
  const [actualites, setActualites] = useState<Actualite[]>([])
  const [features, setFeatures]     = useState<GeoFeature[]>([])
  const [stats, setStats]           = useState<Stats | null>(null)
  const [loading, setLoading]       = useState(true)
  const [activeDoc, setActiveDoc]   = useState<'juridique' | 'projet' | 'annexe'>('juridique')

  // ── Données statiques par défaut (affichées tant que la BDD n'est pas alimentée) ──
  const STATS_DEFAUT = { total: 0, usines: 0, boulangeries: 0 }

  const MARQUEURS_DEFAUT: GeoFeature[] = []

  useEffect(() => {
    const load = async () => {
      try {
        const [actRes, geoRes, statsRes] = await Promise.all([
          portailAPI.actualites({ page_size: 6 }),
          autorisationsAPI.geojson(),
          autorisationsAPI.stats(),
        ])
        setActualites(actRes.data.results || actRes.data)
        // Si l'API retourne des données, on les utilise. Sinon marqueurs par défaut.
        const feats = geoRes.data.features || []
        setFeatures(feats.length > 0 ? feats : MARQUEURS_DEFAUT)
        setStats(statsRes.data)
      } catch {
        // Backend pas encore lancé : utiliser les données statiques
        setFeatures(MARQUEURS_DEFAUT)
      }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const usines       = stats?.par_type.find(p => p.type === 'UNITE' || p.type === 'USINE_EAU')?.count ?? STATS_DEFAUT.usines
  const boulangeries = stats?.par_type.find(p => p.type === 'BP')?.count ?? STATS_DEFAUT.boulangeries
  const total        = stats?.total ?? STATS_DEFAUT.total

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO BANNER — image pure sans texte ──────────── */}
      <div className="w-full overflow-hidden bg-mmi-green" style={{ maxHeight: 320 }}>
        <img
          src="/images/banner_mmi.jpg"
          alt="Ministère des Mines et de l'Industrie"
          className="w-full h-full object-cover object-center block"
          style={{ maxHeight: 320 }}
          onError={e => {
            const el = e.currentTarget
            el.style.display = 'none'
          }}
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
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
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
                    <img src={actu.image} alt={actu.titre} className="w-full h-full object-cover" />
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
                    {actu.titre}
                  </h3>
                  <Link
                    to={`/actualites/${actu.slug}`}
                    className="text-mmi-green text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all"
                  >
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

          {/* Onglets */}
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
        <h2 className="section-title text-2xl mb-8">{t('home.carto_title')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Carte */}
          <div className="lg:col-span-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 420 }}>
            <MapContainer
              center={[20.0, -10.0]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
              />
              {features.map(f => (
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

          {/* Panel statistiques */}
          <div className="lg:col-span-1">
            <div className="card p-5 h-full">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-5 pb-3 border-b border-gray-100">
                <BarChart3 size={18} className="text-mmi-green" />
                Statistiques
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-mmi-green-lt border border-green-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-mmi-green mb-1">
                    <div className="w-3 h-3 rounded-full bg-mmi-green" />
                    Autorisées
                  </div>
                  <p className="text-2xl font-bold text-mmi-green">{total.toLocaleString()}</p>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Autorisées par type</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <div className="w-3 h-3 rounded-full bg-mmi-green" />
                        <span className="text-xs text-gray-600">Usine</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800">{usines}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-xs text-gray-600">Boulangerie</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800">{boulangeries}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="navbar-mmi py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Soumettez votre demande d'autorisation industrielle
          </h2>
          <p className="text-white/80 mb-8">
            Déposez votre dossier en ligne, suivez son avancement en temps réel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/inscription"
              className="bg-white text-mmi-green font-bold px-8 py-3 rounded-full hover:bg-yellow-50 transition-colors shadow-lg"
            >
              Créer un compte demandeur
            </Link>
            <Link
              to="/connexion"
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white/10 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// Sous-composant documents
function DocumentSection({ categorie }: { categorie: 'JURIDIQUE' | 'PROJET' | 'ANNEXE' }) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portailAPI.documents({ categorie })
      .then(r => setDocs(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [categorie])

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>
  )

  if (!docs.length) return (
    <p className="text-gray-400 text-sm py-6 text-center">Aucun document disponible.</p>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {docs.map(doc => (
        <a
          key={doc.id}
          href={doc.fichier}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-mmi-green hover:bg-mmi-green-lt transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-mmi-green-lt group-hover:bg-white flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-mmi-green" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{doc.titre}</p>
            <p className="text-xs text-gray-400">{doc.langue?.toUpperCase()}</p>
          </div>
        </a>
      ))}
    </div>
  )
}
