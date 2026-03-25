import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, Send, CheckSquare, Clock, FileText } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'

const SC_MENU = [
  { to: '/secretariat',           icon: Inbox,    label: 'Tableau de bord' },
  { to: '/secretariat/dossiers',  icon: FileText, label: 'Dossiers reçus' },
  { to: '/secretariat/transmis',  icon: Send,     label: 'Transmis au SG' },
]

export function SecretariatLayout() {
  return <AgentLayout titre="Secrétariat Central" couleur="#0C447C" menu={SC_MENU} />
}

export function SecretariatDashboard() {
  const [counts, setCounts] = useState({ soumis: 0, reception: 0, transmis: 0 })
  useEffect(() => {
    Promise.all([
      demandesAPI.list({ statut: 'SOUMISE' }),
      demandesAPI.list({ statut: 'EN_RECEPTION' }),
      demandesAPI.list({ statut: 'TRANSMISE_SG' }),
    ]).then(([a,b,c]) => setCounts({
      soumis:   (a.data.results||a.data).length,
      reception:(b.data.results||b.data).length,
      transmis: (c.data.results||c.data).length,
    })).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Secrétariat Central</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label:'Dossiers soumis',   value:counts.soumis,   color:'text-blue-600',  bg:'bg-blue-50',  icon:Inbox },
          { label:'En réception',      value:counts.reception, color:'text-amber-600', bg:'bg-amber-50', icon:Clock },
          { label:'Transmis au SG',    value:counts.transmis, color:'text-green-600', bg:'bg-green-50', icon:Send },
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
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-700">Dossiers à réceptionner</h2>
          <Link to="/secretariat/dossiers" className="text-xs text-mmi-green hover:underline">Voir tout</Link>
        </div>
        <MiniTable statuts={['SOUMISE','EN_RECEPTION']} linkBase="/secretariat/dossier" />
      </div>
    </div>
  )
}

export function SecretariatDossiers() {
  return <DossiersList titre="File d'attente — Secrétariat Central" statutsFiltres={['SOUMISE','EN_RECEPTION']} linkBase="/secretariat/dossier" />
}

export function SecretariatTransmis() {
  return <DossiersList titre="Transmis au Secrétaire Général" statutsFiltres={['TRANSMISE_SG','EN_LECTURE_SG']} linkBase="/secretariat/dossier" />
}

export function SecretariatDossier() {
  return (
    <DossierDetail
      backLink="/secretariat/dossiers"
      backLabel="Retour Secrétariat"
      actionsDisponibles={[
        { etape_code:'SC_RECEPTION',       label:'Accuser réception',           action:'Accusé de réception et référencement du dossier', color:'blue',  icon:CheckSquare },
        { etape_code:'SC_TRANSMISSION_SG', label:'Transmettre au Secrétaire Général', action:'Transmission au Secrétaire Général',         color:'green', icon:Send },
      ]}
    />
  )
}

function MiniTable({ statuts, linkBase }: { statuts:string[]; linkBase:string }) {
  const [rows, setRows] = useState<any[]>([])
  useEffect(()=>{
    demandesAPI.list({ page_size:5 })
      .then(r=>setRows((r.data.results||r.data).filter((d:any)=>statuts.includes(d.statut)).slice(0,5)))
      .catch(()=>{})
  },[])
  if(!rows.length) return <div className="p-8 text-center text-gray-400 text-sm">Aucun dossier en attente</div>
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
        <tr>
          <th className="text-left px-5 py-3">Référence</th>
          <th className="text-left px-5 py-3">Établissement</th>
          <th className="text-left px-5 py-3">Statut</th>
          <th className="text-left px-5 py-3">Date</th>
          <th className="px-5 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((d:any)=>(
          <tr key={d.id} className="hover:bg-gray-50">
            <td className="px-5 py-3 font-mono text-xs font-bold text-mmi-green">{d.numero_ref}</td>
            <td className="px-5 py-3 font-medium">{d.raison_sociale}</td>
            <td className="px-5 py-3"><StatusBadge statut={d.statut} /></td>
            <td className="px-5 py-3 text-xs text-gray-400">{new Date(d.date_soumission).toLocaleDateString('fr-FR')}</td>
            <td className="px-5 py-3"><Link to={`${linkBase}/${d.id}`} className="text-xs text-mmi-green hover:underline">Traiter →</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}