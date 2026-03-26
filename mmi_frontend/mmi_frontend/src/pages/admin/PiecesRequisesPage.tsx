import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Save, X, Trash2, FileText, CheckCircle } from 'lucide-react'
import { api } from '@/utils/api'
import toast from 'react-hot-toast'

interface TypeDemande { id: number; code: string; libelle: string }
interface Piece {
  id: number; nom: string; description: string; obligatoire: boolean
  has_statut: boolean; has_cahier_charges: boolean; ordre: number
  type_demande: number; format_accepte: string
}

const TYPES_COLORS: Record<string, string> = {
  BP:             'bg-orange-100 text-orange-700',
  USINE_EAU:      'bg-blue-100 text-blue-700',
  UNITE:          'bg-green-100 text-green-700',
  RENOUVELLEMENT: 'bg-purple-100 text-purple-700',
  EXTENSION:      'bg-red-100 text-red-700',
}

const FORMATS = [
  { value: '.pdf',           label: 'PDF uniquement' },
  { value: '.pdf,.jpg,.png', label: 'PDF, JPG, PNG' },
  { value: '.pdf,.doc,.docx',label: 'PDF, DOC, DOCX' },
  { value: '*',              label: 'Tous formats' },
]

const INIT_FORM = {
  nom: '', description: '', obligatoire: true,
  has_statut: false, has_cahier_charges: false,
  ordre: 0, format_accepte: '.pdf,.jpg,.png'
}

