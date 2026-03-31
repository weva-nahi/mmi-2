import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, AlertCircle, Mail } from 'lucide-react'
import { authAPI } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function LoginAgentPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.loginAgent({ email: form.email, password: form.password })
      setAuth(data.user, data.access, data.refresh)
      toast.success(`Bienvenue, ${data.user.nom} !`)
      const roles = data.user.roles as string[]
      if (data.user.is_super_admin)                        navigate('/admin')
      else if (roles.includes('SEC_CENTRAL'))              navigate('/secretariat')
      else if (roles.includes('SEC_GENERAL'))              navigate('/sg')
      else if (roles.includes('MINISTRE'))                 navigate('/ministre')
      else if (roles.includes('DGI_DIRECTEUR'))            navigate('/dgi')
      else if (roles.includes('DGI_SECRETARIAT'))          navigate('/dgi')
      else if (roles.includes('DDPI_DIRECTEUR'))           navigate('/ddpi')
      else if (roles.includes('DDPI_CHEF_BP'))             navigate('/ddpi')
      else if (roles.includes('DDPI_CHEF_USINES'))         navigate('/ddpi')
      else if (roles.includes('DDPI_AGENT'))               navigate('/ddpi')
      else if (roles.includes('DDPI_CHEF'))                navigate('/ddpi')
      else if (roles.includes('SEC_COMITE_BP'))            navigate('/ddpi')
      else if (roles.includes('MMI_SIGNATAIRE'))           navigate('/ministre')
      else                                                  navigate('/')
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
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col">
       {/* ── HERO BANNER ───────────────────────────────────── */}
      <div className="w-full overflow-hidden bg-mmi-green" style={{ maxHeight: 320 }}>
        <img
          src="/images/banner_mmi.jpg"
          alt="Ministère des Mines et de l'Industrie"
          className="w-full h-full object-cover object-center block"
          style={{ maxHeight: 320 }}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      </div>

      {/* ══ FORMULAIRE AGENTS ══ */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {/* En-tête */}
            <div className="text-center pb-5 mb-5 border-b border-gray-100">
              <p className="text-2xl font-bold" style={{ color: '#1B6B30' }}>MMIAPP</p>
              <p className="text-gray-600 font-semibold text-sm mt-1">
                Espace Agents & Administration
              </p>
              <p className="text-gray-400 text-xs mt-1">Accès réservé au personnel du MMI</p>
            </div>

            {/* Bandeau info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-xs text-blue-700 flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">ℹ️</span>
              <span>
                Connectez-vous avec votre <strong>adresse email professionnelle</strong> et
                votre mot de passe fourni par l'administrateur.
              </span>
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresse email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:border-mmi-green focus:ring-2
                               focus:ring-mmi-green/20 transition-all"
                    placeholder="votre.email@mmi.gov.mr"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required autoFocus autoComplete="email"
                  />
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:border-mmi-green focus:ring-2
                               focus:ring-mmi-green/20 transition-all"
                    placeholder="Votre mot de passe"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="text-right mt-1.5">
                  <Link to="/mot-de-passe-oublie" className="text-xs text-mmi-green hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center
                           justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #1B6B30, #2E8B45)' }}
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
    </div>
  )
}