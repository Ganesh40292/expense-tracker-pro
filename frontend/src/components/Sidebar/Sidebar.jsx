import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaHome,
  FaExchangeAlt,
  FaChartPie,
  FaSync,
  FaShieldAlt,
  FaReceipt,
  FaBrain,
} from 'react-icons/fa'
import useAuth from '../../hooks/useAuth'
import './Sidebar.css'

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { x: -12, opacity: 0 },
  visible: { x: 0, opacity: 1 },
}

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()

  const navItems = [
    { to: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { to: '/transactions', icon: FaExchangeAlt, label: 'Transactions' },
    { to: '/receipts', icon: FaReceipt, label: 'Receipt Scanner' },
    { to: '/intelligence', icon: FaBrain, label: 'AI Intelligence' },
    { to: '/reports', icon: FaChartPie, label: 'Reports' },
    { to: '/recurring', icon: FaSync, label: 'Recurring' },
  ]

  const hasAdminRole = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'SUPPORT'].includes(user?.role)
  if (hasAdminRole) {
    navItems.push({ to: '/admin/dashboard', icon: FaShieldAlt, label: 'Admin Portal' })
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className={`sidebar__overlay ${isOpen ? 'sidebar__overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.aside
        className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
        aria-label="Primary navigation"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Decorative top glow */}
        <div className="sidebar__glow" aria-hidden="true" />

        <nav className="sidebar__nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <motion.div key={to} variants={itemVariants}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                onClick={onClose}
              >
                <span className="sidebar__link-icon">
                  <Icon size={16} />
                </span>
                <span className="sidebar__link-label">{label}</span>
                <span className="sidebar__link-glow" aria-hidden="true" />
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <div className="sidebar__pulse-line" aria-hidden="true" />
          <div className="sidebar__footer-info">
            <span className="sidebar__footer-dot" />
            <span>Secure • JWT</span>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar
