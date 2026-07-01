import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaLock,
  FaShieldAlt,
  FaEnvelopeOpenText,
  FaUserSecret,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSync,
} from 'react-icons/fa'
import { getAdminAlerts } from '../../services/adminService'
import Loader from '../../components/Loader/Loader'
import './Admin.css'

const alertVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

const SecurityMonitoring = () => {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAlerts = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      const data = await getAdminAlerts()
      setAlerts(data || [])
    } catch (err) {
      console.error('Failed to load security alerts', err)
      setError('Could not retrieve threat warnings.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const securityStats = {
    totalAlerts: alerts.length,
    securityIssues: alerts.filter(a => a.type === 'SECURITY').length,
    systemIssues: alerts.filter(a => a.type === 'SYSTEM').length,
  }

  if (loading) return <Loader />

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Security & Threats</h1>
          <p className="admin-subtitle">Live tracking of brute-force lockouts, failed logins, and background job alerts</p>
        </div>
        <button
          onClick={() => fetchAlerts(true)}
          className="action-btn action-btn--secondary"
          disabled={refreshing}
        >
          <FaSync className={refreshing ? 'spin-animation' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
        </button>
      </div>

      {/* Security Statistics Cards */}
      <div className="admin-bento-grid">
        <div className="glass-card bento-card">
          <div className="bento-icon-container bento-icon-container--purple">
            <FaShieldAlt size={20} />
          </div>
          <div className="bento-content">
            <span className="bento-label">Active Threat Warnings</span>
            <span className="bento-value">{securityStats.totalAlerts}</span>
            <span className="bento-desc">In the last 24 hours</span>
          </div>
        </div>

        <div className="glass-card bento-card">
          <div className="bento-icon-container bento-icon-container--warning">
            <FaUserSecret size={20} />
          </div>
          <div className="bento-content">
            <span className="bento-label">Brute-Force lockouts</span>
            <span className="bento-value">{securityStats.securityIssues}</span>
            <span className="bento-desc">Login block triggers</span>
          </div>
        </div>

        <div className="glass-card bento-card">
          <div className="bento-icon-container bento-icon-container--blue">
            <FaEnvelopeOpenText size={20} />
          </div>
          <div className="bento-content">
            <span className="bento-label">SaaS Job Failures</span>
            <span className="bento-value">{securityStats.systemIssues}</span>
            <span className="bento-desc">Failed emails & background processes</span>
          </div>
        </div>
      </div>

      {/* Alert Feed Container */}
      <div className="security-feed-wrapper" style={{ marginTop: '24px' }}>
        <h3 className="section-title">Live Security Notification Feed</h3>

        {error && (
          <div className="glass-card error-card">
            <p>{error}</p>
          </div>
        )}

        <div className="security-alerts-feed">
          <AnimatePresence>
            {alerts.length > 0 ? (
              alerts.map((alert, idx) => (
                <motion.div
                  key={idx}
                  className={`security-alert-item glass-card alert-item--${alert.type.toLowerCase()}`}
                  variants={alertVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  layout
                >
                  <div className="alert-item-icon">
                    {alert.type === 'SECURITY' ? (
                      <FaLock className="icon-lock" />
                    ) : (
                      <FaExclamationTriangle className="icon-warn" />
                    )}
                  </div>
                  <div className="alert-item-body">
                    <div className="alert-item-title-row">
                      <span className="alert-item-title">{alert.title}</span>
                      <span className="alert-item-time">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                        {new Date(alert.timestamp).toLocaleDateString()})
                      </span>
                    </div>
                    <p className="alert-item-message">{alert.message}</p>
                  </div>
                  {alert.userId && (
                    <Link to={`/admin/users/${alert.userId}`} className="alert-inspect-btn">
                      Inspect Account
                    </Link>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="glass-card security-feed-empty">
                <FaCheckCircle size={32} className="success-icon" />
                <h4>No Threats Detected</h4>
                <p>All core platform operations are running safely. No failed login spikes or lockout alerts logged in the last 24h.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default SecurityMonitoring
