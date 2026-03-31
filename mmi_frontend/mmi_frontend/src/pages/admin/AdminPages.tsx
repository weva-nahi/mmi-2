import React, { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Users, Newspaper, FolderOpen, Settings, LogOut, Plus, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { adminAPI, portailAPI, api } from '@/utils/api'
import DashboardAnalytics from '@/pages/agents/DashboardAnalytics'
import toast from 'react-hot-toast'

const MENU = [
  { to: '/admin',            icon: BarChart3,   label: 'Tableau de bord' },
  { to: '/admin/users',      icon: Users,       label: 'Utilisateurs' },
  { to: '/admin/actualites', icon: Newspaper,   label: 'Actualités' },
  { to: '/admin/documents',  icon: FolderOpen,  label: 'Documents' },
  { to: '/admin/config',     icon: Settings,    label: 'Configuration' },
]

export default function AdminLayout() {
  const { pathname }     = useLocation()
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col"
             style={{ borderTop: '3px solid #C8A400' }}>
        <div className="p-4 border-b border-gray-100">
          <p className="font-bold text-gray-800 text-sm">Super Administration</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.nom_complet}</p>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mt-1 inline-block">
            Super Admin
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {MENU.map(item => (
            <Link key={item.to} to={item.to}
                  className={`sidebar-link ${pathname === item.to ? 'active' : ''}`}>
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={() => { logout(); navigate('/') }}
                  className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}

export function AdminDashboard() {
  return <DashboardAnalytics titre="Tableau de bord — Administration" linkDossiers="/admin" />
}

export function AdminUsers() {
  const { user: me }      = useAuthStore()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newUser, setNewUser]   = useState({ nom:'', prenom:'', email:'', telephone:'', password:'', role_code:'SEC_CENTRAL' })

  const ROLES = ['SEC_CENTRAL','SEC_GENERAL','MINISTRE','DGI_DIRECTEUR','DGI_SECRETARIAT','DDPI_CHEF','DDPI_AGENT']

  const load = () => {
    adminAPI.users({ search }).then(r => setUsers(r.data.results || r.data))
      .catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [search])

  const creerUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminAPI.createUser(newUser)
      toast.success('Utilisateur créé !')
      setShowForm(false); setNewUser({ nom:'', prenom:'', email:'', telephone:'', password:'', role_code:'SEC_CENTRAL' }); load()
    } catch (err: any) { toast.error(err.response?.data?.email?.[0] || 'Erreur') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Gestion des utilisateurs</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Nouvel agent
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 animate-fadeInUp">
          <h3 className="font-semibold text-gray-700 mb-4">Créer un agent institutionnel</h3>
          <form onSubmit={creerUser} className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Nom *</label><input className="form-input" value={newUser.nom} onChange={e => setNewUser(p=>({...p,nom:e.target.value}))} required /></div>
            <div><label className="form-label">Prénom</label><input className="form-input" value={newUser.prenom} onChange={e => setNewUser(p=>({...p,prenom:e.target.value}))} /></div>
            <div><label className="form-label">Email *</label><input type="email" className="form-input" value={newUser.email} onChange={e => setNewUser(p=>({...p,email:e.target.value}))} required /></div>
            <div><label className="form-label">Téléphone</label><input className="form-input" value={newUser.telephone} onChange={e => setNewUser(p=>({...p,telephone:e.target.value}))} /></div>
            <div>
              <label className="form-label">Rôle *</label>
              <select className="form-input" value={newUser.role_code} onChange={e => setNewUser(p=>({...p,role_code:e.target.value}))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="form-label">Mot de passe provisoire *</label><input type="password" className="form-input" value={newUser.password} onChange={e => setNewUser(p=>({...p,password:e.target.value}))} required /></div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary text-sm">Créer</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-3 mb-4 flex items-center gap-2">
        <Search size={15} className="text-gray-400" />
        <input className="form-input text-sm py-1 flex-1" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-5 py-3">Identifiant</th>
                <th className="text-left px-5 py-3">Nom</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Rôle(s)</th>
                <th className="text-left px-5 py-3">Statut</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? null : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-mmi-green">{u.identifiant_unique}</td>
                  <td className="px-5 py-3 font-medium">{u.nom} {u.prenom}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map((r: string) => (
                        <span key={r} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.id !== me?.id && (
                      <button onClick={() => adminAPI.activerUser(u.id).then(() => {
                        setUsers(prev => prev.map(x => x.id === u.id ? {...x, is_active: !x.is_active} : x))
                        toast.success(u.is_active ? 'Suspendu' : 'Activé')
                      })} className={`text-xs px-2 py-1 rounded ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {u.is_active ? 'Suspendre' : 'Activer'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function AdminActualites() {
  const [actualites, setActualites] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ titre:'', contenu:'', publie:false })

  const load = () => { portailAPI.actualites().then(r => setActualites(r.data.results || r.data)).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(() => { load() }, [])

  const publier = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await api.post('/public/actualites/', form); toast.success('Actualité publiée !'); setShowForm(false); setForm({titre:'',contenu:'',publie:false}); load() }
    catch { toast.error('Erreur') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Gestion des actualités</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={15} /> Nouvelle</button>
      </div>
      {showForm && (
        <div className="card p-6 mb-6 animate-fadeInUp">
          <form onSubmit={publier} className="space-y-4">
            <div><label className="form-label">Titre *</label><input className="form-input" value={form.titre} onChange={e=>setForm(p=>({...p,titre:e.target.value}))} required /></div>
            <div><label className="form-label">Contenu *</label><textarea className="form-input resize-none" rows={5} value={form.contenu} onChange={e=>setForm(p=>({...p,contenu:e.target.value}))} required /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="pub" checked={form.publie} onChange={e=>setForm(p=>({...p,publie:e.target.checked}))} /><label htmlFor="pub" className="text-sm">Publier immédiatement</label></div>
            <div className="flex gap-3"><button type="submit" className="btn-primary text-sm">Enregistrer</button><button type="button" onClick={()=>setShowForm(false)} className="btn-secondary text-sm">Annuler</button></div>
          </form>
        </div>
      )}
      <div className="space-y-3">
        {loading ? [1,2,3].map(i=><div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"/>) :
        actualites.map(a => (
          <div key={a.id} className="card p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 truncate">{a.titre}</p>
              <p className="text-xs text-gray-400">{new Date(a.date_publication).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.publie?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{a.publie?'Publiée':'Brouillon'}</span>
              <button onClick={async()=>{await api.patch(`/public/actualites/${a.id}/`,{publie:!a.publie});setActualites(x=>x.map(y=>y.id===a.id?{...y,publie:!y.publie}:y));toast.success('Mis à jour')}} className="text-xs text-blue-600 hover:underline">{a.publie?'Dépublier':'Publier'}</button>
              <button onClick={async()=>{if(!confirm('Supprimer ?'))return;await api.delete(`/public/actualites/${a.id}/`);setActualites(x=>x.filter(y=>y.id!==a.id));toast.success('Supprimée')}} className="text-xs text-red-500 hover:underline">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminDocuments() {
  const [docs, setDocs]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat]         = useState('JURIDIQUE')

  useEffect(() => {
    portailAPI.documents({ categorie: cat }).then(r => setDocs(r.data.results || r.data))
      .catch(()=>{}).finally(()=>setLoading(false))
  }, [cat])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Gestion des documents</h1>
        <button className="btn-primary flex items-center gap-2 text-sm"><Plus size={15}/> Ajouter</button>
      </div>
      <div className="flex gap-2 mb-5">
        {['JURIDIQUE','PROJET','ANNEXE'].map(c => (
          <button key={c} onClick={()=>setCat(c)} className={`text-sm px-4 py-1.5 rounded-full border transition-all ${cat===c?'bg-mmi-green text-white border-mmi-green':'border-gray-200 text-gray-600 hover:border-mmi-green'}`}>{c}</button>
        ))}
      </div>
      <div className="space-y-2">
        {loading ? [1,2,3].map(i=><div key={i} className="h-12 bg-gray-100 rounded animate-pulse"/>) :
        docs.map(d => (
          <div key={d.id} className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen size={16} className="text-mmi-green" />
              <div><p className="text-sm font-medium text-gray-800">{d.titre}</p><p className="text-xs text-gray-400">{d.langue?.toUpperCase()}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${d.publie?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{d.publie?'Publié':'Masqué'}</span>
              <a href={d.fichier} target="_blank" rel="noreferrer" className="text-xs text-mmi-green hover:underline">Ouvrir</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminConfig() {
  const [types, setTypes]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    api.get('/types-demande/').then(r => setTypes(r.data.results || r.data))
      .catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-2">Configuration — Pièces requises</h1>
      <p className="text-sm text-gray-500 mb-6">Gérez les pièces justificatives exigées par type de demande.</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {loading ? [1,2,3].map(i=><div key={i} className="h-12 bg-gray-100 rounded animate-pulse"/>) :
          types.map(t => (
            <button key={t.id} onClick={()=>setSelected(t)}
              className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${selected?.id===t.id?'border-mmi-green bg-mmi-green-lt font-semibold text-mmi-green':'border-gray-200 hover:border-mmi-green bg-white'}`}>
              {t.libelle}
              <span className="text-xs text-gray-400 block">{t.pieces_requises?.length||0} pièces</span>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2">
          {!selected ? <div className="py-16 text-center text-gray-400 text-sm">Sélectionnez un type</div> : (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 mb-4">{selected.libelle}</h3>
              <div className="space-y-2">
                {selected.pieces_requises?.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${p.obligatoire?'bg-red-500':'bg-gray-300'}`} />
                      <span className="text-sm text-gray-800">{p.nom}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.obligatoire?'bg-red-100 text-red-600':'bg-gray-100 text-gray-500'}`}>
                      {p.obligatoire?'Obligatoire':'Optionnel'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}