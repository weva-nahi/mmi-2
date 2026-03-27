import React, { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Inbox, UserCheck, ClipboardCheck, AlertTriangle, Send,
  CheckSquare, BarChart3, XCircle, PenLine, ArrowRight,
  FileText, Upload, Download, Printer, Clock, CheckCircle,
  CreditCard, Users, Building2, Wrench
} from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'
import toast from 'react-hot-toast'

// ── Menus par rôle ─────────────────────────────────────────────
const DDPI_DIR_MENU = [
  { to: '/ddpi',            icon: BarChart3,      label: 'Tableau de bord'   },
  { to: '/ddpi/dossiers',   icon: Inbox,          label: 'Tous les dossiers' },
  { to: '/ddpi/visites',    icon: UserCheck,      label: 'Visites'           },
  { to: '/ddpi/commites',   icon: ClipboardCheck, label: 'Comités BP'        },
]

const DDPI_BP_MENU = [
  { to: '/ddpi',            icon: BarChart3,      label: 'Tableau de bord'   },
  { to: '/ddpi/dossiers',   icon: Inbox,          label: 'Dossiers BP'       },
  { to: '/ddpi/visites',    icon: UserCheck,      label: 'Visites'           },
  { to: '/ddpi/commites',   icon: ClipboardCheck, label: 'Comités BP'        },
]

const DDPI_USINES_MENU = [
  { to: '/ddpi',            icon: BarChart3,      label: 'Tableau de bord'   },
  { to: '/ddpi/dossiers',   icon: Inbox,          label: 'Dossiers Usines'   },
  { to: '/ddpi/visites',    icon: UserCheck,      label: 'Visites'           },
]

export function DDPILayout() {
  return <AgentLayout titre="Direction Développement & Promotion Industrielle" couleur="#993C1D" menu={DDPI_DIR_MENU} />
}

