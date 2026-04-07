import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import toast from 'react-hot-toast'

const SECTEURS = [
  { value: 'agroalimentaire',          label: '🍎 Agroalimentaire' },
  { value: 'peche_halieutique',        label: '🐟 Pêche / Halieutique' },
  { value: 'metallurgie_metallerie',   label: '🔧 Métallurgie / Métallerie' },
  { value: 'materiaux_construction',   label: '🏗️ Matériaux de construction' },
  { value: 'chimie_plastique',         label: '🧪 Chimie / Plastique' },
  { value: 'pharma',                   label: '💊 Pharma' },
  { value: 'textile',                  label: '👕 Textile' },
  { value: 'papeterie_bois',           label: '📄 Papeterie / Bois' },
  { value: 'recyclage',                label: '♻️ Recyclage' },
  { value: 'autre',                    label: '📋 Autre' },
]

export default function FormulaireUnite() {
  const navigate = useNavigate()
  const [loading, setLoading]     = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [errors, setErrors]       = useState<string[]>([])
  const [showGuide, setShowGuide] = useState(false)

  const [form, setForm] = useState({
    telephone_proprietaire: '',
    longitude:              '',
    latitude:               '',
    nni_passeport:          '',
    secteur:                '',
    autre_secteur:          '',
    sous_secteur:           '',
    activite_principale:    '',
    filieres:               '',
    adresse:                '',
    wilaya:                 '',})

  const [files, setFiles] = useState<Record<string, File | null>>({
    // Dossier juridique
    statut_juridique_file:    null,
    registre_commerce_file:   null,
    nif_file:                 null,
    cnss_file:                null,
    // Documents spécifiques usine
    etude_faisabilite_file:   null,
    tdr_impact_file:          null,
    gps_file:                 null,
    fiches_techniques_file:   null,
    demande_ministere_file:   null,
    titre_foncier_file:       null,
    cahier_charges_file:      null,
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
    if (!form.telephone_proprietaire) errs.push('Téléphone obligatoire')
    if (!form.longitude)              errs.push('Longitude GPS obligatoire')
    if (!form.latitude)               errs.push('Latitude GPS obligatoire')
    if (!form.nni_passeport)          errs.push('NNI ou Passeport obligatoire')
    if (!form.secteur)                errs.push('Secteur d\'activité obligatoire')
    if (!form.activite_principale)    errs.push('Activité principale obligatoire')
    const obligatoires = [
      'statut_juridique_file','registre_commerce_file','nif_file','cnss_file',
      'etude_faisabilite_file','tdr_impact_file','gps_file','fiches_techniques_file',
      'demande_ministere_file','titre_foncier_file','cahier_charges_file',
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
        type_demande_code: 'UNITE',
        activite:          form.activite_principale,
        adresse: form.adresse || '', wilaya: form.wilaya || '',
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
      toast.success(`✅ Demande Unité industrielle ${res.numero_ref} soumise !`)
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

      <h2 className="text-xl font-bold text-gray-800 mb-1">🏭 Demande d'Autorisation — Unité Industrielle</h2>
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

        {/* Dossier juridique */}
        <Section title="📋 Dossier juridique de la société">
          <FF label="Statut juridique *" k="statut_juridique_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
          <FF label="Registre de commerce *" k="registre_commerce_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
          <FF label="NIF (Numéro d'Identification Fiscale) *" k="nif_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
          <FF label="Certificat d'enregistrement CNSS *" k="cnss_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
        </Section>

        {/* Documents spécifiques usine */}
        <Section title="🏭 Documents spécifiques à l'unité industrielle">
          <FF label="Une demande adressée au Ministre chargé de l'industrie *"
              k="demande_ministere_file" accept=".pdf" pdfOnly files={files} upFile={upFile} />
          <FF label="Étude de faisabilité *"
              k="etude_faisabilite_file" accept=".pdf" pdfOnly files={files} upFile={upFile} />
          <FF label="TDR — Termes de référence pour l'étude d'impact environnemental *"
              k="tdr_impact_file" accept=".pdf" pdfOnly files={files} upFile={upFile} />
          <FF label="Coordonnées GPS de l'établissement (document / capture) *"
              k="gps_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
          <FF label="Fiches techniques des équipements *"
              k="fiches_techniques_file" accept=".pdf" pdfOnly files={files} upFile={upFile} />
          <FF label="Titre foncier ou contrat de bail *"
              k="titre_foncier_file" accept=".pdf,.jpg,.png" files={files} upFile={upFile} />
          <FF label="Cahier des charges signé *"
              k="cahier_charges_file" accept=".pdf" pdfOnly files={files} upFile={upFile} />
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
              <ol className="space-y-1 list-decimal ml-4">
                <li>Ouvrez Google Maps sur votre téléphone</li>
                <li>Appuyez longtemps sur votre emplacement</li>
                <li>Les coordonnées apparaissent en bas de l'écran</li>
                <li>Copiez la Latitude puis la Longitude</li>
              </ol>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="form-label text-xs">Longitude *</label>
              <input type="text" className="form-input" placeholder="Ex: -15.9582"
                     value={form.longitude} onChange={e => upForm('longitude', e.target.value)} required />
              <p className="text-xs text-gray-400 mt-1">Format: nombre décimal (ex: -15.9582)</p>
            </div>
            <div>
              <label className="form-label text-xs">Latitude *</label>
              <input type="text" className="form-input" placeholder="Ex: 18.0735"
                     value={form.latitude} onChange={e => upForm('latitude', e.target.value)} required />
              <p className="text-xs text-gray-400 mt-1">Format: nombre décimal (ex: 18.0735)</p>
            </div>
          </div>
          <button type="button" onClick={localiserGPS} disabled={gpsLoading}
                  className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
            {gpsLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MapPin size={15} />}
            {form.latitude ? '✅ Position capturée — Relocaliser' : 'Capturer automatiquement ma position GPS'}
          </button>
        </Section>

        {/* Informations supplémentaires */}
        <Section title="📋 Informations supplémentaires">
          <div>
            <label className="form-label text-xs">Téléphone du propriétaire *</label>
            <input type="text" className="form-input" placeholder="Ex: +222 45454545"
                   value={form.telephone_proprietaire}
                   onChange={e => upForm('telephone_proprietaire', e.target.value)} required />
          </div>
          <div>
            <label className="form-label text-xs">NNI ou Passeport *</label>
            <input type="text" className="form-input" placeholder="Ex: 1234567890123 ou P1234567"
                   value={form.nni_passeport}
                   onChange={e => upForm('nni_passeport', e.target.value)} required />
            <p className="text-xs text-gray-400 mt-1">Numéro national d'identité ou numéro de passeport</p>
          </div>
          <div>
            <label className="form-label text-xs">Secteur d'activité *</label>
            <select className="form-input" value={form.secteur}
                    onChange={e => upForm('secteur', e.target.value)} required>
              <option value="">Sélectionner un secteur</option>
              {SECTEURS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {form.secteur === 'autre' && (
            <div>
              <label className="form-label text-xs">Précisez le secteur</label>
              <input type="text" className="form-input" placeholder="Ex: Secteur personnalisé"
                     value={form.autre_secteur}
                     onChange={e => upForm('autre_secteur', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Saisissez votre secteur si non listé</p>
            </div>
          )}
          <div>
            <label className="form-label text-xs">Sous-secteur</label>
            <input type="text" className="form-input" placeholder="Ex: Transformation de produits laitiers"
                   value={form.sous_secteur}
                   onChange={e => upForm('sous_secteur', e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Précisez le sous-secteur d'activité</p>
          </div>
          <div>
            <label className="form-label text-xs">Activité principale *</label>
            <input type="text" className="form-input" placeholder="Ex: Production de yaourt et fromage"
                   value={form.activite_principale}
                   onChange={e => upForm('activite_principale', e.target.value)} required />
            <p className="text-xs text-gray-400 mt-1">Décrivez l'activité principale de l'usine</p>
          </div>
          <div>
            <label className="form-label text-xs">Filières</label>
            <input type="text" className="form-input" placeholder="Ex: Filière lait, Filière céréales"
                   value={form.filieres}
                   onChange={e => upForm('filieres', e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Listez les filières concernées par votre activité</p>
          </div>
        </Section>

        <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1B6B30, #2E8B45)' }}>
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🏭 Envoyer la demande'}
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

function FF({ label, k, accept, pdfOnly = false, files, upFile }: {
  label: string; k: string; accept: string; pdfOnly?: boolean
  files: Record<string, File | null>; upFile: (k: string, f: File) => void
}) {
  const file = files[k]
  return (
    <div>
      <label className="form-label text-xs">{label}</label>
      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all
        ${file ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-200 hover:border-mmi-green'}`}>
        <input type="file" className="hidden" accept={accept}
               onChange={e => e.target.files?.[0] && upFile(k, e.target.files[0])} />
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${file ? 'bg-mmi-green' : 'bg-gray-100'}`}>
          {file ? <CheckCircle size={14} className="text-white" /> : <span className="text-gray-400 text-xs">📎</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${file ? 'text-mmi-green' : 'text-gray-600'}`}>{file ? file.name : 'Cliquer pour choisir'}</p>
          <p className="text-xs text-gray-400">{pdfOnly ? 'Format accepté: PDF uniquement' : 'Format accepté: PDF, JPG, PNG'}</p>
        </div>
      </label>
    </div>
  )
}