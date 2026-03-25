import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/utils/api'

export default function MotDePasseOubliePage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/password-reset/', { email })
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur — vérifiez votre adresse email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <img src="/images/logo_mmi.png" alt="MMI"
               className="h-14 w-14 object-contain mx-auto mb-4 rounded-full"
               onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <h1 className="text-2xl font-bold text-gray-800">Mot de passe oublié</h1>
          <p className="text-gray-500 text-sm mt-1">Plateforme Industrielle MMI</p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-mmi-green-lt rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-mmi-green" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Email envoyé !</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Si l'adresse <strong>{email}</strong> est associée à un compte,
                vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Vérifiez aussi votre dossier spam.
              </p>
              <Link to="/connexion" className="btn-primary w-full flex items-center justify-center gap-2">
                <ArrowLeft size={15} /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Saisissez votre adresse email. Vous recevrez un lien pour réinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Adresse email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      className="form-input pl-9"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Envoyer le lien de réinitialisation'
                  }
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/connexion"
                      className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-mmi-green transition-colors">
                  <ArrowLeft size={14} /> Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}