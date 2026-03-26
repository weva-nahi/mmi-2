import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, LogIn } from 'lucide-react'
import { api } from '@/utils/api'

type Status = 'loading' | 'success' | 'error' | 'already'

export default function ActivationPage() {
  const { uidb64, token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!uidb64 || !token) { setStatus('error'); return }

    api.get(`/auth/activer/${uidb64}/${token}/`)
      .then(r => {
        const msg = r.data.detail || ''
        if (msg.includes('déjà activé')) {
          setStatus('already')
        } else {
          setStatus('success')
        }
        setMessage(msg)
        // Redirection auto vers connexion après 4s
        if (!msg.includes('déjà activé')) {
          setTimeout(() => navigate('/connexion-agent'), 4000)
        }
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'Lien invalide ou expiré.')
      })
  }, [uidb64, token])

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

          {/* Logo */}
          <img src="/images/logo_mmi.png" alt="MMI"
               className="h-14 w-14 object-contain rounded-full mx-auto mb-6"
               onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />

          {/* Loading */}
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader size={28} className="text-blue-500 animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Activation en cours...</h2>
              <p className="text-sm text-gray-500">Vérification de votre lien d'activation</p>
            </>
          )}

          {/* Succès */}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Compte activé !</h2>
              <p className="text-sm text-gray-500 mb-6">
                Votre compte a été activé avec succès.<br />
                Vous allez être redirigé vers la page de connexion...
              </p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
                <div className="bg-mmi-green h-1.5 rounded-full animate-[width_4s_linear]"
                     style={{ animation: 'progress 4s linear forwards' }} />
              </div>
              <Link to="/connexion-agent"
                    className="btn-primary flex items-center justify-center gap-2 text-sm">
                <LogIn size={15} /> Se connecter maintenant
              </Link>
            </>
          )}

          {/* Déjà activé */}
          {status === 'already' && (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Compte déjà actif</h2>
              <p className="text-sm text-gray-500 mb-6">
                Votre compte est déjà activé. Connectez-vous directement.
              </p>
              <Link to="/connexion-agent"
                    className="btn-primary flex items-center justify-center gap-2 text-sm">
                <LogIn size={15} /> Se connecter
              </Link>
            </>
          )}

          {/* Erreur */}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Lien invalide</h2>
              <p className="text-sm text-gray-500 mb-6">
                {message || 'Ce lien d\'activation est expiré ou invalide.'}<br />
                Contactez l'administrateur pour obtenir un nouveau lien.
              </p>
              <Link to="/"
                    className="btn-secondary flex items-center justify-center gap-2 text-sm">
                Retour à l'accueil
              </Link>
            </>
          )}

        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}