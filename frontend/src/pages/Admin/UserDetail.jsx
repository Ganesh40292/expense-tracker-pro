import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaArrowLeft,
  FaUser,
  FaShieldAlt,
  FaHistory,
  FaDesktop,
  FaCoins,
  FaToggleOn,
  FaToggleOff,
} from 'react-icons/fa'
import { getUserDetails, changeUserStatus, changeUserRole } from '../../services/adminService'
import Loader from '../../components/Loader/Loader'
import { formatCurrency } from '../../utils/formatCurrency'
import './Admin.css'

const UserDetail = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getUserDetails(id)
      setData(res)
    } catch (err) {
      console.error('Failed to load user details', err)
      setError('User not found or database query failed.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchUserDetails()
  }, [fetchUserDetails])

  const handleStatusToggle = async () => {
    if (!data?.profile) return
    try {
      setUpdatingStatus(true)
      const nextStatus = !data.profile.enabled
      await changeUserStatus(id, nextStatus)
      setData(prev => ({
        ...prev,
        profile: { ...prev.profile, enabled: nextStatus }
      }))
    } catch (err) {
      console.error('Status update failed', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleRoleChange = async (newRole) => {
    if (!data?.profile) return
    try {
      await changeUserRole(id, newRole)
      setData(prev => ({
        ...prev,
        profile: { ...prev.profile, role: newRole }
      }))
    } catch (err) {
      console.error('Role update failed', err)
    }
  }

  if (loading) return <Loader />

  if (error || !data) {
    return (
      <div className="admin-container">
        <div className="glass-card error-card">
          <p>{error || 'An error occurred'}</p>
          <Link to="/admin/users" className="action-btn action-btn--secondary">
            <FaArrowLeft /> Back to Users
          </Link>
        </div>
      </div>
    )
  }

  const { profile, transactions, sessions, auditLogs } = data

  return (
    <div className="admin-container">
      {/* Back button and title */}
      <div className="admin-detail-header">
        <Link to="/admin/users" className="back-link">
          <FaArrowLeft /> Back to directory
        </Link>
        <div className="admin-header" style={{ marginTop: '12px', padding: 0 }}>
          <div>
            <h1 className="admin-title">Account Profile</h1>
            <p className="admin-subtitle">Inspecting user #{profile.id} activities and credentials</p>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="profile-grid">
        <motion.div
          className="glass-card profile-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-circle">
              <FaUser size={32} />
            </div>
            <h3>{profile.name}</h3>
            <span className="profile-badge-email">{profile.email}</span>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-row">
              <span>Account Status</span>
              <span className={`status-pill ${profile.enabled ? 'status-pill--active' : 'status-pill--inactive'}`}>
                {profile.enabled ? 'Active' : 'Deactivated'}
              </span>
            </div>
            
            <div className="profile-detail-row">
              <span>Security Role</span>
              <select
                value={profile.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="table-role-select"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="MODERATOR">Moderator</option>
                <option value="SUPPORT">Support</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div className="profile-detail-row">
              <span>Registered On</span>
              <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="profile-detail-row">
              <span>Last Active</span>
              <span>{profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'}</span>
            </div>

            <div className="profile-detail-row">
              <span>Preferred Currency</span>
              <span>{profile.defaultCurrency || 'INR'}</span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="profile-actions-panel">
            <button
              onClick={handleStatusToggle}
              disabled={updatingStatus}
              className={`action-btn ${profile.enabled ? 'action-btn--warning' : 'action-btn--primary'}`}
              style={{ width: '100%' }}
            >
              {profile.enabled ? <FaToggleOff /> : <FaToggleOn />}
              <span>{profile.enabled ? 'Deactivate Account' : 'Reactivate Account'}</span>
            </button>
          </div>
        </motion.div>

        {/* Sessions Tab */}
        <motion.div
          className="glass-card sessions-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header-with-icon">
            <FaDesktop className="card-header-icon" />
            <h3>Active Login Sessions</h3>
          </div>
          <div className="sessions-list scrollable-panel">
            {sessions && sessions.length > 0 ? (
              sessions.map(s => (
                <div key={s.id} className="session-item-row">
                  <div className="session-details">
                    <span className="session-device">{s.device_info}</span>
                    <span className="session-meta">IP: {s.ip_address} • Logged in: {new Date(s.created_at).toLocaleString()}</span>
                  </div>
                  <span className="session-expiry-badge">Expires {new Date(s.expiry_date).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <div className="empty-panel-fallback">
                <span>No active sessions found</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Transactions Table & Audit Trail Section */}
      <div className="user-details-tables-grid">
        {/* Transactions Card */}
        <motion.div
          className="glass-card details-table-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header-with-icon">
            <FaCoins className="card-header-icon" />
            <h3>Recent Transactions (Last 20)</h3>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions && transactions.length > 0 ? (
                  transactions.map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.transaction_date).toLocaleDateString()}</td>
                      <td className="detail-table-title">{t.title}</td>
                      <td>{t.category}</td>
                      <td>
                        <span className={`type-badge ${t.type.toLowerCase() === 'income' ? 'type-badge--income' : 'type-badge--expense'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`amount-cell ${t.type.toLowerCase() === 'income' ? 'amount-cell--income' : 'amount-cell--expense'}`}>
                        {formatCurrency(t.amount, t.currency)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-table-cell">No transactions recorded for this account</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Audit Log Card */}
        <motion.div
          className="glass-card details-table-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header-with-icon">
            <FaHistory className="card-header-icon" />
            <h3>Security & Audit Trail</h3>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map(l => (
                    <tr key={l.id}>
                      <td>{new Date(l.timestamp).toLocaleString()}</td>
                      <td>
                        <span className={`action-badge action-badge--${l.action.toLowerCase()}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="detail-table-desc">{l.details}</td>
                      <td>{l.ip_address || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-table-cell">No audit trails recorded for this account</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default UserDetail
