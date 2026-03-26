import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3, Users, Newspaper, FolderOpen, Settings, LogOut,
  Shield, Plus, Search, CheckCircle, XCircle, RefreshCw,
  Edit2, Trash2, Eye, EyeOff, FileText, Bell, Database,
  UserCheck, UserX, Building2, User, Key, ChevronDown, ChevronUp
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { adminAPI, portailAPI } from '@/utils/api'
import toast from 'react-hot-toast'

// ── Constantes ────────────────────────────────────────────────
const MENU = [
  { to: '/admin',                 icon: BarChart3,  label: 'Tableau de bord'   },
  { to: '/admin/users',           icon: Users,      label: 'Utilisateurs'      },
  { to: '/admin/actualites',      icon: Newspaper,  label: 'Actualités'        },
  { to: '/admin/documents',       icon: FolderOpen, label: 'Documents & Projets'},
  { to: '/admin/pieces-requises', icon: FileText,   label: 'Pièces requises'   },
  { to: '/admin/config',          icon: Settings,   label: 'Configuration'     },
]

const ROLES_LABELS: Record<string, string> = {
  DEMANDEUR:       'Demandeur industriel',
  SEC_CENTRAL:     'Secrétariat Central',
  SEC_GENERAL:     'Secrétaire Général',
  MINISTRE:        'Ministre',
  DGI_DIRECTEUR:   'Directeur DGI',
  DGI_SECRETARIAT: 'Secrétariat DGI',
  DDPI_CHEF:       'Chef Service DDPI',
  DDPI_AGENT:      'Agent DDPI',
  MMI_SIGNATAIRE:  'Signataire MMI',
  SUPER_ADMIN:     'Super Administrateur',
}

// Rôles agents (pas demandeur — le demandeur s'inscrit lui-même)
const ROLES_AGENTS = [
  'SEC_CENTRAL','SEC_GENERAL','MINISTRE',
  'DGI_DIRECTEUR','DGI_SECRETARIAT',
  'DDPI_CHEF','DDPI_AGENT',
  'MMI_SIGNATAIRE','SUPER_ADMIN',
]

