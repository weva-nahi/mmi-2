import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Clock, Search } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'

interface Props {
  titre: string
  statutsFiltres: string[]
  linkBase: string
}

interface Demande {
  id: number
  numero_ref: string
  statut: string
  raison_sociale: string
  activite: string
  wilaya: string
  type_demande: { libelle: string }
  demandeur_nom: string
  date_soumission: string
}

export default function DossiersList({ titre, statutsFiltres, linkBase }: Props) {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    setLoading(true)
    // Envoyer tous les statuts en une seule requête (séparés par virgule)
    const statut = statutsFiltres.join(',')
    demandesAPI.list({ statut, page_size: 200 })
      .then(r => setDemandes(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statutsFiltres.join(',')])

  const filtrees = demandes.filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.numero_ref?.toLowerCase().includes(q) ||
      d.raison_sociale?.toLowerCase().includes(q) ||
      d.activite?.toLowerCase().includes(q) ||
      d.wilaya?.toLowerCase().includes(q) ||
      d.demandeur_nom?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">{titre}</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          {filtrees.length} dossier(s)
        </span>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="form-input pl-9 text-sm w-full"
          placeholder="Rechercher par référence, entreprise, wilaya..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtrees.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Aucun dossier trouvé</p>
          {search && (
            <button onClick={() => setSearch('')}
                    className="text-xs text-mmi-green mt-2 hover:underline">
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtrees.map(d => (
            <Link key={d.id} to={`${linkBase}/${d.id}`}
                  className="card p-4 flex items-center gap-4 hover:shadow-md transition-all
                             hover:border-mmi-green/30 group cursor-pointer">

              {/* Icône */}
              <div className="w-10 h-10 bg-mmi-green-lt rounded-xl flex items-center
                              justify-center flex-shrink-0 group-hover:bg-mmi-green/10">
                <FileText size={18} className="text-mmi-green" />
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono font-bold text-sm text-mmi-green">
                    {d.numero_ref}
                  </span>
                  <StatusBadge statut={d.statut} />
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {d.raison_sociale || d.demandeur_nom || '—'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {d.type_demande?.libelle}
                  {d.wilaya && ` · ${d.wilaya}`}
                  {d.activite && ` · ${d.activite}`}
                </p>
              </div>

              {/* Date */}
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} />
                  {d.date_soumission
                    ? new Date(d.date_soumission).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })
                    : '—'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}