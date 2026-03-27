import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox, Send, BookOpen, CheckSquare, ArrowRightCircle,
  ArrowRight, Eye, CheckCircle, FileText
} from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'

const SG_MENU = [
  { to: '/sg',          icon: Inbox,       label: 'Tableau de bord'    },
  { to: '/sg/dossiers', icon: BookOpen,    label: 'Dossiers à traiter' },
  { to: '/sg/traites',  icon: CheckCircle, label: 'Dossiers traités'   },
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
      attente: (a.data.results||a.data).length,
      ministre:(b.data.results||b.data).length,
      dgi:     (c.data.results||c.data).length,
    })).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Secrétaire Général</h1>
      <p className="text-sm text-gray-500 mb-6">Orientation des dossiers vers le Ministre ou la DGI</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'En attente',     value:counts.attente,  color:'text-purple-600', bg:'bg-purple-50', icon:Inbox,          link:'/sg/dossiers' },
          { label:'Vers Ministre',  value:counts.ministre, color:'text-blue-600',   bg:'bg-blue-50',   icon:ArrowRightCircle,link:'/sg/traites'  },
          { label:'Vers DGI',       value:counts.dgi,      color:'text-green-600',  bg:'bg-green-50',  icon:Send,           link:'/sg/traites'  },
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

      {/* Circuit SG */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Rôle du Secrétaire Général</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
          {['Réception SC','Prise en charge','Orientation','Vers Ministre ou DGI'].map((s,i,arr)=>(
            <React.Fragment key={s}>
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-medium">{s}</span>
              {i<arr.length-1 && <ArrowRight size={11} className="text-gray-400"/>}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Vous orientez chaque dossier soit vers le <strong>Ministre</strong> (dossiers nécessitant
          une décision ministérielle) soit directement vers la <strong>DGI</strong> pour instruction technique.
          Vous pouvez ajouter des annotations et des pièces jointes à chaque étape.
        </p>
        <Link to="/sg/dossiers"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-purple-600 hover:underline font-medium">
          Voir les dossiers en attente →
        </Link>
      </div>
    </div>
  )
}

export function SGDossiers() {
  return (
    <DossiersList
      titre="Dossiers — Secrétaire Général"
      statutsFiltres={['TRANSMISE_SG','EN_LECTURE_SG']}
      linkBase="/sg/dossier"
    />
  )
}

export function SGTraites() {
  return (
    <DossiersList
      titre="Dossiers traités — SG"
      statutsFiltres={['TRANSMISE_MINISTRE','EN_INSTRUCTION_DGI','EN_LECTURE_MINISTRE']}
      linkBase="/sg/dossier"
    />
  )
}

export function SGDossier() {
  return (
    <DossierDetail
      backLink="/sg/dossiers"
      backLabel="Retour SG"
      actionsDisponibles={[
        { etape_code:'SG_LECTURE',          label:'Prendre en charge',         action:'Prise en charge par le Secrétaire Général',              color:'blue',  icon:CheckSquare      },
        { etape_code:'SG_TRANSMISSION_MIN', label:'Orienter → Ministre',       action:'Transmission au Ministre pour décision',                 color:'yellow',icon:ArrowRightCircle },
        { etape_code:'SG_TRANSMISSION_DGI', label:'Orienter → DGI',            action:"Transmission directe à la DGI pour instruction",        color:'green', icon:Send             },
      ]}
    />
  )
}