// ── Layout ─────────────────────────────────────────────────────
export default function AdminLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  return (
    <div className="flex h-[calc(100vh-64px)]">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0"
             style={{ borderTop: '3px solid #C8A400' }}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
              <Shield size={16} className="text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{user?.nom} {user?.prenom}</p>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Super Admin</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {MENU.map(item => (
            <Link key={item.to} to={item.to}
              className={`sidebar-link ${(item.to === '/admin' ? pathname === '/admin' : pathname.startsWith(item.to)) ? 'active' : ''}`}>
              <item.icon size={18} />{item.label}
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
      <main className="flex-1 overflow-auto bg-gray-50"><Outlet /></main>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────
export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.users({ page_size: 200 })
      .then(r => {
        const all = r.data.results || r.data
        const agents    = all.filter((u: any) => !u.is_super_admin && !(u.roles||[]).includes('DEMANDEUR'))
        const demandeurs = all.filter((u: any) => (u.roles||[]).includes('DEMANDEUR'))
        const actifs    = all.filter((u: any) => u.is_active)
        setStats({ total: all.length, agents: agents.length, demandeurs: demandeurs.length, actifs: actifs.length })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Tableau de bord — Super Administration</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestion globale de la plateforme MMI</p>
      </div>

      {/* KPIs utilisateurs */}
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <KPI label="Total utilisateurs"  value={stats.total}      icon={Users}     color="text-gray-700"   bg="bg-gray-50"   />
          <KPI label="Agents institutionnels" value={stats.agents}   icon={Shield}    color="text-blue-600"   bg="bg-blue-50"   />
          <KPI label="Demandeurs"           value={stats.demandeurs} icon={Building2} color="text-green-600"  bg="bg-green-50"  />
          <KPI label="Comptes actifs"       value={stats.actifs}     icon={CheckCircle} color="text-amber-600" bg="bg-amber-50" />
        </div>
      )}

      {/* Raccourcis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label:'Gérer les utilisateurs',  desc:'Créer agents, attribuer rôles, activer/suspendre', icon:Users,    link:'/admin/users',           color:'text-blue-600',  bg:'bg-blue-50'  },
          { label:'Publier une actualité',   desc:'Ajouter des articles sur le portail public',        icon:Newspaper,link:'/admin/actualites',       color:'text-green-600', bg:'bg-green-50' },
          { label:'Documents & Projets',     desc:'Publier docs juridiques, annexes et projets',       icon:FolderOpen,link:'/admin/documents',       color:'text-amber-600', bg:'bg-amber-50' },
        ].map(c => (
          <Link key={c.label} to={c.link}
                className="card p-5 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <c.icon size={20} className={c.color} />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">{c.label}</h3>
            <p className="text-xs text-gray-500">{c.desc}</p>
          </Link>
        ))}
      </div>

      {/* Info rôles */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <Key size={15} className="text-amber-500" /> Rôles disponibles dans la plateforme
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(ROLES_LABELS).map(([code, label]) => (
            <div key={code} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${code === 'DEMANDEUR' ? 'bg-green-500' : code === 'SUPER_ADMIN' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <span className="text-gray-600 font-medium">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          💡 Les demandeurs s'inscrivent eux-mêmes via le portail. Les agents sont créés par le Super Admin.
        </p>
      </div>
    </div>
  )
}

// ── Gestion utilisateurs ───────────────────────────────────────
export function AdminUsers() {
  const { user: me } = useAuthStore()
  const [users, setUsers]         = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterType, setFilterType] = useState<'tous'|'agents'|'demandeurs'>('tous')
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [showPwd, setShowPwd]     = useState(false)
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', password: '', role_code: 'SEC_CENTRAL'
  })

  const load = () => {
    setLoading(true)
    adminAPI.users({ search })
      .then(r => setUsers(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [search])

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminAPI.createUser(form)
      toast.success(`✅ Compte agent créé pour ${form.nom} ${form.prenom}`)
      setShowCreateAgent(false)
      setForm({ nom:'', prenom:'', email:'', telephone:'', password:'', role_code:'SEC_CENTRAL' })
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.email?.[0] || err.response?.data?.detail || 'Erreur création')
    }
  }

  const toggleActive = async (u: any) => {
    try {
      await adminAPI.activerUser(u.id)
      toast.success(`Compte ${u.is_active ? 'suspendu' : 'activé'}`)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur')
    }
  }

  const changerRole = async (userId: number, role_code: string) => {
    if (!role_code) return
    try {
      await adminAPI.attribuerRole(userId, role_code)
      toast.success('Rôle mis à jour')
      load()
    } catch { toast.error('Erreur attribution rôle') }
  }

  // Filtrer les utilisateurs
  const usersFiltres = users.filter(u => {
    if (filterType === 'agents')     return !u.is_super_admin && !(u.roles||[]).includes('DEMANDEUR')
    if (filterType === 'demandeurs') return (u.roles||[]).includes('DEMANDEUR')
    return true
  })

  const countAgents     = users.filter(u => !u.is_super_admin && !(u.roles||[]).includes('DEMANDEUR')).length
  const countDemandeurs = users.filter(u => (u.roles||[]).includes('DEMANDEUR')).length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500">{users.length} utilisateur(s) au total</p>
        </div>
        <button onClick={() => setShowCreateAgent(!showCreateAgent)}
                className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Créer un agent
        </button>
      </div>

      {/* Formulaire création agent */}
      {showCreateAgent && (
        <div className="card p-6 mb-6 border-l-4 border-amber-400 animate-fadeInUp">
          <h3 className="font-bold text-gray-700 mb-1 flex items-center gap-2">
            <Shield size={15} className="text-amber-500" /> Créer un compte agent institutionnel
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            ℹ️ Les demandeurs s'inscrivent eux-mêmes via le portail. Ici vous créez uniquement les agents MMI.
          </p>
          <form onSubmit={createAgent} className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom *</label>
              <input className="form-input" value={form.nom}
                     onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Prénom</label>
              <input className="form-input" value={form.prenom}
                     onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Email professionnel *</label>
              <input type="email" className="form-input" placeholder="prenom.nom@mmi.gov.mr"
                     value={form.email}
                     onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Téléphone</label>
              <input className="form-input" placeholder="+222 XX XX XX XX"
                     value={form.telephone}
                     onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Mot de passe temporaire *</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="form-input pr-10"
                       value={form.password}
                       onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Rôle institutionnel *</label>
              <select className="form-input" value={form.role_code}
                      onChange={e => setForm(p => ({ ...p, role_code: e.target.value }))}>
                {ROLES_AGENTS.map(r => (
                  <option key={r} value={r}>{ROLES_LABELS[r] || r}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex items-center gap-2 text-sm">
                <UserCheck size={15} /> Créer le compte agent
              </button>
              <button type="button" onClick={() => setShowCreateAgent(false)}
                      className="btn-secondary text-sm">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9 text-sm"
                 placeholder="Rechercher nom, email, identifiant..."
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Tabs filtre */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { key:'tous',       label:`Tous (${users.length})`        },
            { key:'agents',     label:`Agents (${countAgents})`       },
            { key:'demandeurs', label:`Demandeurs (${countDemandeurs})`},
          ].map(t => (
            <button key={t.key}
                    onClick={() => setFilterType(t.key as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                      ${filterType === t.key ? 'bg-white shadow-sm text-mmi-green' : 'text-gray-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-secondary text-sm flex items-center gap-1.5">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : usersFiltres.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Utilisateur</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-5 py-3">Rôle(s)</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-center px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersFiltres.map(u => {
                  const isDemandeur = (u.roles||[]).includes('DEMANDEUR')
                  const isSuperAdmin = u.is_super_admin
                  const isExpanded = expandedUser === u.id
                  return (
                    <React.Fragment key={u.id}>
                      <tr className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                              ${isDemandeur ? 'bg-green-100' : isSuperAdmin ? 'bg-amber-100' : 'bg-blue-100'}`}>
                              {isDemandeur
                                ? <Building2 size={14} className="text-green-600" />
                                : isSuperAdmin
                                  ? <Shield size={14} className="text-amber-600" />
                                  : <User size={14} className="text-blue-600" />
                              }
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{u.nom} {u.prenom}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                              {/* Identifiant uniquement pour les demandeurs */}
                              {isDemandeur && u.identifiant_unique && (
                                <p className="text-xs font-mono text-mmi-green">{u.identifiant_unique}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${isDemandeur ? 'bg-green-100 text-green-700'
                              : isSuperAdmin ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'}`}>
                            {isDemandeur ? '🏭 Demandeur' : isSuperAdmin ? '⚙️ Super Admin' : '👤 Agent'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(u.roles||[]).map((r: string) => (
                              <span key={r} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                {ROLES_LABELS[r] || r}
                              </span>
                            ))}
                            {u.is_super_admin && !(u.roles||[]).includes('SUPER_ADMIN') && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Super Admin</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
                            ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            {u.is_active ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {/* Changer rôle — agents seulement */}
                            {!isDemandeur && !isSuperAdmin && (
                              <select
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 hover:border-mmi-green bg-white"
                                defaultValue=""
                                onChange={e => { changerRole(u.id, e.target.value); e.target.value = '' }}>
                                <option value="" disabled>Changer rôle</option>
                                {ROLES_AGENTS.map(r => (
                                  <option key={r} value={r}>{ROLES_LABELS[r] || r}</option>
                                ))}
                              </select>
                            )}
                            {/* Voir détails demandeur */}
                            {isDemandeur && (
                              <button
                                onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                                className="p-1.5 bg-green-50 text-green-500 rounded-lg hover:bg-green-100"
                                title="Voir détails">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                            {/* Activer/Suspendre — pas pour super admin */}
                            {!isSuperAdmin && (
                              <button onClick={() => toggleActive(u)}
                                      title={u.is_active ? 'Suspendre' : 'Activer'}
                                      className={`p-1.5 rounded-lg transition-colors
                                        ${u.is_active
                                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                          : 'bg-green-50 text-green-500 hover:bg-green-100'}`}>
                                {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Détails demandeur expandable */}
                      {isExpanded && isDemandeur && (
                        <tr className="bg-green-50/50">
                          <td colSpan={5} className="px-5 py-3">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <p className="text-gray-400">Identifiant unique</p>
                                <p className="font-mono font-bold text-mmi-green">{u.identifiant_unique || '—'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Entreprise</p>
                                <p className="font-medium text-gray-700">{u.nom_entreprise || '—'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">NIF</p>
                                <p className="font-medium text-gray-700">{u.nif || '—'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Téléphone</p>
                                <p className="font-medium text-gray-700">{u.telephone || '—'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Forme juridique</p>
                                <p className="font-medium text-gray-700">{u.forme_juridique || '—'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Adresse siège</p>
                                <p className="font-medium text-gray-700">{u.adresse_siege || '—'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Gestion Actualités ─────────────────────────────────────────
export function AdminActualites() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<number|null>(null)
  const [form, setForm] = useState({ titre:'', contenu:'', publie:false })

  const load = () => {
    portailAPI.actualites({})
      .then(r => setArticles(r.data.results||r.data))
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }
  useEffect(()=>load(),[])

  const handleSubmit = async () => {
    try {
      if (editId) { await adminAPI.updateActualite(editId, form); toast.success('Article mis à jour') }
      else        { await adminAPI.createActualite(form as any);  toast.success('Article publié') }
      setShowForm(false); setEditId(null)
      setForm({titre:'',contenu:'',publie:false}); load()
    } catch(err:any) { toast.error(err.response?.data?.detail||'Erreur') }
  }

  const handleDelete = async (id:number) => {
    if (!confirm('Supprimer cet article ?')) return
    try { await adminAPI.deleteActualite(id); toast.success('Supprimé'); load() }
    catch { toast.error('Erreur') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Gestion des actualités</h1>
        <button onClick={()=>{ setShowForm(!showForm); setEditId(null); setForm({titre:'',contenu:'',publie:false}) }}
                className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16}/> Nouvel article
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 border-l-4 border-mmi-green animate-fadeInUp">
          <h3 className="font-bold text-gray-700 mb-4">{editId?'✏️ Modifier':'➕ Nouvel article'}</h3>
          <div className="space-y-4">
            <div><label className="form-label">Titre *</label>
              <input className="form-input" value={form.titre}
                     onChange={e=>setForm(p=>({...p,titre:e.target.value}))}/></div>
            <div><label className="form-label">Contenu *</label>
              <textarea className="form-input resize-none" rows={6} value={form.contenu}
                        onChange={e=>setForm(p=>({...p,contenu:e.target.value}))}/></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.publie}
                     onChange={e=>setForm(p=>({...p,publie:e.target.checked}))}/>
              Publier immédiatement sur le portail
            </label>
            <div className="flex gap-3">
              <button onClick={handleSubmit} className="btn-primary text-sm">
                {editId?'Mettre à jour':'Publier'}
              </button>
              <button onClick={()=>{setShowForm(false);setEditId(null)}}
                      className="btn-secondary text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i=><div key={i} className="h-12 bg-gray-100 rounded animate-pulse"/>)}</div>
        ) : articles.length===0 ? (
          <div className="p-12 text-center text-gray-400">
            <Newspaper size={40} className="mx-auto mb-3 opacity-20"/>
            <p>Aucun article — cliquez "Nouvel article" pour commencer</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-5 py-3">Titre</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Statut</th>
                <th className="text-center px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map((a:any)=>(
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800 max-w-sm truncate">{a.titre}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(a.date_publication).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${a.publie?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {a.publie?'✅ Publié':'📝 Brouillon'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={()=>{ setEditId(a.id); setForm({titre:a.titre,contenu:a.contenu,publie:a.publie}); setShowForm(true) }}
                              className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 size={14}/></button>
                      <button onClick={()=>handleDelete(a.id)}
                              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={14}/></button>
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

// ── Configuration ──────────────────────────────────────────────
export function AdminConfig() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-2">Configuration système</h1>
      <p className="text-sm text-gray-500 mb-6">Paramètres globaux de la plateforme MMI</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { label:'Pièces requises par type', desc:'Documents obligatoires par type de demande', icon:FileText,  link:'/admin/pieces-requises', color:'text-blue-600',  bg:'bg-blue-50'  },
          { label:'Rôles et permissions',     desc:"Créer et gérer les agents institutionnels",  icon:Shield,    link:'/admin/users',           color:'text-purple-600',bg:'bg-purple-50' },
          { label:'Paramètres email SMTP',    desc:'Outlook/Gmail pour les notifications auto',  icon:Bell,      link:null,                     color:'text-green-600', bg:'bg-green-50' },
          { label:'Sauvegarde données',       desc:'Export SQLite3 de la base de données',       icon:Database,  link:null,                     color:'text-amber-600', bg:'bg-amber-50' },
        ].map(c=>(
          <div key={c.label} onClick={()=>c.link&&window.location.assign(c.link)}
               className={`card p-5 ${c.link?'hover:shadow-md cursor-pointer':''}`}>
            <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
              <c.icon size={20} className={c.color}/>
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">{c.label}</h3>
            <p className="text-xs text-gray-500">{c.desc}</p>
            {c.link && <span className="text-xs text-mmi-green font-medium mt-2 block">Configurer →</span>}
          </div>
        ))}
      </div>
      <div className="card p-5 border-l-4 border-green-400">
        <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <Bell size={15} className="text-green-600"/> Configuration email active
        </h3>
        <div className="space-y-1.5 text-xs">
          {[
            ['Fournisseur','Outlook / Office 365'],
            ['Serveur SMTP','smtp.office365.com:587'],
            ['Expéditeur','industrie@mmi.gov.mr'],
            ['TLS','✅ Activé'],
          ].map(([k,v])=>(
            <div key={k} className="flex gap-3">
              <span className="text-gray-400 w-32">{k}</span>
              <span className="font-medium text-gray-700">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Composant KPI ──────────────────────────────────────────────
function KPI({ label, value, icon:Icon, color, bg }: {
  label:string; value:number; icon:any; color:string; bg:string
}) {
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-2`}>
        <Icon size={18} className={color}/>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value??0}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}