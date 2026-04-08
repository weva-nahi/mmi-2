import React, { useEffect, useState } from 'react'
import i18n from '@/i18n/i18n'

function getLang(obj: any, field: string): string {
  const lang = i18n.language
  if (lang === 'ar' && obj?.[field + '_ar']) return obj[field + '_ar']
  if (lang === 'en' && obj?.[field + '_en']) return obj[field + '_en']
  return obj?.[field] || ''
}

import { useParams, Link } from 'react-router-dom'
import { Calendar, ArrowLeft, ChevronRight, FileText, Share2 } from 'lucide-react'
import { portailAPI } from '@/utils/api'

interface Article {
  id: number
  titre: string
  titre_en?: string
  titre_ar?: string
  contenu_en?: string
  contenu_ar?: string
  slug: string
  contenu: string
  image: string
  date_publication: string
  auteur_nom: string
}

export default function ArticleDetailPage() {
  const { slug } = useParams()
  const [article, setArticle]     = useState<Article | null>(null)
  const [recents, setRecents]     = useState<Article[]>([])
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    // Récupérer l'article directement par slug
    portailAPI.actualiteBySlug(slug)
      .then(r => setArticle(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))

    // Charger les articles récents
    portailAPI.actualites({ page_size: 4 })
      .then(r => setRecents((r.data.results || r.data).filter((a: Article) => a.slug !== slug).slice(0, 3)))
      .catch(() => {})
  }, [slug])

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-4">
      <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse" />
      <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
    </div>
  )

  if (notFound || !article) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <FileText size={52} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Article introuvable</h2>
        <p className="text-gray-500 text-sm mb-4">Cet article n'existe pas ou a été supprimé.</p>
        <Link to="/actualites" className="btn-primary text-sm">
          Retour aux actualités
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-mmi-green transition-colors">Accueil</Link>
          <ChevronRight size={13} />
          <Link to="/actualites" className="hover:text-mmi-green transition-colors">Actualités</Link>
          <ChevronRight size={13} />
          <span className="text-gray-700 font-medium line-clamp-1">{article.titre}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Article principal ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Image principale */}
              {article.image && (
                <div className="h-72 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.titre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-8">
                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(article.date_publication).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                  {article.auteur_nom && (
                    <span className="text-gray-300">|</span>
                  )}
                  {article.auteur_nom && (
                    <span>Par {article.auteur_nom}</span>
                  )}
                </div>

                {/* Titre */}
                <h1 className="text-2xl font-bold text-gray-800 leading-tight mb-6">
                  {article.titre}
                </h1>

                {/* Séparateur */}
                <div className="h-0.5 w-16 bg-mmi-green rounded mb-6" />

                {/* Contenu */}
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  style={{ lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: article.contenu }}
                />

                {/* Actions */}
                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                  <Link to="/actualites"
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-mmi-green transition-colors">
                    <ArrowLeft size={15} /> Retour aux actualités
                  </Link>
                  <button
                    onClick={() => navigator.clipboard?.writeText(window.location.href)}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-mmi-green ml-auto transition-colors"
                    title="Copier le lien"
                  >
                    <Share2 size={14} /> Partager
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-6">

            {/* Articles récents */}
            {recents.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 text-sm mb-4 pb-3 border-b border-gray-100">
                  Autres actualités
                </h3>
                <div className="space-y-4">
                  {recents.map(a => (
                    <Link key={a.id} to={`/actualites/${a.slug}`}
                          className="flex gap-3 group">
                      <div className="w-16 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {a.image
                          ? <img src={a.image} alt={a.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          : <div className="w-full h-full flex items-center justify-center"><FileText size={18} className="text-gray-300" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 line-clamp-2 group-hover:text-mmi-green transition-colors leading-snug">
                          {a.titre}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(a.date_publication).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short'
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to="/actualites"
                      className="flex items-center justify-center gap-1 text-xs text-mmi-green hover:underline mt-4 pt-3 border-t border-gray-100">
                  Voir toutes les actualités <ChevronRight size={12} />
                </Link>
              </div>
            )}

            {/* Liens utiles */}
            <div className="bg-mmi-green-lt border border-green-200 rounded-2xl p-6">
              <h3 className="font-bold text-mmi-green text-sm mb-4">Liens utiles</h3>
              <div className="space-y-2 text-sm">
                {[
                  { to: '/connexion',  label: 'Espace demandeur' },
                  { to: '/pmne',       label: 'Programme PMNE' },
                  { to: '/contact',    label: 'Nous contacter' },
                ].map(l => (
                  <Link key={l.to} to={l.to}
                        className="flex items-center gap-2 text-mmi-green hover:underline">
                    <ChevronRight size={12} /> {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}