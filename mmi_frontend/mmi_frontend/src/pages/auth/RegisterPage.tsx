import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react'
import { authAPI } from '@/utils/api'
import toast from 'react-hot-toast'

const FORMES = [
  { value: 'etablissement', label: 'Établissement' },
  { value: 'sa',   label: 'SA' },
  { value: 'sarl', label: 'SARL' },
  { value: 'autre', label: 'Autre' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ id: string; email: string } | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({
    nom_entreprise: '', forme_juridique: '', nif: '', adresse_siege: '',
    nom: '', prenom: '', telephone: '',
    email: '', email_recuperation: '',
    password: '', password_confirm: '',
  })

  const up = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  const pwdStrength = () => {
    const p = form.password
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }

  const strength = pwdStrength()
  const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-mmi-green']
  const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password_confirm) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      const { data } = await authAPI.register(form)
      setSuccess({ id: data.identifiant_unique, email: form.email })
    } catch (err: any) {
      const errors = err.response?.data
      if (errors) {
        const msg = Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' | ')
        toast.error(msg)
      } else {
        toast.error("Erreur lors de l'inscription.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="card p-10">
            <div className="w-16 h-16 bg-mmi-green-lt rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-mmi-green" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Compte créé avec succès !</h2>
            <p className="text-gray-500 text-sm mb-6">
              Votre identifiant unique a été envoyé à <strong>{success.email}</strong>
            </p>
            <div className="bg-mmi-green-lt border border-green-200 rounded-xl p-5 mb-6">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Votre identifiant</p>
              <p className="text-2xl font-bold text-mmi-green font-mono tracking-widest">{success.id}</p>
              <p className="text-xs text-mmi-green mt-2">Conservez cet identifiant — il vous est indispensable pour vous connecter.</p>
            </div>
            <button onClick={() => navigate('/connexion')} className="btn-primary w-full">
              Se connecter maintenant
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img src="/images/logo_mmi.png" alt="MMI" className="h-14 w-14 object-contain mx-auto mb-3 rounded-full"
               onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <h1 className="text-2xl font-bold text-gray-800">Créer un compte demandeur</h1>
          <p className="text-gray-500 text-sm mt-1">Plateforme Industrielle MMI</p>
        </div>

        {/* Étapes */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[
            { n: 1, label: 'Entreprise' },
            { n: 2, label: 'Responsable' },
            { n: 3, label: 'Accès' },
          ].map(s => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${step >= s.n ? 'bg-mmi-green text-white' : 'bg-gray-200 text-gray-500'}`}>
                {s.n}
              </div>
              <span className={`text-sm hidden sm:block ${step >= s.n ? 'text-mmi-green font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {s.n < 3 && <div className={`w-8 h-0.5 ${step > s.n ? 'bg-mmi-green' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card p-8">

            {/* Étape 1 : Entreprise */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeInUp">
                <h3 className="font-semibold text-gray-700 mb-4">Informations de l'entreprise</h3>
                <div>
                  <label className="form-label">Nom de l'entreprise *</label>
                  <input className="form-input" placeholder="Raison sociale complète"
                         value={form.nom_entreprise} onChange={e => up('nom_entreprise', e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Forme juridique *</label>
                    <select className="form-input" value={form.forme_juridique}
                            onChange={e => up('forme_juridique', e.target.value)} required>
                      <option value="">-- Choisir --</option>
                      {FORMES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">NIF *</label>
                    <input className="form-input" placeholder="Numéro Identification Fiscale"
                           value={form.nif} onChange={e => up('nif', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="form-label">Adresse du siège *</label>
                  <input className="form-input" placeholder="Wilaya, Moughataa, adresse complète"
                         value={form.adresse_siege} onChange={e => up('adresse_siege', e.target.value)} required />
                </div>
                <div className="pt-2">
                  <button type="button" className="btn-primary w-full" onClick={() => setStep(2)}>
                    Suivant →
                  </button>
                </div>
              </div>
            )}

            {/* Étape 2 : Responsable */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeInUp">
                <h3 className="font-semibold text-gray-700 mb-4">Responsable de l'entreprise</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nom *</label>
                    <input className="form-input" value={form.nom}
                           onChange={e => up('nom', e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Prénom *</label>
                    <input className="form-input" value={form.prenom}
                           onChange={e => up('prenom', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Téléphone *</label>
                  <input type="tel" className="form-input" placeholder="22 00 00 00"
                         value={form.telephone} onChange={e => up('telephone', e.target.value)} required />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setStep(1)}>← Retour</button>
                  <button type="button" className="btn-primary flex-1" onClick={() => setStep(3)}>Suivant →</button>
                </div>
              </div>
            )}

            {/* Étape 3 : Accès */}
            {step === 3 && (
              <div className="space-y-4 animate-fadeInUp">
                <h3 className="font-semibold text-gray-700 mb-4">Accès & sécurité</h3>
                <div>
                  <label className="form-label">Email principal *</label>
                  <input type="email" className="form-input" placeholder="Votre identifiant y sera envoyé"
                         value={form.email} onChange={e => up('email', e.target.value)} required />
                  <p className="text-xs text-mmi-green mt-1">Votre identifiant MMI-DEM-XXXXX sera envoyé à cette adresse</p>
                </div>
                <div>
                  <label className="form-label">Email de récupération *</label>
                  <input type="email" className="form-input" placeholder="Email de secours"
                         value={form.email_recuperation} onChange={e => up('email_recuperation', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Mot de passe *</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} className="form-input pr-10"
                           placeholder="Min. 8 caractères"
                           value={form.password} onChange={e => up('password', e.target.value)} required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[0,1,2,3].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength-1] : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{strengthLabels[strength - 1] || ''}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="form-label">Confirmer le mot de passe *</label>
                  <input type="password" className="form-input"
                         placeholder="Répétez le mot de passe"
                         value={form.password_confirm} onChange={e => up('password_confirm', e.target.value)} required />
                  {form.password_confirm && form.password !== form.password_confirm && (
                    <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setStep(2)}>← Retour</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><UserPlus size={16} /> Créer mon compte</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="text-mmi-green font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}