import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, AlertCircle, Mail } from 'lucide-react'
import { authAPI } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function LoginAgentPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.loginAgent({ email: form.email, password: form.password })
      setAuth(data.user, data.access, data.refresh)
      toast.success(`Bienvenue, ${data.user.nom} !`)

      const roles = data.user.roles as string[]
      if (data.user.is_super_admin)                                                  navigate('/admin')
      else if (roles.includes('SEC_CENTRAL'))                                        navigate('/secretariat')
      else if (roles.includes('SEC_GENERAL'))                                        navigate('/sg')
      else if (roles.includes('MINISTRE'))                                           navigate('/ministre')
      else if (roles.includes('DGI_DIRECTEUR') || roles.includes('DGI_SECRETARIAT')) navigate('/dgi')
      else if (roles.includes('DDPI_CHEF') || roles.includes('DDPI_AGENT'))          navigate('/ddpi')
      else if (roles.includes('MMI_SIGNATAIRE'))                                     navigate('/mmi')
      else navigate('/')
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Email ou mot de passe incorrect.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/images/logo_mmi.png"
            alt="MMI"
            className="h-16 w-16 object-contain mx-auto mb-4 rounded-full"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <h1 className="text-2xl font-bold text-gray-800">Espace Agents & Administration</h1>
          <p className="text-gray-500 text-sm mt-1">Accès réservé au personnel du MMI</p>
        </div>

        <div className="card p-8">

          {/* Bandeau info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-xs text-blue-700">
            Connectez-vous avec votre <strong>adresse email professionnelle</strong> et votre mot de passe fourni par l'administrateur.
          </div>

          {/* Erreur */}
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
                <input
                  type="email"
                  className="form-input pl-10"
                  placeholder="     votre.email@mmi.gov.mr "
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="form-label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Votre mot de passe"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  autoComplete="current-password"
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
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><LogIn size={16} /> Se connecter</>
              }
            </button>
          </form>

         
        </div>

      </div>
    </div>
  )
}