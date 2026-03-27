import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, ChevronLeft, Search, FileText } from 'lucide-react'
import { portailAPI } from '@/utils/api'
import HeroBanner from '@/components/ui/HeroBanner'

interface Actualite {
  id: number
  titre: string
  slug: string
  contenu: string
  image: string
  date_publication: string
  publie: boolean
}

export default function ActualitesPage() {
  const { t } = useTranslation()
  const [articles, setArticles] = useState<Actualite[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const PAGE_SIZE = 9

  useEffect(() => {
    setLoading(true)
    portailAPI.actualites({ page, page_size: PAGE_SIZE, search: search || undefined })
      .then(r => {
        setArticles(r.data.results || r.data)
        setTotal(r.data.count || (r.data.results || r.data).length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Titre + recherche */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title text-2xl">Actualités</h1>
            <p className="text-gray-500 text-sm mt-2">
              Restez informé des dernières nouvelles du secteur industriel
            </p>
            <div className="h-0.5 w-40 bg-mmi-green mt-2 rounded" />
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-full sm:w-72">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              className="flex-1 text-sm outline-none bg-transparent"
              placeholder="Rechercher un article..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {/* Grille articles */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <FileText size={52} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">Aucun article trouvé</p>
            {search && (
              <button onClick={() => setSearch('')}
                      className="text-sm text-mmi-green hover:underline mt-2">
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((actu, i) => (
              <article key={actu.id}
                       className={`card hover:shadow-md transition-all duration-200 animate-fadeInUp`}
                       style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Image */}
                <div className="h-48 bg-gray-100 rounded-t-xl overflow-hidden">
                  {actu.image ? (
                    <img
                      src={actu.image}
                      alt={actu.titre}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-mmi-green-lt">
                      <FileText size={44} className="text-mmi-green opacity-25" />
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Calendar size={11} />
                    {new Date(actu.date_publication).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </div>

                  <h2 className="font-semibold text-gray-800 text-sm leading-snug mb-3 line-clamp-2 hover:text-mmi-green transition-colors">
                    {actu.titre}
                  </h2>

                  <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-3">
                    {actu.contenu?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>

                  <Link
                    to={`/actualites/${actu.slug}`}
                    className="text-mmi-green text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Lire la suite <ChevronRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200
                         disabled:opacity-40 hover:bg-mmi-green-lt hover:border-mmi-green hover:text-mmi-green
                         transition-all disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} /> Précédent
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all
                    ${page === i + 1
                      ? 'bg-mmi-green text-white'
                      : 'border border-gray-200 hover:border-mmi-green hover:text-mmi-green'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200
                         disabled:opacity-40 hover:bg-mmi-green-lt hover:border-mmi-green hover:text-mmi-green
                         transition-all disabled:cursor-not-allowed"
            >
              Suivant <ChevronRight size={15} />
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          {total} article(s) — Page {page} / {totalPages || 1}
        </p>
      </div>
    </div>
  )
}