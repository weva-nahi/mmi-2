import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// ── Intercepteur request : ajoute le token JWT ────────────────
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Intercepteur response : refresh automatique si 401 ────────
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, {
            refresh: refreshToken,
          })
          useAuthStore.getState().setTokens(data.access, refreshToken)
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return api(originalRequest)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/connexion'
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/connexion'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login:          (data: { identifiant_unique: string; password: string }) =>
                    api.post('/auth/login/', data),
  loginAgent:     (data: { email: string; password: string }) =>
                    api.post('/auth/login/agent/', data),
  register:       (data: object) => api.post('/auth/register/', data),
  refresh:        (refresh: string) => api.post('/auth/token/refresh/', { refresh }),
  passwordReset:  (email: string) => api.post('/auth/password-reset/', { email }),
  passwordChange: (data: { old_password: string; new_password: string }) =>
                    api.post('/auth/password-change/', data),
}

// ── Demandes ─────────────────────────────────────────────────
export const demandesAPI = {
  list:        (params?: object) => api.get('/demandes/', { params }),
  get:         (id: number)      => api.get(`/demandes/${id}/`),
  create:      (data: object)    => api.post('/demandes/', data),
  update:      (id: number, data: object) => api.patch(`/demandes/${id}/`, data),
  transmettre: (id: number, data: {
    etape_code: string
    action:     string
    commentaire?: string
  }) => api.post(`/demandes/${id}/transmettre/`, data),
  historique:  (id: number) => api.get(`/demandes/${id}/historique/`),
  uploadPiece: (id: number, formData: FormData) =>
                 api.post(`/demandes/${id}/upload-piece/`, formData, {
                   headers: { 'Content-Type': 'multipart/form-data' },
                 }),
}

// ── Types de demande ─────────────────────────────────────────
export const typeDemandesAPI = {
  list: () => api.get('/types-demande/'),
  get:  (id: number) => api.get(`/types-demande/${id}/`),
}

// ── Pièces requises ──────────────────────────────────────────
export const piecesRequisesAPI = {
  list:   (params?: object) => api.get('/pieces-requises/', { params }),
  create: (data: object)    => api.post('/pieces-requises/', data),
  update: (id: number, data: object) => api.patch(`/pieces-requises/${id}/`, data),
  delete: (id: number)      => api.delete(`/pieces-requises/${id}/`),
}

// ── Autorisations (carte publique) ────────────────────────────
export const autorisationsAPI = {
  list:       (params?: object) => api.get('/autorisations/', { params }),
  get:        (id: number)      => api.get(`/autorisations/${id}/`),
  geojson:    ()                => api.get('/autorisations/geojson/'),
  stats:      ()                => api.get('/autorisations/stats/'),
  rechercher: (q: string)       => api.get('/autorisations/', { params: { search: q } }),
}

// ── Portail public ────────────────────────────────────────────
export const portailAPI = {
  actualites: (params?: object) => api.get('/public/actualites/', { params }),
  documents:  (params?: object) => api.get('/public/documents/', { params }),
  projets:    (params?: object) => api.get('/public/projets/',   { params }),
  contact:    (data: object)    => api.post('/public/contact/',   data),
}

// ── Notifications ─────────────────────────────────────────────
export const notificationsAPI = {
  list:       ()           => api.get('/notifications/'),
  marquerLu:  (id: number) => api.post(`/notifications/${id}/marquer-lu/`),
  toutLire:   ()           => api.post('/notifications/tout-lire/'),
  nonLuesCount: ()         => api.get('/notifications/non-lues-count/'),
}

// ── Analytics ─────────────────────────────────────────────────
export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard/'),
  export:    (params?: object) => api.get('/analytics/export/', { params, responseType: 'blob' }),
}

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  // Utilisateurs
  users:         (params?: object) => api.get('/admin/users/', { params }),
  createUser:    (data: object)    => api.post('/admin/users/', data),
  updateUser:    (id: number, data: object) => api.patch(`/admin/users/${id}/`, data),
  attribuerRole: (id: number, role_code: string) =>
                   api.post(`/admin/users/${id}/attribuer-role/`, { role_code }),
  activerUser:   (id: number) => api.post(`/admin/users/${id}/activer/`),
  // Actualités
  actualites:        (params?: object) => api.get('/admin/actualites/', { params }),
  createActualite:   (data: FormData) =>
                       api.post('/admin/actualites/', data, {
                         headers: { 'Content-Type': 'multipart/form-data' },
                       }),
  updateActualite:   (id: number, data: object) => api.patch(`/admin/actualites/${id}/`, data),
  deleteActualite:   (id: number)      => api.delete(`/admin/actualites/${id}/`),
  // Documents
  documents:        (params?: object) => api.get('/admin/documents/', { params }),
  createDocument:   (data: FormData) =>
                      api.post('/admin/documents/', data, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      }),
  deleteDocument:   (id: number) => api.delete(`/admin/documents/${id}/`),
}

// ── Visites & Comités BP ──────────────────────────────────────
export const visitesAPI = {
  create: (data: FormData) =>
            api.post('/visites/', data, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }),
  get:    (demandeId: number) => api.get('/visites/', { params: { demande: demandeId } }),
}

export const comitesBPAPI = {
  create: (data: FormData) =>
            api.post('/comites-bp/', data, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }),
  get:    (demandeId: number) => api.get('/comites-bp/', { params: { demande: demandeId } }),
}

export const distancesAPI = {
  create: (data: object) => api.post('/distances-boulangerie/', data),
  get:    (demandeId: number) => api.get('/distances-boulangerie/', { params: { demande: demandeId } }),
}