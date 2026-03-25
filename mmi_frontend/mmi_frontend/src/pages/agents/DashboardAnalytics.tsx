import React, { useEffect, useState } from 'react'
import { BarChart3, FileText, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react'
import { analyticsAPI } from '@/utils/api'
import { Link } from 'react-router-dom'
import StatusBadge from '@/components/ui/StatusBadge'

interface Props {
  titre: string
  linkDossiers: string
}

export default function DashboardAnalytics({ titre, linkDossiers }: Props) {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.dashboard()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  const enCours = data?.par_statut
    ?.filter((s: any) => !['VALIDE','REJETE'].includes(s.statut))
    ?.reduce((a: number, b: any) => a + b.count, 0) || 0

  const validees = data?.par_statut?.find((s: any) => s.statut === 'VALIDE')?.count || 0
  const rejetees = data?.par_statut?.find((s: any) => s.statut === 'REJETE')?.count || 0

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">{titre}</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total dossiers',   value: data?.total_demandes || 0,    icon: FileText,    color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'En cours',         value: enCours,                       icon: Clock,       color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Validées',         value: validees,                      icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Autorisations',    value: data?.autorisations_actives||0,icon: TrendingUp,  color: 'text-purple-600',bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Répartition par type */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-mmi-green" />
            Répartition par type
          </h3>
          <div className="space-y-3">
            {data?.par_type?.map((t: any) => {
              const pct = Math.round((t.count / (data?.total_demandes || 1)) * 100)
              const colors: Record<string, string> = {
                BP: 'bg-orange-400', USINE_EAU: 'bg-blue-400',
                UNITE: 'bg-mmi-green', RENOUVELLEMENT: 'bg-purple-400', EXTENSION: 'bg-red-400'
              }
              return (
                <div key={t.type_demande__code}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{t.type_demande__code}</span>
                    <span className="font-semibold">{t.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[t.type_demande__code] || 'bg-gray-400'}`}
                         style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Par wilaya */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-4">Top wilayas</h3>
          <div className="space-y-2">
            {data?.par_wilaya?.slice(0, 6).map((w: any, i: number) => (
              <div key={w.wilaya} className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-mmi-green-lt text-mmi-green text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i+1}
                </span>
                <span className="flex-1 text-gray-700">{w.wilaya}</span>
                <span className="font-semibold text-gray-800">{w.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dernières demandes */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 text-sm">Dernières demandes</h3>
          <Link to={linkDossiers} className="text-xs text-mmi-green hover:underline">Voir tout</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-5 py-3">Référence</th>
                <th className="text-left px-5 py-3">Établissement</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-left px-5 py-3">Statut</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.demandes_recentes?.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs font-bold text-mmi-green">{d.numero_ref}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{d.raison_sociale}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d.type_code}</span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge statut={d.statut} /></td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(d.date_soumission).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}