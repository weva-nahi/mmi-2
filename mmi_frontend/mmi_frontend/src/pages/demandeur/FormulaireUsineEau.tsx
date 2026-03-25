import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import toast from 'react-hot-toast'

export default function FormulaireUsineEau() {
  const navigate = useNavigate()
  const [loading, setLoading]     = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [errors, setErrors]       = useState<string[]>([])
  const [showGuide, setShowGuide] = useState(false)

  const [form, setForm] = useState({
    telephone_proprietaire: '',
    activite_principale:    '',
    longitude:              '',
    latitude:               '',
  })

  const [files, setFiles] = useState<Record<string, File | null>>({
    // Dossier juridique
    statut_certifie_notaire_file:        null,
    registre_commerce_local_file:        null,
    numero_identification_fiscale_file:  null,
    certificat_enregistrement_cnss_file: null,
    // Documents spécifiques eaux minérales
    autorisation_ministere_eau_file:         null,
    analyses_eau_laboratoire_file:           null,
    etude_faisabilite_projet_file:           null,
    declaration_conformite_emballage_file:   null,
    cahier_charges_signe_file:               null,
    demande_autorisation_ministre_file:      null,
    copie_identite_proprietaire_file:        null,
  })

  const upForm = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const upFile = (k: string, f: File)   => setFiles(p => ({ ...p, [k]: f }))

  const localiserGPS = () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        upForm('latitude',  pos.coords.latitude.toFixed(6))
        upForm('longitude', pos.coords.longitude.toFixed(6))
        setGpsLoading(false)
        toast.success('Position GPS capturée !')
      },
      () => { toast.error('Impossible d\'obtenir la position'); setGpsLoading(false) },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const validate = (): string[] => {
    const errs: string[] = []
    if (!form.telephone_proprietaire) errs.push('Téléphone du propriétaire obligatoire')
    if (!form.activite_principale)    errs.push('Activité principale obligatoire')
    if (!form.longitude)              errs.push('Longitude GPS obligatoire')
    if (!form.latitude)               errs.push('Latitude GPS obligatoire')
    const obligatoires = [
      'statut_certifie_notaire_file','registre_commerce_local_file',
      'numero_identification_fiscale_file','certificat_enregistrement_cnss_file',
      'autorisation_ministere_eau_file','analyses_eau_laboratoire_file',
      'etude_faisabilite_projet_file','declaration_conformite_emballage_file',
      'cahier_charges_signe_file','demande_autorisation_ministre_file',
      'copie_identite_proprietaire_file',
    ]
    obligatoires.forEach(k => { if (!files[k]) errs.push(`Pièce manquante : ${k.replace(/_file$/, '').replace(/_/g,' ')}`) })
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setLoading(true)
    try {
      const { data: res } = await demandesAPI.create({
        type_demande_code: 'USINE_EAU',
        raison_sociale:    form.activite_principale,
        activite:          form.activite_principale,
        adresse: '', wilaya: '',
        latitude:  form.latitude  || null,
        longitude: form.longitude || null,
        formulaire_specifique: form,
      })
      for (const [key, file] of Object.entries(files)) {
        if (!file) continue
        const fd = new FormData()
        fd.append('fichier', file)
        fd.append('piece_nom', key)
        await demandesAPI.uploadPiece(res.id, fd)
      }
      toast.success(`✅ Demande Eau Minérale ${res.numero_ref} soumise !`)
      navigate('/demandeur/demandes')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/demandeur/nouvelle')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-mmi-green mb-6">
        <ChevronLeft size={16} /> Retour
      </button>

      <h2 className="text-xl font-bold text-gray-800 mb-1">💧 Demande d'Autorisation — Eaux Minérales</h2>
      <p className="text-sm text-gray-500 mb-6">Remplissez tous les champs obligatoires *</p>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
            <AlertCircle size={16} /> Champs obligatoires manquants
          </div>
          <ul className="space-y-1">
            {errors.map((e, i) => <li key={i} className="text-xs text-red-600">• {e}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Informations générales */}
        <Section title="📋 Informations générales">
          <Field label="Téléphone du propriétaire *">
            <input type="text" className="form-input" placeholder="Ex: +222 45454545"
                   value={form.telephone_proprietaire}
                   onChange={e => upForm('telephone_proprietaire', e.target.value)} required />
          </Field>
          <Field label="Activité principale *">
            <input type="text" className="form-input"
                   placeholder="Ex: Exploitation d'eaux minérales naturelles"
                   value={form.activite_principale}
                   onChange={e => upForm('activite_principale', e.target.value)} required />
          </Field>
        </Section>

        {/* Dossier juridique */}
        <Section title="📋 Dossier juridique de la société ou ETS">
          <FF label="Statut certifié par le notaire *" k="statut_certifie_notaire_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
          <FF label="Registre de commerce local *" k="registre_commerce_local_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
          <FF label="Numéro d'identification fiscale *" k="numero_identification_fiscale_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
          <FF label="Certificat d'enregistrement CNSS *" k="certificat_enregistrement_cnss_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
        </Section>

        {/* Documents spécifiques eaux */}
        <Section title="💧 Documents spécifiques aux eaux minérales">
          <FF label="Autorisation du ministère de l'Eau pour le forage du puits et l'utilisation des matériaux et équipements nécessaires *"
              k="autorisation_ministere_eau_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
          <FF label="Analyses des échantillons d'eau prélevés sur le site dans un laboratoire agréé, attestant de leur qualité et de leur conformité aux normes des eaux minérales naturelles *"
              k="analyses_eau_laboratoire_file" accept=".pdf" pdfOnly files={files} upFile={upFile} />
          <FF label="Étude de faisabilité du projet *"
              k="etude_faisabilite_projet_file" accept=".pdf" pdfOnly files={files} upFile={upFile} />
          <FF label="Une déclaration attestant la conformité de l'emballage par les services compétents des ministères chargés de l'industrie et de la santé *"
              k="declaration_conformite_emballage_file" accept=".pdf" pdfOnly files={files} upFile={upFile} />
          <FF label="Copie du cahier des charges signé, précisant les conditions d'extraction et de commercialisation de l'eau minérale naturelle *"
              k="cahier_charges_signe_file" accept=".pdf" pdfOnly files={files} upFile={upFile} />
          <FF label="Une demande d'autorisation adressée au Ministre chargé de l'industrie *"
              k="demande_autorisation_ministre_file" accept=".pdf" pdfOnly files={files} upFile={upFile} />
          <FF label="Une copie d'identité du propriétaire *"
              k="copie_identite_proprietaire_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
        </Section>

        {/* GPS */}
        <Section title="📍 Coordonnées GPS de l'établissement">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Saisissez manuellement ou capturez automatiquement</p>
            <button type="button" onClick={() => setShowGuide(!showGuide)}
                    className="text-xs text-blue-600 hover:underline">❓ Comment obtenir mes coordonnées ?</button>
          </div>
          {showGuide && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 mb-3">
              <p className="font-semibold mb-1">Comment obtenir vos coordonnées GPS :</p>
              <ol className="space-y-1 list-decimal ml-4">
                <li>Ouvrez Google Maps sur votre téléphone</li>
                <li>Appuyez longtemps sur votre emplacement</li>
                <li>Les coordonnées apparaissent en bas de l'écran</li>
                <li>Copiez la Latitude puis la Longitude</li>
              </ol>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <Field label="Longitude *">
              <input type="text" className="form-input" placeholder="Ex: -15.9582"
                     value={form.longitude} onChange={e => upForm('longitude', e.target.value)} required />
              <p className="text-xs text-gray-400 mt-1">Format: nombre décimal (ex: -15.9582)</p>
            </Field>
            <Field label="Latitude *">
              <input type="text" className="form-input" placeholder="Ex: 18.0735"
                     value={form.latitude} onChange={e => upForm('latitude', e.target.value)} required />
              <p className="text-xs text-gray-400 mt-1">Format: nombre décimal (ex: 18.0735)</p>
            </Field>
          </div>
          <button type="button" onClick={localiserGPS} disabled={gpsLoading}
                  className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
            {gpsLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MapPin size={15} />}
            {form.latitude ? '✅ Position capturée — Relocaliser' : 'Capturer automatiquement ma position GPS'}
          </button>
        </Section>

        <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '💧 Envoyer la demande'}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-700 text-sm mb-4 pb-2 border-b border-gray-100">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="form-label text-xs">{label}</label>{children}</div>
}
function FF({ label, k, accept, pdfOnly = false, files, upFile }: {
  label: string; k: string; accept: string; pdfOnly?: boolean
  files: Record<string, File | null>; upFile: (k: string, f: File) => void
}) {
  const file = files[k]
  return (
    <div>
      <label className="form-label text-xs">{label}</label>
      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all
        ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}>
        <input type="file" className="hidden" accept={accept}
               onChange={e => e.target.files?.[0] && upFile(k, e.target.files[0])} />
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${file ? 'bg-blue-500' : 'bg-gray-100'}`}>
          {file ? <CheckCircle size={14} className="text-white" /> : <span className="text-gray-400 text-xs">📎</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${file ? 'text-blue-700' : 'text-gray-600'}`}>
            {file ? file.name : 'Cliquer pour choisir'}
          </p>
          <p className="text-xs text-gray-400">{pdfOnly ? 'Format accepté: PDF uniquement' : 'Format accepté: PDF, JPG, PNG'}</p>
        </div>
      </label>
    </div>
  )
}