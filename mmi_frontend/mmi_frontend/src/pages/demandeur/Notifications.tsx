import React, { useEffect, useState } from 'react'
import { Bell, CheckCheck, Clock } from 'lucide-react'
import { notificationsAPI } from '@/utils/api'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

interface Notif {
  id: number; type: string; titre: string; message: string
  lu: boolean; created_at: string; demande_ref: string
}

const TYPE_COLORS: Record<string, string> = {
  validation:        'bg-green-100 text-green-700 border-green-200',
  rejet:             'bg-red-100 text-red-700 border-red-200',
  dossier_incomplet: 'bg-orange-100 text-orange-700 border-orange-200',
  document_pret:     'bg-blue-100 text-blue-700 border-blue-200',
  statut_change:     'bg-gray-100 text-gray-700 border-gray-200',
  action_requise:    'bg-yellow-100 text-yellow-700 border-yellow-200',
}

export default function Notifications() {
  const [notifs, setNotifs]   = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    notificationsAPI.list()
      .then(r => setNotifs(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const marquerLu = async (id: number) => {
    await notificationsAPI.marquerLu(id)
    setNotifs(n => n.map(x => x.id === id ? { ...x, lu: true } : x))
  }

  const toutLire = async () => {
    await notificationsAPI.toutLire()
    setNotifs(n => n.map(x => ({ ...x, lu: true })))
    toast.success('Toutes les notifications lues')
  }

  const nonLues = notifs.filter(n => !n.lu).length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
          {nonLues > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {nonLues}
            </span>
          )}
        </div>
        {nonLues > 0 && (
          <button onClick={toutLire}
                  className="flex items-center gap-1.5 text-sm text-mmi-green hover:underline">
            <CheckCheck size={14} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <Bell size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map(n => (
            <div
              key={n.id}
              className={`card p-4 flex gap-4 cursor-pointer transition-all hover:shadow-md
                ${!n.lu ? 'border-l-4 border-mmi-green' : 'opacity-75'}`}
              onClick={() => !n.lu && marquerLu(n.id)}
            >
              <div className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border self-start mt-0.5
                ${TYPE_COLORS[n.type] || TYPE_COLORS.statut_change}`}>
                {n.type.replace('_', ' ')}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.lu ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'}`}>
                  {n.titre}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                {n.demande_ref && (
                  <Link to={`/demandeur/demandes`}
                        className="text-xs text-mmi-green hover:underline mt-1 block">
                    Dossier {n.demande_ref}
                  </Link>
                )}
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap flex items-start gap-1">
                <Clock size={11} className="mt-0.5" />
                {new Date(n.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}