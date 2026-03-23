import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  identifiant_unique: string
  nom: string
  prenom: string
  email: string
  nom_complet: string
  nom_entreprise: string
  roles: string[]
  is_super_admin: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, access: string, refresh: string) => void
  setTokens: (access: string, refresh: string) => void
  logout: () => void
  hasRole: (role: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, access, refresh) =>
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true }),

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      hasRole: (role: string) => {
        const { user } = get()
        if (!user) return false
        if (user.is_super_admin) return true
        return user.roles.includes(role)
      },
    }),
    {
      name: 'mmi-auth',
      partialize: state => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