// ── Dashboard DDPI ─────────────────────────────────────────────
export function DDPIDashboard() {
  const [counts, setCounts] = useState({
    entrant:0, bp:0, usines:0, visites:0,
    commission:0, incomplet:0, accord:0
  })

  useEffect(() => {
    Promise.all([
      demandesAPI.list({ statut: 'EN_TRAITEMENT_DDPI'    }),
      demandesAPI.list({ statut: 'EN_TRAITEMENT_DDPI_BP' }),
      demandesAPI.list({ statut: 'EN_TRAITEMENT_DDPI_US' }),
      demandesAPI.list({ statut: 'VISITE_PROGRAMMEE'     }),
      demandesAPI.list({ statut: 'EN_COMMISSION_BP'      }),
      demandesAPI.list({ statut: 'DOSSIER_INCOMPLET'     }),
      demandesAPI.list({ statut: 'ACCORD_PRINCIPE'       }),
    ]).then(([a,b,c,d,e,f,g]) => setCounts({
      entrant:    (a.data.results||a.data).length,
      bp:         (b.data.results||b.data).length,
      usines:     (c.data.results||c.data).length,
      visites:    (d.data.results||d.data).length,
      commission: (e.data.results||e.data).length,
      incomplet:  (f.data.results||f.data).length,
      accord:     (g.data.results||g.data).length,
    })).catch(() => {})
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1">
        Direction du Développement & de la Promotion Industrielle
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Traitement technique des dossiers industriels
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:'À orienter',         value:counts.entrant,   color:'text-orange-600', bg:'bg-orange-50',  icon:Inbox,          link:'/ddpi/dossiers'  },
          { label:'Dossiers BP',         value:counts.bp,        color:'text-amber-600',  bg:'bg-amber-50',   icon:Building2,      link:'/ddpi/dossiers'  },
          { label:'Dossiers Usines',     value:counts.usines,    color:'text-blue-600',   bg:'bg-blue-50',    icon:Wrench,         link:'/ddpi/dossiers'  },
          { label:'Visites programmées', value:counts.visites,   color:'text-teal-600',   bg:'bg-teal-50',    icon:UserCheck,      link:'/ddpi/visites'   },
          { label:'En commission BP',    value:counts.commission,color:'text-purple-600', bg:'bg-purple-50',  icon:ClipboardCheck, link:'/ddpi/commites'  },
          { label:'Incomplets',          value:counts.incomplet, color:'text-red-600',    bg:'bg-red-50',     icon:AlertTriangle,  link:'/ddpi/dossiers'  },
          { label:'Accord de principe',  value:counts.accord,    color:'text-green-600',  bg:'bg-green-50',   icon:CheckSquare,    link:null              },
        ].map(s => (
          <div key={s.label}
               onClick={() => s.link && (window.location.href = s.link)}
               className={`card p-4 ${s.link ? 'hover:shadow-md cursor-pointer' : ''}`}>
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerte dossiers incomplets */}
      {counts.incomplet > 0 && (
        <div className="card p-4 mb-4 border-l-4 border-red-400 bg-red-50/50">
          <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
            <AlertTriangle size={15} /> {counts.incomplet} dossier(s) incomplet(s)
          </div>
          <p className="text-xs text-gray-500">Des demandeurs attendent votre retour.</p>
          <Link to="/ddpi/dossiers" className="text-xs text-red-600 hover:underline mt-1 block">
            Traiter les dossiers incomplets →
          </Link>
        </div>
      )}

      {/* Circuit DDPI */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Circuit DDPI</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { label:'Réception DGI',      color:'bg-orange-100 text-orange-700' },
            { label:'Vérification',       color:'bg-blue-100 text-blue-700'    },
            { label:'Orientation BP/Usines', color:'bg-amber-100 text-amber-700' },
            { label:'Visite / Commission', color:'bg-teal-100 text-teal-700'  },
            { label:'Accord / Arrêté',    color:'bg-green-100 text-green-700'  },
            { label:'Signature MMI',      color:'bg-purple-100 text-purple-700'},
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <span className={`${step.color} px-2 py-1 rounded-lg font-medium`}>{step.label}</span>
              {i < arr.length-1 && <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Listes dossiers ────────────────────────────────────────────
export function DDPIDossiers() {
  const { user } = useAuthStore()
  const roles = user?.roles || []

  // Routing intelligent selon le rôle
  const isChefBP     = roles.includes('DDPI_CHEF_BP')
  const isChefUsines = roles.includes('DDPI_CHEF_USINES')
  const isSecComite  = roles.includes('SEC_COMITE_BP')

  // Statuts et lien selon le rôle
  const config = isChefBP ? {
    titre:    'Dossiers Boulangeries — Chef Service BP',
    statuts:  ['EN_TRAITEMENT_DDPI_BP','VISITE_PROGRAMMEE','EN_COMMISSION_BP','ACCORD_PRINCIPE'],
    link:     '/ddpi/dossier-bp',
  } : isChefUsines ? {
    titre:    'Dossiers Usines — Chef Service Usines',
    statuts:  ['EN_TRAITEMENT_DDPI_US','VISITE_PROGRAMMEE','ACCORD_PRINCIPE','ARRETE_EN_COURS'],
    link:     '/ddpi/dossier-usines',
  } : isSecComite ? {
    titre:    'Comités BP — Secrétaire',
    statuts:  ['EN_COMMISSION_BP','PV_COMITE_DEPOSE','ATTENTE_QUITTANCE','ACCORD_PRINCIPE'],
    link:     '/ddpi/comite-bp',
  } : {
    titre:    'Tous les dossiers — DDPI',
    statuts:  ['EN_TRAITEMENT_DDPI','EN_TRAITEMENT_DDPI_BP','EN_TRAITEMENT_DDPI_US',
               'DOSSIER_INCOMPLET','VISITE_PROGRAMMEE','EN_COMMISSION_BP',
               'PV_COMITE_DEPOSE','ATTENTE_QUITTANCE','ACCORD_PRINCIPE','ARRETE_EN_COURS'],
    link:     '/ddpi/dossier',
  }

  return (
    <DossiersList
      titre={config.titre}
      statutsFiltres={config.statuts}
      linkBase={config.link}
    />
  )
}

export function DDPIVisites() {
  return <DossiersList titre="Visites programmées" statutsFiltres={['VISITE_PROGRAMMEE']} linkBase="/ddpi/dossier" />
}

export function DDPIComites() {
  return (
    <DossiersList
      titre="Comités BP — Suivi"
      statutsFiltres={['EN_COMMISSION_BP','PV_COMITE_DEPOSE','ATTENTE_QUITTANCE']}
      linkBase="/ddpi/dossier"
    />
  )
}

// ── Dossier DDPI — routing automatique selon rôle ─────────────
export function DDPIDossier() {
  const { user } = useAuthStore()
  const roles = user?.roles || []

  // Router selon le rôle connecté
  if (roles.includes('DDPI_CHEF_BP'))
    return <DDPIChefBPDossier />
  if (roles.includes('DDPI_CHEF_USINES'))
    return <DDPIChefUsinesDossier />
  if (roles.includes('SEC_COMITE_BP'))
    return <SecretaireComiteBPDossier />
  // Default: Directeur DDPI ou Agent
  return <DDPIDirecteurDossier />
}

// ── Dossier DDPI Directeur (orientation) ──────────────────────
function DDPIDirecteurDossier() {
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
        { etape_code:'DDPI_VERIFICATION',  label:'Vérifier complétude',        action:'Vérification de la complétude du dossier par la DDPI',                        color:'blue',   icon:CheckSquare    },
        { etape_code:'DDPI_INCOMPLET',     label:'Signaler incomplet',          action:'Dossier incomplet — demande de compléments au demandeur',                     color:'yellow', icon:AlertTriangle  },
        { etape_code:'DDPI_CHEF_BP',       label:'Orienter → Chef BP',          action:'Orientation vers le Chef de Service Boulangeries / Pâtisseries',              color:'yellow',  icon:Building2      },
        { etape_code:'DDPI_CHEF_USINES',   label:'Orienter → Chef Usines',      action:'Orientation vers le Chef de Service Usines Industrielles',                    color:'blue',   icon:Wrench         },
        { etape_code:'DDPI_ACCORD_PRINCIPE', label:'Accord de principe',        action:'Accord de principe accordé par le Directeur DDPI',                            color:'green',  icon:CheckSquare    },
        { etape_code:'DDPI_ARRETE_REDACTION', label:"Rédiger l'arrêté",         action:"Démarrage de la rédaction de l'arrêté final",                                color:'blue',   icon:PenLine        },
        { etape_code:'DDPI_REJET',         label:'Rejeter le dossier',          action:'Rejet motivé — notification envoyée au demandeur',                            color:'red',    icon:RejetIcon      },
      ]}
    />
  )
}

// ── Dossier Chef Service BP ────────────────────────────────────
export function DDPIChefBPDossier() {
  return (
    <DossierDetail
      backLink="/ddpi/dossiers"
      backLabel="Retour Chef BP"
      actionsDisponibles={[
        { etape_code:'DDPI_VISITE',        label:'Programmer visite',           action:'Programmation de la visite des lieux de l\'établissement',                   color:'blue',   icon:UserCheck      },
        { etape_code:'DDPI_PV_VISITE',     label:'Déposer PV de visite',        action:'Procès-verbal de visite des lieux déposé',                                  color:'blue',   icon:FileText       },
        { etape_code:'DDPI_COMMISSION_BP', label:'Soumettre en commission BP',   action:'Dossier soumis à la commission BP pour délibération',                       color:'blue', icon:ClipboardCheck },
        { etape_code:'DDPI_INCOMPLET',     label:'Signaler incomplet',           action:'Dossier incomplet — demande de compléments',                                color:'yellow', icon:AlertTriangle  },
        { etape_code:'DDPI_ACCORD_PRINCIPE', label:'Accord de principe',         action:'Accord de principe — dossier BP approuvé',                                 color:'green',  icon:CheckSquare    },
      ]}
    />
  )
}

// ── Dossier Chef Service Usines ────────────────────────────────
export function DDPIChefUsinesDossier() {
  return (
    <DossierDetail
      backLink="/ddpi/dossiers"
      backLabel="Retour Chef Usines"
      actionsDisponibles={[
        { etape_code:'DDPI_VISITE',        label:'Programmer visite',           action:'Programmation de la visite du site industriel',                             color:'blue',   icon:UserCheck      },
        { etape_code:'DDPI_PV_VISITE',     label:'Déposer PV de visite',        action:'Procès-verbal de visite du site déposé',                                   color:'blue',   icon:FileText       },
        { etape_code:'DDPI_ACCORD_PRINCIPE', label:'Accord de principe',         action:'Accord de principe — unité industrielle approuvée',                        color:'green',  icon:CheckSquare    },
        { etape_code:'DDPI_ARRETE_REDACTION', label:"Lancer rédaction arrêté",   action:"Démarrage de la rédaction de l'arrêté ou accord de principe",             color:'blue',   icon:PenLine        },
        { etape_code:'DDPI_INCOMPLET',     label:'Signaler incomplet',           action:'Dossier incomplet — demande de compléments',                               color:'yellow', icon:AlertTriangle  },
        { etape_code:'DDPI_REJET',         label:'Rejeter',                      action:'Rejet motivé du dossier usine',                                            color:'red',    icon:XCircle        },
      ]}
    />
  )
}

// ── Secrétaire Comité BP ───────────────────────────────────────
export function SecretaireComiteBPDossier() {
  const { id } = useParams()
  const [demande, setDemande] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pvFile, setPvFile]   = useState<File | null>(null)
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving]   = useState(false)

  const load = () => {
    if (!id) return
    demandesAPI.get(Number(id))
      .then(r => setDemande(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const deposerPV = async () => {
    if (!demande) return
    setSaving(true)
    try {
      // Joindre le PV si fourni
      if (pvFile) {
        const fd = new FormData()
        fd.append('fichier', pvFile)
        await demandesAPI.uploadPieceAgent(demande.id, fd).catch(() => {})
      }
      // Enregistrer l'étape PV Comité
      await demandesAPI.transmettre(demande.id, {
        etape_code: 'DDPI_PV_COMITE_BP',
        action: 'Procès-verbal du comité BP déposé — en attente de quittance',
        commentaire,
      })
      toast.success('PV du comité BP enregistré')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const demanderQuittance = async () => {
    if (!demande) return
    setSaving(true)
    try {
      await demandesAPI.transmettre(demande.id, {
        etape_code: 'DDPI_QUITTANCE_BP',
        action: 'Demande de quittance de paiement émise au demandeur',
        commentaire: 'Veuillez déposer la quittance de paiement des frais d\'autorisation.',
      })
      toast.success('Notification quittance envoyée au demandeur')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const validerQuittance = async () => {
    if (!demande) return
    setSaving(true)
    try {
      await demandesAPI.quittanceRecue(demande.id, commentaire)
      toast.success('Quittance validée — Accord de principe accordé')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (!demande) return <div className="p-6 text-center text-gray-400">Dossier introuvable</div>

  const isPVDepose    = ['PV_COMITE_DEPOSE','ATTENTE_QUITTANCE','ACCORD_PRINCIPE'].includes(demande.statut)
  const isQuittance   = demande.statut === 'ATTENTE_QUITTANCE'
  const isAccord      = demande.statut === 'ACCORD_PRINCIPE'
  const piecesJointes = demande.pieces_jointes || []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/ddpi/commites" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-mmi-green">
          ← Comités BP
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono font-bold text-mmi-green">{demande.numero_ref}</span>
        <StatusBadge statut={demande.statut} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Infos dossier */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-gray-700 text-sm mb-4">Informations du dossier</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Référence',     demande.numero_ref],
                ['Type',          demande.type_demande?.libelle],
                ['Établissement', demande.raison_sociale],
                ['Wilaya',        demande.wilaya],
                ['Demandeur',     demande.demandeur_nom],
                ['Email',         demande.demandeur_email],
              ].map(([k,v]) => (
                <div key={k as string}>
                  <p className="text-xs text-gray-400">{k}</p>
                  <p className="font-semibold text-gray-800 text-sm">{v || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pièces jointes existantes */}
          {piecesJointes.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <FileText size={14} /> Pièces jointes ({piecesJointes.length})
              </h3>
              <div className="space-y-2">
                {piecesJointes.map((pj: any) => (
                  <a key={pj.id} href={pj.fichier} target="_blank" rel="noreferrer"
                     className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:border-mmi-green hover:bg-mmi-green-lt transition-colors">
                    <FileText size={14} className="text-mmi-green flex-shrink-0" />
                    <span className="text-xs text-gray-700 flex-1 truncate">{pj.nom_original}</span>
                    <Download size={13} className="text-mmi-green flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Historique */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <Clock size={14} className="text-gray-400" /> Historique
            </h3>
            {(demande.etapes || []).map((e: any, i: number) => (
              <div key={e.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-mmi-green-lt border-2 border-mmi-green flex-shrink-0" />
                  {i < (demande.etapes||[]).length-1 && <div className="w-0.5 h-6 bg-gray-200 my-1" />}
                </div>
                <div className="pb-3 flex-1">
                  <p className="text-xs font-semibold text-gray-800">{e.action}</p>
                  <p className="text-xs text-gray-400">{e.acteur_nom}</p>
                  {e.commentaire && <p className="text-xs text-gray-500 italic mt-0.5">"{e.commentaire}"</p>}
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(e.date_action).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Secrétaire Comité BP */}
        <div className="space-y-4">

          {/* Étape 1 : Déposer PV */}
          {!isPVDepose && (
            <div className="card p-5 border-l-4 border-purple-400">
              <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <ClipboardCheck size={15} className="text-purple-500" /> Étape 1 — PV du comité
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="form-label text-xs">PV du comité BP (PDF)</label>
                  <label className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed cursor-pointer
                    ${pvFile ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-400'}`}>
                    <input type="file" className="hidden" accept=".pdf"
                           onChange={e => setPvFile(e.target.files?.[0] || null)} />
                    <Upload size={14} className={pvFile ? 'text-purple-500' : 'text-gray-400'} />
                    <span className="text-xs text-gray-600 truncate">
                      {pvFile ? pvFile.name : 'Choisir le PV (PDF)'}
                    </span>
                  </label>
                </div>
                <div>
                  <label className="form-label text-xs">Résultat du comité</label>
                  <textarea className="form-input text-sm resize-none" rows={2}
                            placeholder="Décision du comité..."
                            value={commentaire}
                            onChange={e => setCommentaire(e.target.value)} />
                </div>
                <button onClick={deposerPV} disabled={saving}
                        className="w-full py-2.5 rounded-xl font-bold text-white text-sm bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <><ClipboardCheck size={14} /> Enregistrer le PV</>}
                </button>
              </div>
            </div>
          )}

          {/* Étape 2 : Demander quittance */}
          {isPVDepose && !isAccord && (
            <div className="card p-5 border-l-4 border-amber-400">
              <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <CreditCard size={15} className="text-amber-500" /> Étape 2 — Quittance de paiement
              </h3>
              {!isQuittance ? (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Le PV a été déposé. Demandez au demandeur de payer les frais et de déposer la quittance.
                  </p>
                  <button onClick={demanderQuittance} disabled={saving}
                          className="w-full py-2.5 rounded-xl font-bold text-white text-sm bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-2 disabled:opacity-60">
                    <CreditCard size={14} /> Demander la quittance
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Le demandeur a été notifié. Validez la quittance dès réception.
                  </p>
                  <div className="mb-3">
                    <label className="form-label text-xs">Référence quittance</label>
                    <input className="form-input text-sm" placeholder="N° quittance..."
                           value={commentaire} onChange={e => setCommentaire(e.target.value)} />
                  </div>
                  <button onClick={validerQuittance} disabled={saving}
                          className="w-full py-2.5 rounded-xl font-bold text-white text-sm bg-mmi-green hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <><CheckCircle size={14} /> Valider la quittance</>}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Accordé */}
          {isAccord && (
            <div className="card p-5 bg-green-50 border border-mmi-green">
              <div className="flex items-center gap-2 text-mmi-green font-bold text-sm mb-2">
                <CheckCircle size={16} /> Accord de principe accordé ✅
              </div>
              <p className="text-xs text-gray-600">
                La quittance a été validée. L'accord de principe est accordé. 
                Le dossier est transmis pour la rédaction de l'arrêté.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}