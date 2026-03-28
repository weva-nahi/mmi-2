import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, CheckCircle, Search, Upload, Save, AlertTriangle } from 'lucide-react'
import { demandesAPI, autorisationsAPI } from '@/utils/api'
import toast from 'react-hot-toast'

const NATURES_EXTENSION = [
  { value: 'augmentation_capacite',    label: 'Augmentation de la capacité de production' },
  { value: 'ajout_activite',           label: 'Ajout d\'une nouvelle activité' },
  { value: 'agrandissement_superficie','label': 'Agrandissement de la superficie' },
  { value: 'nouveau_equipement',       label: 'Ajout de nouveaux équipements' },
  { value: 'autre',                    label: 'Autre nature d\'extension' },
]

export default function FormulaireExtension() {
  const navigate   = useNavigate()
  const [step, setStep]       = useState(1)
  const [saving, setSaving]   = useState(false)
  const [searching, setSearching] = useState(false)
  const [autoExistante, setAutoExistante] = useState<any>(null)
  const [files, setFiles]     = useState<Record<string, File>>({})
  const [searchTerm, setSearchTerm] = useState('')

  const [form, setForm] = useState({
    num_autorisation_ref: '',
    nature_extension:     '',
    description_travaux:  '',
    superficie_actuelle:  '',
    superficie_nouvelle:  '',
    capacite_actuelle:    '',
    capacite_nouvelle:    '',
    cout_extension:       '',
    delai_realisation:    '',
    justification:        '',
  })

  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // Recherche de l'autorisation existante
  const rechercherAuto = async () => {
    if (!searchTerm.trim()) return
    setSearching(true)
    try {
      const res = await autorisationsAPI.byNumeroPour(searchTerm.trim(), 'extension')
      setAutoExistante(res.data)
      up('num_autorisation_ref', res.data.numero_auto)
      toast.success(res.data.message || 'Autorisation trouvée — extension éligible !')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Aucune autorisation active trouvée avec ce numéro')
      setAutoExistante(null)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const { data: res } = await demandesAPI.create({
        type_demande_code:   'EXTENSION',
        raison_sociale:       autoExistante?.adresse || '',
        adresse:              autoExistante?.adresse || '',
        wilaya:               autoExistante?.wilaya || '',
        activite:             form.nature_extension || '',
        formulaire_specifique: form,
      })
      // Lier l'autorisation parente à la demande d'extension
      if (autoExistante?.id || autoExistante?.numero_auto) {
        try {
          await demandesAPI.lierAutorisation(res.id, autoExistante.numero_auto)
        } catch { /* non bloquant */ }
      }
      for (const [key, file] of Object.entries(files)) {
        const fd = new FormData()
        fd.append('fichier', file)
        fd.append('piece_nom', key)
        await demandesAPI.uploadPiece(res.id, fd)
      }
      toast.success(`Demande d'extension ${res.numero_ref} soumise !`)
      navigate('/demandeur/demandes')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const STEPS = ['Autorisation', 'Nature', 'Détails', 'Documents', 'Confirmation']

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}
                className="text-sm text-gray-500 hover:text-mmi-green flex items-center gap-1">
          <ChevronLeft size={16} /> Retour
        </button>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-700">Extension d'autorisation industrielle</span>
      </div>

      {/* Barre étapes */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step > i+1 ? 'bg-mmi-green text-white' : step === i+1 ? 'bg-mmi-green text-white ring-4 ring-mmi-green/20' : 'bg-gray-100 text-gray-400'}`}>
                {step > i+1 ? <CheckCircle size={13} /> : i+1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i+1 ? 'text-mmi-green font-medium' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < STEPS.length-1 && <div className={`flex-1 h-0.5 mb-4 ${step > i+1 ? 'bg-mmi-green' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6">

        {/* ── Étape 1 : Rechercher autorisation ── */}
        {step === 1 && (
          <div className="animate-fadeInUp">
            <h2 className="font-bold text-gray-800 mb-2">Rattacher à une autorisation existante</h2>
            <p className="text-sm text-gray-500 mb-5">
              L'extension est rattachée à une autorisation industrielle déjà accordée.
              Entrez son numéro de référence.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                className="form-input flex-1"
                placeholder="Ex: MMI-2022-00456"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && rechercherAuto()}
              />
              <button
                onClick={rechercherAuto}
                disabled={searching}
                className="btn-primary flex items-center gap-1.5 px-4"
              >
                {searching
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Search size={15} />
                }
                Rechercher
              </button>
            </div>

            {autoExistante ? (
              <div className="rounded-xl border-2 border-mmi-green bg-mmi-green-lt p-4 animate-fadeInUp">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-mmi-green flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-mmi-green">{autoExistante.numero_auto}</p>
                    <p className="font-medium text-gray-800 mt-1">{autoExistante.raison_sociale}</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs text-gray-600">
                      <span>Type : {autoExistante.type_auto}</span>
                      <span>Wilaya : {autoExistante.wilaya}</span>
                      <span>Activité : {autoExistante.activite}</span>
                      <span>Date : {new Date(autoExistante.date_autorisation).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-400">
                <Search size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune autorisation sélectionnée</p>
                <p className="text-xs mt-1">Entrez le numéro de référence et cliquez Rechercher</p>
              </div>
            )}
          </div>
        )}

        {/* ── Étape 2 : Nature de l'extension ── */}
        {step === 2 && (
          <div className="animate-fadeInUp">
            <h2 className="font-bold text-gray-800 mb-5">Nature de l'extension</h2>
            <div className="space-y-2 mb-5">
              {NATURES_EXTENSION.map(n => (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => up('nature_extension', n.value)}
                  className={`w-full text-left p-3.5 rounded-xl border-2 text-sm transition-all
                    ${form.nature_extension === n.value
                      ? 'border-mmi-green bg-mmi-green-lt text-mmi-green font-medium'
                      : 'border-gray-200 text-gray-700 hover:border-mmi-green'}`}
                >
                  {n.label}
                </button>
              ))}
            </div>
            <div>
              <label className="form-label">Description des travaux d'extension *</label>
              <textarea className="form-input resize-none" rows={3}
                        placeholder="Décrivez les travaux prévus..."
                        value={form.description_travaux}
                        onChange={e => up('description_travaux', e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Étape 3 : Détails chiffrés ── */}
        {step === 3 && (
          <div className="animate-fadeInUp space-y-4">
            <h2 className="font-bold text-gray-800 mb-4">Détails de l'extension</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['superficie_actuelle', 'Superficie actuelle (m²)', ''],
                ['superficie_nouvelle', 'Superficie après extension (m²)', ''],
                ['capacite_actuelle',   'Capacité actuelle (unités/an)', ''],
                ['capacite_nouvelle',   'Capacité après extension (unités/an)', ''],
                ['cout_extension',      'Coût estimatif (MRU)', ''],
                ['delai_realisation',   'Délai de réalisation', 'Ex: 6 mois'],
              ].map(([key, label, ph]) => (
                <div key={key as string}>
                  <label className="form-label">{label as string}</label>
                  <input className="form-input" placeholder={ph as string}
                         value={(form as any)[key as string]}
                         onChange={e => up(key as string, e.target.value)} />
                </div>
              ))}
            </div>
            <div>
              <label className="form-label">Justification de l'extension</label>
              <textarea className="form-input resize-none" rows={3}
                        placeholder="Pourquoi cette extension est-elle nécessaire ?"
                        value={form.justification}
                        onChange={e => up('justification', e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Étape 4 : Documents ── */}
        {step === 4 && (
          <div className="animate-fadeInUp space-y-3">
            <h2 className="font-bold text-gray-800 mb-4">Pièces justificatives</h2>
            {[
              { key: 'plan_extension',    label: 'Plan d\'extension / plans architecturaux',   obligatoire: true },
              { key: 'devis_travaux',     label: 'Devis estimatif des travaux',                obligatoire: true },
              { key: 'autorisation_ref',  label: 'Copie de l\'autorisation d\'origine',        obligatoire: true },
              { key: 'etude_impact',      label: 'Étude d\'impact environnemental (si requis)', obligatoire: false },
              { key: 'accord_propriete',  label: 'Titre de propriété / bail',                  obligatoire: false },
            ].map(doc => (
              <label key={doc.key}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-all
                  ${files[doc.key] ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-200 hover:border-mmi-green'}`}>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                       onChange={e => e.target.files?.[0] && setFiles(p => ({ ...p, [doc.key]: e.target.files![0] }))} />
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                  ${files[doc.key] ? 'bg-mmi-green' : 'bg-gray-100'}`}>
                  {files[doc.key]
                    ? <CheckCircle size={16} className="text-white" />
                    : <Upload size={16} className="text-gray-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${files[doc.key] ? 'text-mmi-green' : 'text-gray-700'}`}>
                    {doc.label} {doc.obligatoire && <span className="text-red-500">*</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {files[doc.key] ? files[doc.key].name : 'Cliquer pour choisir'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* ── Étape 5 : Confirmation ── */}
        {step === 5 && (
          <div className="animate-fadeInUp">
            <h2 className="font-bold text-gray-800 mb-5">Récapitulatif</h2>
            <div className="space-y-2 mb-5">
              {[
                ['Autorisation de référence', form.num_autorisation_ref],
                ['Établissement',             autoExistante?.raison_sociale || '—'],
                ['Nature extension',          NATURES_EXTENSION.find(n => n.value === form.nature_extension)?.label || '—'],
                ['Superficie actuelle',       form.superficie_actuelle ? `${form.superficie_actuelle} m²` : '—'],
                ['Superficie nouvelle',       form.superficie_nouvelle ? `${form.superficie_nouvelle} m²` : '—'],
                ['Coût estimatif',            form.cout_extension ? `${form.cout_extension} MRU` : '—'],
                ['Documents joints',          `${Object.keys(files).length} fichier(s)`],
              ].map(([k, v]) => (
                <div key={k as string} className="flex gap-4 text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-400 w-40 flex-shrink-0">{k}</span>
                  <span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              En soumettant, je certifie l'exactitude de ces informations.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          {step > 1 && (
            <button onClick={() => setStep(s => s-1)}
                    className="btn-secondary flex items-center gap-1.5">
              <ChevronLeft size={16} /> Précédent
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={() => setStep(s => s+1)}
              disabled={step === 1 && !autoExistante}
              className="btn-primary flex items-center gap-1.5 ml-auto disabled:opacity-40"
            >
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Save size={16} /> Soumettre</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}