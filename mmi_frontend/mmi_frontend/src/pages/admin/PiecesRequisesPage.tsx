import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Save, X, CheckCircle } from 'lucide-react'
import { api } from '@/utils/api'
import toast from 'react-hot-toast'

interface TypeDemande { id: number; code: string; libelle: string }
interface Piece {
  id: number; nom: string; obligatoire: boolean
  has_statut: boolean; has_cahier_charges: boolean; ordre: number
  type_demande: number
}

const TYPES_COLORS: Record<string, string> = {
  BP:             'bg-orange-100 text-orange-700',
  USINE_EAU:      'bg-blue-100 text-blue-700',
  UNITE:          'bg-green-100 text-green-700',
  RENOUVELLEMENT: 'bg-purple-100 text-purple-700',
  EXTENSION:      'bg-red-100 text-red-700',
}

export default function PiecesRequisesPage() {
  const [types, setTypes]     = useState<TypeDemande[]>([])
  const [pieces, setPieces]   = useState<Piece[]>([])
  const [loading, setLoading] = useState(true)
  const [typeActif, setTypeActif] = useState<number | null>(null)
  const [editId, setEditId]   = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nom: '', obligatoire: true, has_statut: false, has_cahier_charges: false, ordre: 0
  })

  const load = async () => {
    setLoading(true)
    try {
      const [tRes, pRes] = await Promise.all([
        api.get('/types-demande/'),
        api.get('/pieces-requises/'),
      ])
      setTypes(tRes.data.results || tRes.data)
      setPieces(pRes.data.results || pRes.data)
      if (!typeActif && (tRes.data.results || tRes.data).length > 0) {
        setTypeActif((tRes.data.results || tRes.data)[0].id)
      }
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const piecesType = pieces.filter(p => p.type_demande === typeActif)
  const typeInfo   = types.find(t => t.id === typeActif)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/pieces-requises/', { ...form, type_demande: typeActif })
      toast.success('Pièce ajoutée')
      setShowForm(false)
      setForm({ nom: '', obligatoire: true, has_statut: false, has_cahier_charges: false, ordre: 0 })
      load()
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async (pieceId: number) => {
    if (!window.confirm('Supprimer cette pièce requise ?')) return
    try {
      await api.delete(`/pieces-requises/${pieceId}/`)
      toast.success('Pièce supprimée')
      load()
    } catch { toast.error('Erreur') }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Configuration des pièces requises</h1>
          <p className="text-gray-500 text-sm mt-0.5">Définir les documents obligatoires par type de demande</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Onglets types */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden">
            <div className="card-header">
              <p className="text-xs font-semibold text-gray-500 uppercase">Types de demande</p>
            </div>
            <div className="divide-y divide-gray-50">
              {types.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTypeActif(t.id); setShowForm(false) }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors
                    ${typeActif === t.id ? 'bg-mmi-green-lt text-mmi-green font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-1 ${TYPES_COLORS[t.code] || 'bg-gray-100 text-gray-600'}`}>
                    {t.code}
                  </span>
                  <p className="text-xs leading-snug">{t.libelle}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pièces du type sélectionné */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">
                  {typeInfo?.libelle} — {piecesType.length} pièce(s)
                </h3>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
              >
                <Plus size={13} /> Ajouter
              </button>
            </div>

            {/* Formulaire ajout */}
            {showForm && (
              <div className="border-b border-gray-100 p-5 bg-gray-50 animate-fadeInUp">
                <form onSubmit={handleAdd} className="space-y-3">
                  <div>
                    <label className="form-label text-xs">Nom de la pièce *</label>
                    <input className="form-input text-sm" value={form.nom}
                           onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} required />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.obligatoire}
                             onChange={e => setForm(p => ({ ...p, obligatoire: e.target.checked }))} />
                      Obligatoire
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.has_statut}
                             onChange={e => setForm(p => ({ ...p, has_statut: e.target.checked }))} />
                      Champ statut
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.has_cahier_charges}
                             onChange={e => setForm(p => ({ ...p, has_cahier_charges: e.target.checked }))} />
                      Cahier des charges
                    </label>
                  </div>
                  <div>
                    <label className="form-label text-xs">Ordre d'affichage</label>
                    <input type="number" className="form-input text-sm w-24" min={0}
                           value={form.ordre}
                           onChange={e => setForm(p => ({ ...p, ordre: Number(e.target.value) }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs flex items-center gap-1">
                      <Save size={12} /> Enregistrer
                    </button>
                    <button type="button" onClick={() => setShowForm(false)}
                            className="btn-secondary text-xs flex items-center gap-1">
                      <X size={12} /> Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Liste pièces */}
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : piecesType.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm">Aucune pièce configurée pour ce type</p>
                <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-3">
                  Ajouter la première pièce
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {piecesType.sort((a, b) => a.ordre - b.ordre).map(piece => (
                  <div key={piece.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50">
                    <span className="text-xs text-gray-400 w-5 text-center">{piece.ordre}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{piece.nom}</p>
                      <div className="flex gap-2 mt-1">
                        {piece.obligatoire && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Obligatoire</span>
                        )}
                        {piece.has_statut && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Statut</span>
                        )}
                        {piece.has_cahier_charges && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">Cahier charges</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditId(editId === piece.id ? null : piece.id)}
                              className="text-blue-400 hover:text-blue-600">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(piece.id)}
                              className="text-red-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}