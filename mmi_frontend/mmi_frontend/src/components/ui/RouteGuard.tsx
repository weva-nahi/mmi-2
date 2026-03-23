import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface Props {
  children: React.ReactNode
  roles?: string[]
}

export default function RouteGuard({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />
  }

  if (roles && roles.length > 0) {
    const userRoles = user?.roles || []
    const hasAccess = user?.is_super_admin ||
                      roles.some(r => userRoles.includes(r))
    if (!hasAccess) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
