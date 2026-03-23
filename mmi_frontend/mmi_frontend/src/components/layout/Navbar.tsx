import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Facebook, Linkedin, Globe, Bell, Menu, X, ChevronDown } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const currentLang = i18n.language

  const changeLang = (code: string) => {
    i18n.changeLanguage(code)
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = code
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getEspaceLink = () => {
    if (!user) return '/connexion'
    if (user.is_super_admin) return '/admin'
    const role = user.roles[0]
    const map: Record<string, string> = {
      DEMANDEUR: '/demandeur',
      SEC_CENTRAL: '/secretariat',
      SEC_GENERAL: '/sg',
      MINISTRE: '/ministre',
      DGI_DIRECTEUR: '/dgi',
      DGI_SECRETARIAT: '/dgi',
      DDPI_CHEF: '/ddpi',
      DDPI_AGENT: '/ddpi',
      MMI_SIGNATAIRE: '/mmi',
    }
    return map[role] || '/connexion'
  }

  return (
    <nav className="navbar-mmi shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo + Nom */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/images/logo_mmi.png"
              alt="Logo MMI"
              className="h-10 w-10 object-contain rounded-full"
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </Link>

          {/* Navigation principale — desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-white font-semibold text-sm hover:text-yellow-200 transition-colors">
              {t('nav.portail')}
            </Link>
            <Link
              to={isAuthenticated ? getEspaceLink() : '/connexion'}
              className="text-white font-semibold text-sm hover:text-yellow-200 transition-colors"
            >
              {t('nav.autorisations')}
            </Link>
            <Link to="/pmne" className="text-white font-semibold text-sm hover:text-yellow-200 transition-colors">
              {t('nav.pmne')}
            </Link>
            <Link to="/contact" className="text-white font-semibold text-sm hover:text-yellow-200 transition-colors">
              {t('nav.contact')}
            </Link>
          </div>

          {/* Droite : langues + réseaux + auth */}
          <div className="hidden md:flex items-center gap-4">
            {/* Sélecteur de langue */}
            <div className="flex items-center gap-1">
              {LANGS.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLang(lang.code)}
                  className={`
                    text-xs font-bold px-2.5 py-1 rounded-full border transition-all
                    ${currentLang === lang.code
                      ? 'bg-white text-mmi-green border-white'
                      : 'text-white border-white/50 hover:border-white hover:bg-white/10'}
                  `}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3 border-l border-white/30 pl-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer"
                 className="text-white/80 hover:text-white transition-colors">
                <Facebook size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer"
                 className="text-white/80 hover:text-white transition-colors">
                <Linkedin size={18} />
              </a>
              <a href="https://mmi.gov.mr" target="_blank" rel="noreferrer"
                 className="text-white/80 hover:text-white transition-colors">
                <Globe size={18} />
              </a>
            </div>

            {/* Auth */}
            <div className="border-l border-white/30 pl-4">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-white text-sm font-medium hover:text-yellow-200 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      {user?.nom?.charAt(0)}{user?.prenom?.charAt(0)}
                    </div>
                    <span className="hidden lg:block">{user?.nom_complet || user?.nom}</span>
                    <ChevronDown size={14} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                      <Link
                        to={getEspaceLink()}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-mmi-green-lt hover:text-mmi-green"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Mon espace
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/connexion"
                  className="bg-white text-mmi-green font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-yellow-50 transition-colors"
                >
                  Connexion
                </Link>
              )}
            </div>
          </div>

          {/* Burger mobile */}
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/20 mt-2 pt-3 space-y-1">
            {[
              { to: '/', label: t('nav.portail') },
              { to: isAuthenticated ? getEspaceLink() : '/connexion', label: t('nav.autorisations') },
              { to: '/pmne', label: t('nav.pmne') },
              { to: '/contact', label: t('nav.contact') },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2 px-3">
              {LANGS.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLang(lang.code)}
                  className={`text-xs font-bold px-3 py-1 rounded-full border transition-all
                    ${currentLang === lang.code ? 'bg-white text-mmi-green border-white' : 'text-white border-white/50'}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            {!isAuthenticated && (
              <Link
                to="/connexion"
                className="block text-center bg-white text-mmi-green font-semibold py-2 rounded-lg mt-2"
                onClick={() => setMenuOpen(false)}
              >
                Connexion
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
