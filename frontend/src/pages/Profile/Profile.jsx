import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuth from '../../hooks/useAuth'
import useTransactions from '../../hooks/useTransactions'
import api from '../../services/api'
import { FaArrowLeft, FaUser, FaLock, FaCamera, FaDownload, FaUpload, FaDatabase, FaShieldAlt, FaCheckCircle } from 'react-icons/fa'
import { useToast } from '../../context/ToastContext'
import { downloadBackupJSON, restoreFromJSONFile } from '../../services/backupService'
import './Profile.css'

export default function Profile() {
  const { user, loginUser, token } = useAuth()
  const { transactions, fetchTransactions } = useTransactions()
  const { showToast } = useToast()

  const targetUserId = user?.id || user?.userId || 'me'

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

  // Backup & Restore state
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post(`/users/profile/${targetUserId}/avatar`, formData, {
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
      const response = await api.put(`/users/profile/${targetUserId}`, { name, email })
      loginUser(
        {
          ...user,
          id: response.data.id || user?.id || user?.userId,
          userId: response.data.id || user?.userId || user?.id,
          name: response.data.name,
          email: response.data.email,
          avatarUrl: response.data.avatarUrl || user?.avatarUrl,
        },
        token,
      )
      setMessage('Profile details updated successfully!')
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
      await api.put(`/users/password/${targetUserId}`, { currentPassword, newPassword })
      setPasswordMessage('Password updated successfully!')
      showToast('Password updated!', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password')
      showToast('Password update failed', 'error')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDownloadBackup = async () => {
    setBackupLoading(true)
    try {
      await downloadBackupJSON(user)
      showToast('JSON Database Backup downloaded successfully!', 'success')
    } catch {
      showToast('Failed to generate backup file', 'error')
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestoreJSON = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setRestoreLoading(true)
    try {
      const result = await restoreFromJSONFile(file)
      fetchTransactions && fetchTransactions()
      showToast(`Restored ${result.count} transactions successfully!`, 'success')
    } catch {
      showToast('Failed to restore backup file. Ensure valid JSON format.', 'error')
    } finally {
      setRestoreLoading(false)
      e.target.value = ''
    }
  }

  return (
    <motion.main
      className="page-glass profile-page space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">User Profile & Account Settings</h1>
          <p className="text-xs text-slate-400">Manage personal credentials, security preferences, and database backups</p>
        </div>
        <Link to="/dashboard" className="btn-secondary">
          <FaArrowLeft size={12} />
          Dashboard
        </Link>
      </div>

      {/* ── Hero Banner (Full Balanced Grid) ── */}
      <div className="profile-hero glass-card p-6 border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left Avatar + User Details */}
          <div className="md:col-span-2 flex flex-col sm:flex-row items-center sm:items-start gap-5">
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
                  className="profile-avatar-lg overflow-hidden w-20 h-20 rounded-2xl border-2 border-cyan-500/40 shadow-lg flex items-center justify-center bg-indigo-900/40 text-2xl font-extrabold text-white"
                  whileHover={{ scale: 1.05 }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </motion.div>
                <div className="absolute bottom-0 right-0 p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg border border-slate-800 transition-all">
                  <FaCamera size={12} />
                </div>
              </label>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl font-extrabold text-slate-100">{user?.name || 'User'}</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {user?.role || 'User'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> Account Active</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" /> Currency: {user?.defaultCurrency || 'INR'}</span>
              </div>
            </div>
          </div>

          {/* Right Balanced Stats Pills */}
          <div className="grid grid-cols-2 gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Logged Records</div>
              <div className="text-lg font-extrabold text-cyan-400 mt-0.5">{transactions?.length || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Security Level</div>
              <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <FaShieldAlt size={12} /> JWT Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-Column Balanced Equal Grid (Personal Info + Security) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Personal Information */}
        <div className="glass-card p-6 flex flex-col justify-between h-full border border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-5 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FaUser size={14} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Personal Information</h3>
                <p className="text-[11px] text-slate-400">Update your account name and email address</p>
              </div>
            </div>

            {message && (
              <motion.div
                className="profile-success mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FaCheckCircle size={14} />
                <span>{message}</span>
              </motion.div>
            )}
            {error && (
              <div className="auth-error mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form id="profile-details-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label htmlFor="profile-name" className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/60 focus:border-cyan-400 text-xs text-slate-100 outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-email" className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/60 focus:border-cyan-400 text-xs text-slate-100 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </form>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              form="profile-details-form"
              className="btn-primary w-full justify-center py-2.5 text-xs font-bold"
              disabled={loading}
            >
              <FaUser size={12} />
              {loading ? 'Saving Changes...' : 'Update Personal Details'}
            </button>
          </div>
        </div>

        {/* Right Column: Password & Security */}
        <div className="glass-card p-6 flex flex-col justify-between h-full border border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-5 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FaLock size={14} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Password & Security</h3>
                <p className="text-[11px] text-slate-400">Change your account password securely</p>
              </div>
            </div>

            {passwordMessage && (
              <div className="profile-success mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <FaCheckCircle size={14} />
                <span>{passwordMessage}</span>
              </div>
            )}
            {passwordError && (
              <div className="auth-error mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {passwordError}
              </div>
            )}

            <form id="profile-password-form" onSubmit={handlePasswordSubmit} className="space-y-3">
              <div className="form-group">
                <label htmlFor="current-pass" className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  id="current-pass"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700/60 focus:border-indigo-400 text-xs text-slate-100 outline-none transition-all"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-pass" className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  id="new-pass"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700/60 focus:border-indigo-400 text-xs text-slate-100 outline-none transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-pass" className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirm-pass"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700/60 focus:border-indigo-400 text-xs text-slate-100 outline-none transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </div>
            </form>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              form="profile-password-form"
              className="btn-primary w-full justify-center py-2.5 text-xs font-bold"
              disabled={passwordLoading}
            >
              <FaLock size={12} />
              {passwordLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Module 6: Data Backup, Encryption & Instant Restore ── */}
      <div className="glass-card p-6 border border-slate-800 bg-slate-900/60">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FaDatabase size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Encrypted Data Backup & Instant Restore</h3>
              <p className="text-xs text-slate-400">Export your complete financial records as JSON or restore state on new devices</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={backupLoading}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 flex items-center gap-2">
                <FaDownload size={13} className="text-emerald-400" />
                1-Click JSON Backup
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Download encrypted JSON export of all transactions & assets</div>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 shrink-0">
              {backupLoading ? 'Exporting...' : 'Export JSON'}
            </span>
          </button>

          <label className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group cursor-pointer flex items-center justify-between">
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreJSON}
              disabled={restoreLoading}
              className="hidden"
            />
            <div>
              <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 flex items-center gap-2">
                <FaUpload size={13} className="text-cyan-400" />
                Restore from Backup
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Upload previously exported JSON backup file</div>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30 shrink-0">
              {restoreLoading ? 'Restoring...' : 'Upload JSON'}
            </span>
          </label>
        </div>
      </div>
    </motion.main>
  )
}
