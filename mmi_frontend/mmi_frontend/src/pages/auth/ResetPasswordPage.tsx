import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { api } from '@/utils/api'

export default function ResetPasswordPage() {
  const { uidb64, token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')

  // Indicateur force mot de passe
  const getStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8)               score++
    if (/[A-Z]/.test(pwd))             score++
    if (/[0-9]/.test(pwd))             score++
    if (/[^A-Za-z0-9]/.test(pwd))      score++
    return score
  }
  const strength = getStrength(password)
  const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strength]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password-confirm/', {
        uidb64,
        token,
        password,
      })
      setSuccess(true)
      setTimeout(() => navigate('/connexion'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lien invalide ou expiré. Faites une nouvelle demande.')
    } finally {
      setLoading(false)
    }
  }

  // ── Succès ─────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Mot de passe réinitialisé !</h2>
          <p className="text-gray-500 text-sm mb-6">
            Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion.
          </p>
          <Link to="/connexion" className="btn-primary text-sm inline-flex items-center gap-2">
            Se connecter maintenant
          </Link>
        </div>
      </div>
    )
  }

  // ── Formulaire ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-mmi-green-lt rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={26} className="text-mmi-green" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Nouveau mot de passe</h1>
          <p className="text-gray-500 text-sm mt-1">
            Choisissez un mot de passe sécurisé pour votre compte MMI.
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Nouveau mot de passe */}
          <div>
            <label className="form-label">Nouveau mot de passe *</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="form-input pr-10"
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
              />
              <button type="button"
                      onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Barre de force */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div key={i}
                         className={`h-1.5 flex-1 rounded-full transition-all ${
                           i <= strength ? strengthColor : 'bg-gray-200'
                         }`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  strength <= 1 ? 'text-red-500' :
                  strength === 2 ? 'text-orange-500' :
                  strength === 3 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* Confirmer */}
          <div>
            <label className="form-label">Confirmer le mot de passe *</label>
            <input
              type={showPwd ? 'text' : 'password'}
              className={`form-input ${
                confirm && confirm !== password ? 'border-red-400 focus:ring-red-300' : ''
              }`}
              placeholder="Répétez le mot de passe"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            {confirm && confirm !== password && (
              <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
            )}
            {confirm && confirm === password && password.length >= 8 && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle size={11} /> Mots de passe identiques
              </p>
            )}
          </div>

          {/* Conseils */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
            <p className={password.length >= 8 ? 'text-green-600' : ''}>
              {password.length >= 8 ? '✓' : '○'} Au moins 8 caractères
            </p>
            <p className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
              {/[A-Z]/.test(password) ? '✓' : '○'} Une lettre majuscule
            </p>
            <p className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
              {/[0-9]/.test(password) ? '✓' : '○'} Un chiffre
            </p>
            <p className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>
              {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Un caractère spécial (!@#$...)
            </p>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading || password !== confirm || password.length < 8}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Lock size={15} />
            }
            Réinitialiser le mot de passe
          </button>
        </form>

        {/* Retour */}
        <div className="mt-6 text-center">
          <Link to="/connexion"
                className="text-sm text-gray-400 hover:text-mmi-green flex items-center justify-center gap-1">
            <ArrowLeft size={13} /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}