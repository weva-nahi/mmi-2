import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, FileSignature, BarChart3, PenLine, Send, CheckSquare } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'
import DashboardAnalytics from './DashboardAnalytics'
import DGIAnalytics from './DGIAnalytics'

const DGI_MENU = [
  { to: '/dgi',            icon: BarChart3,     label: 'Tableau de bord' },
  { to: '/dgi/dossiers',   icon: Inbox,         label: 'En instruction' },
  { to: '/dgi/signature',  icon: FileSignature, label: 'À signer' },
  { to: '/dgi/analytics',  icon: BarChart3,     label: 'Analytics & Export' },
]

export function DGILayout() {
  return <AgentLayout titre="Direction Générale de l'Industrie" couleur="#854F0B" menu={DGI_MENU} />
}

export function DGIDashboard() {
  const [counts, setCounts] = React.useState({ instruction:0, signature:0, signes:0 })
  React.useEffect(()=>{
    Promise.all([
      demandesAPI.list({ statut:'EN_INSTRUCTION_DGI' }),
      demandesAPI.list({ statut:'SIGNATURE_DGI' }),
      demandesAPI.list({ statut:'VALIDE' }),
    ]).then(([a,b,c])=>setCounts({
      instruction:(a.data.results||a.data).length,
      signature:  (b.data.results||b.data).length,
      signes:     (c.data.results||c.data).length,
    })).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Direction Générale de l'Industrie</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label:'En instruction',    value:counts.instruction, color:'text-amber-600',  bg:'bg-amber-50',  icon:PenLine },
          { label:'En attente signature',value:counts.signature, color:'text-blue-600',   bg:'bg-blue-50',   icon:FileSignature },
          { label:'Dossiers validés',  value:counts.signes,      color:'text-green-600',  bg:'bg-green-50',  icon:CheckSquare },
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
      <DashboardAnalytics titre="Statistiques globales" linkDossiers="/dgi/dossiers" />
    </div>
  )
}

export function DGIDossiers() {
  return <DossiersList titre="Dossiers en instruction — DGI" statutsFiltres={['EN_INSTRUCTION_DGI']} linkBase="/dgi/dossier" />
}

export function DGISignature() {
  return <DossiersList titre="Documents à signer — DGI" statutsFiltres={['SIGNATURE_DGI']} linkBase="/dgi/dossier" />
}

export function DGIDossier() {
  return (
    <DossierDetail
      backLink="/dgi/dossiers"
      backLabel="Retour DGI"
      actionsDisponibles={[
        { etape_code:'DGI_INSTRUCTION',       label:'Instruire et annoter',    action:'Instruction et annotation technique par la DGI',           color:'blue',   icon:PenLine },
        { etape_code:'DGI_TRANSMISSION_DDPI', label:'Transmettre à la DDPI',   action:'Transmission à la Direction du Développement Industriel',   color:'green',  icon:Send },
        { etape_code:'DGI_SIGNATURE',         label:'Signer le document',      action:'Signature officielle du document par le Directeur DGI',    color:'yellow', icon:FileSignature },
      ]}
    />
  )
}

export function DGIAnalyticsPage() {
  return <DGIAnalytics />
}