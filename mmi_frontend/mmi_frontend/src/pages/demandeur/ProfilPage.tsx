import React, { useState } from 'react'
import { User, Building2, Mail, Phone, Lock, Save, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/utils/api'
import toast from 'react-hot-toast'

export default function ProfilPage() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore()
  const [saving, setSaving]     = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [saved, setSaved]       = useState(false)

  const [form, setForm] = useState({
    nom:              user?.nom || '',
    prenom:           user?.prenom || '',
    telephone:        (user as any)?.telephone || '',
    email_recuperation: (user as any)?.email_recuperation || '',
    nom_entreprise:   user?.nom_entreprise || '',
    nif:              (user as any)?.nif || '',
    adresse_siege:    (user as any)?.adresse_siege || '',
    forme_juridique:  (user as any)?.forme_juridique || '',
  })

  const [pwd, setPwd] = useState({
    ancien: '', nouveau: '', confirmer: ''
  })

  const up    = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const upPwd = (k: string, v: string) => setPwd(p => ({ ...p, [k]: v }))

  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.patch(`/admin/users/${user?.id}/`, form)
      if (user && accessToken && refreshToken) {
        setAuth({ ...user, ...data }, accessToken, refreshToken)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      toast.success('Profil mis à jour')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwd.nouveau !== pwd.confirmer) {
      toast.error('Les nouveaux mots de passe ne correspondent pas')
      return
    }
    if (pwd.nouveau.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    setSavingPwd(true)
    try {
      await api.post('/auth/password-change/', {
        old_password: pwd.ancien,
        new_password: pwd.nouveau,
      })
      toast.success('Mot de passe modifié avec succès')
      setPwd({ ancien: '', nouveau: '', confirmer: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Mot de passe actuel incorrect')
    } finally {
      setSavingPwd(false)
    }
  }

  const FORMES = [
    { value: 'etablissement', label: 'Établissement' },
    { value: 'sa',            label: 'SA' },
    { value: 'sarl',          label: 'SARL' },
    { value: 'autre',         label: 'Autre' },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Mon profil</h1>

      {/* Carte identifiant */}
      <div className="card p-5 mb-6 bg-mmi-green-lt border border-green-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-mmi-green flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">
              {user?.nom?.charAt(0)}{user?.prenom?.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-bold text-gray-800">{user?.nom_complet || user?.nom}</p>
            <p className="text-sm text-gray-500">{user?.nom_entreprise}</p>
            <p className="text-sm font-mono text-mmi-green font-bold mt-1">
              {user?.identifiant_unique}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire profil */}
      <form onSubmit={handleSaveProfil} className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <User size={17} className="text-mmi-green" /> Informations personnelles
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom</label>
              <input className="form-input" value={form.nom}
                     onChange={e => up('nom', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Prénom</label>
              <input className="form-input" value={form.prenom}
                     onChange={e => up('prenom', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label flex items-center gap-1.5">
              <Phone size={13} /> Téléphone
            </label>
            <input type="tel" className="form-input" value={form.telephone}
                   onChange={e => up('telephone', e.target.value)} />
          </div>

          <div>
            <label className="form-label flex items-center gap-1.5">
              <Mail size={13} /> Email de récupération
            </label>
            <input type="email" className="form-input" value={form.email_recuperation}
                   onChange={e => up('email_recuperation', e.target.value)} />
          </div>
        </div>

        <div className="border-t border-gray-100 mt-6 pt-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-mmi-green" /> Informations entreprise
          </h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">Raison sociale</label>
              <input className="form-input" value={form.nom_entreprise}
                     onChange={e => up('nom_entreprise', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Forme juridique</label>
                <select className="form-input" value={form.forme_juridique}
                        onChange={e => up('forme_juridique', e.target.value)}>
                  <option value="">-- Choisir --</option>
                  {FORMES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">NIF</label>
                <input className="form-input" value={form.nif}
                       onChange={e => up('nif', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Adresse du siège</label>
              <textarea className="form-input resize-none" rows={2} value={form.adresse_siege}
                        onChange={e => up('adresse_siege', e.target.value)} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
        >
          {saving
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : saved
              ? <><CheckCircle size={16} /> Sauvegardé !</>
              : <><Save size={16} /> Enregistrer les modifications</>
          }
        </button>
      </form>

      {/* Changement mot de passe */}
      <form onSubmit={handleChangePwd} className="card p-6">
        <h2 className="font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <Lock size={17} className="text-mmi-green" /> Changer le mot de passe
        </h2>

        <div className="space-y-4">
          <div>
            <label className="form-label">Mot de passe actuel</label>
            <input type="password" className="form-input" value={pwd.ancien}
                   onChange={e => upPwd('ancien', e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Nouveau mot de passe</label>
            <input type="password" className="form-input" value={pwd.nouveau}
                   onChange={e => upPwd('nouveau', e.target.value)}
                   minLength={8} required />
          </div>
          <div>
            <label className="form-label">Confirmer le nouveau mot de passe</label>
            <input type="password" className="form-input" value={pwd.confirmer}
                   onChange={e => upPwd('confirmer', e.target.value)} required />
            {pwd.confirmer && pwd.nouveau !== pwd.confirmer && (
              <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPwd}
          className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
        >
          {savingPwd
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Lock size={16} /> Changer le mot de passe</>
          }
        </button>
      </form>
    </div>
  )
}