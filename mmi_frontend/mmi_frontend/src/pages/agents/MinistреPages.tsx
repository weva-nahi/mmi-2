import React, { useEffect, useState } from 'react'
import { Inbox, Send, Eye } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'

const MIN_MENU = [
  { to: '/ministre',          icon: Inbox, label: 'Tableau de bord' },
  { to: '/ministre/dossiers', icon: Eye,   label: 'Dossiers à lire' },
]

export function MinistreLayout() {
  return <AgentLayout titre="Espace Ministre" couleur="#3C3489" menu={MIN_MENU} />
}

export function MinistreDashboard() {
  const [counts, setCounts] = useState({ attente:0, traites:0 })
  useEffect(()=>{
    Promise.all([
      demandesAPI.list({ statut:'TRANSMISE_MINISTRE' }),
      demandesAPI.list({ statut:'EN_LECTURE_MINISTRE' }),
    ]).then(([a,b])=>setCounts({
      attente:(a.data.results||a.data).length,
      traites:(b.data.results||b.data).length,
    })).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Espace Ministre</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label:'Dossiers à lire',  value:counts.attente, color:'text-indigo-600', bg:'bg-indigo-50', icon:Inbox },
          { label:'En lecture',       value:counts.traites, color:'text-blue-600',   bg:'bg-blue-50',   icon:Eye },
        ].map(s=>(
          <div key={s.label} className="card p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="card p-5 text-sm text-gray-500 leading-relaxed">
        En tant que Ministre, vous recevez les dossiers sensibles transmis par le Secrétaire Général.
        Après lecture et instruction, vous les orientez vers la DGI pour traitement technique.
      </div>
    </div>
  )
}

export function MinistreDossiers() {
  return <DossiersList titre="Dossiers — Ministre" statutsFiltres={['TRANSMISE_MINISTRE','EN_LECTURE_MINISTRE']} linkBase="/ministre/dossier" />
}

export function MinistreDossier() {
  return (
    <DossierDetail
      backLink="/ministre/dossiers"
      backLabel="Retour"
      actionsDisponibles={[
        { etape_code:'MIN_LECTURE',          label:'Prendre en lecture',       action:'Lecture et instruction par le Ministre',          color:'blue',  icon:Eye },
        { etape_code:'MIN_TRANSMISSION_DGI', label:'Transmettre à la DGI',     action:'Transmission à la DGI après lecture ministérielle', color:'green', icon:Send },
      ]}
    />
  )
}