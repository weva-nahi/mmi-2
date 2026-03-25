import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, FileText, Download, Eye } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'

interface Demande {
  id: number; numero_ref: string; statut: string
  raison_sociale: string; type_libelle: string
  wilaya: string; date_soumission: string
}

export default function MesDemandes() {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statutF, setStatutF]   = useState('')

  useEffect(() => {
    demandesAPI.list({ search, statut: statutF || undefined })
      .then(r => setDemandes(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, statutF])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Mes demandes</h1>
        <Link to="/demandeur/nouvelle" className="btn-primary flex items-center gap-2 text-sm">
          + Nouvelle demande
        </Link>
      </div>

      {/* Filtres */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={15} className="text-gray-400" />
          <input type="text" className="form-input text-sm py-1.5"
                 placeholder="Rechercher par référence ou établissement..."
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input text-sm py-1.5 w-44"
                value={statutF} onChange={e => setStatutF(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="SOUMISE">Soumise</option>
          <option value="EN_TRAITEMENT_DDPI">En traitement</option>
          <option value="DOSSIER_INCOMPLET">Incomplet</option>
          <option value="VALIDE">Validée</option>
          <option value="REJETE">Rejetée</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : demandes.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune demande</p>
            <Link to="/demandeur/nouvelle" className="btn-primary inline-flex mt-4 text-sm">
              Soumettre ma première demande
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Référence</th>
                  <th className="text-left px-5 py-3">Établissement</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-5 py-3">Wilaya</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {demandes.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-mmi-green">{d.numero_ref}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">{d.raison_sociale}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{d.type_libelle}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{d.wilaya}</td>
                    <td className="px-5 py-3.5"><StatusBadge statut={d.statut} /></td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(d.date_soumission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link to={`/demandeur/demandes/${d.id}`}
                              className="text-mmi-green hover:text-mmi-green-mid" title="Voir">
                          <Eye size={15} />
                        </Link>
                        {d.statut === 'VALIDE' && (
                          <Link to={`/demandeur/demandes/${d.id}`}
                                className="text-blue-600 hover:text-blue-800" title="Télécharger">
                            <Download size={15} />
                          </Link>
                        )}
                      </div>
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