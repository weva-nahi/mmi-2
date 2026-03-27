import React, { useState } from 'react'
import { Inbox, FileSignature, BarChart3, PenLine, Send, CheckSquare, ArrowRight, Printer } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'
import DashboardAnalytics from './DashboardAnalytics'
import DGIAnalytics from './DGIAnalytics'

const DGI_MENU = [
  { to: '/dgi',            icon: BarChart3,     label: 'Tableau de bord'    },
  { to: '/dgi/dossiers',   icon: Inbox,         label: 'En instruction'     },
  { to: '/dgi/signature',  icon: FileSignature, label: 'À signer'           },
  { to: '/dgi/analytics',  icon: BarChart3,     label: 'Analytics & Export' },
]

export function DGILayout() {
  return <AgentLayout titre="Direction Générale de l'Industrie" couleur="#854F0B" menu={DGI_MENU} />
}

export function DGIDashboard() {
  const [counts, setCounts] = React.useState({ instruction:0, signature:0, signes:0 })
  React.useEffect(() => {
    Promise.all([
      demandesAPI.list({ statut:'EN_INSTRUCTION_DGI' }),
      demandesAPI.list({ statut:'SIGNATURE_DGI' }),
      demandesAPI.list({ statut:'VALIDE' }),
    ]).then(([a,b,c]) => setCounts({
      instruction: (a.data.results||a.data).length,
      signature:   (b.data.results||b.data).length,
      signes:      (c.data.results||c.data).length,
    })).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Direction Générale de l'Industrie</h1>
      <p className="text-sm text-gray-500 mb-6">Instruction technique et transmission à la DDPI</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'En instruction',       value:counts.instruction, color:'text-amber-600',  bg:'bg-amber-50',  icon:PenLine,       link:'/dgi/dossiers'  },
          { label:'En attente signature', value:counts.signature,   color:'text-blue-600',   bg:'bg-blue-50',   icon:FileSignature, link:'/dgi/signature' },
          { label:'Dossiers validés',     value:counts.signes,      color:'text-green-600',  bg:'bg-green-50',  icon:CheckSquare,   link:null             },
        ].map(s => (
          <div key={s.label} className={`card p-5 ${s.link ? 'hover:shadow-md cursor-pointer' : ''}`}
               onClick={() => s.link && (window.location.href = s.link)}>
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Circuit DGI */}
      <div className="card p-5 mb-5">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Circuit DGI</h3>
        <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
          {[
            'Réception du SG/Ministre',
            'Instruction technique',
            'Transmission à la DDPI',
            'Signature DGI',
            'Transmission MMI',
          ].map((step, i, arr) => (
            <React.Fragment key={step}>
              <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-medium">{step}</span>
              {i < arr.length - 1 && <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <DashboardAnalytics titre="Statistiques globales" linkDossiers="/dgi/dossiers" />
    </div>
  )
}

export function DGIDossiers() {
  return (
    <DossiersList
      titre="Dossiers en instruction — DGI"
      statutsFiltres={['EN_INSTRUCTION_DGI','EN_LECTURE_SG','TRANSMISE_MINISTRE','EN_LECTURE_MINISTRE']}
      linkBase="/dgi/dossier"
    />
  )
}

export function DGISignature() {
  return (
    <DossiersList
      titre="Documents à signer — DGI"
      statutsFiltres={['SIGNATURE_DGI']}
      linkBase="/dgi/dossier"
    />
  )
}

export function DGIDossier() {
  return (
    <DossierDetail
      backLink="/dgi/dossiers"
      backLabel="Retour DGI"
      actionsDisponibles={[
        {
          etape_code: 'DGI_INSTRUCTION',
          label:      'Marquer en instruction',
          action:     'Instruction et annotation technique par la DGI',
          color:      'blue',
          icon:       PenLine,
        },
        {
          etape_code: 'DGI_TRANSMISSION_DDPI',
          label:      'Transmettre à la DDPI',
          action:     'Transmission à la Direction du Développement Industriel pour visite et étude',
          color:      'green',
          icon:       Send,
        },
        {
          etape_code: 'DGI_SIGNATURE',
          label:      'Signer le document',
          action:     'Signature officielle du document par le Directeur Général de l\'Industrie',
          color:      'yellow',
          icon:       FileSignature,
        },
      ]}
    />
  )
}

export function DGIAnalyticsPage() {
  return <DGIAnalytics />
}

// ── Secrétariat DGI — Impression ─────────────────────────────
export function DGISecretariatDossier() {
  const [imprimant, setImprimant] = useState(false)

  const handleImprimer = async (demandeId: number) => {
    setImprimant(true)
    try {
      const res = await demandesAPI.imprimer(demandeId)
      // Ouvrir fenêtre impression avec données du dossier
      const d = res.data.demande
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(`
        <html><head><title>Dossier ${d.numero_ref}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #1a1a1a; }
          h1 { color: #1B6B30; border-bottom: 2px solid #C8A400; padding-bottom: 8px; }
          h2 { color: #0A4A1E; margin-top: 24px; font-size: 14px; text-transform: uppercase; }
          .row { display: flex; gap: 16px; margin: 6px 0; }
          .label { color: #666; min-width: 160px; font-size: 12px; }
          .value { font-weight: bold; font-size: 13px; }
          .header { text-align: center; margin-bottom: 32px; }
          .badge { background: #E8F5EC; color: #1B6B30; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          @media print { button { display: none; } }
        </style></head><body>
        <div class="header">
          <h1>MINISTÈRE DES MINES ET DE L'INDUSTRIE</h1>
          <p>Direction Générale de l'Industrie — MMIAPP</p>
        </div>
        <h1>Dossier : ${d.numero_ref}</h1>
        <span class="badge">${d.statut}</span>
        <h2>Informations du dossier</h2>
        <div class="row"><span class="label">Type de demande</span><span class="value">${d.type_demande?.libelle || '—'}</span></div>
        <div class="row"><span class="label">Établissement</span><span class="value">${d.raison_sociale || '—'}</span></div>
        <div class="row"><span class="label">Activité</span><span class="value">${d.activite || '—'}</span></div>
        <div class="row"><span class="label">Wilaya</span><span class="value">${d.wilaya || '—'}</span></div>
        <div class="row"><span class="label">Adresse</span><span class="value">${d.adresse || '—'}</span></div>
        <div class="row"><span class="label">Date soumission</span><span class="value">${new Date(d.date_soumission).toLocaleDateString('fr-FR')}</span></div>
        <h2>Demandeur</h2>
        <div class="row"><span class="label">Nom</span><span class="value">${d.demandeur_nom || '—'}</span></div>
        <div class="row"><span class="label">Identifiant</span><span class="value">${d.demandeur_identifiant || '—'}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${d.demandeur_email || '—'}</span></div>
        <h2>Circuit de traitement</h2>
        ${(d.etapes || []).map((e: any) => `
          <div class="row">
            <span class="label">${e.etape_code}</span>
            <span class="value">${e.action}</span>
          </div>
        `).join('')}
        <br/><br/>
        <button onclick="window.print()">🖨️ Imprimer</button>
        </body></html>
      `)
      win.document.close()
      setTimeout(() => win.print(), 500)
    } catch (err: any) {
      import('react-hot-toast').then(({ default: toast }) =>
        toast.error(err.response?.data?.detail || 'Erreur impression')
      )
    } finally {
      setImprimant(false)
    }
  }

  return (
    <DossierDetail
      backLink="/dgi/dossiers"
      backLabel="Retour Secrétariat DGI"
      actionsDisponibles={[
        { etape_code:'DGI_SEC_IMPRESSION', label:'Disponible pour impression',
          action:'Dossier mis à disposition pour impression — circuit papier', color:'blue', icon:Printer },
        { etape_code:'DGI_INSTRUCTION',    label:'Marquer en instruction',
          action:'Instruction et annotation technique DGI', color:'yellow', icon:PenLine },
        { etape_code:'DGI_TRANSMISSION_DDPI', label:'Transmettre à la DDPI',
          action:'Transmission à la Direction du Développement Industriel', color:'green', icon:Send },
        { etape_code:'DGI_SIGNATURE',      label:'Signer le document',
          action:'Signature officielle du Directeur Général de l\'Industrie', color:'yellow', icon:FileSignature },
      ]}
    />
  )
}