import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, CheckCircle, Save, Building2, User, FileText, MapPin, Settings, RefreshCw, Upload } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const WILAYAS = [
  'Hodh Ech Chargui','Hodh El Gharbi','Assaba','Gorgol','Brakna','Trarza',
  'Adrar','Dakhlet Nouadhibou','Tagant','Guidimaka','Tiris Zemmour',
  'Inchiri','Nouakchott Nord','Nouakchott Ouest','Nouakchott Sud',
]

const FORMES = ['Établissement','SA','SARL','SNC','GIE','Autre']
const ACTIVITES_TYPE = ['Agroalimentaire','Matériaux de construction','Chimie','Métallurgie','Textile','Eau','Autre']

const SECTIONS = [
  { id: 1, label: 'Identification',    icon: Building2 },
  { id: 2, label: 'Dirigeant',         icon: User },
  { id: 3, label: 'Localisation',      icon: MapPin },
  { id: 4, label: 'Activité',          icon: Settings },
  { id: 5, label: 'Situation actuelle',icon: RefreshCw },
  { id: 6, label: 'Documents',         icon: FileText },
  { id: 7, label: 'Confirmation',      icon: CheckCircle },
]

export default function FormulaireRenouvellement() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const [step, setStep]       = useState(1)
  const [saving, setSaving]   = useState(false)
  const [files, setFiles]     = useState<Record<string, File>>({})

  const [data, setData] = useState({
    // Section 1 — Identification
    raison_sociale: user?.nom_entreprise || '',
    forme_juridique: '',
    nif: '',
    rccm: '',
    date_creation: '',
    capital_social: '',
    // Section 2 — Dirigeant
    dirigeant_nom: '',
    dirigeant_prenom: '',
    dirigeant_nationalite: '',
    dirigeant_telephone: '',
    dirigeant_email: '',
    dirigeant_cin: '',
    // Section 3 — Localisation
    adresse: '',
    wilaya: '',
    commune: '',
    telephone_siege: '',
    latitude: '',
    longitude: '',
    // Section 4 — Activité
    activite_principale: '',
    activite_secondaire: '',
    code_nace: '',
    effectif_total: '',
    effectif_femmes: '',
    // Section 5 — Situation actuelle
    num_autorisation_ancien: '',
    date_autorisation_ancien: '',
    capacite_production: '',
    chiffre_affaires: '',
    observations: '',
  })

  const up = (k: string, v: string) => setData(p => ({ ...p, [k]: v }))
  const addFile = (k: string, f: File) => setFiles(p => ({ ...p, [k]: f }))

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const { data: res } = await demandesAPI.create({
        type_demande_code: 'RENOUVELLEMENT',
        ...data,
        formulaire_specifique: data,
      })
      // Upload fichiers
      for (const [key, file] of Object.entries(files)) {
        const fd = new FormData()
        fd.append('fichier', file)
        fd.append('piece_nom', key)
        await demandesAPI.uploadPiece(res.id, fd)
      }
      toast.success(`Demande ${res.numero_ref} soumise !`)
      navigate('/demandeur/demandes')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-mmi-green flex items-center gap-1">
          <ChevronLeft size={16} /> Retour
        </button>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-700">Renouvellement d'enregistrement industriel</span>
      </div>

      {/* Barre de progression */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {SECTIONS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step > s.id  ? 'bg-mmi-green text-white cursor-pointer hover:bg-mmi-green-mid'
                  : step === s.id ? 'bg-mmi-green text-white ring-4 ring-mmi-green/20'
                  : 'bg-gray-100 text-gray-400'}`}
              >
                {step > s.id ? <CheckCircle size={14} /> : s.id}
              </button>
              <span className={`text-xs whitespace-nowrap hidden sm:block ${step === s.id ? 'text-mmi-green font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < SECTIONS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${step > s.id ? 'bg-mmi-green' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6">

        {/* ── Section 1 : Identification ── */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeInUp">
            <SectionTitle icon={Building2} title="Identification de l'entreprise" />
            <Grid2>
              <Field label="Raison sociale *" value={data.raison_sociale} onChange={v => up('raison_sociale', v)} />
              <Field label="Forme juridique *" type="select" options={FORMES}
                     value={data.forme_juridique} onChange={v => up('forme_juridique', v)} />
              <Field label="NIF *" value={data.nif} onChange={v => up('nif', v)} placeholder="Ex: 00123456789" />
              <Field label="RCCM" value={data.rccm} onChange={v => up('rccm', v)} placeholder="Ex: MR-NKC-2020-B-1234" />
              <Field label="Date de création *" type="date" value={data.date_creation} onChange={v => up('date_creation', v)} />
              <Field label="Capital social (MRU)" value={data.capital_social} onChange={v => up('capital_social', v)} placeholder="Ex: 1000000" />
            </Grid2>
          </div>
        )}

        {/* ── Section 2 : Dirigeant ── */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeInUp">
            <SectionTitle icon={User} title="Informations du dirigeant" />
            <Grid2>
              <Field label="Nom *" value={data.dirigeant_nom} onChange={v => up('dirigeant_nom', v)} />
              <Field label="Prénom *" value={data.dirigeant_prenom} onChange={v => up('dirigeant_prenom', v)} />
              <Field label="Nationalité *" value={data.dirigeant_nationalite} onChange={v => up('dirigeant_nationalite', v)} placeholder="Ex: Mauritanienne" />
              <Field label="N° CIN / Passeport *" value={data.dirigeant_cin} onChange={v => up('dirigeant_cin', v)} />
              <Field label="Téléphone *" type="tel" value={data.dirigeant_telephone} onChange={v => up('dirigeant_telephone', v)} placeholder="+222 XX XX XX XX" />
              <Field label="Email" type="email" value={data.dirigeant_email} onChange={v => up('dirigeant_email', v)} />
            </Grid2>
          </div>
        )}

        {/* ── Section 3 : Localisation ── */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeInUp">
            <SectionTitle icon={MapPin} title="Localisation de l'établissement" />
            <Grid2>
              <div className="col-span-2">
                <Field label="Adresse complète *" value={data.adresse} onChange={v => up('adresse', v)} />
              </div>
              <Field label="Wilaya *" type="select" options={WILAYAS}
                     value={data.wilaya} onChange={v => up('wilaya', v)} />
              <Field label="Commune / Moughataa" value={data.commune} onChange={v => up('commune', v)} />
              <Field label="Téléphone siège" type="tel" value={data.telephone_siege} onChange={v => up('telephone_siege', v)} />
              <Field label="Latitude GPS" value={data.latitude} onChange={v => up('latitude', v)} placeholder="Ex: 18.0764" />
              <Field label="Longitude GPS" value={data.longitude} onChange={v => up('longitude', v)} placeholder="Ex: -15.9785" />
            </Grid2>
          </div>
        )}

        {/* ── Section 4 : Activité ── */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeInUp">
            <SectionTitle icon={Settings} title="Activité industrielle" />
            <Grid2>
              <Field label="Activité principale *" type="select" options={ACTIVITES_TYPE}
                     value={data.activite_principale} onChange={v => up('activite_principale', v)} />
              <Field label="Activité secondaire" value={data.activite_secondaire} onChange={v => up('activite_secondaire', v)} />
              <Field label="Code NACE / NAC" value={data.code_nace} onChange={v => up('code_nace', v)} placeholder="Ex: C10.1" />
              <Field label="Effectif total (employés)" type="number" value={data.effectif_total} onChange={v => up('effectif_total', v)} />
              <Field label="Dont femmes" type="number" value={data.effectif_femmes} onChange={v => up('effectif_femmes', v)} />
            </Grid2>
          </div>
        )}

        {/* ── Section 5 : Situation actuelle ── */}
        {step === 5 && (
          <div className="space-y-4 animate-fadeInUp">
            <SectionTitle icon={RefreshCw} title="Situation de l'enregistrement actuel" />
            <Grid2>
              <Field label="N° autorisation à renouveler *" value={data.num_autorisation_ancien}
                     onChange={v => up('num_autorisation_ancien', v)} placeholder="Ex: MMI-2020-00123" />
              <Field label="Date de l'autorisation *" type="date" value={data.date_autorisation_ancien}
                     onChange={v => up('date_autorisation_ancien', v)} />
              <Field label="Capacité de production actuelle" value={data.capacite_production}
                     onChange={v => up('capacite_production', v)} placeholder="Ex: 500 tonnes/an" />
              <Field label="Chiffre d'affaires annuel (MRU)" value={data.chiffre_affaires}
                     onChange={v => up('chiffre_affaires', v)} />
            </Grid2>
            <div>
              <label className="form-label">Observations / Changements depuis la dernière autorisation</label>
              <textarea className="form-input resize-none" rows={3}
                        value={data.observations} onChange={e => up('observations', e.target.value)}
                        placeholder="Décrire les changements intervenus..." />
            </div>
          </div>
        )}

        {/* ── Section 6 : Documents ── */}
        {step === 6 && (
          <div className="space-y-4 animate-fadeInUp">
            <SectionTitle icon={FileText} title="Pièces justificatives" />
            <p className="text-xs text-gray-500">Formats acceptés : PDF, JPG, PNG — max 10 Mo par fichier</p>
            <div className="space-y-3">
              {[
                { key: 'registre_commerce', label: 'Registre de commerce (RCCM)', obligatoire: true },
                { key: 'attestation_nif',   label: 'Attestation NIF', obligatoire: true },
                { key: 'ancienne_auto',      label: 'Ancienne autorisation à renouveler', obligatoire: true },
                { key: 'plan_masse',         label: 'Plan de masse / Plan de situation', obligatoire: false },
                { key: 'bilan',              label: 'Dernier bilan comptable', obligatoire: false },
                { key: 'attestation_cnss',   label: 'Attestation de régularité CNSS', obligatoire: false },
              ].map(doc => (
                <label key={doc.key}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-all
                    ${files[doc.key] ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-200 hover:border-mmi-green'}`}>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                         onChange={e => e.target.files?.[0] && addFile(doc.key, e.target.files[0])} />
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                    ${files[doc.key] ? 'bg-mmi-green' : 'bg-gray-100'}`}>
                    {files[doc.key]
                      ? <CheckCircle size={16} className="text-white" />
                      : <Upload size={16} className="text-gray-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${files[doc.key] ? 'text-mmi-green' : 'text-gray-700'}`}>
                      {doc.label}
                      {doc.obligatoire && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {files[doc.key] ? files[doc.key].name : 'Cliquer pour choisir'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 7 : Confirmation ── */}
        {step === 7 && (
          <div className="animate-fadeInUp">
            <SectionTitle icon={CheckCircle} title="Récapitulatif de la demande" />
            <div className="space-y-2 mb-6">
              {[
                ['Raison sociale',        data.raison_sociale],
                ['Forme juridique',       data.forme_juridique],
                ['NIF',                   data.nif],
                ['Dirigeant',             `${data.dirigeant_nom} ${data.dirigeant_prenom}`],
                ['Wilaya',                data.wilaya],
                ['Activité',              data.activite_principale],
                ['N° autorisation',       data.num_autorisation_ancien],
                ['Documents joints',      `${Object.keys(files).length} fichier(s)`],
              ].map(([k, v]) => (
                <div key={k as string} className="flex gap-4 text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-400 w-36 flex-shrink-0">{k}</span>
                  <span className="font-medium text-gray-800">{v || '—'}</span>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 mb-5">
              En soumettant cette demande, je certifie l'exactitude des informations fournies et m'engage à respecter
              la réglementation industrielle mauritanienne en vigueur.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
                    className="btn-secondary flex items-center gap-1.5">
              <ChevronLeft size={16} /> Précédent
            </button>
          )}
          {step < 7 ? (
            <button onClick={() => setStep(s => s + 1)}
                    className="btn-primary flex items-center gap-1.5 ml-auto">
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
                    className="btn-primary flex items-center justify-center gap-2 flex-1">
              {saving
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Save size={16} /> Soumettre la demande</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Composants utilitaires ────────────────────────────────────
function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
      <div className="w-8 h-8 bg-mmi-green-lt rounded-lg flex items-center justify-center">
        <Icon size={16} className="text-mmi-green" />
      </div>
      <h2 className="font-bold text-gray-800">{title}</h2>
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
}

function Field({ label, value, onChange, type = 'text', options, placeholder, className = '' }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; options?: string[]; placeholder?: string; className?: string
}) {
  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      {type === 'select' ? (
        <select className="form-input" value={value} onChange={e => onChange(e.target.value)}>
          <option value="">-- Sélectionner --</option>
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} className="form-input" value={value}
               onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  )
}