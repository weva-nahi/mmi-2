// ──────────────────────────────────────────────────────────────
// SECRÉTARIAT CENTRAL
// ──────────────────────────────────────────────────────────────
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'
import { Inbox, Send, CheckSquare } from 'lucide-react'

const SC_MENU = [
  { to: '/secretariat',          icon: Inbox,       label: 'Dossiers reçus' },
  { to: '/secretariat/transmis', icon: Send,        label: 'Transmis au SG' },
]

export function SecretariatLayout() {
  return <AgentLayout titre="Secrétariat Central" couleur="#0C447C" menu={SC_MENU} />
}

export function SecretariatDashboard() {
  return (
    <DossiersList
      titre="Dossiers à réceptionner"
      statutsFiltres={['SOUMISE', 'EN_RECEPTION']}
      linkBase="/secretariat/dossier"
    />
  )
}

export function SecretariatDossier() {
  return (
    <DossierDetail
      backLink="/secretariat"
      backLabel="Retour aux dossiers"
      actionsDisponibles={[
        {
          etape_code: 'SC_RECEPTION',
          label: 'Accuser réception',
          action: 'Accusé de réception et référencement du dossier',
          color: 'blue',
          icon: CheckSquare,
        },
        {
          etape_code: 'SC_TRANSMISSION_SG',
          label: 'Transmettre au SG',
          action: 'Transmission de la lettre annotée au Secrétaire Général',
          color: 'green',
          icon: Send,
        },
      ]}
    />
  )
}

// ──────────────────────────────────────────────────────────────
// SECRÉTAIRE GÉNÉRAL
// ──────────────────────────────────────────────────────────────
const SG_MENU = [
  { to: '/sg',         icon: Inbox, label: 'Dossiers en attente' },
  { to: '/sg/traites', icon: Send,  label: 'Dossiers traités' },
]

export function SGLayout() {
  return <AgentLayout titre="Secrétaire Général" couleur="#534AB7" menu={SG_MENU} />
}

export function SGDashboard() {
  return (
    <DossiersList
      titre="Dossiers — Secrétaire Général"
      statutsFiltres={['TRANSMISE_SG', 'EN_LECTURE_SG']}
      linkBase="/sg/dossier"
    />
  )
}

export function SGDossier() {
  return (
    <DossierDetail
      backLink="/sg"
      backLabel="Retour"
      actionsDisponibles={[
        {
          etape_code: 'SG_LECTURE',
          label: 'Prendre en lecture',
          action: 'Prise en lecture par le Secrétaire Général',
          color: 'blue',
          icon: CheckSquare,
        },
        {
          etape_code: 'SG_TRANSMISSION_MIN',
          label: 'Transmettre au Ministre',
          action: 'Transmission pour lecture ministérielle',
          color: 'yellow',
          icon: Send,
        },
        {
          etape_code: 'SG_TRANSMISSION_DGI',
          label: 'Transmettre à la DGI',
          action: 'Transmission directe à la Direction Générale de l\'Industrie',
          color: 'green',
          icon: Send,
        },
      ]}
    />
  )
}

// ──────────────────────────────────────────────────────────────
// MINISTRE
// ──────────────────────────────────────────────────────────────
const MIN_MENU = [
  { to: '/ministre', icon: Inbox, label: 'Dossiers à lire' },
]

export function MinistреLayout() {
  return <AgentLayout titre="Espace Ministre" couleur="#3C3489" menu={MIN_MENU} />
}

export function MinistreDashboard() {
  return (
    <DossiersList
      titre="Dossiers — Ministre"
      statutsFiltres={['TRANSMISE_MINISTRE', 'EN_LECTURE_MINISTRE']}
      linkBase="/ministre/dossier"
    />
  )
}

export function MinistreDossier() {
  return (
    <DossierDetail
      backLink="/ministre"
      backLabel="Retour"
      actionsDisponibles={[
        {
          etape_code: 'MIN_LECTURE',
          label: 'Prendre en lecture',
          action: 'Lecture et instruction par le Ministre',
          color: 'blue',
          icon: CheckSquare,
        },
        {
          etape_code: 'MIN_TRANSMISSION_DGI',
          label: 'Transmettre à la DGI',
          action: 'Transmission à la DGI après lecture ministérielle',
          color: 'green',
          icon: Send,
        },
      ]}
    />
  )
}

// ──────────────────────────────────────────────────────────────
// DGI
// ──────────────────────────────────────────────────────────────
import { BarChart3, PenLine, FileSignature } from 'lucide-react'

const DGI_MENU = [
  { to: '/dgi',             icon: Inbox,         label: 'Dossiers en instruction' },
  { to: '/dgi/signature',   icon: FileSignature, label: 'À signer' },
  { to: '/dgi/analytics',   icon: BarChart3,     label: 'Tableau de bord' },
]

export function DGILayout() {
  return <AgentLayout titre="Direction Générale de l'Industrie" couleur="#854F0B" menu={DGI_MENU} />
}

