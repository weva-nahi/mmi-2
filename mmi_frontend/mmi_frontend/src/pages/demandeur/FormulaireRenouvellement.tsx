import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, AlertTriangle, MapPin, Save, Search, Link } from 'lucide-react'
import { demandesAPI, autorisationsAPI } from '@/utils/api'
import toast from 'react-hot-toast'

const SECTIONS = [
  { id:0, label:'Autorisation à renouveler' },
  { id:1, label:'Identification' },
  { id:2, label:'Adresse & Contact' },
  { id:3, label:'Gestionnaire' },
  { id:4, label:'Environnement juridique' },
  { id:5, label:'Environnement administratif' },
  { id:6, label:'Environnement économique' },
  { id:7, label:'Défis & Confirmation' },
]

export default function FormulaireRenouvellement() {
  const navigate = useNavigate()

  const searchAutorisation = async () => {
    if (!autoNumero.trim()) return
    setAutoSearching(true)
    setAutoError('')
    setAutoFound(null)
    try {
      const res = await autorisationsAPI.byNumeroPour(autoNumero.trim(), 'renouvellement')
      setAutoFound(res.data)
    } catch (err: any) {
      setAutoError(err.response?.data?.detail || 'Autorisation introuvable')
    } finally {
      setAutoSearching(false)
    }
  }

  const lierAutorisation = async () => {
    if (!autoFound || !demandeId) return
    try {
      await demandesAPI.lierAutorisation(demandeId, autoFound.numero_auto)
      setAutoLiee(true)
      toast.success('Autorisation liée avec succès')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors du lien')
    }
  }
  const [step, setStep]       = useState(0)
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState<string[]>([])
  const [gpsLoading, setGpsLoading]       = useState(false)
  const [autoNumero, setAutoNumero]       = useState('')
  const [autoFound, setAutoFound]         = useState<any>(null)
  const [autoSearching, setAutoSearching] = useState(false)
  const [autoError, setAutoError]         = useState('')
  const [autoLiee, setAutoLiee]           = useState(false)
  const [demandeId, setDemandeId]         = useState<number | null>(null)

  const [form, setForm] = useState({
    // I. Identification
    abreviation:            '',
    denomination_complete:  '',
    activite_principale:    '',
    nationalite_entreprise: '',
    // II. Adresse & Contact
    localisation_siege:     '',
    coordonnees_gps:        '',
    latitude:               '',
    longitude:              '',
    bp:                     '',
    telephone:              '',
    email:                  '',
    site_web:               '',
    moyen_contact:          '', // poste / telephone / email
    // III. Gestionnaire
    nom_premier_responsable: '',
    nni_passeport:           '',
    nationalite_responsable: '',
    telephone_responsable:   '',
    // IV. Environnement juridique
    forme_juridique:         '', // Etablissement / SA / SARL / Autre
    forme_juridique_autre:   '',
    statut_numero:           '',
    statut_date:             '',
    registre_commerce_num:   '',
    registre_commerce_date:  '',
    nif_numero:              '',
    nif_date:                '',
    cnss_numero:             '',
    // V. Environnement administratif
    numero_enregistrement:   '',
    date_enregistrement:     '',
    date_creation:           '',
    date_debut_production:   '',
    date_demarrage_unite:    '',
    nombre_arrets:           '',
    nombre_emplois_crees:    '',
    nationalites_employes:   '',
    nb_employes_admin:       '',
    nb_techniciens:          '',
    nb_ouvriers:             '',
    // VI. Environnement économique
    description_unite:       '',
    capital_social:          '',
    financement_fonds_propres:'',
    financement_emprunt:     '',
    origine_investissement:  '', // National / International / Les deux
    nature_investissement:   '', // Nouvelle création / Extension / Modernisation
    donnees_financieres_2023:'',
    donnees_financieres_2024:'',
    matieres_premieres:      '',
    capacite_production_jour:'',
    capacite_production_mois:'',
    capacite_production_an:  '',
    production_effective_jour:'',
    stock:                   '',
    varietes_production:     '',
    capacite_estimee:        '',
    capacite_augmentation:   '',
    // VII. Défis
    principales_difficultes: '',
  })

  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const localiserGPS = () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(6)
        const lon = pos.coords.longitude.toFixed(6)
        up('latitude',  lat)
        up('longitude', lon)
        up('coordonnees_gps', `${lat}, ${lon}`)
        setGpsLoading(false)
        toast.success('Position GPS capturée !')
      },
      () => { toast.error('Impossible d\'obtenir la position'); setGpsLoading(false) },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const validate = (): string[] => {
    const errs: string[] = []
    if (!form.denomination_complete)   errs.push('Dénomination complète obligatoire')
    if (!form.activite_principale)     errs.push('Activité principale obligatoire')
    if (!form.localisation_siege)      errs.push('Localisation du siège obligatoire')
    if (!form.telephone)               errs.push('Téléphone obligatoire')
    if (!form.nom_premier_responsable) errs.push('Nom du premier responsable obligatoire')
    if (!form.nni_passeport)           errs.push('NNI et N° Passeport obligatoires')
    if (!form.forme_juridique)         errs.push('Forme juridique obligatoire')
    if (!form.numero_enregistrement)   errs.push('Numéro d\'enregistrement obligatoire')
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); setStep(1); return }
    setErrors([])
    setSaving(true)
    try {
      const { data: res } = await demandesAPI.create({
        type_demande_code: 'RENOUVELLEMENT',
        raison_sociale:    form.denomination_complete,
        activite:          form.activite_principale,
        adresse:           form.localisation_siege,
        wilaya:            '',
        latitude:          form.latitude  || null,
        longitude:         form.longitude || null,
        formulaire_specifique: form,
      })
      // Lier l'autorisation si trouvée
      if (autoFound && res.id) {
        try {
          await demandesAPI.lierAutorisation(res.id, autoFound.numero_auto)
        } catch { /* non bloquant */ }
      }
      toast.success(`✅ Demande de renouvellement ${res.numero_ref} soumise !`)
      navigate('/demandeur/demandes')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la soumission')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* En-tête officiel */}
      <div className="bg-mmi-green-lt border border-green-200 rounded-xl p-4 mb-6 text-center">
        <p className="text-xs text-gray-500">République Islamique de Mauritanie — Honneur, Fraternité, Justice</p>
        <p className="text-xs font-semibold text-mmi-green">MINISTÈRE DES MINES ET DE L'INDUSTRIE</p>
        <p className="text-xs text-gray-600">Direction Générale de l'Industrie / DDPI</p>
        <h2 className="font-bold text-gray-800 mt-2 text-sm">
          FORMULAIRE DE RENOUVELLEMENT D'ENREGISTREMENT D'ENTREPRISE INDUSTRIELLE / 2025
        </h2>
      </div>

      <button onClick={() => navigate('/demandeur/nouvelle')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-mmi-green mb-6">
        <ChevronLeft size={16} /> Retour
      </button>

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

      {/* Barre de progression */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {SECTIONS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <button onClick={() => step > s.id && setStep(s.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${step > s.id  ? 'bg-mmi-green text-white cursor-pointer' :
                          step === s.id ? 'bg-mmi-green text-white ring-4 ring-mmi-green/20' :
                          'bg-gray-100 text-gray-400'}`}>
                {step > s.id ? <CheckCircle size={12} /> : s.id}
              </button>
              <span className={`text-xs whitespace-nowrap hidden md:block
                ${step === s.id ? 'text-mmi-green font-medium' : 'text-gray-400'}`}>{s.label}</span>
            </div>
            {i < SECTIONS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${step > s.id ? 'bg-mmi-green' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6">

        {/* ══ STEP 0 — Autorisation à renouveler ══ */}
        {step === 0 && (
          <div className="space-y-5 animate-fadeInUp">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-blue-800 text-sm mb-1 flex items-center gap-2">
                <Link size={15} /> Autorisation à renouveler
              </h3>
              <p className="text-xs text-blue-600">
                Saisissez le numéro de votre autorisation expirée ou proche de l'expiration.
                Ce numéro figure sur votre document officiel (format : AUTO-XXXX-...).
              </p>
            </div>

            <div>
              <label className="form-label">Numéro d'autorisation *</label>
              <div className="flex gap-2">
                <input className="form-input flex-1"
                       placeholder="Ex: AUTO-2024-BP-12345"
                       value={autoNumero}
                       onChange={e => { setAutoNumero(e.target.value); setAutoFound(null); setAutoError('') }}
                       onKeyDown={e => e.key === 'Enter' && searchAutorisation()} />
                <button type="button" onClick={searchAutorisation}
                        disabled={autoSearching || !autoNumero.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm
                                   hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                  {autoSearching
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Search size={15} />}
                  Vérifier
                </button>
              </div>
              {autoError && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {autoError}
                </p>
              )}
            </div>

            {/* Résultat */}
            {autoFound && (
              <div className={`rounded-xl p-4 border ${
                autoLiee          ? 'bg-green-50 border-green-300'
                : (autoFound.est_expiree || (autoFound.jours_restants <= 90 && autoFound.jours_restants >= 0))
                                  ? 'bg-amber-50 border-amber-300'
                                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-1">
                      {autoLiee && <CheckCircle size={14} className="text-green-600" />}
                      {autoFound.numero_auto}
                      {autoFound.est_expiree && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Expirée</span>
                      )}
                    </p>
                    <p className={`text-xs mb-2 font-medium ${
                      autoFound.peut_renouveler ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {autoFound.message}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div><span className="text-gray-400">Type : </span>{autoFound.type}</div>
                      <div><span className="text-gray-400">Wilaya : </span>{autoFound.wilaya || '—'}</div>
                      <div><span className="text-gray-400">Délivrance : </span>{autoFound.date_delivrance}</div>
                      <div><span className="text-gray-400">Expiration : </span>{autoFound.date_expiration}</div>
                    </div>
                  </div>
                  {autoLiee && <span className="text-green-600 text-xs font-bold">Liée ✓</span>}
                  {!autoFound.peut_renouveler && !autoLiee && (
                    <span className="text-red-500 text-xs font-bold">Non éligible</span>
                  )}
                </div>
              </div>
            )}

            {/* Note */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-xs text-gray-600">
                <strong>Je n'ai pas mon numéro ?</strong> Vous pouvez continuer sans.
                Un agent MMI fera le rapprochement lors du traitement.
              </p>
            </div>
          </div>
        )}

        {/* ── I. Identification ── */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeInUp">
            <SH num="I" title="Identification de l'entreprise" />
            <Row label="Abréviation">
              <input className="form-input" value={form.abreviation}
                     onChange={e => up('abreviation', e.target.value)}
                     placeholder="Ex: SMCI" />
            </Row>
            <Row label="Dénomination complète *">
              <input className="form-input" value={form.denomination_complete}
                     onChange={e => up('denomination_complete', e.target.value)} required />
            </Row>
            <Row label="Activité principale *">
              <input className="form-input" value={form.activite_principale}
                     onChange={e => up('activite_principale', e.target.value)} required />
            </Row>
            <Row label="Nationalité de l'entreprise">
              <input className="form-input" value={form.nationalite_entreprise}
                     onChange={e => up('nationalite_entreprise', e.target.value)}
                     placeholder="Ex: Mauritanienne" />
            </Row>
          </div>
        )}

        {/* ── II. Adresse & Contact ── */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeInUp">
            <SH num="II" title="Adresse et contact de l'entreprise" />
            <Row label="Localisation du siège *">
              <textarea className="form-input resize-none" rows={2} value={form.localisation_siege}
                        onChange={e => up('localisation_siege', e.target.value)} required />
            </Row>

            {/* GPS */}
            <div>
              <label className="form-label">Coordonnées GPS</label>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <input className="form-input" placeholder="Latitude (ex: 18.0735)"
                         value={form.latitude}
                         onChange={e => { up('latitude', e.target.value); up('coordonnees_gps', `${e.target.value}, ${form.longitude}`) }} />
                </div>
                <div>
                  <input className="form-input" placeholder="Longitude (ex: -15.9582)"
                         value={form.longitude}
                         onChange={e => { up('longitude', e.target.value); up('coordonnees_gps', `${form.latitude}, ${e.target.value}`) }} />
                </div>
              </div>
              <button type="button" onClick={localiserGPS} disabled={gpsLoading}
                      className="flex items-center gap-2 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700">
                {gpsLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MapPin size={12} />}
                {form.latitude ? '✅ Capturé — Relocaliser' : 'Capturer GPS automatiquement'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Row label="B.P.">
                <input className="form-input" placeholder="Ex: BP 1234"
                       value={form.bp} onChange={e => up('bp', e.target.value)} />
              </Row>
              <Row label="Téléphone *">
                <input className="form-input" type="tel" placeholder="+222 XX XX XX XX"
                       value={form.telephone} onChange={e => up('telephone', e.target.value)} required />
              </Row>
              <Row label="E-mail">
                <input className="form-input" type="email"
                       value={form.email} onChange={e => up('email', e.target.value)} />
              </Row>
              <Row label="Site web">
                <input className="form-input" placeholder="www.entreprise.mr"
                       value={form.site_web} onChange={e => up('site_web', e.target.value)} />
              </Row>
            </div>
            <div>
              <label className="form-label">Moyen de contact favorisé</label>
              <div className="flex gap-4 mt-1">
                {['Poste', 'Téléphone', 'E-mail'].map(m => (
                  <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="moyen_contact" value={m}
                           checked={form.moyen_contact === m}
                           onChange={e => up('moyen_contact', e.target.value)} />
                    {m}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── III. Gestionnaire ── */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeInUp">
            <SH num="III" title="Information du Gestionnaire de l'entreprise" />
            <Row label="Nom du premier responsable *">
              <input className="form-input" value={form.nom_premier_responsable}
                     onChange={e => up('nom_premier_responsable', e.target.value)} required />
            </Row>
            <Row label="N.N.I et N° Passeport *">
              <input className="form-input" placeholder="Ex: 1234567890123 / P1234567"
                     value={form.nni_passeport}
                     onChange={e => up('nni_passeport', e.target.value)} required />
            </Row>
            <Row label="Nationalité">
              <input className="form-input" placeholder="Ex: Mauritanienne"
                     value={form.nationalite_responsable}
                     onChange={e => up('nationalite_responsable', e.target.value)} />
            </Row>
            <Row label="Téléphone">
              <input className="form-input" type="tel"
                     value={form.telephone_responsable}
                     onChange={e => up('telephone_responsable', e.target.value)} />
            </Row>
          </div>
        )}

        {/* ── IV. Environnement juridique ── */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeInUp">
            <SH num="IV" title="Environnement juridique de l'entreprise" />
            <div>
              <label className="form-label">Forme juridique *</label>
              <div className="flex flex-wrap gap-3 mt-1">
                {['Etablissement', 'SA', 'SARL', 'Autre'].map(f => (
                  <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="forme_juridique" value={f}
                           checked={form.forme_juridique === f}
                           onChange={e => up('forme_juridique', e.target.value)} />
                    {f}
                  </label>
                ))}
              </div>
              {form.forme_juridique === 'Autre' && (
                <input className="form-input mt-2" placeholder="Précisez la forme juridique"
                       value={form.forme_juridique_autre}
                       onChange={e => up('forme_juridique_autre', e.target.value)} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Status — N°">
                <input className="form-input" placeholder="Numéro"
                       value={form.statut_numero} onChange={e => up('statut_numero', e.target.value)} />
              </Row>
              <Row label="Status — Date">
                <input className="form-input" type="date"
                       value={form.statut_date} onChange={e => up('statut_date', e.target.value)} />
              </Row>
              <Row label="Registre du Commerce — N°">
                <input className="form-input" placeholder="Numéro RC"
                       value={form.registre_commerce_num} onChange={e => up('registre_commerce_num', e.target.value)} />
              </Row>
              <Row label="Registre du Commerce — Date">
                <input className="form-input" type="date"
                       value={form.registre_commerce_date} onChange={e => up('registre_commerce_date', e.target.value)} />
              </Row>
              <Row label="N.I.F — N°">
                <input className="form-input" placeholder="Numéro NIF"
                       value={form.nif_numero} onChange={e => up('nif_numero', e.target.value)} />
              </Row>
              <Row label="N.I.F — Date">
                <input className="form-input" type="date"
                       value={form.nif_date} onChange={e => up('nif_date', e.target.value)} />
              </Row>
              <Row label="CNSS — N°">
                <input className="form-input" placeholder="Numéro CNSS"
                       value={form.cnss_numero} onChange={e => up('cnss_numero', e.target.value)} />
              </Row>
            </div>
          </div>
        )}

        {/* ── V. Environnement administratif ── */}
        {step === 5 && (
          <div className="space-y-4 animate-fadeInUp">
            <SH num="V" title="Environnement Administratif de l'entreprise" />
            <div className="grid grid-cols-2 gap-4">
              <Row label="Numéro d'enregistrement de l'usine *">
                <input className="form-input" placeholder="N°..."
                       value={form.numero_enregistrement}
                       onChange={e => up('numero_enregistrement', e.target.value)} required />
              </Row>
              <Row label="Date d'enregistrement">
                <input className="form-input" type="date"
                       value={form.date_enregistrement}
                       onChange={e => up('date_enregistrement', e.target.value)} />
              </Row>
              <Row label="Date de la création">
                <input className="form-input" type="date"
                       value={form.date_creation}
                       onChange={e => up('date_creation', e.target.value)} />
              </Row>
              <Row label="Date de début de la production">
                <input className="form-input" type="date"
                       value={form.date_debut_production}
                       onChange={e => up('date_debut_production', e.target.value)} />
              </Row>
              <Row label="Date de démarrage de l'Unité">
                <input className="form-input" type="date"
                       value={form.date_demarrage_unite}
                       onChange={e => up('date_demarrage_unite', e.target.value)} />
              </Row>
              <Row label="Nombre d'arrêts">
                <input className="form-input" type="number"
                       value={form.nombre_arrets}
                       onChange={e => up('nombre_arrets', e.target.value)} />
              </Row>
              <Row label="Nombre d'emplois créés">
                <input className="form-input" type="number"
                       value={form.nombre_emplois_crees}
                       onChange={e => up('nombre_emplois_crees', e.target.value)} />
              </Row>
              <Row label="Nationalités des employés">
                <input className="form-input" placeholder="Ex: Mauritanienne, Sénégalaise"
                       value={form.nationalites_employes}
                       onChange={e => up('nationalites_employes', e.target.value)} />
              </Row>
              <Row label="Nombre d'employés administratifs">
                <input className="form-input" type="number"
                       value={form.nb_employes_admin}
                       onChange={e => up('nb_employes_admin', e.target.value)} />
              </Row>
              <Row label="Nombre de techniciens">
                <input className="form-input" type="number"
                       value={form.nb_techniciens}
                       onChange={e => up('nb_techniciens', e.target.value)} />
              </Row>
              <Row label="Nombre d'ouvriers">
                <input className="form-input" type="number"
                       value={form.nb_ouvriers}
                       onChange={e => up('nb_ouvriers', e.target.value)} />
              </Row>
            </div>
          </div>
        )}

        {/* ── VI. Environnement économique ── */}
        {step === 6 && (
          <div className="space-y-4 animate-fadeInUp">
            <SH num="VI" title="Environnement Economique de l'entreprise" />
            <Row label="Description de l'unité de production">
              <textarea className="form-input resize-none" rows={2}
                        value={form.description_unite}
                        onChange={e => up('description_unite', e.target.value)} />
            </Row>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Capital Social (MRU)">
                <input className="form-input" placeholder="Ex: 1000000"
                       value={form.capital_social} onChange={e => up('capital_social', e.target.value)} />
              </Row>
              <Row label="Financement — Fonds propres (MRU)">
                <input className="form-input" type="number"
                       value={form.financement_fonds_propres}
                       onChange={e => up('financement_fonds_propres', e.target.value)} />
              </Row>
              <Row label="Financement — Emprunt (MRU)">
                <input className="form-input" type="number"
                       value={form.financement_emprunt}
                       onChange={e => up('financement_emprunt', e.target.value)} />
              </Row>
            </div>

            <div>
              <label className="form-label">Origine de l'investissement</label>
              <div className="flex gap-4 mt-1">
                {['National', 'International', 'National et International'].map(o => (
                  <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="origine_investissement" value={o}
                           checked={form.origine_investissement === o}
                           onChange={e => up('origine_investissement', e.target.value)} />
                    {o}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Nature de l'investissement</label>
              <div className="flex gap-4 mt-1">
                {['Nouvelle création', 'Extension', 'Modernisation'].map(n => (
                  <label key={n} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="nature_investissement" value={n}
                           checked={form.nature_investissement === n}
                           onChange={e => up('nature_investissement', e.target.value)} />
                    {n}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Row label="Données états financiers 2023">
                <input className="form-input" value={form.donnees_financieres_2023}
                       onChange={e => up('donnees_financieres_2023', e.target.value)} />
              </Row>
              <Row label="Données états financiers 2024">
                <input className="form-input" value={form.donnees_financieres_2024}
                       onChange={e => up('donnees_financieres_2024', e.target.value)} />
              </Row>
            </div>

            <Row label="Matières premières">
              <input className="form-input" placeholder="Listez les matières premières utilisées"
                     value={form.matieres_premieres}
                     onChange={e => up('matieres_premieres', e.target.value)} />
            </Row>

            <div className="grid grid-cols-3 gap-3">
              <Row label="Capacité production / jour (Tonnes)">
                <input className="form-input" type="number"
                       value={form.capacite_production_jour}
                       onChange={e => up('capacite_production_jour', e.target.value)} />
              </Row>
              <Row label="Capacité production / mois (Tonnes)">
                <input className="form-input" type="number"
                       value={form.capacite_production_mois}
                       onChange={e => up('capacite_production_mois', e.target.value)} />
              </Row>
              <Row label="Capacité production / an (Tonnes)">
                <input className="form-input" type="number"
                       value={form.capacite_production_an}
                       onChange={e => up('capacite_production_an', e.target.value)} />
              </Row>
              <Row label="Production effective / jour (Tonnes)">
                <input className="form-input" type="number"
                       value={form.production_effective_jour}
                       onChange={e => up('production_effective_jour', e.target.value)} />
              </Row>
              <Row label="Stock (Tonnes)">
                <input className="form-input" type="number"
                       value={form.stock}
                       onChange={e => up('stock', e.target.value)} />
              </Row>
              <Row label="Capacité estimée (Tonnes/jour)">
                <input className="form-input" type="number"
                       value={form.capacite_estimee}
                       onChange={e => up('capacite_estimee', e.target.value)} />
              </Row>
              <Row label="Capacité d'augmentation (Tonnes/jour)">
                <input className="form-input" type="number"
                       value={form.capacite_augmentation}
                       onChange={e => up('capacite_augmentation', e.target.value)} />
              </Row>
            </div>

            <Row label="Les variétés de production (1, 2, 3, 4...)">
              <input className="form-input"
                     placeholder="Ex: 1-Huile de palme  2-Savon  3-Margarine"
                     value={form.varietes_production}
                     onChange={e => up('varietes_production', e.target.value)} />
            </Row>
          </div>
        )}

        {/* ── VII. Défis & Confirmation ── */}
        {step === 7 && (
          <div className="space-y-5 animate-fadeInUp">
            <SH num="VII" title="Défis" />
            <Row label="Principales difficultés rencontrées">
              <textarea className="form-input resize-none" rows={5}
                        placeholder="Décrivez les principales difficultés de l'entreprise..."
                        value={form.principales_difficultes}
                        onChange={e => up('principales_difficultes', e.target.value)} />
            </Row>

            {/* Récapitulatif */}
            <div className="border-t border-gray-100 pt-4">
              <p className="font-semibold text-gray-700 text-sm mb-3">Récapitulatif</p>
              <div className="space-y-1.5">
                {[
                  ['Dénomination',        form.denomination_complete],
                  ['Activité',            form.activite_principale],
                  ['Siège',               form.localisation_siege],
                  ['Téléphone',           form.telephone],
                  ['Gestionnaire',        form.nom_premier_responsable],
                  ['NNI / Passeport',     form.nni_passeport],
                  ['Forme juridique',     form.forme_juridique],
                  ['N° Enregistrement',   form.numero_enregistrement],
                  ['Capital social',      form.capital_social ? `${form.capital_social} MRU` : '—'],
                  ['Emplois créés',       form.nombre_emplois_crees || '—'],
                  ['GPS',                 form.latitude ? `${form.latitude}, ${form.longitude}` : 'Non renseigné'],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex gap-3 text-xs py-1.5 border-b border-gray-50">
                    <span className="text-gray-400 w-36 flex-shrink-0">{k}</span>
                    <span className="font-medium text-gray-800">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-mmi-green-lt border border-green-200 rounded-xl p-4 text-xs text-green-700">
              <p className="font-semibold mb-1">Déclaration sur l'honneur</p>
              <p>Je soussigné(e), certifie l'exactitude des informations fournies dans ce formulaire
              de renouvellement d'enregistrement industriel 2025.</p>
              <p className="mt-2 text-gray-500">Nouakchott, le {new Date().toLocaleDateString('fr-FR')}</p>
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
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && !form.denomination_complete) ||
                (step === 2 && !form.telephone) ||
                (step === 3 && !form.nom_premier_responsable) ||
                (step === 4 && !form.forme_juridique) ||
                (step === 5 && !form.numero_enregistrement)
              }
              className="btn-primary flex items-center gap-1.5 ml-auto disabled:opacity-40"
            >
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Save size={16} /> Soumettre le formulaire de renouvellement</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SH({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
      <span className="w-7 h-7 rounded-full bg-mmi-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {num}
      </span>
      <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label text-xs">{label}</label>
      {children}
    </div>
  )
}