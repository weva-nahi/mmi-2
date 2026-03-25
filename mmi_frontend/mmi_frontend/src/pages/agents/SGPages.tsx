import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, Send, BookOpen, CheckSquare, ArrowRightCircle } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'

const SG_MENU = [
  { to: '/sg',         icon: Inbox,     label: 'Tableau de bord' },
  { to: '/sg/dossiers',icon: BookOpen,  label: 'Dossiers à traiter' },
  { to: '/sg/traites', icon: Send,      label: 'Dossiers traités' },
]

export function SGLayout() {
  return <AgentLayout titre="Secrétaire Général" couleur="#534AB7" menu={SG_MENU} />
}

export function SGDashboard() {
  const [counts, setCounts] = useState({ attente:0, ministre:0, dgi:0 })
  useEffect(()=>{
    Promise.all([
      demandesAPI.list({ statut:'TRANSMISE_SG' }),
      demandesAPI.list({ statut:'TRANSMISE_MINISTRE' }),
      demandesAPI.list({ statut:'EN_INSTRUCTION_DGI' }),
    ]).then(([a,b,c])=>setCounts({
      attente:(a.data.results||a.data).length,
      ministre:(b.data.results||b.data).length,
      dgi:(c.data.results||c.data).length,
    })).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Secrétaire Général</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label:'En attente',        value:counts.attente,  color:'text-purple-600', bg:'bg-purple-50', icon:Inbox },
          { label:'Vers Ministre',     value:counts.ministre, color:'text-blue-600',   bg:'bg-blue-50',   icon:ArrowRightCircle },
          { label:'Vers DGI',          value:counts.dgi,      color:'text-green-600',  bg:'bg-green-50',  icon:Send },
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
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-gray-700">Dossiers en attente d'orientation</h2>
          <Link to="/sg/dossiers" className="text-xs text-mmi-green hover:underline">Voir tout</Link>
        </div>
        <p className="text-sm text-gray-500">
          Vous orientez chaque dossier transmis par le Secrétariat Central soit vers le <strong>Ministre</strong> (dossiers sensibles) soit directement vers la <strong>DGI</strong>.
        </p>
      </div>
    </div>
  )
}

export function SGDossiers() {
  return <DossiersList titre="Dossiers — Secrétaire Général" statutsFiltres={['TRANSMISE_SG','EN_LECTURE_SG']} linkBase="/sg/dossier" />
}

export function SGTraites() {
  return <DossiersList titre="Dossiers traités" statutsFiltres={['TRANSMISE_MINISTRE','EN_INSTRUCTION_DGI']} linkBase="/sg/dossier" />
}

export function SGDossier() {
  return (
    <DossierDetail
      backLink="/sg/dossiers"
      backLabel="Retour SG"
      actionsDisponibles={[
        { etape_code:'SG_LECTURE',           label:'Prendre en lecture',          action:'Prise en lecture par le Secrétaire Général',      color:'blue',   icon:CheckSquare },
        { etape_code:'SG_TRANSMISSION_MIN',  label:'Orienter vers le Ministre',   action:'Transmission pour lecture ministérielle',         color:'yellow', icon:ArrowRightCircle },
        { etape_code:'SG_TRANSMISSION_DGI',  label:'Orienter vers la DGI',        action:'Transmission directe à la Direction Générale de l\'Industrie', color:'green', icon:Send },
      ]}
    />
  )
}