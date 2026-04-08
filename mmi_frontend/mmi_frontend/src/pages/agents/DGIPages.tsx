import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Inbox, FileSignature, BarChart3, PenLine, Send, CheckSquare, ArrowRight, Printer,
         Download, Eye, ArrowLeft, Clock, FileText, User, Hash, Calendar } from 'lucide-react'
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


// ── Menu et Layout Secrétariat DGI ───────────────────────────
const DGI_SEC_MENU = [
  { to: '/dgi-sec',          icon: Inbox,   label: 'Tableau de bord'     },
  { to: '/dgi-sec/dossiers', icon: Printer, label: 'Dossiers à imprimer' },
]

export function DGISecLayout(): JSX.Element {
  return <AgentLayout titre="Secrétariat DGI — Impression" couleur="#6B4A0B" menu={DGI_SEC_MENU} />
}

// Redirection automatique index → /dossiers
export function DGISecIndex(): JSX.Element {
  const navigate = useNavigate()
  React.useEffect(() => { navigate('/dgi-sec/dossiers', { replace: true }) }, [])
  return <></>
}

export function DGISecDashboard(): JSX.Element {
  const [counts, setCounts] = useState({ nouvelles: 0, aImprimer: 0, enInstruction: 0, traites: 0 })

  useEffect(() => {
    Promise.all([
      demandesAPI.list({ statut: 'SOUMISE' }),
      demandesAPI.list({ statut: 'EN_RECEPTION' }),
      demandesAPI.list({ statut: 'PRET_IMPRESSION_DGI' }),
      demandesAPI.list({ statut: 'EN_INSTRUCTION_DGI' }),
      demandesAPI.list({ statut: 'VALIDE' }),
    ]).then(([a, b, c, d, e]) => {
      const soumises    = (a.data.results || a.data).length
      const enReception = (b.data.results || b.data).length
      const aImprimer   = (c.data.results || c.data).length
      setCounts({
        nouvelles:    soumises + enReception,       // nouveaux dossiers
        aImprimer:    soumises + enReception + aImprimer, // tous à imprimer
        enInstruction:(d.data.results || d.data).length,
        traites:      (e.data.results || e.data).length,
      })
    }).catch(() => {})
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Secrétariat DGI</h1>
      <p className="text-sm text-gray-500 mb-6">Impression des dossiers et mise à disposition pour instruction</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Nouvelles demandes',     value: counts.nouvelles,     color: 'text-red-600',   bg: 'bg-red-50',   icon: Inbox,       link: '/dgi-sec/dossiers' },
          { label: 'À imprimer',             value: counts.aImprimer,    color: 'text-amber-600', bg: 'bg-amber-50',  icon: Printer,     link: '/dgi-sec/dossiers' },
          { label: 'En instruction',         value: counts.enInstruction, color: 'text-blue-600',  bg: 'bg-blue-50',  icon: PenLine,     link: '/dgi-sec/dossiers' },

        ].map(s => (
          <div key={s.label} onClick={() => s.link && (window.location.href = s.link)}
               className="card p-5 hover:shadow-md cursor-pointer">
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 border-l-4 border-amber-400">
        <h3 className="font-bold text-gray-700 text-sm mb-2">Rôle du Secrétariat DGI</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
          {['Réception dossier','Impression circuit papier','Mise à disposition DGI'].map((s, i, arr) => (
            <React.Fragment key={s}>
              <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-medium">{s}</span>
              {i < arr.length - 1 && <ArrowRight size={11} className="text-gray-400" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Vous réceptionnez les dossiers et les mettez à disposition pour impression et instruction technique par le Directeur.
        </p>
      </div>
    </div>
  )
}

export function DGISecDossiers(): JSX.Element {
  return (
    <DossiersList
      titre="Dossiers à imprimer — Secrétariat DGI"
      statutsFiltres={['SOUMISE', 'EN_RECEPTION', 'PRET_IMPRESSION_DGI', 'EN_INSTRUCTION_DGI']}
      linkBase="/dgi-sec/dossier-sec"
    />
  )
}

export function DGISecTraites(): JSX.Element {
  return (
    <DossiersList
      titre="Dossiers traités — Secrétariat DGI"
      statutsFiltres={['VALIDE', 'REJETEE']}
      linkBase="/dgi-sec/dossier-sec"
    />
  )
}

export function DGILayout(): JSX.Element {
  return <AgentLayout titre="Direction Générale de l'Industrie" couleur="#854F0B" menu={DGI_MENU} />
}

export function DGIDashboard(): JSX.Element {
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

export function DGIDossiers(): JSX.Element {
  return (
    <DossiersList
      titre="Dossiers en instruction — DGI"
      statutsFiltres={['EN_INSTRUCTION_DGI','EN_LECTURE_SG','TRANSMISE_MINISTRE','EN_LECTURE_MINISTRE']}
      linkBase="/dgi/dossier"
    />
  )
}

export function DGISignature(): JSX.Element {
  return (
    <DossiersList
      titre="Documents à signer — DGI"
      statutsFiltres={['SIGNATURE_DGI']}
      linkBase="/dgi/dossier"
    />
  )
}

export function DGIDossier(): JSX.Element {
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

export function DGIAnalyticsPage(): JSX.Element {
  return <DGIAnalytics />
}

// ── Secrétariat DGI — Impression uniquement ──────────────────
// Affiche UNIQUEMENT les pièces jointes du demandeur.
// Aucune action : pas de transmission, pas de signature, pas de pièce à joindre.
export function DGISecretariatDossier(): JSX.Element {
  const { id } = useParams()
  const [demande, setDemande] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    if (!id) return
    demandesAPI.get(Number(id))
      .then(r => setDemande(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = (): void => {
    if (!demande) return
    setPrinting(true)
    const d = demande
    const pieces: any[] = d.pieces_jointes || []
    const mediaBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api', '')

    // Construire les lignes du tableau de pièces
    const piecesRows = pieces.length > 0
      ? pieces.map((p: any) => {
          const href = p.fichier
            ? (p.fichier.startsWith('http') ? p.fichier : mediaBase + '/media/' + p.fichier)
            : ''
          const lien = href
            ? '<a href="' + href + '" target="_blank" style="color:#1B6B30;font-size:12px;font-weight:bold;">Ouvrir</a>'
            : '<span style="color:#999;">—</span>'
          return '<tr>'
            + '<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;">' + (p.nom_original || p.piece_code || '—') + '</td>'
            + '<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#666;">' + (p.taille_ko ? p.taille_ko + ' Ko' : '—') + '</td>'
            + '<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">' + lien + '</td>'
            + '</tr>'
        }).join('')
      : '<tr><td colspan="3" style="padding:16px;text-align:center;color:#999;">Aucune pièce jointe</td></tr>'

    const dateStr = d.date_soumission ? new Date(d.date_soumission).toLocaleDateString('fr-FR') : '—'

    const html = '<!DOCTYPE html><html><head>'
      + '<title>Dossier ' + d.numero_ref + ' — Pièces jointes</title>'
      + '<style>'
      + '* { margin:0;padding:0;box-sizing:border-box; }'
      + 'body { font-family:Arial,sans-serif;color:#1a1a1a;padding:32px; }'
      + '.header { text-align:center;border-bottom:3px solid #1B6B30;padding-bottom:16px;margin-bottom:24px; }'
      + '.header h1 { color:#1B6B30;font-size:16px;text-transform:uppercase;letter-spacing:1px; }'
      + '.header p { color:#666;font-size:12px;margin-top:4px; }'
      + '.section { margin-bottom:20px; }'
      + '.section-title { font-size:11px;text-transform:uppercase;color:#888;font-weight:bold;letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid #e5e7eb;padding-bottom:4px; }'
      + '.grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }'
      + '.row { display:flex;gap:8px;margin-bottom:6px; }'
      + '.lbl { color:#666;font-size:11px;min-width:130px; }'
      + '.val { font-weight:bold;font-size:12px; }'
      + 'table { width:100%;border-collapse:collapse; }'
      + 'thead th { background:#f0faf4;color:#1B6B30;font-size:11px;text-transform:uppercase;padding:8px 12px;text-align:left;border-bottom:2px solid #1B6B30; }'
      + '.print-btn { margin-top:24px;text-align:center; }'
      + '.print-btn button { background:#1B6B30;color:white;border:none;padding:10px 28px;font-size:14px;font-weight:bold;border-radius:6px;cursor:pointer; }'
      + '@media print { .print-btn { display:none; } }'
      + '</style></head><body>'
      + '<div class="header"><h1>Ministère des Mines et de l\'Industrie</h1><p>Direction Générale de l\'Industrie — Secrétariat</p></div>'
      + '<div class="section"><div class="section-title">Informations de la demande</div>'
      + '<div class="grid">'
      + '<div class="row"><span class="lbl">Référence</span><span class="val">' + d.numero_ref + '</span></div>'
      + '<div class="row"><span class="lbl">Type</span><span class="val">' + (d.type_demande?.libelle || '—') + '</span></div>'
      + '<div class="row"><span class="lbl">Date soumission</span><span class="val">' + dateStr + '</span></div>'
      + '<div class="row"><span class="lbl">Statut</span><span class="val">' + d.statut + '</span></div>'
      + '</div></div>'
      + '<div class="section"><div class="section-title">Demandeur</div>'
      + '<div class="grid">'
      + '<div class="row"><span class="lbl">Nom complet</span><span class="val">' + (d.demandeur_nom || '—') + '</span></div>'
      + '<div class="row"><span class="lbl">Identifiant</span><span class="val">' + (d.demandeur_identifiant || '—') + '</span></div>'
      + '<div class="row"><span class="lbl">Email</span><span class="val">' + (d.demandeur_email || '—') + '</span></div>'
      + '</div></div>'
      + '<div class="section"><div class="section-title">Pièces jointes (' + pieces.length + ')</div>'
      + '<table><thead><tr><th>Document</th><th>Taille</th><th>Lien</th></tr></thead>'
      + '<tbody>' + piecesRows + '</tbody></table>'
      + '</div>'
      + '<div class="print-btn"><button onclick="window.print()">🖨️ Imprimer ce récapitulatif</button></div>'
      + '</body></html>'

    const win = window.open('', '_blank')
    if (!win) { setPrinting(false); return }
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.print(); setPrinting(false) }, 600)
  }

  if (loading) return (
    <div className="p-6 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (!demande) return (
    <div className="p-6 text-center text-gray-400">Dossier introuvable</div>
  )

  const pieces: any[] = demande.pieces_jointes || []
  const mediaBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api', '')

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dgi-sec/dossiers"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700">
          <ArrowLeft size={16} /> Retour
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono font-bold text-amber-700">{demande.numero_ref}</span>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          {demande.statut}
        </span>
      </div>

      {/* Infos demande */}
      <div className="card p-5 mb-4">
        <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <User size={14} className="text-amber-600" /> Informations de la demande
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {([
            ['Référence',        demande.numero_ref],
            ['Type',             demande.type_demande?.libelle],
            ['Demandeur',        demande.demandeur_nom],
            ['Email',            demande.demandeur_email],
            ['Identifiant',      demande.demandeur_identifiant],
            ['Date soumission',  demande.date_soumission
              ? new Date(demande.date_soumission).toLocaleDateString('fr-FR') : '—'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-gray-400">{k}</p>
              <p className="font-semibold text-gray-800 text-sm">{v || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pièces jointes */}
      <div className="card p-5 mb-4">
        <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <FileText size={14} className="text-amber-600" />
          Pièces jointes du demandeur
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {pieces.length} document{pieces.length > 1 ? 's' : ''}
          </span>
        </h3>

        {pieces.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune pièce jointe pour ce dossier</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pieces.map((p: any) => {
              const url = p.fichier
                ? (p.fichier.startsWith('http') ? p.fichier : mediaBase + '/media/' + p.fichier)
                : null
              return (
                <div key={p.id}
                     className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all">
                  <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {/* Nettoyer les noms de code technique → noms lisibles */}
                      {(p.nom_original || p.piece_code || 'Document')
                        .replace(/_file$/i, '')
                        .replace(/_/g, ' ')
                        .replace(/\w/g, (c: string) => c.toUpperCase())}
                    </p>
                    {p.taille_ko && (
                      <p className="text-xs text-gray-400">{p.taille_ko} Ko</p>
                    )}
                  </div>
                  {url && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={url} target="_blank" rel="noreferrer"
                         className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50">
                        <Eye size={13} /> Voir
                      </a>
                      <a href={url} download
                         className="flex items-center gap-1.5 text-xs text-mmi-green hover:text-green-800 font-medium px-2.5 py-1.5 rounded-lg border border-green-200 hover:bg-green-50">
                        <Download size={13} /> Télécharger
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bouton impression */}
      <button
        onClick={handlePrint}
        disabled={printing}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #854F0B, #A0622D)' }}
      >
        {printing
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <><Printer size={16} /> Imprimer le récapitulatif du dossier</>
        }
      </button>
      <p className="text-xs text-center text-gray-400 mt-2">
        Cliquez sur "Voir" pour ouvrir chaque document dans un nouvel onglet
      </p>
    </div>
  )
}