import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../../hooks/useAuth'
import api from '../../services/api'
import { FaArrowLeft, FaUser, FaLock, FaCamera } from 'react-icons/fa'
import { useToast } from '../../context/ToastContext'
import './Profile.css'

function Profile() {
  const { user, loginUser, token } = useAuth()
  const { showToast } = useToast()
  const [name, setName] = useState(() => user?.name || '')
  const [email, setEmail] = useState(() => user?.email || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post(`/users/profile/${user.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      loginUser({ ...user, avatarUrl: res.data.avatarUrl }, token)
      showToast('Profile picture updated!', 'success')
    } catch {
      showToast('Failed to upload profile picture', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

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
          avatarUrl: response.data.avatarUrl || user?.avatarUrl,
        },
        token,
      )
      setMessage('Profile updated successfully!')
      showToast('Profile updated!', 'success')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
      showToast('Profile update failed', 'error')
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
      className="page-glass profile-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-header">
        <div>
          <h1>User Profile</h1>
          <p className="text-xs text-slate-400">Manage your personal information, security, and account preferences</p>
        </div>
        <Link to="/dashboard" className="btn-secondary">
          <FaArrowLeft size={12} />
          Dashboard
        </Link>
      </div>

      {/* ── Profile Hero Header ── */}
      <div className="profile-hero glass-card mb-6 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group cursor-pointer shrink-0">
            <input
              type="file"
              accept="image/*"
              id="avatar-upload-input"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
              className="hidden"
            />
            <label htmlFor="avatar-upload-input" className="cursor-pointer block relative">
              <motion.div
                className="profile-avatar-lg overflow-hidden"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
                <div className="profile-avatar-lg__ring" aria-hidden="true" />
              </motion.div>
              <div className="absolute bottom-0 right-0 p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg border border-slate-800 transition-all">
                <FaCamera className="w-3.5 h-3.5" />
              </div>
            </label>
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h2 className="text-xl font-bold text-slate-100">{user?.name || 'User'}</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {user?.role || 'User'}
              </span>
            </div>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Account Active</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Currency: {user?.defaultCurrency || 'INR'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info Card */}
        <div className="profile-card glass-card p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <FaUser className="text-cyan-400" size={16} />
            <h3 className="text-base font-bold text-slate-100">Personal Information</h3>
          </div>

          {message && (
            <motion.div
              className="profile-success mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message}
            </motion.div>
          )}
          {error && <div className="auth-error mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form space-y-4">
            <div className="form-group">
              <label htmlFor="profile-name" className="text-xs font-semibold text-slate-300">Full Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-email" className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              <FaUser size={12} />
              {loading ? 'Saving...' : 'Update Details'}
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <FaLock className="text-cyan-400" size={16} />
            <h3 className="text-base font-bold text-slate-100">Password & Security</h3>
          </div>

          {passwordMessage && (
            <div className="profile-success mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs">
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div className="auth-error mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="auth-form space-y-4">
            <div className="form-group">
              <label htmlFor="current-pass" className="text-xs font-semibold text-slate-300">Current Password</label>
              <input
                id="current-pass"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={passwordLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-pass" className="text-xs font-semibold text-slate-300">New Password</label>
              <input
                id="new-pass"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={passwordLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-pass" className="text-xs font-semibold text-slate-300">Confirm New Password</label>
              <input
                id="confirm-pass"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={passwordLoading}
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={passwordLoading}>
              <FaLock size={12} />
              {passwordLoading ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </motion.main>
  )
}

export default Profile
