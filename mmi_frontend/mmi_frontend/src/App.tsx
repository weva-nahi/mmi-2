import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RouteGuard from '@/components/ui/RouteGuard'

// Public
import HomePage    from '@/pages/public/HomePage'
import ContactPage from '@/pages/public/ContactPage'
import PMNEPage          from '@/pages/public/PMNEPage'
import ActualitesPage     from '@/pages/public/ActualitesPage'
import ArticleDetailPage  from '@/pages/public/ArticleDetailPage'

// Auth
import LoginPage      from '@/pages/auth/LoginPage'
import RegisterPage   from '@/pages/auth/RegisterPage'
import LoginAgentPage from '@/pages/auth/LoginAgentPage'
import MotDePasseOubliePage from '@/pages/auth/MotDePasseOubliePage'

// Demandeur
import DemandeurLayout        from '@/pages/demandeur/DemandeurLayout'
import DemandeurDashboard     from '@/pages/demandeur/DemandeurDashboard'
import NouvelleDemandeWizard  from '@/pages/demandeur/NouvelleDemandeWizard'
import MesDemandes            from '@/pages/demandeur/MesDemandes'
import SuiviDemande           from '@/pages/demandeur/SuiviDemande'
import NotificationsPage      from '@/pages/demandeur/Notifications'
import ProfilPage                  from '@/pages/demandeur/ProfilPage'
import FormulaireRenouvellement    from '@/pages/demandeur/FormulaireRenouvellement'
import FormulaireExtension         from '@/pages/demandeur/FormulaireExtension'

// Secrétariat Central
import { SecretariatLayout, SecretariatDashboard, SecretariatDossiers, SecretariatTransmis, SecretariatDossier } from '@/pages/agents/SecretariatPages'

// Secrétaire Général
import { SGLayout, SGDashboard, SGDossiers, SGTraites, SGDossier } from '@/pages/agents/SGPages'

// Ministre
import { MinistreLayout, MinistreDashboard, MinistreDossiers, MinistreDossier } from '@/pages/agents/MinistреPages'

// DGI
import { DGILayout, DGIDashboard, DGIDossiers, DGISignature, DGIDossier } from '@/pages/agents/DGIPages'

// DDPI
import { DDPILayout, DDPIDashboard, DDPIDossiers, DDPIVisites, DDPIComites, DDPIDossier } from '@/pages/agents/Ddpipages'
import FormulaireVisite   from '@/pages/agents/FormulaireVisite'
import FormulaireComiteBP from '@/pages/agents/FormulaireComiteBP'
import Distance500m       from '@/pages/agents/Distance500m'

// MMI
import { MMILayout, MMIDashboard, MMIDossiers, MMISignes, MMIDossier } from '@/pages/agents/Mmipages'

// Admin
import AdminLayout, { AdminDashboard, AdminUsers, AdminActualites, AdminConfig } from '@/pages/admin/AdminFullPages'
import AdminDocumentsPage   from '@/pages/admin/AdminDocumentsPage'
import PiecesRequisesPage    from '@/pages/admin/PiecesRequisesPage'

const WIP = (t: string) => () => (
  <div className="p-10 text-center">
    <h1 className="text-xl font-bold text-mmi-green mb-2">{t}</h1>
    <p className="text-gray-400 text-sm">En cours de développement</p>
  </div>
)

