import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Upload, CheckCircle, ChevronRight, ChevronLeft, X, FileText } from 'lucide-react'
import { typeDemandesAPI, demandesAPI } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface TypeDemande { id: number; code: string; libelle: string; pieces_requises: PieceRequise[] }
interface PieceRequise { id: number; nom: string; obligatoire: boolean; ordre: number }

export default function NouvelleDemandeWizard() {
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const [step, setStep]               = useState(1)
  const [types, setTypes]             = useState<TypeDemande[]>([])
  const [typeChoisi, setTypeChoisi]   = useState<TypeDemande | null>(null)
  const [gpsLoading, setGpsLoading]   = useState(false)
  const [gpsPrecision, setGpsPrecision] = useState<number | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [files, setFiles]             = useState<Record<number, File>>({})

  const [form, setForm] = useState({
    raison_sociale: user?.nom_entreprise || '',
    activite: '',
    adresse: '',
    wilaya: '',
    latitude: '',
    longitude: '',
  })

  const [typesLoading, setTypesLoading] = useState(true)
  const [typesError, setTypesError]     = useState(false)

  useEffect(() => {
    setTypesLoading(true)
    setTypesError(false)
    typeDemandesAPI.list()
      .then(r => {
        const data = r.data.results || r.data
        setTypes(data)
        setTypesLoading(false)
      })
      .catch(() => {
        setTypesError(true)
        setTypesLoading(false)
      })
  }, [])

  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const localiserGPS = () => {
    if (!navigator.geolocation) { toast.error('Géolocalisation non supportée'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        up('latitude', pos.coords.latitude.toFixed(6))
        up('longitude', pos.coords.longitude.toFixed(6))
        setGpsPrecision(Math.round(pos.coords.accuracy))
        setGpsLoading(false)
        toast.success('Position capturée !')
      },
      () => { toast.error('Impossible d\'obtenir la position'); setGpsLoading(false) },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const precisionColor = !gpsPrecision ? '' :
    gpsPrecision < 50 ? 'bg-green-500' :
    gpsPrecision < 150 ? 'bg-orange-400' : 'bg-red-500'

  const handleFile = (pieceId: number, file: File) => {
    setFiles(p => ({ ...p, [pieceId]: file }))
  }

  const handleSubmit = async () => {
    if (!typeChoisi) return
    setSubmitting(true)
    try {
      const { data } = await demandesAPI.create({
        type_demande_id: typeChoisi.id,
        raison_sociale: form.raison_sociale,
        activite: form.activite,
        adresse: form.adresse,
        wilaya: form.wilaya,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
      })
      // Upload des pièces
      for (const [pieceId, file] of Object.entries(files)) {
        const fd = new FormData()
        fd.append('fichier', file)
        fd.append('piece_requise_id', pieceId)
        await demandesAPI.uploadPiece(data.id, fd)
      }
      toast.success(`Demande ${data.numero_ref} soumise avec succès !`)
      navigate('/demandeur/demandes')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  const WILAYAS = [
    'Hodh Ech Chargui','Hodh El Gharbi','Assaba','Gorgol','Brakna','Trarza',
    'Adrar','Dakhlet Nouadhibou','Tagant','Guidimaka','Tiris Zemmour',
    'Inchiri','Nouakchott Nord','Nouakchott Ouest','Nouakchott Sud',
  ]

  const TYPES_LABELS: Record<string, { color: string; desc: string }> = {
    BP:             { color: '#f97316', desc: 'Boulangerie, pâtisserie, confiserie' },
    USINE_EAU:      { color: '#0ea5e9', desc: 'Production d\'eau minérale embouteillée' },
    UNITE:          { color: '#1B6B30', desc: 'Usine, manufacture, unité de production' },
    RENOUVELLEMENT: { color: '#7c3aed', desc: 'Renouvellement d\'enregistrement industriel' },
    EXTENSION:      { color: '#c2410c', desc: 'Agrandissement d\'une unité existante' },
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-xl font-bold text-gray-800">Nouvelle demande</h1>
      </div>

      {/* Étapes */}
      <div className="flex items-center gap-2 mb-8">
        {['Type', 'Informations', 'Localisation', 'Pièces', 'Confirmation'].map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${step > i+1 ? 'bg-mmi-green text-white' : step === i+1 ? 'bg-mmi-green text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > i+1 ? <CheckCircle size={14} /> : i+1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i+1 ? 'font-semibold text-mmi-green' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < 4 && <div className={`flex-1 h-0.5 ${step > i+1 ? 'bg-mmi-green' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6">

        {/* ── Étape 1 : Type ── */}
        {step === 1 && (
          <div className="animate-fadeInUp">
            <h2 className="font-semibold text-gray-700 mb-5">Choisissez le type de demande</h2>

            {/* Chargement */}
            {typesLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {/* Erreur de connexion backend */}
            {typesError && (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="font-semibold text-gray-700 mb-1">Impossible de charger les types de demande</p>
                <p className="text-sm text-gray-500 mb-4">
                  Le serveur backend n'est pas accessible.<br />
                  Assurez-vous que Django tourne sur <code className="bg-gray-100 px-1 rounded">http://localhost:8000</code>
                </p>
                <button
                  onClick={() => {
                    setTypesError(false)
                    setTypesLoading(true)
                    typeDemandesAPI.list()
                      .then(r => { setTypes(r.data.results || r.data); setTypesLoading(false) })
                      .catch(() => { setTypesError(true); setTypesLoading(false) })
                  }}
                  className="btn-primary text-sm"
                >
                  🔄 Réessayer
                </button>
              </div>
            )}

            {/* Types chargés depuis la BD */}
            {!typesLoading && !typesError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.map(t => {
                const info = TYPES_LABELS[t.code] || { color: '#888', desc: '', emoji: '📋' }
                const isSelected = typeChoisi?.id === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTypeChoisi(t)}
                    className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-md group
                      ${isSelected
                        ? 'border-2 bg-white shadow-md scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    style={{ borderColor: isSelected ? info.color : undefined }}
                  >
                    {/* Icône */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 transition-all"
                         style={{ background: isSelected ? info.color + '20' : '#f3f4f6' }}>
                      {info.emoji}
                    </div>
                    {/* Titre */}
                    <p className="font-bold text-sm text-gray-800 mb-1 leading-snug">{t.libelle}</p>
                    {/* Description */}
                    <p className="text-xs text-gray-500 leading-relaxed">{info.desc}</p>
                    {/* Badge sélectionné */}
                    {isSelected && (
                      <div className="flex items-center gap-1 mt-3 text-xs font-semibold"
                           style={{ color: info.color }}>
                        <CheckCircle size={13} />
                        Sélectionné
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
              
            )}

          <div className="mt-6 flex justify-end">
              {typeChoisi?.code === 'BP' ? (
                <button onClick={() => navigate('/demandeur/formulaire-bp')}
                        className="btn-primary flex items-center gap-2"
                        style={{ background: '#f97316' }}>
                  Remplir le formulaire BP <ChevronRight size={16} />
                </button>
              ) : typeChoisi?.code === 'USINE_EAU' ? (
                <button onClick={() => navigate('/demandeur/formulaire-usine-eau')}
                        className="btn-primary flex items-center gap-2"
                        style={{ background: '#3b82f6' }}>
                  Remplir le formulaire Usine EAU <ChevronRight size={16} />
                </button>
              ) : typeChoisi?.code === 'UNITE' ? (
                <button onClick={() => navigate('/demandeur/formulaire-unite')}
                        className="btn-primary flex items-center gap-2">
                  Remplir le formulaire Unité <ChevronRight size={16} />
                </button>
              ) : typeChoisi?.code === 'RENOUVELLEMENT' ? (
                <button onClick={() => navigate('/demandeur/renouvellement')}
                        className="btn-primary flex items-center gap-2"
                        style={{ background: '#7c3aed' }}>
                  Remplir le formulaire Renouvellement <ChevronRight size={16} />
                </button>
              ) : typeChoisi?.code === 'EXTENSION' ? (
                <button onClick={() => navigate('/demandeur/extension')}
                        className="btn-primary flex items-center gap-2"
                        style={{ background: '#c2410c' }}>
                  Remplir le formulaire Extension <ChevronRight size={16} />
                </button>
              ) : (
                <button disabled={!typeChoisi} onClick={() => setStep(2)}
                        className="btn-primary flex items-center gap-2 disabled:opacity-40">
                  Suivant <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Étape 2 : Informations ── */}
        {step === 2 && (
          <div className="animate-fadeInUp space-y-4">
            <h2 className="font-semibold text-gray-700 mb-2">Informations de l'établissement</h2>
            <div>
              <label className="form-label">Raison sociale *</label>
              <input className="form-input" value={form.raison_sociale}
                     onChange={e => up('raison_sociale', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Activité principale *</label>
              <input className="form-input" placeholder="Ex: Boulangerie industrielle"
                     value={form.activite} onChange={e => up('activite', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Adresse complète *</label>
              <textarea className="form-input resize-none" rows={2}
                        value={form.adresse} onChange={e => up('adresse', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Wilaya *</label>
              <select className="form-input" value={form.wilaya}
                      onChange={e => up('wilaya', e.target.value)} required>
                <option value="">-- Sélectionner --</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-1">
                <ChevronLeft size={16} /> Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.raison_sociale || !form.activite || !form.adresse || !form.wilaya}
                className="btn-primary flex items-center gap-2 disabled:opacity-40"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 3 : GPS ── */}
        {step === 3 && (
          <div className="animate-fadeInUp">
            <h2 className="font-semibold text-gray-700 mb-5">Localisation GPS</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 mb-5">
              Cliquez sur le bouton ci-dessous pour capturer automatiquement votre position.
              Assurez-vous d'être sur le site de l'établissement.
            </div>

            <div className="flex flex-col items-center gap-4 py-6">
              <button
                onClick={localiserGPS}
                disabled={gpsLoading}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white transition-all
                  ${form.latitude ? 'bg-mmi-green' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {gpsLoading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <MapPin size={20} />
                }
                {form.latitude ? 'Relocaliser' : 'Localiser ma position'}
              </button>

              {form.latitude && (
                <div className="text-center space-y-2">
                  <div className="flex gap-4 text-sm font-mono bg-gray-50 rounded-lg px-4 py-2">
                    <span className="text-gray-500">Lat:</span>
                    <span className="font-bold">{form.latitude}</span>
                    <span className="text-gray-500 ml-4">Lon:</span>
                    <span className="font-bold">{form.longitude}</span>
                  </div>
                  {gpsPrecision && (
                    <div className="flex items-center gap-2 text-xs justify-center">
                      <span className="text-gray-500">Précision :</span>
                      <div className={`w-20 h-2 rounded-full ${precisionColor}`} />
                      <span className="font-medium">{gpsPrecision}m</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-1">
                <ChevronLeft size={16} /> Retour
              </button>
              <button onClick={() => setStep(4)} className="btn-primary flex items-center gap-2">
                {form.latitude ? 'Suivant' : 'Passer (facultatif)'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 4 : Pièces jointes ── */}
        {step === 4 && typeChoisi && (
          <div className="animate-fadeInUp">
            <h2 className="font-semibold text-gray-700 mb-5">
              Pièces justificatives
              <span className="text-xs text-gray-400 font-normal ml-2">
                ({typeChoisi.pieces_requises?.filter(p => p.obligatoire).length || 0} obligatoires)
              </span>
            </h2>

            <div className="space-y-3">
              {typeChoisi.pieces_requises?.map(piece => (
                <div key={piece.id} className={`rounded-xl border p-4 transition-all
                  ${files[piece.id] ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <FileText size={16} className={files[piece.id] ? 'text-mmi-green' : 'text-gray-400'} />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {piece.nom}
                          {piece.obligatoire && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        {files[piece.id] && (
                          <p className="text-xs text-mmi-green mt-0.5">{files[piece.id].name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {files[piece.id] && (
                        <button onClick={() => setFiles(p => { const n={...p}; delete n[piece.id]; return n })}
                                className="text-red-400 hover:text-red-600">
                          <X size={14} />
                        </button>
                      )}
                      <label className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors
                        ${files[piece.id] ? 'bg-white text-mmi-green border border-mmi-green' : 'bg-mmi-green text-white hover:bg-mmi-green-mid'}`}>
                        <Upload size={12} />
                        {files[piece.id] ? 'Modifier' : 'Choisir'}
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                               onChange={e => e.target.files?.[0] && handleFile(piece.id, e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(3)} className="btn-secondary flex items-center gap-1">
                <ChevronLeft size={16} /> Retour
              </button>
              <button onClick={() => setStep(5)} className="btn-primary flex items-center gap-2">
                Vérifier <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 5 : Confirmation ── */}
        {step === 5 && typeChoisi && (
          <div className="animate-fadeInUp">
            <h2 className="font-semibold text-gray-700 mb-5">Récapitulatif de la demande</h2>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Type', value: typeChoisi.libelle },
                { label: 'Établissement', value: form.raison_sociale },
                { label: 'Activité', value: form.activite },
                { label: 'Adresse', value: form.adresse },
                { label: 'Wilaya', value: form.wilaya },
                { label: 'GPS', value: form.latitude ? `${form.latitude}, ${form.longitude}` : 'Non renseigné' },
                { label: 'Pièces jointes', value: `${Object.keys(files).length} fichier(s)` },
              ].map(row => (
                <div key={row.label} className="flex gap-4 text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-500 w-32 flex-shrink-0">{row.label}</span>
                  <span className="font-medium text-gray-800">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 mb-6">
              En soumettant cette demande, vous confirmez que toutes les informations sont exactes et que les pièces jointes sont conformes.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="btn-secondary flex items-center gap-1">
                <ChevronLeft size={16} /> Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex items-center gap-2 flex-1 justify-center"
              >
                {submitting
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><CheckCircle size={16} /> Soumettre la demande</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}