import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, ChevronDown, LogIn, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import i18n from '@/i18n/i18n'

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
]

export default function Navbar() {
  const { t } = useTranslation()
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen]         = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const currentLang = i18n.language

  const changeLang = (code: string) => {
    i18n.changeLanguage(code)
    document.documentElement.dir  = code === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = code
  }

  const handleLogout = () => { logout(); navigate('/') }

  // Lien espace selon rôle — DEMANDEUR → /demandeur, agents → leur espace
  const getEspaceLink = () => {
    if (!user) return '/connexion'
    if (user.is_super_admin) return '/admin'
    const map: Record<string, string> = {
      DEMANDEUR:       '/demandeur',
      SEC_CENTRAL:     '/secretariat',
      SEC_GENERAL:     '/sg',
      MINISTRE:        '/ministre',
      DGI_DIRECTEUR:   '/dgi',
      DGI_SECRETARIAT: '/dgi',
      DDPI_CHEF:       '/ddpi',
      DDPI_AGENT:      '/ddpi',
      MMI_SIGNATAIRE:  '/mmi',
    }
    return map[user.roles[0]] || '/connexion'
  }

  // Lien "Gestion des autorisations" — uniquement pour les demandeurs connectés
  const getAutorisationsLink = () => {
    if (!isAuthenticated) return null           // non connecté → on cache ou on ne redirige pas
    if (user?.roles?.includes('DEMANDEUR')) return '/demandeur'
    return null                                 // agents → ce lien ne les concerne pas
  }

  const isDemandeur = isAuthenticated && user?.roles?.includes('DEMANDEUR')
  const isAgent     = isAuthenticated && !user?.roles?.includes('DEMANDEUR')

  return (
    <nav className="navbar-mmi shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img
              src="/images/logo_mmi.png"
              alt="Logo MMI"
              className="h-14 w-14 object-contain rounded-full border-2 border-white/40 shadow-md"
              style={{ minWidth: 56, minHeight: 56 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </Link>

          {/* ── Navigation desktop ── */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-white font-semibold text-sm hover:text-yellow-200 transition-colors">
              {t('nav.portail')}
            </Link>

            {/* "Gestion des autorisations" :
                - Non connecté       → lien caché (demandeur doit s'inscrire)
                - Demandeur connecté → va vers /demandeur
                - Agent connecté     → ce lien n'apparaît pas (ils ont leur propre espace) */}
            {!isAgent && (
              <Link
                to={isDemandeur ? '/demandeur' : '/connexion'}
                className="text-white font-semibold text-sm hover:text-yellow-200 transition-colors"
              >
                {t('nav.autorisations')}
              </Link>
            )}

            <Link to="/pmne" className="text-white font-semibold text-sm hover:text-yellow-200 transition-colors">
              {t('nav.pmne')}
            </Link>
            <Link to="/contact" className="text-white font-semibold text-sm hover:text-yellow-200 transition-colors">
              {t('nav.contact')}
            </Link>
          </div>

          {/* ── Droite ── */}
          <div className="hidden md:flex items-center gap-4">

            {/* Langues */}
            <div className="flex items-center gap-1">
              {LANGS.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLang(lang.code)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all
                    ${currentLang === lang.code
                      ? 'bg-white text-mmi-green border-white'
                      : 'text-white border-white/50 hover:border-white hover:bg-white/10'}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-white/30" />

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3">
              <a href="https://chk.me/yxMNFpF" target="_blank" rel="noreferrer" title="LinkedIn MMI"
                 className="text-white/80 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
              <a href="https://chk.me/B2HR41P" target="_blank" rel="noreferrer" title="Facebook MMI"
                 className="text-white/80 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://mmi.gov.mr/fr/" target="_blank" rel="noreferrer" title="Site officiel MMI"
                 className="text-white/80 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </a>
            </div>

            <div className="h-5 w-px bg-white/30" />

            {/* ── Auth ──
                Règle :
                - Non connecté       → icône utilisateur → /connexion (agents/admin)
                - Demandeur connecté → icône MASQUÉE (il accède via "Gestion des autorisations")
                - Agent/Admin        → icône → menu déroulant avec "Mon espace" + déconnexion
            */}
            {isAgent ? (
              /* Agent/Admin connecté : menu déroulant */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-white hover:text-yellow-200 transition-colors"
                  title="Mon espace"
                >
                  <div className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                    <LayoutDashboard size={17} className="text-white" />
                  </div>
                  <ChevronDown size={13} className="text-white/70" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-800 truncate">{user?.nom_complet || user?.nom}</p>
                      <p className="text-xs text-mmi-green font-mono">{user?.identifiant_unique}</p>
                    </div>
                    <Link
                      to={getEspaceLink()}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-mmi-green-lt hover:text-mmi-green"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard size={14} />
                      Mon espace
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogIn size={14} className="rotate-180" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : !isAuthenticated ? (
              /* Non connecté : icône → /connexion (agents/admin uniquement) */
              <Link
                to="/connexion-agent"
                title="Espace agents / administrateurs"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </Link>
            ) : null /* Demandeur connecté → icône masquée */}
          </div>

          {/* ── Burger mobile ── */}
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* ── Menu mobile ── */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/20 mt-2 pt-3 space-y-1">
            <Link to="/" className="block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}>{t('nav.portail')}</Link>

            {!isAgent && (
              <Link
                to={isDemandeur ? '/demandeur' : '/connexion'}
                className="block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                {t('nav.autorisations')}
              </Link>
            )}

            <Link to="/pmne" className="block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}>{t('nav.pmne')}</Link>
            <Link to="/contact" className="block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}>{t('nav.contact')}</Link>

            <div className="flex gap-2 pt-2 px-3">
              {LANGS.map(lang => (
                <button key={lang.code} onClick={() => changeLang(lang.code)}
                  className={`text-xs font-bold px-3 py-1 rounded-full border transition-all
                    ${currentLang === lang.code ? 'bg-white text-mmi-green border-white' : 'text-white border-white/50'}`}>
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="flex gap-4 px-3 pt-2">
              <a href="https://chk.me/yxMNFpF" target="_blank" rel="noreferrer" className="text-white/80 hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
              <a href="https://chk.me/B2HR41P" target="_blank" rel="noreferrer" className="text-white/80 hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://mmi.gov.mr/fr/" target="_blank" rel="noreferrer" className="text-white/80 hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </a>
            </div>

            {!isAuthenticated && (
              <Link to="/connexion"
                className="flex items-center justify-center gap-2 bg-white/15 text-white font-medium py-2 rounded-lg mt-2 mx-3 hover:bg-white/25"
                onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Connexion agents
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}