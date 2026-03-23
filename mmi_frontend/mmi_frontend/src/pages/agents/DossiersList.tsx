import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, FileText, ChevronRight } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'

interface Demande {
  id: number
  numero_ref: string
  statut: string
  raison_sociale: string
  type_code: string
  type_libelle: string
  demandeur_nom: string
  wilaya: string
  date_soumission: string
}

interface Props {
  titre: string
  statutsFiltres?: string[]
  linkBase: string
}

const TYPES = ['BP','USINE_EAU','UNITE','RENOUVELLEMENT','EXTENSION']

export default function DossiersList({ titre, statutsFiltres, linkBase }: Props) {
  const [demandes, setDemandes]   = useState<Demande[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statutFilter, setStatut] = useState('')
  const [typeFilter, setType]     = useState('')

  useEffect(() => {
    const params: any = {}
    if (statutFilter) params.statut = statutFilter
    if (typeFilter)   params.type_demande__code = typeFilter
    if (search)       params.search = search

    demandesAPI.list(params)
      .then(r => setDemandes(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statutFilter, typeFilter, search])

  const filtered = statutsFiltres
    ? demandes.filter(d => statutsFiltres.includes(d.statut))
    : demandes

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">{titre}</h1>
        <span className="text-sm text-gray-500">{filtered.length} dossier(s)</span>
      </div>

      {/* Filtres */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            className="form-input text-sm py-1.5"
            placeholder="Rechercher par référence ou établissement..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input text-sm py-1.5 w-44"
          value={typeFilter}
          onChange={e => setType(e.target.value)}
        >
          <option value="">Tous les types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className="form-input text-sm py-1.5 w-44"
          value={statutFilter}
          onChange={e => setStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="SOUMISE">Soumise</option>
          <option value="EN_RECEPTION">En réception</option>
          <option value="EN_INSTRUCTION_DGI">En instruction DGI</option>
          <option value="EN_TRAITEMENT_DDPI">En traitement DDPI</option>
          <option value="DOSSIER_INCOMPLET">Incomplet</option>
          <option value="VALIDE">Validée</option>
          <option value="REJETE">Rejetée</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucun dossier</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Référence</th>
                  <th className="text-left px-5 py-3">Établissement</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-5 py-3">Demandeur</th>
                  <th className="text-left px-5 py-3">Wilaya</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-mmi-green text-xs">{d.numero_ref}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-800 max-w-[180px] truncate">{d.raison_sociale}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d.type_code}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{d.demandeur_nom}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{d.wilaya}</td>
                    <td className="px-5 py-3.5"><StatusBadge statut={d.statut} /></td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {new Date(d.date_soumission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`${linkBase}/${d.id}`}
                        className="flex items-center gap-1 text-mmi-green text-xs hover:underline whitespace-nowrap"
                      >
                        Traiter <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
