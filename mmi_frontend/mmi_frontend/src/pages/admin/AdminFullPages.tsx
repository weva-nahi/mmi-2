import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Users, Newspaper, FolderOpen, Settings, LogOut, Shield, Plus, Search, CheckCircle, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { analyticsAPI, adminAPI, portailAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'
import DashboardAnalytics from '@/pages/agents/DashboardAnalytics'
import toast from 'react-hot-toast'

const MENU = [
  { to: '/admin',            icon: BarChart3, label: 'Tableau de bord' },
  { to: '/admin/users',      icon: Users,     label: 'Utilisateurs' },
  { to: '/admin/actualites', icon: Newspaper, label: 'Actualités' },
  { to: '/admin/documents',  icon: FolderOpen,label: 'Documents' },
  { to: '/admin/config',          icon: Settings,  label: 'Configuration' },
  { to: '/admin/pieces-requises', icon: FolderOpen,label: 'Pièces requises' },
]

// ── Layout ────────────────────────────────────────────────────
export default function AdminLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  return (
    <div className="flex h-[calc(100vh-64px)]">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col" style={{ borderTop:'3px solid #C8A400' }}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-amber-500" />
            <p className="font-bold text-gray-800 text-sm">Super Administration</p>
          </div>
          <p className="text-xs text-gray-400 truncate">{user?.nom_complet}</p>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mt-1 inline-block">Super Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {MENU.map(item=>(
            <Link key={item.to} to={item.to}
              className={`sidebar-link ${(item.to==='/admin' ? pathname==='/admin' : pathname.startsWith(item.to)) ? 'active':''}`}>
              <item.icon size={18}/>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={()=>{logout();navigate('/')}}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut size={18}/>Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50"><Outlet /></main>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────
export function AdminDashboard() {
  return <DashboardAnalytics titre="Tableau de bord — Administration" linkDossiers="/admin/dossiers" />
}

// ── Gestion utilisateurs ──────────────────────────────────────
export function AdminUsers() {
  const { user: me } = useAuthStore()
  const [users, setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom:'', prenom:'', email:'', telephone:'', password:'', role_code:'SEC_CENTRAL' })

  const load = () => {
    adminAPI.users({ search })
      .then(r=>setUsers(r.data.results||r.data))
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }
  useEffect(()=>{ load() },[search])

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminAPI.createUser(form)
      toast.success('Compte créé avec succès')
      setShowForm(false)
      setForm({ nom:'',prenom:'',email:'',telephone:'',password:'',role_code:'SEC_CENTRAL' })
      load()
    } catch(err:any) {
      toast.error(err.response?.data?.email?.[0] || 'Erreur lors de la création')
    }
  }

  const ROLES = [
    'SEC_CENTRAL','SEC_GENERAL','MINISTRE','DGI_DIRECTEUR','DGI_SECRETARIAT','DDPI_CHEF','DDPI_AGENT','MMI_SIGNATAIRE','SUPER_ADMIN'
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Gestion des utilisateurs</h1>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16}/> Nouvel agent
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="card p-6 mb-6 animate-fadeInUp">
          <h3 className="font-semibold text-gray-700 mb-4">Créer un compte agent</h3>
          <form onSubmit={createUser} className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom *</label>
              <input className="form-input" value={form.nom} onChange={e=>setForm(p=>({...p,nom:e.target.value}))} required />
            </div>
            <div>
              <label className="form-label">Prénom</label>
              <input className="form-input" value={form.prenom} onChange={e=>setForm(p=>({...p,prenom:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required />
            </div>
            <div>
              <label className="form-label">Téléphone</label>
              <input className="form-input" value={form.telephone} onChange={e=>setForm(p=>({...p,telephone:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Mot de passe *</label>
              <input type="password" className="form-input" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required />
            </div>
            <div>
              <label className="form-label">Rôle *</label>
              <select className="form-input" value={form.role_code} onChange={e=>setForm(p=>({...p,role_code:e.target.value}))}>
                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex items-center gap-2"><Plus size={14}/>Créer</button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Recherche */}
      <div className="card mb-4 p-4 flex items-center gap-2">
        <Search size={15} className="text-gray-400"/>
        <input type="text" className="form-input text-sm flex-1"
               placeholder="Rechercher par nom, email, identifiant..."
               value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="h-12 bg-gray-100 rounded animate-pulse"/>)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Identifiant</th>
                  <th className="text-left px-5 py-3">Nom</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Rôle(s)</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u=>(
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-mmi-green">{u.identifiant_unique}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{u.nom} {u.prenom}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r:string)=>(
                          <span key={r} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                        {u.is_active?'Actif':'Suspendu'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={()=>adminAPI.activerUser(u.id).then(()=>{ toast.success('Statut modifié'); load() })}
                        className={`text-xs px-2 py-1 rounded transition-colors ${u.is_active?'text-red-600 hover:bg-red-50':'text-green-600 hover:bg-green-50'}`}>
                        {u.is_active?'Suspendre':'Activer'}
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

// ── Gestion Actualités ────────────────────────────────────────
export function AdminActualites() {
  const { user } = useAuthStore()
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre:'', contenu:'', publie:false })

  const load = ()=>{ portailAPI.actualites({}).then(r=>setArticles(r.data.results||r.data)).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(()=>load(),[])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Gestion des actualités</h1>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16}/> Nouvel article
        </button>
      </div>
      {showForm && (
        <div className="card p-6 mb-6 animate-fadeInUp">
          <h3 className="font-semibold text-gray-700 mb-4">Nouvel article</h3>
          <div className="space-y-4">
            <div><label className="form-label">Titre *</label>
              <input className="form-input" value={form.titre} onChange={e=>setForm(p=>({...p,titre:e.target.value}))} /></div>
            <div><label className="form-label">Contenu *</label>
              <textarea className="form-input resize-none" rows={5} value={form.contenu} onChange={e=>setForm(p=>({...p,contenu:e.target.value}))} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pub" checked={form.publie} onChange={e=>setForm(p=>({...p,publie:e.target.checked}))} />
              <label htmlFor="pub" className="text-sm text-gray-700">Publier immédiatement</label>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary text-sm" onClick={()=>{ toast.success('Article créé'); setShowForm(false); setForm({titre:'',contenu:'',publie:false}) }}>
                Enregistrer
              </button>
              <button className="btn-secondary text-sm" onClick={()=>setShowForm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
      <div className="card overflow-hidden">
        {loading ? <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="h-12 bg-gray-100 rounded animate-pulse"/>)}</div> : (
          articles.length === 0 ? <div className="p-12 text-center text-gray-400"><Newspaper size={40} className="mx-auto mb-3 opacity-20"/><p>Aucun article</p></div> :
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-5 py-3">Titre</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Statut</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map((a:any)=>(
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800 max-w-xs truncate">{a.titre}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(a.date_publication).toLocaleDateString('fr-FR')}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.publie?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {a.publie?'Publié':'Brouillon'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button className="text-xs text-blue-600 hover:underline">Modifier</button>
                      <button className="text-xs text-red-500 hover:underline">Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Configuration ─────────────────────────────────────────────
export function AdminConfig() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Configuration système</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label:'Pièces requises par type', desc:'Configurer les documents obligatoires par type de demande', color:'text-blue-600', bg:'bg-blue-50', icon:FolderOpen },
          { label:'Rôles et permissions',      desc:'Gérer les droits d\'accès par rôle institutionnel',         color:'text-purple-600',bg:'bg-purple-50',icon:Shield },
          { label:'Paramètres email',          desc:'Configuration SMTP pour les notifications automatiques',    color:'text-green-600', bg:'bg-green-50', icon:Settings },
          { label:'Sauvegarde des données',    desc:'Export et restauration de la base de données',              color:'text-amber-600', bg:'bg-amber-50', icon:FolderOpen },
        ].map(c=>(
          <div key={c.label} className="card p-5 hover:shadow-md transition-all cursor-pointer">
            <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
              <c.icon size={20} className={c.color}/>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">{c.label}</h3>
            <p className="text-xs text-gray-500">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}