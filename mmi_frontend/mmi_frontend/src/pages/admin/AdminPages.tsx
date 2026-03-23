import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Users, Settings, BarChart3, FileText, LogOut, Newspaper, FolderOpen } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { analyticsAPI, adminAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'

const MENU = [
  { to: '/admin',           icon: BarChart3,  label: 'Tableau de bord' },
  { to: '/admin/users',     icon: Users,      label: 'Utilisateurs' },
  { to: '/admin/actualites', icon: Newspaper, label: 'Actualités' },
  { to: '/admin/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/admin/config',    icon: Settings,   label: 'Configuration' },
]

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col"
             style={{ borderTop: '3px solid #C8A400' }}>
        <div className="p-4 border-b border-gray-100">
          <p className="font-bold text-gray-800 text-sm">Super Administration</p>
          <p className="text-xs text-gray-400 mt-0.5">{user?.nom_complet}</p>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mt-1 inline-block">
            Super Admin
          </span>
        </div>

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

        <div className="p-3 border-t border-gray-100">
          <button onClick={() => { logout(); navigate('/') }}
                  className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}

// ── Admin Dashboard ──────────────────────────────────────────
export function AdminDashboard() {
  const [data, setData]     = useState<any>(null)
  const [users, setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsAPI.dashboard(), adminAPI.users({ page_size: 5 })])
      .then(([d, u]) => {
        setData(d.data)
        setUsers(u.data.results || u.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 grid grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Tableau de bord — Administration</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total demandes',       value: data?.total_demandes || 0,        color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'Autorisations actives', value: data?.autorisations_actives || 0, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Utilisateurs',          value: users.length,                      color: 'text-purple-600',bg: 'bg-purple-50' },
          { label: 'En cours',              value: data?.par_statut?.filter((s: any) => s.statut !== 'VALIDE' && s.statut !== 'REJETE').reduce((a: number, b: any) => a + b.count, 0) || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Par type */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Demandes par type</h3>
          <div className="space-y-2">
            {data?.par_type?.map((t: any) => (
              <div key={t.type_demande__code} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t.type_demande__code}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-mmi-green rounded-full"
                      style={{ width: `${Math.min(100, (t.count / (data?.total_demandes || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="font-medium text-gray-800 w-8 text-right">{t.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers utilisateurs */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 text-sm">Derniers utilisateurs</h3>
            <Link to="/admin/users" className="text-xs text-mmi-green hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-mmi-green-lt flex items-center justify-center text-xs font-bold text-mmi-green flex-shrink-0">
                  {u.nom?.charAt(0)}{u.prenom?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{u.nom} {u.prenom}</p>
                  <p className="text-xs text-gray-400 truncate">{u.nom_entreprise || u.email}</p>
                </div>
                <div className="flex gap-1">
                  {u.roles?.slice(0,1).map((r: string) => (
                    <span key={r} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Admin Users ───────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    adminAPI.users({ search })
      .then(r => setUsers(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Gestion des utilisateurs</h1>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Users size={16} /> Nouvel utilisateur
        </button>
      </div>

      <div className="card mb-4 p-4">
        <input
          type="text"
          className="form-input text-sm"
          placeholder="Rechercher par nom, email, identifiant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Identifiant</th>
                  <th className="text-left px-5 py-3">Nom</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Entreprise</th>
                  <th className="text-left px-5 py-3">Rôle(s)</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-mmi-green">{u.identifiant_unique}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">{u.nom} {u.prenom}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{u.nom_entreprise || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r: string) => (
                          <span key={r} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => adminAPI.activerUser(u.id).then(() => window.location.reload())}
                        className={`text-xs px-2 py-1 rounded transition-colors
                          ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {u.is_active ? 'Suspendre' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
