import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../../hooks/useAuth'
import api from '../../services/api'
import { FaArrowLeft, FaUser, FaLock } from 'react-icons/fa'
import './Profile.css'

function Profile() {
  const { user, loginUser, token } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)

    try {
      const response = await api.put(`/users/profile/${user.id}`, { name, email })
      loginUser(
        {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
        },
        token,
      )
      setMessage('Profile updated successfully!')
      setShowPasswordSection(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    setPasswordLoading(true)

    try {
      await api.put(`/users/password/${user.id}`, { currentPassword, newPassword })
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

  return (
    <motion.main
      className="page-glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-header">
        <h1>Profile</h1>
        <Link to="/dashboard" className="btn-secondary">
          <FaArrowLeft size={12} />
          Dashboard
        </Link>
      </div>

      {/* ── Profile Info Card ── */}
      <div className="profile-card glass-card">
        <div className="profile-card__inner">
          <motion.div
            className="profile-avatar-lg"
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            <div className="profile-avatar-lg__ring" aria-hidden="true" />
          </motion.div>

          {message && (
            <motion.div
              className="profile-success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message}
            </motion.div>
          )}
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              <FaUser size={12} />
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Password Section (Visible after update) ── */}
      {showPasswordSection && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: 10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ overflow: 'hidden' }}
        >
          <div className="glass-card profile-security__card" style={{ marginTop: '24px' }}>
            <div className="profile-security__card-inner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <FaLock size={16} color="var(--primary)" />
                <h3 style={{ margin: 0, color: 'var(--text)' }}>Change Password</h3>
              </div>
              
              {passwordMessage && (
                <div className="profile-success" style={{ marginBottom: '16px' }}>
                  {passwordMessage}
                </div>
              )}
              {passwordError && (
                <div className="auth-error" style={{ marginBottom: '16px' }}>
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="auth-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={passwordLoading}>
                  <FaLock size={12} />
                  {passwordLoading ? 'Saving...' : 'Save Password'}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      )}

    </motion.main>
  )
}

export default Profile
