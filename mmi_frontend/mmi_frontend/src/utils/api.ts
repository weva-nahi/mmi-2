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

// ── Intercepteur response : refresh automatique ───────────────
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
      }
    }
    return Promise.reject(error)
  }
)

// ── Endpoints ────────────────────────────────────────────────
export const authAPI = {
  loginAgent: (data: { email: string; password: string }) =>
              api.post('/auth/login/agent/', data),
  login:    (data: { identifiant_unique: string; password: string }) =>
              api.post('/auth/login/', data),
  register: (data: object) => api.post('/auth/register/', data),
  refresh:  (refresh: string) => api.post('/auth/token/refresh/', { refresh }),
}

export const demandesAPI = {
  list:           (params?: object) => api.get('/demandes/', { params }),
  get:            (id: number)      => api.get(`/demandes/${id}/`),
  create:         (data: object)    => api.post('/demandes/', data),
  transmettre:    (id: number, data: object) => api.post(`/demandes/${id}/transmettre/`, data),
  historique:     (id: number)      => api.get(`/demandes/${id}/historique/`),
  uploadPiece:    (id: number, formData: FormData) =>
                    api.post(`/demandes/${id}/upload-piece/`, formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    }),
}

export const typeDemandesAPI = {
  list: () => api.get('/types-demande/'),
}

export const autorisationsAPI = {
  geojson: () => api.get('/autorisations/geojson/'),
  stats:   () => api.get('/autorisations/stats/'),
}

export const portailAPI = {
  actualites: (params?: object) => api.get('/public/actualites/', { params }),
  documents:  (params?: object) => api.get('/public/documents/', { params }),
  projets:    (params?: object) => api.get('/public/projets/', { params }),
}

export const notificationsAPI = {
  list:     () => api.get('/notifications/'),
  marquerLu: (id: number) => api.post(`/notifications/${id}/marquer-lu/`),
  toutLire: () => api.post('/notifications/tout-lire/'),
}

export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard/'),
}

export const adminAPI = {
  users:         (params?: object) => api.get('/admin/users/', { params }),
  createUser:    (data: object)    => api.post('/admin/users/', data),
  attribuerRole: (id: number, role_code: string) =>
                   api.post(`/admin/users/${id}/attribuer-role/`, { role_code }),
  activerUser:   (id: number)      => api.post(`/admin/users/${id}/activer/`),
}