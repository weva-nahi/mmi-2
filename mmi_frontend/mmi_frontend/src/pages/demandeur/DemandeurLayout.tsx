import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, FolderOpen, Bell, LogOut, User, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const MENU = [
  { to: '/demandeur',           icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/demandeur/nouvelle',  icon: PlusCircle,       label: 'Nouvelle demande' },
  { to: '/demandeur/demandes',  icon: FolderOpen,        label: 'Mes demandes' },
  { to: '/demandeur/notifications', icon: Bell,          label: 'Notifications' },
  { to: '/demandeur/profil',        icon: Settings,      label: 'Mon profil' },
]

export default function DemandeurLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        {/* Profil */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mmi-green-lt flex items-center justify-center text-mmi-green font-bold text-sm">
              {user?.nom?.charAt(0)}{user?.prenom?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{user?.nom_complet || user?.nom}</p>
              <p className="text-xs text-gray-400 truncate">{user?.nom_entreprise}</p>
              <p className="text-xs text-mmi-green font-mono">{user?.identifiant_unique}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {MENU.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${pathname === item.to ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="p-3 border-t border-gray-100 space-y-1">
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