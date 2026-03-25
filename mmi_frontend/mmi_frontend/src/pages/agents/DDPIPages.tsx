import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, UserCheck, ClipboardCheck, AlertTriangle, Send, CheckSquare, BarChart3, XCircle, PenLine } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'

const DDPI_MENU = [
  { to: '/ddpi',          icon: BarChart3,     label: 'Tableau de bord' },
  { to: '/ddpi/dossiers', icon: Inbox,         label: 'Dossiers à traiter' },
  { to: '/ddpi/visites',  icon: UserCheck,     label: 'Visites programmées' },
  { to: '/ddpi/commites', icon: ClipboardCheck,label: 'Comités BP' },
]

export function DDPILayout() {
  return <AgentLayout titre="Direction Développement & Promotion Industrielle" couleur="#993C1D" menu={DDPI_MENU} />
}

export function DDPIDashboard() {
  const [counts, setCounts] = useState({ traitement:0, visites:0, commission:0, incomplet:0 })
  useEffect(()=>{
    Promise.all([
      demandesAPI.list({ statut:'EN_TRAITEMENT_DDPI' }),
      demandesAPI.list({ statut:'VISITE_PROGRAMMEE' }),
      demandesAPI.list({ statut:'EN_COMMISSION_BP' }),
      demandesAPI.list({ statut:'DOSSIER_INCOMPLET' }),
    ]).then(([a,b,c,d])=>setCounts({
      traitement:(a.data.results||a.data).length,
      visites:   (b.data.results||b.data).length,
      commission:(c.data.results||c.data).length,
      incomplet: (d.data.results||d.data).length,
    })).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Direction Développement & Promotion Industrielle</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label:'En traitement',   value:counts.traitement, color:'text-orange-600', bg:'bg-orange-50',icon:Inbox },
          { label:'Visites prévues', value:counts.visites,    color:'text-blue-600',   bg:'bg-blue-50',  icon:UserCheck },
          { label:'En commission BP',value:counts.commission, color:'text-teal-600',   bg:'bg-teal-50',  icon:ClipboardCheck },
          { label:'Dossiers incomplets',value:counts.incomplet,color:'text-red-600',   bg:'bg-red-50',   icon:AlertTriangle },
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

      {/* Dossiers urgents — incomplets */}
      {counts.incomplet > 0 && (
        <div className="card p-5 mb-5 border-l-4 border-red-400">
          <h3 className="font-semibold text-red-700 text-sm mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> {counts.incomplet} dossier(s) incomplet(s)
          </h3>
          <p className="text-xs text-gray-500">Des demandeurs attendent votre retour sur leur dossier incomplet.</p>
          <Link to="/ddpi/dossiers" className="text-xs text-red-600 hover:underline mt-2 block">
            Voir les dossiers incomplets →
          </Link>
        </div>
      )}

      {/* Raccourcis par type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/ddpi/dossiers" className="card p-4 hover:shadow-md transition-all text-center">
          <Inbox size={24} className="text-orange-500 mx-auto mb-2" />
          <p className="font-semibold text-sm text-gray-700">File de traitement</p>
          <p className="text-xs text-gray-400">Vérifier et instruire</p>
        </Link>
        <Link to="/ddpi/visites" className="card p-4 hover:shadow-md transition-all text-center">
          <UserCheck size={24} className="text-blue-500 mx-auto mb-2" />
          <p className="font-semibold text-sm text-gray-700">Visites des lieux</p>
          <p className="text-xs text-gray-400">Planifier et documenter</p>
        </Link>
        <Link to="/ddpi/commites" className="card p-4 hover:shadow-md transition-all text-center">
          <ClipboardCheck size={24} className="text-teal-500 mx-auto mb-2" />
          <p className="font-semibold text-sm text-gray-700">Comités BP</p>
          <p className="text-xs text-gray-400">Réunions et décisions</p>
        </Link>
      </div>
    </div>
  )
}

export function DDPIDossiers() {
  return (
    <DossiersList
      titre="Dossiers — DDPI"
      statutsFiltres={['EN_TRAITEMENT_DDPI','DOSSIER_INCOMPLET','VISITE_PROGRAMMEE','EN_COMMISSION_BP','ACCORD_PRINCIPE','ARRETE_EN_COURS']}
      linkBase="/ddpi/dossier"
    />
  )
}

export function DDPIVisites() {
  return <DossiersList titre="Visites programmées" statutsFiltres={['VISITE_PROGRAMMEE']} linkBase="/ddpi/dossier" />
}

export function DDPIComites() {
  return <DossiersList titre="Comités BP" statutsFiltres={['EN_COMMISSION_BP']} linkBase="/ddpi/dossier" />
}

export function DDPIDossier() {
  const RejetIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  )
  return (
    <DossierDetail
      backLink="/ddpi/dossiers"
      backLabel="Retour DDPI"
      actionsDisponibles={[
        { etape_code:'DDPI_VERIFICATION',    label:'Vérifier le dossier',      action:'Vérification de la complétude du dossier',                color:'blue',   icon:CheckSquare },
        { etape_code:'DDPI_INCOMPLET',       label:'Signaler incomplet',        action:'Dossier incomplet — notification envoyée au demandeur',   color:'yellow', icon:AlertTriangle },
        { etape_code:'DDPI_VISITE',          label:'Programmer visite',         action:'Programmation de la visite des lieux',                    color:'blue',   icon:UserCheck },
        { etape_code:'DDPI_COMMISSION_BP',   label:'Soumettre en commission BP',action:'Passage en réunion de la commission BP',                  color:'blue',   icon:ClipboardCheck },
        { etape_code:'DDPI_ACCORD_PRINCIPE', label:'Accorder principe',         action:'Accord de principe accordé par la DDPI',                  color:'green',  icon:CheckSquare },
        { etape_code:'DDPI_CHEF_SERVICE',    label:'Transmettre au Chef',       action:'Transmission au Chef de service DDPI',                    color:'blue',   icon:Send },
        { etape_code:'DDPI_ARRETE_REDACTION', label:"Rédiger l'arrêté",          action:"Démarrage de la rédaction de l'arrêté final",                     color:'blue',   icon:PenLine },
        { etape_code:'DDPI_REJET',           label:'Rejeter le dossier',        action:'Rejet du dossier — lettre de notification envoyée',       color:'red',    icon:RejetIcon },
      ]}
    />
  )
}