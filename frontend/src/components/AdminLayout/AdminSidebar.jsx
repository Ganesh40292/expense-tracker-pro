import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaShieldAlt,
  FaUsers,
  FaChartBar,
  FaLock,
  FaHistory,
  FaHeartbeat,
  FaCog,
  FaExchangeAlt,
} from 'react-icons/fa'
import './AdminSidebar.css'

const adminNavItems = [
  { to: '/admin/dashboard', icon: FaShieldAlt, label: 'Overview' },
  { to: '/admin/users', icon: FaUsers, label: 'User Directory' },
  { to: '/admin/analytics', icon: FaChartBar, label: 'Platform Stats' },
  { to: '/admin/security', icon: FaLock, label: 'Security Monitor' },
  { to: '/admin/audit-logs', icon: FaHistory, label: 'Audit Logs' },
  { to: '/admin/health', icon: FaHeartbeat, label: 'System Health' },
  { to: '/admin/settings', icon: FaCog, label: 'Global Settings' },
]

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { x: -12, opacity: 0 },
  visible: { x: 0, opacity: 1 },
}

const AdminSidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className={`sidebar__overlay ${isOpen ? 'sidebar__overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.aside
        className={`sidebar sidebar--admin ${isOpen ? 'sidebar--open' : ''}`}
        aria-label="Admin navigation"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Decorative top glow - Admin Theme (Red/Purple) */}
        <div className="sidebar__glow sidebar__glow--admin" aria-hidden="true" />

        <div className="sidebar__admin-title">
          <span>ADMIN PORTAL</span>
        </div>

        <nav className="sidebar__nav">
          {adminNavItems.map(({ to, icon: Icon, label }) => (
            <motion.div key={to} variants={itemVariants}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active sidebar__link--admin' : 'sidebar__link'
                }
                onClick={onClose}
              >
                <span className="sidebar__link-icon">
                  <Icon size={16} />
                </span>
                <span className="sidebar__link-label">{label}</span>
                <span className="sidebar__link-glow sidebar__link-glow--admin" aria-hidden="true" />
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* User Portal Link */}
        <div className="sidebar__user-portal">
          <NavLink to="/dashboard" className="sidebar__link sidebar__link--exit" onClick={onClose}>
            <span className="sidebar__link-icon">
              <FaExchangeAlt size={16} />
            </span>
            <span className="sidebar__link-label">Exit to App</span>
          </NavLink>
        </div>

        {/* Footer */}
        <div className="sidebar__footer">
          <div className="sidebar__pulse-line sidebar__pulse-line--admin" aria-hidden="true" />
          <div className="sidebar__footer-info">
            <span className="sidebar__footer-dot sidebar__footer-dot--admin" />
            <span>Admin • Elevated</span>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default AdminSidebar
