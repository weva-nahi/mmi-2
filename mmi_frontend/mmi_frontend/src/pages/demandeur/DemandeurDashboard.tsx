import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, FileText, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import StatusBadge from '@/components/ui/StatusBadge'

interface Demande {
  id: number
  numero_ref: string
  statut: string
  raison_sociale: string
  type_code: string
  type_libelle: string
  date_soumission: string
}

export default function DemandeurDashboard() {
  const { user } = useAuthStore()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    demandesAPI.list()
      .then(r => setDemandes(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total:    demandes.length,
    en_cours: demandes.filter(d => !['VALIDE','REJETE'].includes(d.statut)).length,
    validees: demandes.filter(d => d.statut === 'VALIDE').length,
    rejetees: demandes.filter(d => d.statut === 'REJETE').length,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Bonjour, {user?.nom} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">{user?.nom_entreprise}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total dossiers',   value: stats.total,    icon: FileText,    color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'En cours',         value: stats.en_cours, icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Validées',         value: stats.validees, icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Rejetées',         value: stats.rejetees, icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-mmi-green rounded-xl p-6 mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg mb-1">Soumettre une nouvelle demande</h3>
          <p className="text-white/80 text-sm">BP, Usine EAU, Unité industrielle, Renouvellement, Extension</p>
        </div>
        <Link to="/demandeur/nouvelle" className="bg-white text-mmi-green font-bold px-5 py-2.5 rounded-lg hover:bg-yellow-50 transition-colors flex items-center gap-2 whitespace-nowrap">
          <PlusCircle size={18} />
          Nouvelle demande
        </Link>
      </div>

      {/* Dernières demandes */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Mes dernières demandes</h2>
          <Link to="/demandeur/demandes" className="text-sm text-mmi-green hover:underline flex items-center gap-1">
            Voir tout <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : demandes.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune demande</p>
            <p className="text-sm">Commencez par soumettre votre première demande</p>
            <Link to="/demandeur/nouvelle" className="btn-primary inline-flex mt-4 text-sm">
              Nouvelle demande
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-6 py-3">Référence</th>
                  <th className="text-left px-6 py-3">Établissement</th>
                  <th className="text-left px-6 py-3">Type</th>
                  <th className="text-left px-6 py-3">Statut</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {demandes.slice(0,5).map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-mmi-green">{d.numero_ref}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{d.raison_sociale}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{d.type_libelle}</td>
                    <td className="px-6 py-4"><StatusBadge statut={d.statut} /></td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(d.date_soumission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/demandeur/demandes/${d.id}`} className="text-mmi-green hover:underline text-xs">
                        Voir →
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
