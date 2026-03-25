import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: number
  identifiant_unique: string
  nom: string
  prenom: string
  nom_complet: string
  email: string
  email_recuperation?: string
  telephone?: string
  nom_entreprise?: string
  nif?: string
  adresse_siege?: string
  forme_juridique?: string
  roles: string[]
  is_super_admin: boolean
  is_active: boolean
}

interface AuthState {
  user:            User | null
  accessToken:     string | null
  refreshToken:    string | null
  isAuthenticated: boolean

  setAuth:    (user: User, access: string, refresh: string) => void
  setTokens:  (access: string, refresh: string) => void
  updateUser: (data: Partial<User>) => void
  logout:     () => void
  hasRole:    (role: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,

      setAuth: (user, access, refresh) =>
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true }),

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      updateUser: (data) => {
        const { user } = get()
        if (user) set({ user: { ...user, ...data } })
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
        localStorage.removeItem('mmi-auth')
      },

      hasRole: (role: string) => {
        const { user } = get()
        if (!user) return false
        if (user.is_super_admin) return true
        return user.roles.includes(role)
      },
    }),
    {
      name:    'mmi-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        user:            state.user,
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)