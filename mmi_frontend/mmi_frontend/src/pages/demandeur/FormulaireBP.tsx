import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import toast from 'react-hot-toast'

export default function FormulaireBP() {
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [errors, setErrors]     = useState<string[]>([])
  const [showGuide, setShowGuide] = useState(false)

  const [form, setForm] = useState({
    telephone_proprietaire: '',
    activite_principale:    '',
    adresse:                '',
    wilaya:                 '',
    longitude:              '',
    latitude:               '',
  })

  const [files, setFiles] = useState<Record<string, File | null>>({
    // Dossier juridique
    statut_certifie_notaire_file:       null,
    registre_commerce_local_file:       null,
    numero_identification_fiscale_file: null,
    certificat_enregistrement_cnss_file:null,
    // Documents spécifiques boulangerie
    demande_ministere_file:             null,
    carte_identite_proprietaire_file:   null,
    coordonnees_file:                   null,
    titre_foncier_file:                 null,
    etude_faisabilite_file:             null,
    cahier_charges_file:                null,
  })

  const upForm = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const upFile = (k: string, f: File)   => setFiles(p => ({ ...p, [k]: f }))

  const localiserGPS = () => {
    if (!navigator.geolocation) { toast.error('Géolocalisation non supportée'); return }
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
      'demande_ministere_file','carte_identite_proprietaire_file',
      'titre_foncier_file','etude_faisabilite_file','cahier_charges_file',
    ]
    obligatoires.forEach(k => { if (!files[k]) errs.push(`Pièce manquante : ${k.replace(/_file$/, '').replace(/_/g, ' ')}`) })
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
        type_demande_code: 'BP',
        activite:          form.activite_principale,
        adresse:           form.adresse || '',
        wilaya:            form.wilaya || '',
        latitude:          form.latitude  || null,
        longitude:         form.longitude || null,
        formulaire_specifique: form,
      })
      for (const [key, file] of Object.entries(files)) {
        if (!file) continue
        const fd = new FormData()
        fd.append('fichier', file)
        fd.append('piece_nom', key)
        await demandesAPI.uploadPiece(res.id, fd)
      }
      toast.success(`✅ Demande BP ${res.numero_ref} soumise avec succès !`)
      navigate('/demandeur/demandes')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Retour */}
      <button onClick={() => navigate('/demandeur/nouvelle')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-mmi-green mb-6 transition-colors">
        <ChevronLeft size={16} /> Retour
      </button>

      <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
        🥖 Demande d'Autorisation — Boulangerie
      </h2>
      <p className="text-sm text-gray-500 mb-6">Remplissez tous les champs obligatoires *</p>

      {/* Erreurs */}
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

        {/* ── Informations générales ── */}
        <Section title="📋 Informations générales">
          <Field label="Téléphone du propriétaire *">
            <input type="text" className="form-input"
                   placeholder="Ex: +222 45454545"
                   value={form.telephone_proprietaire}
                   onChange={e => upForm('telephone_proprietaire', e.target.value)} required />
          </Field>
          <Field label="Activité principale *">
            <input type="text" className="form-input"
                   placeholder="Ex: Exploitation de boulangerie"
                   value={form.activite_principale}
                   onChange={e => upForm('activite_principale', e.target.value)} required />
          </Field>
        </Section>

        {/* ── Dossier juridique ── */}
        <Section title="📋 Dossier juridique de la société ou ETS">
          <FileField label="Statut certifié par le notaire *" name="statut_certifie_notaire_file"
                     accept=".pdf,.jpg,.png" file={files.statut_certifie_notaire_file}
                     onChange={f => upFile('statut_certifie_notaire_file', f)} />
          <FileField label="Registre de commerce local *" name="registre_commerce_local_file"
                     accept=".pdf,.jpg,.png" file={files.registre_commerce_local_file}
                     onChange={f => upFile('registre_commerce_local_file', f)} />
          <FileField label="Numéro d'identification fiscale *" name="numero_identification_fiscale_file"
                     accept=".pdf,.jpg,.png" file={files.numero_identification_fiscale_file}
                     onChange={f => upFile('numero_identification_fiscale_file', f)} />
          <FileField label="Certificat d'enregistrement CNSS *" name="certificat_enregistrement_cnss_file"
                     accept=".pdf,.jpg,.png" file={files.certificat_enregistrement_cnss_file}
                     onChange={f => upFile('certificat_enregistrement_cnss_file', f)} />
        </Section>

        {/* ── Documents spécifiques boulangerie ── */}
        <Section title="🥖 Documents spécifiques à la boulangerie">
          <FileField
            label="Une demande adressée au Ministre chargé de l'Industrie pour l'autorisation *"
            name="demande_ministere_file" accept=".pdf"
            file={files.demande_ministere_file}
            onChange={f => upFile('demande_ministere_file', f)} pdfOnly />
          <FileField
            label="Une copie de la carte d'identité et des numéros de téléphone du propriétaire *"
            name="carte_identite_proprietaire_file" accept=".pdf,.jpg,.png"
            file={files.carte_identite_proprietaire_file}
            onChange={f => upFile('carte_identite_proprietaire_file', f)} />
          <FileField
            label="Le titre de propriété foncière ou un contrat de bail d'une durée d'au moins cinq ans *"
            name="titre_foncier_file" accept=".pdf"
            file={files.titre_foncier_file}
            onChange={f => upFile('titre_foncier_file', f)} pdfOnly />
          <FileField
            label="L'étude de faisabilité économique du projet (Boulangerie avec Pâtisserie ou Boulangerie ou Pâtisserie) *"
            name="etude_faisabilite_file" accept=".pdf"
            file={files.etude_faisabilite_file}
            onChange={f => upFile('etude_faisabilite_file', f)} pdfOnly />
          <FileField
            label="Une copie du cahier des charges des Boulangeries-Pâtisserie, signée par l'intéressé *"
            name="cahier_charges_file" accept=".pdf"
            file={files.cahier_charges_file}
            onChange={f => upFile('cahier_charges_file', f)} pdfOnly />
          <FileField
            label="Coordonnées GPS (capture écran ou document)"
            name="coordonnees_file" accept=".pdf,.jpg,.png"
            file={files.coordonnees_file}
            onChange={f => upFile('coordonnees_file', f)} optional />
        </Section>

        {/* ── GPS ── */}
        <Section title="📍 Coordonnées GPS de l'établissement">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Saisissez manuellement ou capturez automatiquement</p>
            <button type="button" onClick={() => setShowGuide(!showGuide)}
                    className="text-xs text-blue-600 hover:underline">
              ❓ Comment obtenir mes coordonnées ?
            </button>
          </div>
          {showGuide && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 mb-3">
              <p className="font-semibold mb-1">Comment obtenir vos coordonnées GPS :</p>
              <ol className="space-y-1 list-decimal ml-4">
                <li>Ouvrez <strong>Google Maps</strong> sur votre téléphone</li>
                <li>Appuyez longtemps sur votre emplacement</li>
                <li>Les coordonnées apparaissent en bas de l'écran</li>
                <li>Copiez la <strong>Latitude</strong> puis la <strong>Longitude</strong></li>
              </ol>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <Field label="Longitude *" className="flex-1">
              <input type="text" className="form-input"
                     placeholder="Ex: -15.9582"
                     value={form.longitude}
                     onChange={e => upForm('longitude', e.target.value)} required />
              <p className="text-xs text-gray-400 mt-1">Format: nombre décimal (ex: -15.9582)</p>
            </Field>
            <Field label="Latitude *" className="flex-1">
              <input type="text" className="form-input"
                     placeholder="Ex: 18.0735"
                     value={form.latitude}
                     onChange={e => upForm('latitude', e.target.value)} required />
              <p className="text-xs text-gray-400 mt-1">Format: nombre décimal (ex: 18.0735)</p>
            </Field>
          </div>
          <button type="button" onClick={localiserGPS} disabled={gpsLoading}
                  className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            {gpsLoading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <MapPin size={15} />}
            {form.latitude ? '✅ Position capturée — Relocaliser' : 'Capturer automatiquement ma position GPS'}
          </button>
        </Section>

        {/* Bouton soumettre */}
        <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : '🥖 Envoyer la demande'}
        </button>
      </form>
    </div>
  )
}

// ── Composants utilitaires ───────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-700 text-sm mb-4 pb-2 border-b border-gray-100">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="form-label text-xs">{label}</label>
      {children}
    </div>
  )
}

function FileField({ label, name, accept, file, onChange, pdfOnly = false, optional = false }: {
  label: string; name: string; accept: string
  file: File | null; onChange: (f: File) => void
  pdfOnly?: boolean; optional?: boolean
}) {
  return (
    <div>
      <label className="form-label text-xs">{label}</label>
      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all
        ${file ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-200 hover:border-mmi-green'}`}>
        <input type="file" className="hidden" accept={accept}
               onChange={e => e.target.files?.[0] && onChange(e.target.files[0])} />
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${file ? 'bg-mmi-green' : 'bg-gray-100'}`}>
          {file ? <CheckCircle size={14} className="text-white" /> : <span className="text-gray-400 text-xs">📎</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${file ? 'text-mmi-green' : 'text-gray-600'}`}>
            {file ? file.name : 'Cliquer pour choisir'}
          </p>
          <p className="text-xs text-gray-400">{pdfOnly ? 'Format accepté: PDF uniquement' : 'Format accepté: PDF, JPG, PNG'}</p>
        </div>
      </label>
    </div>
  )
}