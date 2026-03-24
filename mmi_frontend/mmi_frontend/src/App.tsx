import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RouteGuard from '@/components/ui/RouteGuard'
import HomePage from '@/pages/public/HomePage'
import LoginPage from '@/pages/auth/LoginPage'
import LoginAgentPage from '@/pages/auth/LoginAgentPage'
import ContactPage from '@/pages/public/ContactPage'
import PMNEPage from '@/pages/public/PMNEPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DemandeurLayout from '@/pages/demandeur/DemandeurLayout'
import DemandeurDashboard from '@/pages/demandeur/DemandeurDashboard'
import {
  SecretariatLayout, SecretariatDashboard, SecretariatDossier,
  SGLayout, SGDashboard, SGDossier,
  MinistреLayout, MinistreDashboard, MinistreDossier,
  DGILayout, DGIDashboard, DGIDossier,
  DDPILayout, DDPIDashboard, DDPIDossier,
  MMILayout, MMIDashboard, MMIDossier,
} from '@/pages/agents/AgentPages'
import AdminLayout, { AdminDashboard, AdminUsers } from '@/pages/admin/AdminPages'

const WIP = (t: string) => () => (
  <div className="p-10 text-center">
    <h1 className="text-xl font-bold text-mmi-green mb-2">{t}</h1>
    <p className="text-gray-400 text-sm">En cours de développement</p>
  </div>
)

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/connexion-agent" element={<LoginAgentPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/pmne" element={<PMNEPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/actualites" element={WIP('Actualités')()} />
          <Route path="/actualites/:slug" element={WIP('Article')()} />

          <Route path="/demandeur" element={<RouteGuard roles={['DEMANDEUR']}><DemandeurLayout /></RouteGuard>}>
            <Route index element={<DemandeurDashboard />} />
            <Route path="nouvelle" element={WIP('Nouvelle demande')()} />
            <Route path="demandes" element={WIP('Mes demandes')()} />
            <Route path="demandes/:id" element={WIP('Détail demande')()} />
            <Route path="notifications" element={WIP('Notifications')()} />
          </Route>

          <Route path="/secretariat" element={<RouteGuard roles={['SEC_CENTRAL']}><SecretariatLayout /></RouteGuard>}>
            <Route index element={<SecretariatDashboard />} />
            <Route path="dossier/:id" element={<SecretariatDossier />} />
            <Route path="transmis" element={WIP('Transmis')()} />
          </Route>

          <Route path="/sg" element={<RouteGuard roles={['SEC_GENERAL']}><SGLayout /></RouteGuard>}>
            <Route index element={<SGDashboard />} />
            <Route path="dossier/:id" element={<SGDossier />} />
            <Route path="traites" element={WIP('Traités')()} />
          </Route>

          <Route path="/ministre" element={<RouteGuard roles={['MINISTRE']}><MinistреLayout /></RouteGuard>}>
            <Route index element={<MinistreDashboard />} />
            <Route path="dossier/:id" element={<MinistreDossier />} />
          </Route>

          <Route path="/dgi" element={<RouteGuard roles={['DGI_DIRECTEUR','DGI_SECRETARIAT']}><DGILayout /></RouteGuard>}>
            <Route index element={<DGIDashboard />} />
            <Route path="dossier/:id" element={<DGIDossier />} />
            <Route path="signature" element={WIP('Signatures')()} />
            <Route path="analytics" element={WIP('Analytics')()} />
          </Route>

          <Route path="/ddpi" element={<RouteGuard roles={['DDPI_CHEF','DDPI_AGENT']}><DDPILayout /></RouteGuard>}>
            <Route index element={<DDPIDashboard />} />
            <Route path="dossier/:id" element={<DDPIDossier />} />
            <Route path="visites" element={WIP('Visites')()} />
            <Route path="commites" element={WIP('Comités BP')()} />
          </Route>

          <Route path="/mmi" element={<RouteGuard roles={['MMI_SIGNATAIRE']}><MMILayout /></RouteGuard>}>
            <Route index element={<MMIDashboard />} />
            <Route path="dossier/:id" element={<MMIDossier />} />
          </Route>

          <Route path="/admin" element={<RouteGuard roles={['SUPER_ADMIN']}><AdminLayout /></RouteGuard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="actualites" element={WIP('Actualités admin')()} />
            <Route path="documents" element={WIP('Documents admin')()} />
            <Route path="config" element={WIP('Configuration')()} />
          </Route>

          <Route path="*" element={<div className="min-h-[60vh] flex items-center justify-center"><div className="text-center"><p className="text-7xl font-bold text-mmi-green mb-4">404</p><p className="text-gray-500">Page introuvable</p></div></div>} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}