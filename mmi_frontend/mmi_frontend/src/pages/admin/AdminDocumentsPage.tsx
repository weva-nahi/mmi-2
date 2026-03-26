import React, { useEffect, useState } from 'react'
import {
  FileText, Upload, Plus, Download, Trash2,
  FolderOpen, BookOpen, Scale, RefreshCw, Eye,
  CheckCircle, XCircle, Search, TrendingUp
} from 'lucide-react'
import { adminAPI, portailAPI } from '@/utils/api'
import { api } from '@/utils/api'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────
interface DocPublic {
  id: number; titre: string; categorie: string
  fichier: string; langue: string; publie: boolean
  created_at: string
}
interface Projet {
  id: number; titre: string; secteur: string
  description: string; budget_estime: string
  statut: string; publie: boolean; created_at: string
  fichier?: string
}

// ── Constantes ────────────────────────────────────────────────
const CATEGORIES = [
  { code: 'JURIDIQUE', label: 'Documents juridiques', icon: Scale,     color: 'text-blue-600',  bg: 'bg-blue-50',  badge: 'bg-blue-100 text-blue-700'  },
  { code: 'ANNEXE',    label: 'Documents annexes',    icon: FolderOpen, color: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  { code: 'PROJET',    label: 'Banque des projets',   icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
]

const LANGUES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'Anglais'  },
  { code: 'ar', label: 'Arabe'    },
]

const STATUTS_PROJET = [
  { code: 'ouvert',   label: 'Ouvert'   },
  { code: 'en_cours', label: 'En cours' },
  { code: 'cloture',  label: 'Clôturé'  },
]

// ══════════════════════════════════════════════════════════════
export default function AdminDocumentsPage() {
  const [activeTab, setActiveTab] = useState<'documents'|'projets'>('documents')

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1">Documents publics & Banque de projets</h1>
      <p className="text-sm text-gray-500 mb-5">Gestion des ressources publiées sur le portail MMI</p>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'documents', label: '📄 Documents & Juridiques', },
          { key: 'projets',   label: '📈 Banque de projets',      },
        ].map(tab => (
          <button key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition-all
                    ${activeTab === tab.key
                      ? 'bg-white shadow-sm text-mmi-green font-semibold'
                      : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'documents' && <TabDocuments />}
      {activeTab === 'projets'   && <TabProjets />}
    </div>
  )
}

