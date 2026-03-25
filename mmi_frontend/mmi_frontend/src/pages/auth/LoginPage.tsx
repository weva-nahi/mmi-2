import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { authAPI } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ identifiant_unique: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.user, data.access, data.refresh)
      toast.success(`Bienvenue, ${data.user.nom} !`)
      // Redirection selon le rôle
      const roles = data.user.roles as string[]
      if (data.user.is_super_admin) navigate('/admin')
      else if (roles.includes('DEMANDEUR'))       navigate('/demandeur')
      else if (roles.includes('SEC_CENTRAL'))     navigate('/secretariat')
      else if (roles.includes('SEC_GENERAL'))     navigate('/sg')
      else if (roles.includes('MINISTRE'))        navigate('/ministre')
      else if (roles.includes('DGI_DIRECTEUR') || roles.includes('DGI_SECRETARIAT')) navigate('/dgi')
      else if (roles.includes('DDPI_CHEF') || roles.includes('DDPI_AGENT')) navigate('/ddpi')
      else if (roles.includes('MMI_SIGNATAIRE'))  navigate('/mmi')
      else navigate('/')
    } catch (err: any) {
      const msg = err.response?.data?.detail ||
                  err.response?.data?.non_field_errors?.[0] ||
                  'Identifiant ou mot de passe incorrect.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/images/logo_mmi.png" alt="MMI" className="h-16 w-16 object-contain mx-auto mb-4 rounded-full"
               onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <h1 className="text-2xl font-bold text-gray-800">Connexion</h1>
          <p className="text-gray-500 text-sm mt-1">Plateforme Industrielle MMI</p>
        </div>

        <div className="card p-8">
          {/* Info identifiant */}
          <div className="bg-mmi-green-lt border border-green-200 rounded-lg p-3 mb-6 text-xs text-mmi-green">
            Utilisez votre identifiant unique <strong>MMI-DEM-XXXXX</strong> reçu par email lors de votre inscription.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">{t('auth.identifiant')}</label>
              <input
                type="text"
                className="form-input font-mono tracking-wider"
                placeholder="MMI-DEM-XXXXX"
                value={form.identifiant_unique}
                onChange={e => setForm(p => ({ ...p, identifiant_unique: e.target.value.toUpperCase() }))}
                required
              />
            </div>

            <div>
              <label className="form-label">{t('auth.mot_de_passe')}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Votre mot de passe"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/mot-de-passe-oublie" className="text-xs text-mmi-green hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  {t('auth.se_connecter')}
                </>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500 mb-3">
              Vous n'avez pas encore de compte ?
            </p>
            <Link
              to="/inscription"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl
                         border-2 border-mmi-green text-mmi-green font-semibold text-sm
                         hover:bg-mmi-green hover:text-white transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Créer un compte demandeur
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}