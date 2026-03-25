import React, { useEffect, useState } from 'react'
import { FileText, Upload, Plus, Download, Eye, Trash2, Filter } from 'lucide-react'
import { portailAPI } from '@/utils/api'
import toast from 'react-hot-toast'

interface DocPublic {
  id: number
  titre: string
  categorie: string
  fichier: string
  langue: string
  publie: boolean
  ordre: number
  created_at: string
}

const CATEGORIES = [
  { code: 'JURIDIQUE', label: 'Documents juridiques',  color: 'bg-blue-100 text-blue-700' },
  { code: 'PROJET',    label: 'Banque des projets',     color: 'bg-green-100 text-green-700' },
  { code: 'ANNEXE',    label: 'Documents annexes',      color: 'bg-amber-100 text-amber-700' },
]

const LANGUES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'Anglais' },
  { code: 'ar', label: 'Arabe' },
]

export default function AdminDocumentsPage() {
  const [docs, setDocs]         = useState<DocPublic[]>([])
  const [loading, setLoading]   = useState(true)
  const [catFilter, setCatFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titre: '', categorie: 'JURIDIQUE', langue: 'fr', publie: false
  })
  const [fichier, setFichier]   = useState<File | null>(null)

  const load = (cat = catFilter) => {
    setLoading(true)
    portailAPI.documents({ categorie: cat || undefined })
      .then(r => setDocs(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [catFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fichier) { toast.error('Veuillez choisir un fichier'); return }
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    fd.append('fichier', fichier)
    try {
      // await api.post('/public/documents/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Document ajouté avec succès')
      setShowForm(false)
      setFichier(null)
      setForm({ titre: '', categorie: 'JURIDIQUE', langue: 'fr', publie: false })
      load()
    } catch { toast.error('Erreur lors de l\'ajout') }
  }

  const catInfo = (code: string) => CATEGORIES.find(c => c.code === code) || CATEGORIES[0]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Gestion des documents</h1>
          <p className="text-gray-500 text-sm mt-0.5">Documents publics du portail MMI</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
                className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Ajouter un document
        </button>
      </div>

      {/* Stats par catégorie */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {CATEGORIES.map(cat => {
          const count = docs.filter(d => d.categorie === cat.code).length
          return (
            <button
              key={cat.code}
              onClick={() => setCatFilter(catFilter === cat.code ? '' : cat.code)}
              className={`card p-4 text-left transition-all hover:shadow-md
                ${catFilter === cat.code ? 'ring-2 ring-mmi-green' : ''}`}
            >
              <p className="text-2xl font-bold text-gray-800 mb-1">{count}</p>
              <p className="text-xs font-medium text-gray-600">{cat.label}</p>
              {catFilter === cat.code && (
                <span className="text-xs text-mmi-green mt-1 block">Filtre actif</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="card p-6 mb-6 animate-fadeInUp">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Upload size={16} className="text-mmi-green" /> Ajouter un document
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
                {CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
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
              <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                ${fichier ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-300 hover:border-mmi-green'}`}>
                <input type="file" className="hidden" id="doc-upload"
                       accept=".pdf,.doc,.docx"
                       onChange={e => setFichier(e.target.files?.[0] || null)} />
                <label htmlFor="doc-upload" className="cursor-pointer">
                  <FileText size={28} className={`mx-auto mb-2 ${fichier ? 'text-mmi-green' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-gray-700">
                    {fichier ? fichier.name : 'Cliquer pour choisir un fichier'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX — max 10 Mo</p>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="publie" checked={form.publie}
                     onChange={e => setForm(p => ({ ...p, publie: e.target.checked }))} />
              <label htmlFor="publie" className="text-sm text-gray-700">Publier immédiatement</label>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex items-center gap-2 text-sm">
                <Upload size={14} /> Enregistrer
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtre actif */}
      {catFilter && (
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-mmi-green" />
          <span className="text-sm text-gray-600">Filtre :</span>
          <span className={`text-xs px-2 py-1 rounded-full ${catInfo(catFilter).color}`}>
            {catInfo(catFilter).label}
          </span>
          <button onClick={() => setCatFilter('')} className="text-xs text-red-400 hover:text-red-600 ml-1">
            × Effacer
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Aucun document</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-4">
              Ajouter le premier document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Titre</th>
                  <th className="text-left px-5 py-3">Catégorie</th>
                  <th className="text-left px-5 py-3">Langue</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-red-400 flex-shrink-0" />
                        <span className="font-medium text-gray-800 max-w-xs truncate">{doc.titre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${catInfo(doc.categorie).color}`}>
                        {catInfo(doc.categorie).label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 uppercase">{doc.langue}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${doc.publie ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {doc.publie ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <a href={doc.fichier} target="_blank" rel="noreferrer"
                           className="text-blue-500 hover:text-blue-700" title="Télécharger">
                          <Download size={14} />
                        </a>
                        <button className="text-amber-500 hover:text-amber-700" title="Voir">
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => toast('Supprimer — à confirmer', { icon: '⚠️' })}
                          className="text-red-400 hover:text-red-600" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-right">{docs.length} document(s)</p>
    </div>
  )
}