// ── Tab Documents (Juridiques + Annexes) ─────────────────────
function TabDocuments() {
  const [docs, setDocs]         = useState<DocPublic[]>([])
  const [loading, setLoading]   = useState(true)
  const [catFilter, setCatFilter] = useState<'JURIDIQUE'|'ANNEXE'|''>('') 
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [fichier, setFichier]   = useState<File | null>(null)
  const [form, setForm] = useState({
    titre: '', categorie: 'JURIDIQUE', langue: 'fr', publie: false, description: ''
  })

  const load = () => {
    setLoading(true)
    // Charger les deux catégories (pas PROJET — géré dans l'autre onglet)
    adminAPI.documents({ categorie: catFilter || undefined })
      .then(r => {
        const all = r.data.results || r.data
        // Exclure les projets de cet onglet
        setDocs(all.filter((d: DocPublic) => d.categorie !== 'PROJET'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [catFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fichier) { toast.error('Veuillez choisir un fichier'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      fd.append('fichier', fichier)
      await adminAPI.createDocument(fd)
      toast.success('Document ajouté avec succès')
      setShowForm(false)
      setFichier(null)
      setForm({ titre: '', categorie: 'JURIDIQUE', langue: 'fr', publie: false, description: '' })
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'ajout')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, titre: string) => {
    if (!confirm(`Supprimer "${titre}" ?`)) return
    try {
      await adminAPI.deleteDocument(id)
      toast.success('Document supprimé')
      load()
    } catch { toast.error('Erreur suppression') }
  }

  const catInfo = (code: string) => CATEGORIES.find(c => c.code === code) || CATEGORIES[0]

  // Docs filtrés
  const docsFiltres = docs.filter(d =>
    !search || d.titre.toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const countJuridique = docs.filter(d => d.categorie === 'JURIDIQUE').length
  const countAnnexe    = docs.filter(d => d.categorie === 'ANNEXE').length

  return (
    <div>
      {/* Stats cartes */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {[
          { cat: 'JURIDIQUE', count: countJuridique, icon: Scale,     label: 'Documents juridiques', color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { cat: 'ANNEXE',    count: countAnnexe,    icon: FolderOpen, label: 'Documents annexes',   color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <button key={s.cat}
                  onClick={() => setCatFilter(catFilter === s.cat ? '' : s.cat as any)}
                  className={`card p-4 text-left hover:shadow-md transition-all
                    ${catFilter === s.cat ? 'ring-2 ring-mmi-green' : ''}`}>
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            {catFilter === s.cat && <span className="text-xs text-mmi-green">Filtre actif ✓</span>}
          </button>
        ))}
      </div>

      {/* Barre actions */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9 text-sm" placeholder="Rechercher un document..."
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowForm(!showForm)}
                className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Ajouter un document
        </button>
        <button onClick={load} className="btn-secondary text-sm flex items-center gap-1.5">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card p-6 mb-5 border-l-4 border-mmi-green animate-fadeInUp">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Upload size={15} className="text-mmi-green" /> Ajouter un document
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Titre du document *</label>
              <input className="form-input" value={form.titre}
                     onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Catégorie *</label>
              <select className="form-input" value={form.categorie}
                      onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))}>
                <option value="JURIDIQUE">📋 Document juridique</option>
                <option value="ANNEXE">📁 Document annexe</option>
              </select>
            </div>
            <div>
              <label className="form-label">Langue *</label>
              <select className="form-input" value={form.langue}
                      onChange={e => setForm(p => ({ ...p, langue: e.target.value }))}>
                {LANGUES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Fichier (PDF) *</label>
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
                ${fichier ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-200 hover:border-mmi-green'}`}>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx"
                       onChange={e => setFichier(e.target.files?.[0] || null)} />
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${fichier ? 'bg-mmi-green' : 'bg-gray-100'}`}>
                  {fichier ? <CheckCircle size={18} className="text-white" /> : <FileText size={18} className="text-gray-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {fichier ? fichier.name : 'Cliquer pour choisir un fichier'}
                  </p>
                  <p className="text-xs text-gray-400">PDF, DOC, DOCX — max 10 Mo</p>
                </div>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pub-doc" checked={form.publie}
                     onChange={e => setForm(p => ({ ...p, publie: e.target.checked }))} />
              <label htmlFor="pub-doc" className="text-sm text-gray-700 cursor-pointer">
                Publier immédiatement sur le portail
              </label>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                      className="btn-primary flex items-center gap-2 text-sm">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Upload size={14} />
                }
                Enregistrer
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                      className="btn-secondary text-sm">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : docsFiltres.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Aucun document trouvé</p>
            <button onClick={() => setShowForm(true)}
                    className="btn-primary text-sm mt-4">Ajouter le premier document</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Document</th>
                  <th className="text-left px-5 py-3">Catégorie</th>
                  <th className="text-left px-5 py-3">Langue</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-center px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docsFiltres.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-red-400 flex-shrink-0" />
                        <span className="font-medium text-gray-800 max-w-xs truncate">{doc.titre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catInfo(doc.categorie).badge}`}>
                        {catInfo(doc.categorie).label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 uppercase">{doc.langue}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
                        ${doc.publie ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {doc.publie ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {doc.publie ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{doc.created_at}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        {doc.fichier && (
                          <a href={doc.fichier} target="_blank" rel="noreferrer"
                             className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"
                             title="Télécharger">
                            <Download size={14} />
                          </a>
                        )}
                        <button onClick={() => handleDelete(doc.id, doc.titre)}
                                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                                title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 p-3 text-right">{docsFiltres.length} document(s)</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab Banque de projets ─────────────────────────────────────
function TabProjets() {
  const [projets, setProjets]   = useState<Projet[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [fichier, setFichier]   = useState<File | null>(null)
  const [form, setForm] = useState({
    titre: '', secteur: '', description: '',
    budget_estime: '', statut: 'ouvert', publie: false
  })

  const load = () => {
    setLoading(true)
    portailAPI.projets({})
      .then(r => setProjets(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (fichier) fd.append('fichier', fichier)
      await api.post('/public/projets/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Projet ajouté avec succès')
      setShowForm(false)
      setFichier(null)
      setForm({ titre:'', secteur:'', description:'', budget_estime:'', statut:'ouvert', publie:false })
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const STATUT_BADGE: Record<string, string> = {
    ouvert:   'bg-green-100 text-green-700',
    en_cours: 'bg-blue-100 text-blue-700',
    cloture:  'bg-gray-100 text-gray-500',
  }

  const projetsFiltres = projets.filter(p =>
    !search || p.titre.toLowerCase().includes(search.toLowerCase()) ||
               p.secteur.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { statut:'ouvert',   label:'Projets ouverts',   color:'text-green-600', bg:'bg-green-50' },
          { statut:'en_cours', label:'En cours',          color:'text-blue-600',  bg:'bg-blue-50'  },
          { statut:'cloture',  label:'Clôturés',          color:'text-gray-500',  bg:'bg-gray-50'  },
        ].map(s => (
          <div key={s.statut} className="card p-4">
            <p className={`text-2xl font-bold ${s.color}`}>
              {projets.filter(p => p.statut === s.statut).length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Barre actions */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9 text-sm" placeholder="Rechercher un projet..."
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowForm(!showForm)}
                className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Nouveau projet
        </button>
        <button onClick={load} className="btn-secondary text-sm flex items-center gap-1.5">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card p-6 mb-5 border-l-4 border-green-500 animate-fadeInUp">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-green-600" /> Ajouter un projet à la banque
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Titre du projet *</label>
              <input className="form-input" value={form.titre}
                     onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Secteur d'activité *</label>
              <input className="form-input" placeholder="Ex: Agroalimentaire, Mines..."
                     value={form.secteur}
                     onChange={e => setForm(p => ({ ...p, secteur: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Budget estimé (MRU)</label>
              <input className="form-input" type="number" placeholder="Ex: 5000000"
                     value={form.budget_estime}
                     onChange={e => setForm(p => ({ ...p, budget_estime: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Description *</label>
              <textarea className="form-input resize-none" rows={4} value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Statut</label>
              <select className="form-input" value={form.statut}
                      onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}>
                {STATUTS_PROJET.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Fiche projet (PDF, optionnel)</label>
              <label className={`flex items-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer
                ${fichier ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400'}`}>
                <input type="file" className="hidden" accept=".pdf"
                       onChange={e => setFichier(e.target.files?.[0] || null)} />
                <FileText size={16} className={fichier ? 'text-green-600' : 'text-gray-400'} />
                <span className="text-xs text-gray-600">{fichier ? fichier.name : 'Choisir un PDF'}</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pub-proj" checked={form.publie}
                     onChange={e => setForm(p => ({ ...p, publie: e.target.checked }))} />
              <label htmlFor="pub-proj" className="text-sm text-gray-700 cursor-pointer">
                Publier sur le Portail de l'industrie
              </label>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                      className="btn-primary flex items-center gap-2 text-sm"
                      style={{ background: '#16a34a' }}>
                {saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Plus size={14} />
                }
                Enregistrer le projet
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                      className="btn-secondary text-sm">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau projets */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : projetsFiltres.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Aucun projet dans la banque</p>
            <button onClick={() => setShowForm(true)}
                    className="btn-primary text-sm mt-4"
                    style={{ background: '#16a34a' }}>
              Ajouter le premier projet
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Projet</th>
                  <th className="text-left px-5 py-3">Secteur</th>
                  <th className="text-left px-5 py-3">Budget (MRU)</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3">Publié</th>
                  <th className="text-center px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projetsFiltres.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/80">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800">{p.titre}</p>
                      <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{p.description}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {p.secteur}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-gray-700">
                      {p.budget_estime
                        ? Number(p.budget_estime).toLocaleString('fr-FR') + ' MRU'
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${STATUT_BADGE[p.statut] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUTS_PROJET.find(s => s.code === p.statut)?.label || p.statut}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full
                        ${p.publie ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.publie ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {p.publie ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        {p.fichier && (
                          <a href={p.fichier} target="_blank" rel="noreferrer"
                             className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100">
                            <Download size={14} />
                          </a>
                        )}
                        <button className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                                onClick={() => toast('Supprimer ce projet ?', { icon: '⚠️' })}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 p-3 text-right">{projetsFiltres.length} projet(s)</p>
          </div>
        )}
      </div>
    </div>
  )
}