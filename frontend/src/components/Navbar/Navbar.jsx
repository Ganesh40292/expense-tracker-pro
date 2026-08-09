import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUserCircle, FaBell, FaSignOutAlt, FaUser, FaDesktop, FaBars, FaTimes, FaCheckDouble } from 'react-icons/fa'
import useAuth from '../../hooks/useAuth'
import useTransactions from '../../hooks/useTransactions'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import CurrencySelector from '../CurrencySelector/CurrencySelector'
import './Navbar.css'

const Navbar = ({ onToggleSidebar, onOpenCommandPalette }) => {
  const { user, logoutUser } = useAuth()
  const { transactions } = useTransactions()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [readIds, setReadIds] = useState([])
  const dropdownRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const notifRef = useRef(null)

  // Build notifications from recent transactions
  const notifications = (transactions || []).slice(0, 8).map((tx) => ({
    id: tx.id,
    title: tx.type === 'INCOME' ? `Income: ${tx.title}` : `Expense: ${tx.title}`,
    detail: `₹${Number(tx.amount).toLocaleString('en-IN')} — ${tx.category}`,
    date: tx.transactionDate,
    type: tx.type,
  }))

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length
  const handleMarkAllRead = () => setReadIds(notifications.map((n) => n.id))
  const location = useLocation()

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && !e.target.closest('.navbar__hamburger')) {
        setMobileMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* Close mobile menu on route change */
  useEffect(() => {
    Promise.resolve().then(() => {
      setMobileMenuOpen(false)
      setProfileOpen(false)
    })
  }, [location.pathname])

  const handleLogout = () => {
    setProfileOpen(false)
    setMobileMenuOpen(false)
    logoutUser()
  }

  const handleHamburgerClick = () => {
    if (onToggleSidebar) {
      onToggleSidebar()
    } else {
      setMobileMenuOpen((prev) => !prev)
    }
  }

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="navbar__left">
        {/* Hamburger — visible only on mobile */}
        <button
          type="button"
          className="navbar__hamburger"
          onClick={handleHamburgerClick}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>

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

          <button
            type="button"
            onClick={() => onOpenCommandPalette && onOpenCommandPalette()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-medium transition-all shadow-inner ml-3 cursor-pointer"
          >
            <span className="text-cyan-400 font-bold">⌘</span>
            <span className="hidden sm:inline">Search...</span>
            <kbd className="px-1 py-0.5 text-[10px] bg-slate-800 rounded border border-slate-700 text-slate-400 font-mono">Ctrl K</kbd>
          </button>
        </div>
      </div>

      {/* Desktop right section */}
      <div className="navbar__right navbar__right--desktop">
        {user ? (
          <div className="navbar__user">
            <ThemeToggle />
            <CurrencySelector />

            <div className="navbar__notif-wrapper" ref={notifRef}>
              <motion.button
                type="button"
                className="navbar__icon-btn"
                aria-label="Notifications"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotifOpen((prev) => !prev)}
              >
                <FaBell size={15} />
                {unreadCount > 0 && <span className="navbar__icon-btn-ping" />}
              </motion.button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    className="navbar__notif-dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="navbar__notif-header">
                      <span className="navbar__notif-title">Notifications</span>
                      {unreadCount > 0 && (
                        <button type="button" className="navbar__notif-mark-btn" onClick={handleMarkAllRead}>
                          <FaCheckDouble size={11} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="navbar__notif-list">
                      {notifications.length === 0 ? (
                        <div className="navbar__notif-empty">
                          <FaBell size={20} style={{ opacity: 0.3 }} />
                          <span>No notifications yet</span>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`navbar__notif-item ${readIds.includes(n.id) ? 'navbar__notif-item--read' : ''}`}
                          >
                            <div className={`navbar__notif-dot ${n.type === 'INCOME' ? 'navbar__notif-dot--income' : 'navbar__notif-dot--expense'}`} />
                            <div className="navbar__notif-content">
                              <span className="navbar__notif-item-title">{n.title}</span>
                              <span className="navbar__notif-item-detail">{n.detail}</span>
                            </div>
                            <span className="navbar__notif-item-date">{n.date}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-cyan-500/40" />
                  ) : (
                    <FaUserCircle size={20} />
                  )}
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
            <ThemeToggle />
            <Link to="/login" className="btn-secondary">Login</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </div>
        )}
      </div>

      {/* Mobile right section — notification + avatar only */}
      <div className="navbar__right navbar__right--mobile">
        {user && (
          <>
            <ThemeToggle />
            <CurrencySelector />

            <motion.button
              type="button"
              className="navbar__icon-btn"
              aria-label="Notifications"
              whileTap={{ scale: 0.95 }}
              onClick={() => setNotifOpen((prev) => !prev)}
            >
              <FaBell size={15} />
              {unreadCount > 0 && <span className="navbar__icon-btn-ping" />}
            </motion.button>

            <div className="navbar__profile-wrapper" ref={dropdownRef}>
              <motion.button
                type="button"
                className="navbar__profile navbar__profile--compact"
                onClick={() => setProfileOpen((prev) => !prev)}
                whileTap={{ scale: 0.97 }}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <div className="navbar__avatar" aria-hidden="true">
                  <FaUserCircle size={20} />
                </div>
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

                    <Link
                      to="/profile"
                      className="navbar__dropdown-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <FaUser size={13} />
                      <span>Profile</span>
                    </Link>

                    <div className="navbar__dropdown-divider" />

                    <div className="navbar__dropdown-section-title">Session Management</div>

                    <button
                      type="button"
                      className="navbar__dropdown-item navbar__dropdown-item--danger"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt size={13} />
                      <span>Log out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
        {!user && (
          <div className="navbar__auth-links">
            <ThemeToggle />
            <Link to="/login" className="btn-secondary">Login</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </div>
        )}
      </div>
    </motion.nav>
  )
}

export default Navbar
