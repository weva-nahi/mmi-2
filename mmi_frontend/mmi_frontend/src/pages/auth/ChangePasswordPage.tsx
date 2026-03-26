import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'
import { api } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    ancien_password: '', nouveau_password: '', confirm_password: ''
  })
  const [show, setShow] = useState({ ancien: false, nouveau: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.nouveau_password !== form.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (form.nouveau_password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/password-change/', {
        ancien_password:  form.ancien_password,
        nouveau_password: form.nouveau_password,
      })
      setSuccess(true)
      toast.success('Mot de passe modifié avec succès')
      setTimeout(() => navigate('/connexion-agent'), 3000)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors du changement')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Mot de passe modifié !</h2>
        <p className="text-sm text-gray-500">Redirection vers la connexion...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* En-tête */}
          <div className="text-center pb-5 mb-5 border-b border-gray-100">
            <div className="w-12 h-12 bg-mmi-green-lt rounded-xl flex items-center justify-center mx-auto mb-3">
              <Lock size={22} className="text-mmi-green" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">Changer le mot de passe</h1>
            <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ancien mot de passe */}
            <div>
              <label className="form-label">Mot de passe actuel *</label>
              <div className="relative">
                <input type={show.ancien ? 'text' : 'password'}
                       className="form-input pr-10"
                       value={form.ancien_password}
                       onChange={e => setForm(p => ({ ...p, ancien_password: e.target.value }))}
                       required />
                <button type="button" onClick={() => setShow(p => ({ ...p, ancien: !p.ancien }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show.ancien ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label className="form-label">Nouveau mot de passe *</label>
              <div className="relative">
                <input type={show.nouveau ? 'text' : 'password'}
                       className="form-input pr-10"
                       placeholder="Minimum 8 caractères"
                       value={form.nouveau_password}
                       onChange={e => setForm(p => ({ ...p, nouveau_password: e.target.value }))}
                       required minLength={8} />
                <button type="button" onClick={() => setShow(p => ({ ...p, nouveau: !p.nouveau }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show.nouveau ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Indicateur force */}
              {form.nouveau_password && (
                <div className="mt-1.5 flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      form.nouveau_password.length >= i * 3
                        ? i <= 1 ? 'bg-red-400'
                          : i <= 2 ? 'bg-amber-400'
                          : i <= 3 ? 'bg-blue-400'
                          : 'bg-green-500'
                        : 'bg-gray-100'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirmer */}
            <div>
              <label className="form-label">Confirmer le nouveau mot de passe *</label>
              <div className="relative">
                <input type={show.confirm ? 'text' : 'password'}
                       className={`form-input pr-10 ${
                         form.confirm_password && form.confirm_password !== form.nouveau_password
                           ? 'border-red-300 focus:border-red-400' : ''
                       }`}
                       value={form.confirm_password}
                       onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))}
                       required />
                <button type="button" onClick={() => setShow(p => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.confirm_password && form.confirm_password !== form.nouveau_password && (
                <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-white flex items-center
                               justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #1B6B30, #2E8B45)' }}>
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Lock size={15} /> Enregistrer le nouveau mot de passe</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}