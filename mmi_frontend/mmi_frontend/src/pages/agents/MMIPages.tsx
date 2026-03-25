import React, { useEffect, useState } from 'react'
import { FileSignature, CheckCircle, Clock } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'

const MMI_MENU = [
  { to: '/mmi',          icon: FileSignature, label: 'Tableau de bord' },
  { to: '/mmi/dossiers', icon: Clock,         label: 'Arrêtés à signer' },
  { to: '/mmi/signes',   icon: CheckCircle,   label: 'Arrêtés signés' },
]

export function MMILayout() {
  return <AgentLayout titre="MMI — Signature des arrêtés" couleur="#1B6B30" menu={MMI_MENU} />
}

export function MMIDashboard() {
  const [counts, setCounts] = useState({ attente:0, signes:0 })
  useEffect(()=>{
    Promise.all([
      demandesAPI.list({ statut:'SIGNATURE_MMI' }),
      demandesAPI.list({ statut:'VALIDE' }),
    ]).then(([a,b])=>setCounts({
      attente:(a.data.results||a.data).length,
      signes: (b.data.results||b.data).length,
    })).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">MMI — Signature des arrêtés</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label:'Arrêtés en attente', value:counts.attente, color:'text-amber-600',  bg:'bg-amber-50',  icon:Clock },
          { label:'Arrêtés signés',     value:counts.signes,  color:'text-green-600',  bg:'bg-green-50',  icon:CheckCircle },
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
        En tant que Signataire MMI, vous apposez la signature officielle sur les arrêtés finaux
        (BP, conjoint, unité industrielle). Après signature, le document est disponible au téléchargement
        pour le demandeur.
      </div>
    </div>
  )
}

export function MMIDossiers() {
  return <DossiersList titre="Arrêtés en attente de signature — MMI" statutsFiltres={['SIGNATURE_MMI']} linkBase="/mmi/dossier" />
}

export function MMISignes() {
  return <DossiersList titre="Arrêtés signés" statutsFiltres={['VALIDE']} linkBase="/mmi/dossier" />
}

export function MMIDossier() {
  return (
    <DossierDetail
      backLink="/mmi/dossiers"
      backLabel="Retour MMI"
      actionsDisponibles={[
        { etape_code:'MMI_SIGNATURE', label:"Signer l'arrêté officiel", action:"Signature officielle de l'arrêté par le MMI", color:'green', icon:FileSignature },
      ]}
    />
  )
}