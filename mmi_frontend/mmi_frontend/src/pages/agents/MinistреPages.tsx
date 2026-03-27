import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Eye, Send, CheckSquare, ArrowRight, Clock,
  FileText, Download, CheckCircle, Inbox
} from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'

const MIN_MENU = [
  { to: '/ministre',          icon: Inbox,       label: 'Tableau de bord'  },
  { to: '/ministre/dossiers', icon: FileText,    label: 'Dossiers à traiter'},
  { to: '/ministre/traites',  icon: CheckCircle, label: 'Dossiers traités'  },
]

export function MinistreLayout() {
  return <AgentLayout titre="Cabinet du Ministre" couleur="#4A1942" menu={MIN_MENU} />
}

export function MinistreDashboard() {
  const [counts, setCounts] = useState({ attente:0, lecture:0, transmis:0 })
  useEffect(()=>{
    Promise.all([
      demandesAPI.list({ statut:'TRANSMISE_MINISTRE' }),
      demandesAPI.list({ statut:'EN_LECTURE_MINISTRE' }),
      demandesAPI.list({ statut:'EN_INSTRUCTION_DGI' }),
    ]).then(([a,b,c])=>setCounts({
      attente: (a.data.results||a.data).length,
      lecture: (b.data.results||b.data).length,
      transmis:(c.data.results||c.data).length,
    })).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Cabinet du Ministre</h1>
      <p className="text-sm text-gray-500 mb-6">Examen et orientation des dossiers industriels</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'En attente d\'examen', value:counts.attente,  color:'text-purple-600', bg:'bg-purple-50', icon:Inbox,        link:'/ministre/dossiers' },
          { label:'En cours de lecture',  value:counts.lecture,  color:'text-blue-600',   bg:'bg-blue-50',   icon:Eye,          link:'/ministre/dossiers' },
          { label:'Transmis à la DGI',    value:counts.transmis, color:'text-green-600',  bg:'bg-green-50',  icon:CheckCircle,  link:'/ministre/traites'  },
        ].map(s=>(
          <div key={s.label} onClick={()=>s.link&&(window.location.href=s.link)}
               className="card p-5 hover:shadow-md cursor-pointer">
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color}/>
            </div>
            <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rôle du Ministre */}
      <div className="card p-5 border-l-4 border-purple-400">
        <h3 className="font-bold text-gray-700 text-sm mb-2">Rôle du Ministre</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {['Réception SG','Lecture dossier','Annotation / Décision','Transmission DGI'].map((s,i,arr)=>(
            <React.Fragment key={s}>
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-medium">{s}</span>
              {i < arr.length-1 && <ArrowRight size={11} className="text-gray-400"/>}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          En tant que Ministre, vous examinez les dossiers transmis par le SG et les orientez vers la DGI
          pour instruction technique. Vous pouvez ajouter des annotations et des pièces jointes.
        </p>
      </div>
    </div>
  )
}

export function MinistreDossiers() {
  return (
    <DossiersList
      titre="Dossiers à examiner — Cabinet du Ministre"
      statutsFiltres={['TRANSMISE_MINISTRE','EN_LECTURE_MINISTRE']}
      linkBase="/ministre/dossier"
    />
  )
}

export function MinistreTraites() {
  return (
    <DossiersList
      titre="Dossiers transmis à la DGI"
      statutsFiltres={['EN_INSTRUCTION_DGI','EN_TRAITEMENT_DDPI','VALIDE']}
      linkBase="/ministre/dossier"
    />
  )
}

export function MinistreDossier() {
  return (
    <DossierDetail
      backLink="/ministre/dossiers"
      backLabel="Retour Cabinet"
      actionsDisponibles={[
        { etape_code:'MIN_LECTURE',          label:'Prendre en lecture',   action:'Prise en lecture par le Ministre',                       color:'blue',  icon:Eye      },
        { etape_code:'MIN_TRANSMISSION_DGI', label:'Transmettre à la DGI', action:'Transmission à la Direction Générale de l\'Industrie',  color:'green', icon:Send     },
      ]}
    />
  )
}