export default function PiecesRequisesPage() {
  const [types, setTypes]         = useState<TypeDemande[]>([])
  const [pieces, setPieces]       = useState<Piece[]>([])
  const [loading, setLoading]     = useState(true)
  const [typeActif, setTypeActif] = useState<number | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState<number | null>(null)
  const [form, setForm]           = useState({ ...INIT_FORM })

  const load = async () => {
    setLoading(true)
    try {
      const [tRes, pRes] = await Promise.all([
        api.get('/types-demande/'),
        api.get('/pieces-requises/'),
      ])
      const typesData  = tRes.data.results || tRes.data
      const piecesData = pRes.data.results || pRes.data
      setTypes(typesData)
      setPieces(piecesData)
      if (!typeActif && typesData.length > 0) {
        setTypeActif(typesData[0].id)
      }
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const piecesType = pieces
    .filter(p => p.type_demande === typeActif)
    .sort((a, b) => a.ordre - b.ordre)
  const typeInfo = types.find(t => t.id === typeActif)

  // ── Ajouter ou modifier ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) {
        await api.patch(`/pieces-requises/${editId}/`, { ...form, type_demande: typeActif })
        toast.success('Pièce mise à jour')
      } else {
        await api.post('/pieces-requises/', { ...form, type_demande: typeActif })
        toast.success('Pièce ajoutée')
      }
      setShowForm(false)
      setEditId(null)
      setForm({ ...INIT_FORM })
      load()
    } catch { toast.error('Erreur lors de l\'enregistrement') }
  }

  // ── Éditer ───────────────────────────────────────────────
  const startEdit = (piece: Piece) => {
    setEditId(piece.id)
    setForm({
      nom:               piece.nom,
      description:       piece.description || '',
      obligatoire:       piece.obligatoire,
      has_statut:        piece.has_statut,
      has_cahier_charges:piece.has_cahier_charges,
      ordre:             piece.ordre,
      format_accepte:    piece.format_accepte || '.pdf,.jpg,.png',
    })
    setShowForm(true)
  }

  // ── Supprimer ────────────────────────────────────────────
  const handleDelete = async (piece: Piece) => {
    if (!window.confirm(`Supprimer "${piece.nom}" ?\n\nCette action est irréversible.`)) return
    try {
      await api.delete(`/pieces-requises/${piece.id}/`)
      toast.success('Pièce supprimée')
      load()
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm({ ...INIT_FORM })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Configuration des pièces requises</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Définir les documents obligatoires par type de demande
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Colonne gauche : Types ── */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Types de demande
              </p>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {types.map(t => {
                  const count = pieces.filter(p => p.type_demande === t.id).length
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setTypeActif(t.id); cancelForm() }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors
                        ${typeActif === t.id
                          ? 'bg-mmi-green-lt border-r-2 border-mmi-green'
                          : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${TYPES_COLORS[t.code] || 'bg-gray-100 text-gray-600'}`}>
                          {t.code}
                        </span>
                        <span className="text-xs text-gray-400">{count} pièce(s)</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-snug">{t.libelle}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite : Pièces ── */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* En-tête */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">
                  {typeInfo?.libelle || 'Sélectionnez un type'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {piecesType.length} pièce(s) configurée(s)
                </p>
              </div>
              {typeActif && (
                <button
                  onClick={() => { cancelForm(); setShowForm(true) }}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <Plus size={13} /> Ajouter une pièce
                </button>
              )}
            </div>

            {/* ── Formulaire ajout/modification ── */}
            {showForm && (
              <div className="border-b border-gray-100 p-5 bg-amber-50/50 animate-fadeInUp">
                <h4 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
                  {editId ? <Edit2 size={14} className="text-blue-500" /> : <Plus size={14} className="text-mmi-green" />}
                  {editId ? 'Modifier la pièce' : 'Nouvelle pièce requise'}
                </h4>
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Nom */}
                  <div>
                    <label className="form-label text-xs">Nom de la pièce *</label>
                    <input className="form-input text-sm" required
                           placeholder="Ex: Registre de commerce, CIN du gérant..."
                           value={form.nom}
                           onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="form-label text-xs">Description / instructions</label>
                    <input className="form-input text-sm"
                           placeholder="Ex: Document datant de moins de 3 mois..."
                           value={form.description}
                           onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>

                  {/* Format accepté */}
                  <div>
                    <label className="form-label text-xs">Format de fichier accepté *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FORMATS.map(f => (
                        <label key={f.value}
                               className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer text-xs transition-all
                                 ${form.format_accepte === f.value
                                   ? 'border-mmi-green bg-mmi-green-lt text-mmi-green font-semibold'
                                   : 'border-gray-200 text-gray-600 hover:border-mmi-green'}`}>
                          <input type="radio" name="format" className="hidden"
                                 value={f.value}
                                 checked={form.format_accepte === f.value}
                                 onChange={() => setForm(p => ({ ...p, format_accepte: f.value }))} />
                          <FileText size={13} />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 text-xs cursor-pointer p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-mmi-green">
                      <input type="checkbox" checked={form.obligatoire}
                             onChange={e => setForm(p => ({ ...p, obligatoire: e.target.checked }))} />
                      <span className="font-medium">Obligatoire</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-mmi-green">
                      <input type="checkbox" checked={form.has_statut}
                             onChange={e => setForm(p => ({ ...p, has_statut: e.target.checked }))} />
                      <span>Champ statut</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-mmi-green">
                      <input type="checkbox" checked={form.has_cahier_charges}
                             onChange={e => setForm(p => ({ ...p, has_cahier_charges: e.target.checked }))} />
                      <span>Cahier des charges</span>
                    </label>
                  </div>

                  {/* Ordre */}
                  <div>
                    <label className="form-label text-xs">Ordre d'affichage</label>
                    <input type="number" min={0} className="form-input text-sm w-24"
                           value={form.ordre}
                           onChange={e => setForm(p => ({ ...p, ordre: Number(e.target.value) }))} />
                    <p className="text-xs text-gray-400 mt-1">Les pièces sont triées par ordre croissant</p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button type="submit" className="btn-primary text-xs flex items-center gap-1.5">
                      <Save size={13} /> {editId ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                    <button type="button" onClick={cancelForm}
                            className="btn-secondary text-xs flex items-center gap-1.5">
                      <X size={13} /> Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Liste pièces ── */}
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : piecesType.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <FileText size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Aucune pièce configurée pour ce type</p>
                <button onClick={() => setShowForm(true)}
                        className="btn-primary text-sm mt-4 flex items-center gap-2 mx-auto">
                  <Plus size={14} /> Ajouter la première pièce
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {piecesType.map((piece, idx) => (
                  <div key={piece.id}
                       className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50/80 transition-colors">
                    {/* Numéro d'ordre */}
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-gray-500 font-bold">{piece.ordre || idx + 1}</span>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{piece.nom}</p>
                      {piece.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{piece.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {/* Format */}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FileText size={10} />
                          {FORMATS.find(f => f.value === piece.format_accepte)?.label || 'PDF, JPG, PNG'}
                        </span>
                        {/* Obligatoire */}
                        {piece.obligatoire ? (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            ⚠️ Obligatoire
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                            Optionnel
                          </span>
                        )}
                        {piece.has_statut && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            Statut requis
                          </span>
                        )}
                        {piece.has_cahier_charges && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                            Cahier des charges
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => startEdit(piece)}
                              title="Modifier"
                              className="p-1.5 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(piece)}
                              title="Supprimer"
                              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 size={14} />
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