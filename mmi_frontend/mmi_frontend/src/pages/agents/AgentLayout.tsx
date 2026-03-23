import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Home } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface MenuItem {
  to: string
  icon: any
  label: string
}

interface Props {
  titre: string
  couleur: string
  menu: MenuItem[]
}

export default function AgentLayout({ titre, couleur, menu }: Props) {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        {/* En-tête sidebar */}
        <div className="p-4 border-b border-gray-100" style={{ borderTop: `3px solid ${couleur}` }}>
          <p className="font-bold text-gray-800 text-sm">{titre}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.nom_complet || user?.nom}</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1">
          {menu.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${pathname === item.to || pathname.startsWith(item.to + '/') ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link to="/" className="sidebar-link">
            <Home size={18} />
            Portail public
          </Link>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}
