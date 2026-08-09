import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

function AdminRoute() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const hasAdminRole = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'SUPPORT'].includes(user?.role)
  return hasAdminRole ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export default AdminRoute
