import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Navbar from '../Navbar/Navbar'
import AdminSidebar from './AdminSidebar'
import AuroraBackground from '../Neon/AuroraBackground'
import Footer from '../Footer/Footer'
import '../ProtectedLayout/ProtectedLayout.css'

const AdminLayout = () => {
  const { isAuthenticated, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const hasAdminRole = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'SUPPORT'].includes(user?.role)
  if (!hasAdminRole) {
    return <Navigate to="/dashboard" replace />
  }

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="layout">
      <AuroraBackground />
      <Navbar onToggleSidebar={handleToggleSidebar} />
      <div className="layout__body">
        <AdminSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
        <main className="layout__content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          <div style={{ flex: '1 0 auto' }}>
            <Outlet />
          </div>
          <div style={{ padding: '0 24px' }}>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
