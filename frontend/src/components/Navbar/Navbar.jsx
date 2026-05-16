import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUserCircle, FaBell, FaSignOutAlt, FaUser, FaDesktop } from 'react-icons/fa'
import useAuth from '../../hooks/useAuth'
import './Navbar.css'

const Navbar = () => {
  const { user, logoutUser } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setProfileOpen(false)
    logoutUser()
  }

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="navbar__left">
        <Link to="/dashboard" className="navbar__brand">
          <div className="navbar__brand-icon" aria-hidden="true">
            <span className="brand-dot brand-dot--a" />
            <span className="brand-dot brand-dot--b" />
            <span className="brand-dot brand-dot--c" />
          </div>
          <div className="navbar__brand-text">
            <span className="navbar__brand-name">ExpenseTracker</span>
          </div>
        </Link>

        <div className="navbar__pills" aria-hidden="true">
          <span className="status-pill">
            <span className="status-pill__dot" />
            Live
          </span>
        </div>
      </div>

      <div className="navbar__right">
        {user ? (
          <div className="navbar__user">
            <motion.button
              type="button"
              className="navbar__icon-btn"
              aria-label="Notifications"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaBell size={15} />
              <span className="navbar__icon-btn-ping" />
            </motion.button>

            {/* Profile trigger + dropdown */}
            <div className="navbar__profile-wrapper" ref={dropdownRef}>
              <motion.button
                type="button"
                className={`navbar__profile ${profileOpen ? 'navbar__profile--open' : ''}`}
                onClick={() => setProfileOpen((prev) => !prev)}
                whileTap={{ scale: 0.97 }}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <div className="navbar__avatar" aria-hidden="true">
                  <FaUserCircle size={20} />
                </div>
                <div className="navbar__profile-info">
                  <div className="navbar__profile-name">{user.name}</div>
                  <div className="navbar__profile-email">{user.email}</div>
                </div>
                <span className={`navbar__chevron ${profileOpen ? 'navbar__chevron--open' : ''}`}>
                  ▾
                </span>
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="navbar__dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* User info header */}
                    <div className="navbar__dropdown-header">
                      <div className="navbar__dropdown-avatar">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="navbar__dropdown-name">{user.name}</div>
                        <div className="navbar__dropdown-email">{user.email}</div>
                      </div>
                    </div>

                    <div className="navbar__dropdown-divider" />

                    {/* Links */}
                    <Link
                      to="/profile"
                      className="navbar__dropdown-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <FaUser size={13} />
                      <span>Profile</span>
                    </Link>

                    <div className="navbar__dropdown-divider" />

                    {/* Session Management */}
                    <div className="navbar__dropdown-section-title">Session Management</div>

                    <button
                      type="button"
                      className="navbar__dropdown-item navbar__dropdown-item--danger"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt size={13} />
                      <span>Log out</span>
                    </button>

                    <button
                      type="button"
                      className="navbar__dropdown-item navbar__dropdown-item--danger"
                      onClick={handleLogout}
                    >
                      <FaDesktop size={13} />
                      <span>Sign out of all accounts</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="navbar__auth-links">
            <Link to="/login" className="btn-secondary">Login</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </div>
        )}
      </div>
    </motion.nav>
  )
}

export default Navbar
