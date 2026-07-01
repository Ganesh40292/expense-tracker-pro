import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaLock,
  FaDesktop,
  FaBell,
  FaHistory,
  FaSignOutAlt,
  FaShieldAlt,
  FaMobileAlt,
  FaLaptop,
  FaGlobe,
  FaCheck,
  FaExclamationTriangle,
  FaKey,
  FaUserEdit,
  FaFileExport,
  FaTimesCircle,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa'
import { emailService } from '../../services/emailService'
import {
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  getAuditActivity,
} from '../../services/authService'
import api from '../../services/api'
import useAuth from '../../hooks/useAuth'
import './Settings.css'

function AccountSecurity() {
  const { user } = useAuth()
  const [tab, setTab] = useState('security')

  // ── Notification Preferences ──
  const [prefs, setPrefs] = useState({
    monthlySummaryEnabled: true,
    budgetAlertsEnabled: true,
    recurringRemindersEnabled: true,
  })
  const [loadingPrefs, setLoadingPrefs] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)

  // ── Password Change ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // ── Sessions ──
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sessionAction, setSessionAction] = useState(null)

  // ── Activity ──
  const [activity, setActivity] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  useEffect(() => {
    if (tab === 'notifications') loadPreferences()
    if (tab === 'sessions') loadSessions()
    if (tab === 'activity') loadActivity()
  }, [tab])

  // ── Notifications ──
  const loadPreferences = async () => {
    setLoadingPrefs(true)
    try {
      const data = await emailService.getPreferences()
      setPrefs(data)
    } catch {
      console.error('Failed to load preferences')
    } finally {
      setLoadingPrefs(false)
    }
  }

  const handlePrefChange = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const savePreferences = async () => {
    setSavingPrefs(true)
    try {
      await emailService.updatePreferences(prefs)
      alert('Preferences saved successfully!')
    } catch {
      alert('Failed to save preferences.')
    } finally {
      setSavingPrefs(false)
    }
  }

  // ── Password ──
  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' }
    let score = 0
    if (pw.length >= 8) score++
    if (pw.length >= 12) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    if (score <= 1) return { level: 1, label: 'Weak', color: 'var(--color-danger)' }
    if (score <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' }
    if (score <= 3) return { level: 3, label: 'Good', color: '#22c55e' }
    if (score <= 4) return { level: 4, label: 'Strong', color: '#10b981' }
    return { level: 5, label: 'Excellent', color: '#06d6a0' }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setPasswordLoading(true)
    try {
      await api.put(`/users/password/${user.id}`, {
        currentPassword,
        newPassword,
      })
      setPasswordMessage('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  // ── Sessions ──
  const loadSessions = async () => {
    setLoadingSessions(true)
    try {
      const data = await getActiveSessions()
      setSessions(data)
    } catch {
      console.error('Failed to load sessions')
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleRevokeSession = async (sessionId) => {
    setSessionAction(sessionId)
    try {
      await revokeSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch {
      alert('Failed to revoke session')
    } finally {
      setSessionAction(null)
    }
  }

  const handleRevokeAllOther = async () => {
    setSessionAction('all')
    try {
      await revokeAllOtherSessions()
      setSessions((prev) => prev.filter((s) => s.current))
    } catch {
      alert('Failed to revoke sessions')
    } finally {
      setSessionAction(null)
    }
  }

  const getDeviceIcon = (ua) => {
    if (!ua) return <FaGlobe />
    const lower = ua.toLowerCase()
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone'))
      return <FaMobileAlt />
    return <FaLaptop />
  }

  const parseDeviceInfo = (ua) => {
    if (!ua || ua === 'Unknown Device') return 'Unknown Device'
    if (ua.length > 60) return ua.substring(0, 57) + '...'
    return ua
  }

  // ── Activity ──
  const loadActivity = async () => {
    setLoadingActivity(true)
    try {
      const data = await getAuditActivity()
      setActivity(data)
    } catch {
      console.error('Failed to load activity')
    } finally {
      setLoadingActivity(false)
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return <FaCheck style={{ color: '#10b981' }} />
      case 'LOGIN_FAILED':
      case 'LOGIN_BLOCKED':
        return <FaExclamationTriangle style={{ color: 'var(--color-danger)' }} />
      case 'PASSWORD_CHANGED':
      case 'PASSWORD_RESET':
        return <FaKey style={{ color: '#f59e0b' }} />
      case 'PROFILE_UPDATED':
        return <FaUserEdit style={{ color: 'var(--color-primary)' }} />
      case 'EXPORT_PDF':
      case 'EXPORT_EXCEL':
        return <FaFileExport style={{ color: '#8b5cf6' }} />
      case 'REGISTER':
        return <FaShieldAlt style={{ color: '#06d6a0' }} />
      default:
        return <FaHistory style={{ color: 'var(--text-secondary)' }} />
    }
  }

  const getActionLabel = (action) => {
    const labels = {
      LOGIN_SUCCESS: 'Signed in',
      LOGIN_FAILED: 'Failed login attempt',
      LOGIN_BLOCKED: 'Login blocked (locked)',
      PASSWORD_CHANGED: 'Password changed',
      PASSWORD_RESET: 'Password reset',
      PROFILE_UPDATED: 'Profile updated',
      EXPORT_PDF: 'PDF report exported',
      EXPORT_EXCEL: 'Excel report exported',
      REGISTER: 'Account created',
      LOGOUT: 'Signed out',
    }
    return labels[action] || action
  }

  const timeAgo = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = (now - date) / 1000

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
  }

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
          <p className="settings-subtitle">Manage passwords, sessions, and security preferences</p>
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
        <button
          type="button"
          className={tab === 'activity' ? 'settings-tab settings-tab--active' : 'settings-tab'}
          onClick={() => setTab('activity')}
        >
          <FaHistory size={13} />
          Activity
        </button>
        <button
          type="button"
          className={tab === 'notifications' ? 'settings-tab settings-tab--active' : 'settings-tab'}
          onClick={() => setTab('notifications')}
        >
          <FaBell size={13} />
          Notifications
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ═══ SECURITY TAB ═══ */}
        {tab === 'security' && (
          <motion.div
            key="security"
            className="glass-card settings-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="settings-card__inner">
              <h2>Change Password</h2>
              <p className="settings-muted">
                Choose a strong password with at least 8 characters.
              </p>

              {passwordMessage && (
                <div className="security-alert security-alert--success">
                  <FaCheck size={14} />
                  {passwordMessage}
                </div>
              )}
              {passwordError && (
                <div className="security-alert security-alert--error">
                  <FaExclamationTriangle size={14} />
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="auth-form">
                <div className="form-group">
                  <label>Current password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      tabIndex={-1}
                    >
                      {showCurrentPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPw(!showNewPw)}
                      tabIndex={-1}
                    >
                      {showNewPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="password-strength">
                      <div className="password-strength-bar">
                        <div
                          className="password-strength-fill"
                          style={{
                            width: `${(passwordStrength.level / 5) * 100}%`,
                            backgroundColor: passwordStrength.color,
                          }}
                        />
                      </div>
                      <span
                        className="password-strength-label"
                        style={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Confirm new password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      tabIndex={-1}
                    >
                      {showConfirmPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ═══ SESSIONS TAB ═══ */}
        {tab === 'sessions' && (
          <motion.div
            key="sessions"
            className="glass-card settings-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="settings-card__inner">
              <div className="sessions-header">
                <div>
                  <h2>Active Sessions</h2>
                  <p className="settings-muted">
                    Manage devices where you&apos;re currently signed in.
                  </p>
                </div>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    className="btn-danger-outline"
                    onClick={handleRevokeAllOther}
                    disabled={sessionAction === 'all'}
                  >
                    <FaSignOutAlt size={13} />
                    {sessionAction === 'all' ? 'Revoking...' : 'Sign out all other'}
                  </button>
                )}
              </div>

              {loadingSessions ? (
                <div className="sessions-loading">
                  <div className="spinner" />
                  <p>Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <p className="settings-muted" style={{ padding: '24px 0' }}>
                  No active sessions found.
                </p>
              ) : (
                <div className="sessions-list">
                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      className={`session-card ${session.current ? 'session-card--current' : ''}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      layout
                    >
                      <div className="session-icon">{getDeviceIcon(session.deviceInfo)}</div>
                      <div className="session-info">
                        <div className="session-device">
                          {parseDeviceInfo(session.deviceInfo)}
                          {session.current && (
                            <span className="session-badge">This device</span>
                          )}
                        </div>
                        <div className="session-meta">
                          <span>{session.ipAddress}</span>
                          <span className="session-dot">·</span>
                          <span>{timeAgo(session.createdAt)}</span>
                        </div>
                      </div>
                      {!session.current && (
                        <button
                          type="button"
                          className="session-revoke-btn"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={sessionAction === session.id}
                          title="Revoke session"
                        >
                          {sessionAction === session.id ? (
                            <div className="spinner-sm" />
                          ) : (
                            <FaTimesCircle size={16} />
                          )}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ ACTIVITY TAB ═══ */}
        {tab === 'activity' && (
          <motion.div
            key="activity"
            className="glass-card settings-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="settings-card__inner">
              <h2>Recent Activity</h2>
              <p className="settings-muted">
                Your account activity from the last 50 events.
              </p>

              {loadingActivity ? (
                <div className="sessions-loading">
                  <div className="spinner" />
                  <p>Loading activity...</p>
                </div>
              ) : activity.length === 0 ? (
                <p className="settings-muted" style={{ padding: '24px 0' }}>
                  No activity recorded yet.
                </p>
              ) : (
                <div className="activity-timeline">
                  {activity.map((event, index) => (
                    <motion.div
                      key={event.id || index}
                      className="activity-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <div className="activity-icon-wrapper">{getActionIcon(event.action)}</div>
                      <div className="activity-content">
                        <div className="activity-action">{getActionLabel(event.action)}</div>
                        {event.details && (
                          <div className="activity-details">{event.details}</div>
                        )}
                        <div className="activity-meta">
                          <span>{timeAgo(event.timestamp)}</span>
                          {event.ipAddress && (
                            <>
                              <span className="session-dot">·</span>
                              <span>{event.ipAddress}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ NOTIFICATIONS TAB ═══ */}
        {tab === 'notifications' && (
          <motion.div
            key="notifications"
            className="glass-card settings-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="settings-card__inner">
              <h2>Email Preferences</h2>
              <p className="settings-muted">
                Control what types of emails you receive from us.
              </p>
              {loadingPrefs ? (
                <div className="sessions-loading">
                  <div className="spinner" />
                  <p>Loading preferences...</p>
                </div>
              ) : (
                <div className="auth-form" style={{ marginTop: '24px' }}>
                  <div className="pref-row">
                    <div>
                      <strong className="pref-title">Monthly Financial Summary</strong>
                      <span className="settings-muted pref-desc">
                        Receive a comprehensive snapshot of your finances every month.
                      </span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={prefs.monthlySummaryEnabled}
                        onChange={() => handlePrefChange('monthlySummaryEnabled')}
                      />
                      <span className="slider round" />
                    </label>
                  </div>

                  <div className="pref-row">
                    <div>
                      <strong className="pref-title">Budget Alerts</strong>
                      <span className="settings-muted pref-desc">
                        Get notified instantly when you exceed category budgets.
                      </span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={prefs.budgetAlertsEnabled}
                        onChange={() => handlePrefChange('budgetAlertsEnabled')}
                      />
                      <span className="slider round" />
                    </label>
                  </div>

                  <div className="pref-row" style={{ marginBottom: '24px' }}>
                    <div>
                      <strong className="pref-title">Recurring Reminders</strong>
                      <span className="settings-muted pref-desc">
                        Receive heads-up emails for upcoming automated payments.
                      </span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={prefs.recurringRemindersEnabled}
                        onChange={() => handlePrefChange('recurringRemindersEnabled')}
                      />
                      <span className="slider round" />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={savePreferences}
                    disabled={savingPrefs}
                  >
                    {savingPrefs ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}

export default AccountSecurity
