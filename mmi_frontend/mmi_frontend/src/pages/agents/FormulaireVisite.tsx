import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Upload, CheckCircle, XCircle, FileText, Save } from 'lucide-react'
import { api } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function FormulaireVisite() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [rapport, setRapport] = useState<File | null>(null)
  const [pv, setPv]           = useState<File | null>(null)
  const [form, setForm] = useState({
    date_visite:  '',
    observations: '',
    conforme:     '' as '' | 'true' | 'false',
  })

  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date_visite) { toast.error('La date de visite est obligatoire'); return }
    if (form.conforme === '') { toast.error('Veuillez indiquer si l\'établissement est conforme'); return }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('demande', id!)
      fd.append('inspecteur', String(user?.id))
      fd.append('date_visite',  form.date_visite)
      fd.append('observations', form.observations)
      fd.append('conforme',     form.conforme)
      if (rapport) fd.append('rapport',   rapport)
      if (pv)      fd.append('pv_visite', pv)

      await api.post('/visites/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })

      // Transition du statut
      await api.post(`/demandes/${id}/transmettre/`, {
        etape_code:  'DDPI_PV_VISITE',
        action:      'PV de visite enregistré',
        commentaire: form.observations,
      })

      toast.success('PV de visite enregistré avec succès !')
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
        <span className="font-semibold text-gray-700">PV de visite des lieux</span>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
          <FileText size={20} className="text-mmi-green" />
          Enregistrer la visite des lieux
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Date de visite */}
          <div>
            <label className="form-label">Date de la visite *</label>
            <input
              type="date"
              className="form-input"
              value={form.date_visite}
              onChange={e => up('date_visite', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Conformité */}
          <div>
            <label className="form-label">L'établissement est-il conforme ? *</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => up('conforme', 'true')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all
                  ${form.conforme === 'true'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-green-400'}`}
              >
                <CheckCircle size={18} className={form.conforme === 'true' ? 'text-green-500' : 'text-gray-400'} />
                Conforme
              </button>
              <button
                type="button"
                onClick={() => up('conforme', 'false')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all
                  ${form.conforme === 'false'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-red-400'}`}
              >
                <XCircle size={18} className={form.conforme === 'false' ? 'text-red-500' : 'text-gray-400'} />
                Non conforme
              </button>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="form-label">Observations et remarques</label>
            <textarea
              className="form-input resize-none"
              rows={4}
              placeholder="Décrivez les observations faites lors de la visite..."
              value={form.observations}
              onChange={e => up('observations', e.target.value)}
            />
          </div>

          {/* Upload Rapport */}
          <div>
            <label className="form-label">Rapport de visite (PDF)</label>
            <UploadZone
              file={rapport}
              onChange={setRapport}
              label="Rapport de visite"
            />
          </div>

          {/* Upload PV */}
          <div>
            <label className="form-label">PV de visite signé (PDF)</label>
            <UploadZone
              file={pv}
              onChange={setPv}
              label="PV de visite"
            />
          </div>

          {/* Résumé */}
          {form.conforme && (
            <div className={`rounded-xl p-4 border text-sm
              ${form.conforme === 'true'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'}`}>
              <p className="font-semibold mb-1">
                {form.conforme === 'true' ? '✅ Établissement conforme' : '❌ Établissement non conforme'}
              </p>
              <p className="text-xs">
                {form.conforme === 'true'
                  ? 'Le dossier pourra être soumis au comité BP pour décision.'
                  : 'Le demandeur sera notifié des non-conformités à corriger.'}
              </p>
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

function UploadZone({ file, onChange, label }: {
  file: File | null
  onChange: (f: File) => void
  label: string
}) {
  return (
    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
      ${file ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-300 hover:border-mmi-green hover:bg-gray-50'}`}>
      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
             onChange={e => e.target.files?.[0] && onChange(e.target.files[0])} />
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
        ${file ? 'bg-mmi-green' : 'bg-gray-100'}`}>
        {file
          ? <CheckCircle size={18} className="text-white" />
          : <Upload size={18} className="text-gray-400" />
        }
      </div>
      <div>
        <p className={`text-sm font-medium ${file ? 'text-mmi-green' : 'text-gray-600'}`}>
          {file ? file.name : `Choisir le ${label}`}
        </p>
        <p className="text-xs text-gray-400">PDF, JPG, PNG — max 10 Mo</p>
      </div>
    </label>
  )
}