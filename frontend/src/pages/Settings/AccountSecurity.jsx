import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaLock, FaDesktop } from 'react-icons/fa'
import './Settings.css'

function AccountSecurity() {
  const [tab, setTab] = useState('security')

  return (
    <motion.main
      className="page-glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-header">
        <div>
          <h1>Account Security</h1>
          <p className="settings-subtitle">
            Manage passwords and active sessions
          </p>
        </div>
      </div>

      <div className="settings-tabs" role="tablist" aria-label="Security sections">
        <button
          type="button"
          className={tab === 'security' ? 'settings-tab settings-tab--active' : 'settings-tab'}
          onClick={() => setTab('security')}
        >
          <FaLock size={13} />
          Security
        </button>
        <button
          type="button"
          className={tab === 'sessions' ? 'settings-tab settings-tab--active' : 'settings-tab'}
          onClick={() => setTab('sessions')}
        >
          <FaDesktop size={13} />
          Sessions
        </button>
      </div>

      {tab === 'security' ? (
        <div className="glass-card settings-card">
          <div className="settings-card__inner">
            <h2>Change Password</h2>
            <p className="settings-muted">
              Not available yet. Add backend endpoint (<code>PUT /api/auth/password</code>) to complete.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="auth-form">
              <div className="form-group">
                <label>Current password</label>
                <input type="password" placeholder="••••••••" disabled />
              </div>
              <div className="form-group">
                <label>New password</label>
                <input type="password" placeholder="••••••••" disabled />
              </div>
              <div className="form-group">
                <label>Confirm new password</label>
                <input type="password" placeholder="••••••••" disabled />
              </div>
              <button type="submit" className="btn-primary" disabled>
                Save changes
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="glass-card settings-card">
          <div className="settings-card__inner">
            <h2>Active Sessions</h2>
            <p className="settings-muted">
              Implement endpoints to list and revoke sessions/tokens.
            </p>
            <button type="button" className="btn-primary" disabled>
              Sign out all sessions
            </button>
          </div>
        </div>
      )}
    </motion.main>
  )
}

export default AccountSecurity
