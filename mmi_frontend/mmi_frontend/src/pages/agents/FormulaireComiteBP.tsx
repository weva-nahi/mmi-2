import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, CheckCircle, XCircle, Save, Upload } from 'lucide-react'
import { api } from '@/utils/api'
import toast from 'react-hot-toast'

export default function FormulaireComiteBP() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [pv, setPv]           = useState<File | null>(null)
  const [quittance, setQuittance] = useState<File | null>(null)
  const [membres, setMembres] = useState<string[]>([''])
  const [form, setForm] = useState({
    date_reunion: '',
    decision:     '' as '' | 'accord' | 'rejet',
    motif_rejet:  '',
  })

  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const addMembre = () => setMembres(p => [...p, ''])
  const removeMembre = (i: number) => setMembres(p => p.filter((_, idx) => idx !== i))
  const updateMembre = (i: number, v: string) =>
    setMembres(p => p.map((m, idx) => idx === i ? v : m))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date_reunion) { toast.error('La date de réunion est obligatoire'); return }
    if (!form.decision)     { toast.error('La décision est obligatoire'); return }
    if (form.decision === 'rejet' && !form.motif_rejet) {
      toast.error('Le motif de rejet est obligatoire')
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('demande',       id!)
      fd.append('date_reunion',  form.date_reunion)
      fd.append('decision',      form.decision)
      fd.append('motif_rejet',   form.motif_rejet)
      fd.append('membres',       JSON.stringify(membres.filter(m => m.trim())))
      if (pv)        fd.append('pv_reunion', pv)
      if (quittance) fd.append('quittance',  quittance)

      await api.post('/comites-bp/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })

      // Transition statut
      const etape = form.decision === 'accord' ? 'DDPI_ACCORD_PRINCIPE' : 'DDPI_REJET'
      const action = form.decision === 'accord'
        ? 'Accord de principe accordé par le Comité BP'
        : `Rejet du dossier par le Comité BP — ${form.motif_rejet}`

      await api.post(`/demandes/${id}/transmettre/`, {
        etape_code:  etape,
        action,
        commentaire: form.motif_rejet || '',
      })

      toast.success(form.decision === 'accord'
        ? 'Accord de principe accordé !'
        : 'Dossier rejeté — notification envoyée au demandeur')

      navigate(`/ddpi/dossier/${id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/ddpi/dossier/${id}`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-mmi-green">
          <ArrowLeft size={16} /> Retour au dossier
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-700">Réunion Comité BP</span>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-gray-800 text-lg mb-5">
          Procès-verbal du Comité BP
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Date réunion */}
          <div>
            <label className="form-label">Date de la réunion *</label>
            <input
              type="date"
              className="form-input"
              value={form.date_reunion}
              onChange={e => up('date_reunion', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Membres présents */}
          <div>
            <label className="form-label">Membres présents</label>
            <div className="space-y-2">
              {membres.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    className="form-input flex-1"
                    placeholder={`Membre ${i + 1} — Nom et fonction`}
                    value={m}
                    onChange={e => updateMembre(i, e.target.value)}
                  />
                  {membres.length > 1 && (
                    <button type="button" onClick={() => removeMembre(i)}
                            className="text-red-400 hover:text-red-600 px-2">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addMembre}
                className="flex items-center gap-1.5 text-sm text-mmi-green hover:underline mt-1"
              >
                <Plus size={14} /> Ajouter un membre
              </button>
            </div>
          </div>

          {/* Quittance de paiement */}
          <div>
            <label className="form-label">Quittance de paiement *</label>
            <FileUpload file={quittance} onChange={setQuittance} label="quittance de paiement" />
          </div>

          {/* PV de réunion */}
          <div>
            <label className="form-label">PV de réunion (PDF)</label>
            <FileUpload file={pv} onChange={setPv} label="PV de réunion" />
          </div>

          {/* Décision */}
          <div>
            <label className="form-label">Décision du comité *</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => up('decision', 'accord')}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-semibold text-sm transition-all
                  ${form.decision === 'accord'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-green-400'}`}
              >
                <CheckCircle size={20} className={form.decision === 'accord' ? 'text-green-500' : 'text-gray-300'} />
                Accord
              </button>
              <button
                type="button"
                onClick={() => up('decision', 'rejet')}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-semibold text-sm transition-all
                  ${form.decision === 'rejet'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-red-400'}`}
              >
                <XCircle size={20} className={form.decision === 'rejet' ? 'text-red-500' : 'text-gray-300'} />
                Rejet
              </button>
            </div>
          </div>

          {/* Motif rejet */}
          {form.decision === 'rejet' && (
            <div className="animate-fadeInUp">
              <label className="form-label text-red-600">Motif du rejet *</label>
              <textarea
                className="form-input resize-none border-red-300 focus:ring-red-400"
                rows={3}
                placeholder="Expliquez les raisons du rejet..."
                value={form.motif_rejet}
                onChange={e => up('motif_rejet', e.target.value)}
                required
              />
              <p className="text-xs text-red-500 mt-1">
                Ce motif sera inclus dans la lettre de notification envoyée au demandeur.
              </p>
            </div>
          )}

          {/* Résumé décision */}
          {form.decision && (
            <div className={`rounded-xl p-4 border text-sm
              ${form.decision === 'accord'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'}`}>
              {form.decision === 'accord' ? (
                <>
                  <p className="font-semibold">✅ Accord de principe</p>
                  <p className="text-xs mt-1">Le dossier passe à la phase de rédaction de l'arrêté.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">❌ Dossier rejeté</p>
                  <p className="text-xs mt-1">Une lettre de notification sera envoyée au demandeur.</p>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link to={`/ddpi/dossier/${id}`} className="btn-secondary flex-1 text-center">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Save size={16} /> Enregistrer le PV</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FileUpload({ file, onChange, label }: {
  file: File | null
  onChange: (f: File) => void
  label: string
}) {
  return (
    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
      ${file ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-300 hover:border-mmi-green'}`}>
      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
             onChange={e => e.target.files?.[0] && onChange(e.target.files[0])} />
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
        ${file ? 'bg-mmi-green' : 'bg-gray-100'}`}>
        {file ? <CheckCircle size={18} className="text-white" /> : <Upload size={18} className="text-gray-400" />}
      </div>
      <div>
        <p className={`text-sm font-medium ${file ? 'text-mmi-green' : 'text-gray-600'}`}>
          {file ? file.name : `Choisir la ${label}`}
        </p>
        <p className="text-xs text-gray-400">PDF, JPG, PNG — max 10 Mo</p>
      </div>
    </label>
  )
}