export function DGIDashboard() {
  return (
    <DossiersList
      titre="Dossiers — DGI"
      statutsFiltres={['EN_INSTRUCTION_DGI', 'SIGNATURE_DGI']}
      linkBase="/dgi/dossier"
    />
  )
}

export function DGIDossier() {
  return (
    <DossierDetail
      backLink="/dgi"
      backLabel="Retour DGI"
      actionsDisponibles={[
        {
          etape_code: 'DGI_INSTRUCTION',
          label: 'Instruire et annoter',
          action: 'Instruction et annotation technique par la DGI',
          color: 'blue',
          icon: PenLine,
        },
        {
          etape_code: 'DGI_TRANSMISSION_DDPI',
          label: 'Transmettre à la DDPI',
          action: 'Transmission à la Direction du Développement et de la Promotion Industrielle',
          color: 'green',
          icon: Send,
        },
        {
          etape_code: 'DGI_SIGNATURE',
          label: 'Signer le document',
          action: 'Signature officielle du document par la DGI',
          color: 'yellow',
          icon: FileSignature,
        },
      ]}
    />
  )
}

// ──────────────────────────────────────────────────────────────
// DDPI
// ──────────────────────────────────────────────────────────────
import { ClipboardCheck, UserCheck, AlertTriangle } from 'lucide-react'

const DDPI_MENU = [
  { to: '/ddpi',           icon: Inbox,          label: 'Dossiers à traiter' },
  { to: '/ddpi/visites',   icon: UserCheck,      label: 'Visites programmées' },
  { to: '/ddpi/commites',  icon: ClipboardCheck, label: 'Comités BP' },
]

export function DDPILayout() {
  return <AgentLayout titre="Direction Développement & Promotion Industrielle" couleur="#993C1D" menu={DDPI_MENU} />
}

export function DDPIDashboard() {
  return (
    <DossiersList
      titre="Dossiers — DDPI"
      statutsFiltres={['EN_TRAITEMENT_DDPI','DOSSIER_INCOMPLET','VISITE_PROGRAMMEE','EN_COMMISSION_BP','ACCORD_PRINCIPE']}
      linkBase="/ddpi/dossier"
    />
  )
}

export function DDPIDossier() {
  return (
    <DossierDetail
      backLink="/ddpi"
      backLabel="Retour DDPI"
      actionsDisponibles={[
        {
          etape_code: 'DDPI_VERIFICATION',
          label: 'Vérifier le dossier',
          action: 'Vérification de la complétude du dossier',
          color: 'blue',
          icon: ClipboardCheck,
        },
        {
          etape_code: 'DDPI_INCOMPLET',
          label: 'Dossier incomplet',
          action: 'Notification dossier incomplet envoyée au demandeur',
          color: 'yellow',
          icon: AlertTriangle,
        },
        {
          etape_code: 'DDPI_VISITE',
          label: 'Programmer visite',
          action: 'Programmation de la visite des lieux (BP)',
          color: 'blue',
          icon: UserCheck,
        },
        {
          etape_code: 'DDPI_COMMISSION_BP',
          label: 'Réunion comité BP',
          action: 'Réunion de la commission du comité BP',
          color: 'blue',
          icon: ClipboardCheck,
        },
        {
          etape_code: 'DDPI_ACCORD_PRINCIPE',
          label: 'Accord de principe',
          action: 'Accord de principe accordé',
          color: 'green',
          icon: CheckSquare,
        },
        {
          etape_code: 'DDPI_REJET',
          label: 'Rejeter le dossier',
          action: 'Rejet du dossier — lettre de notification envoyée',
          color: 'red',
          icon: ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
        },
        {
          etape_code: 'DDPI_CHEF_SERVICE',
          label: 'Transmettre au Chef',
          action: 'Transmission au Chef de service DDPI',
          color: 'blue',
          icon: Send,
        },
      ]}
    />
  )
}

// ──────────────────────────────────────────────────────────────
// MMI SIGNATAIRE
// ──────────────────────────────────────────────────────────────
const MMI_MENU = [
  { to: '/mmi', icon: FileSignature, label: 'Arrêtés à signer' },
]

export function MMILayout() {
  return <AgentLayout titre="MMI — Signature des arrêtés" couleur="#1B6B30" menu={MMI_MENU} />
}

export function MMIDashboard() {
  return (
    <DossiersList
      titre="Arrêtés à signer — MMI"
      statutsFiltres={['SIGNATURE_MMI']}
      linkBase="/mmi/dossier"
    />
  )
}

export function MMIDossier() {
  return (
    <DossierDetail
      backLink="/mmi"
      backLabel="Retour MMI"
      actionsDisponibles={[
        {
          etape_code: 'MMI_SIGNATURE',
          label: 'Signer l\'arrêté',
          action: 'Signature officielle de l\'arrêté par le MMI',
          color: 'green',
          icon: FileSignature,
        },
      ]}
    />
  )
}