const NotFound = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <p className="text-7xl font-bold text-mmi-green mb-4">404</p>
      <p className="text-gray-500">Page introuvable</p>
    </div>
  </div>
)

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">
        <Routes>
          {/* ── Public ── */}
          <Route path="/"                element={<HomePage />} />
          <Route path="/connexion"       element={<LoginPage />} />
          <Route path="/connexion-agent" element={<LoginAgentPage />} />
          <Route path="/inscription"     element={<RegisterPage />} />
          <Route path="/pmne"            element={<PMNEPage />} />
          <Route path="/contact"         element={<ContactPage />} />
          <Route path="/actualites"      element={<ActualitesPage />} />
          <Route path="/actualites/:slug" element={<ArticleDetailPage />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOubliePage />} />

          {/* ── Demandeur ── */}
          <Route path="/demandeur" element={<RouteGuard roles={['DEMANDEUR']}><DemandeurLayout /></RouteGuard>}>
            <Route index               element={<DemandeurDashboard />} />
            <Route path="nouvelle"     element={<NouvelleDemandeWizard />} />
            <Route path="demandes"     element={<MesDemandes />} />
            <Route path="demandes/:id" element={<SuiviDemande />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profil"               element={<ProfilPage />} />
            <Route path="renouvellement"       element={<FormulaireRenouvellement />} />
            <Route path="extension"            element={<FormulaireExtension />} />
          </Route>

          {/* ── Secrétariat Central ── */}
          <Route path="/secretariat" element={<RouteGuard roles={['SEC_CENTRAL']}><SecretariatLayout /></RouteGuard>}>
            <Route index               element={<SecretariatDashboard />} />
            <Route path="dossiers"     element={<SecretariatDossiers />} />
            <Route path="transmis"     element={<SecretariatTransmis />} />
            <Route path="dossier/:id"  element={<SecretariatDossier />} />
          </Route>

          {/* ── Secrétaire Général ── */}
          <Route path="/sg" element={<RouteGuard roles={['SEC_GENERAL']}><SGLayout /></RouteGuard>}>
            <Route index              element={<SGDashboard />} />
            <Route path="dossiers"    element={<SGDossiers />} />
            <Route path="traites"     element={<SGTraites />} />
            <Route path="dossier/:id" element={<SGDossier />} />
          </Route>

          {/* ── Ministre ── */}
          <Route path="/ministre" element={<RouteGuard roles={['MINISTRE']}><MinistreLayout /></RouteGuard>}>
            <Route index              element={<MinistreDashboard />} />
            <Route path="dossiers"    element={<MinistreDossiers />} />
            <Route path="dossier/:id" element={<MinistreDossier />} />
          </Route>

          {/* ── DGI ── */}
          <Route path="/dgi" element={<RouteGuard roles={['DGI_DIRECTEUR','DGI_SECRETARIAT']}><DGILayout /></RouteGuard>}>
            <Route index              element={<DGIDashboard />} />
            <Route path="dossiers"    element={<DGIDossiers />} />
            <Route path="signature"   element={<DGISignature />} />
            <Route path="dossier/:id" element={<DGIDossier />} />
          </Route>

          {/* ── DDPI ── */}
          <Route path="/ddpi" element={<RouteGuard roles={['DDPI_CHEF','DDPI_AGENT']}><DDPILayout /></RouteGuard>}>
            <Route index              element={<DDPIDashboard />} />
            <Route path="dossiers"    element={<DDPIDossiers />} />
            <Route path="visites"     element={<DDPIVisites />} />
            <Route path="commites"    element={<DDPIComites />} />
            <Route path="dossier/:id"   element={<DDPIDossier />} />
            <Route path="visite/:id"    element={<FormulaireVisite />} />
            <Route path="comite-bp/:id" element={<FormulaireComiteBP />} />
            <Route path="distance/:id"  element={<Distance500m />} />
          </Route>

          {/* ── MMI Signataire ── */}
          <Route path="/mmi" element={<RouteGuard roles={['MMI_SIGNATAIRE']}><MMILayout /></RouteGuard>}>
            <Route index              element={<MMIDashboard />} />
            <Route path="dossiers"    element={<MMIDossiers />} />
            <Route path="signes"      element={<MMISignes />} />
            <Route path="dossier/:id" element={<MMIDossier />} />
          </Route>

          {/* ── Super Admin ── */}
          <Route path="/admin" element={<RouteGuard roles={['SUPER_ADMIN']}><AdminLayout /></RouteGuard>}>
            <Route index              element={<AdminDashboard />} />
            <Route path="users"       element={<AdminUsers />} />
            <Route path="actualites"  element={<AdminActualites />} />
            <Route path="documents"   element={<AdminDocumentsPage />} />
            <Route path="config"          element={<AdminConfig />} />
            <Route path="pieces-requises" element={<PiecesRequisesPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}