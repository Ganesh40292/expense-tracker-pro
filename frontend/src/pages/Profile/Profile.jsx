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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Left Column: Personal Information */}
        <div className="glass-card p-8 sm:p-10 flex flex-col justify-between h-full border border-slate-700/80 rounded-3xl text-center bg-slate-900/90 shadow-2xl">
          <div>
            <div className="flex flex-col items-center justify-center text-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <FaUser size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-100">Personal Information</h3>
                <p className="text-sm text-slate-300 mt-0.5">Update your account name and email address</p>
              </div>
            </div>

            {message && (
              <motion.div
                className="profile-success mb-5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FaCheckCircle size={16} />
                <span>{message}</span>
              </motion.div>
            )}
            {error && (
              <div className="auth-error mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm text-center">
                {error}
              </div>
            )}

            <form id="profile-details-form" onSubmit={handleSubmit} className="space-y-5 text-center">
              <div className="form-group text-center">
                <label htmlFor="profile-name" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 text-center">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 text-sm text-slate-100 outline-none text-center font-semibold transition-all shadow-inner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group text-center">
                <label htmlFor="profile-email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 text-center">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 text-sm text-slate-100 outline-none text-center font-mono font-semibold transition-all shadow-inner"
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
              className="btn-primary w-full justify-center py-3.5 text-sm font-bold rounded-2xl shadow-lg"
              disabled={loading}
            >
              <FaUser size={14} />
              {loading ? 'Saving Changes...' : 'Update Personal Details'}
            </button>
          </div>
        </div>

        {/* Right Column: Password & Security */}
        <div className="glass-card p-8 sm:p-10 flex flex-col justify-between h-full border border-slate-700/80 rounded-3xl text-center bg-slate-900/90 shadow-2xl">
          <div>
            <div className="flex flex-col items-center justify-center text-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <FaLock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-100">Password & Security</h3>
                <p className="text-sm text-slate-300 mt-0.5">Change your account password securely</p>
              </div>
            </div>

            {passwordMessage && (
              <div className="profile-success mb-5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-center gap-2">
                <FaCheckCircle size={16} />
                <span>{passwordMessage}</span>
              </div>
            )}
            {passwordError && (
              <div className="auth-error mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm text-center">
                {passwordError}
              </div>
            )}

            <form id="profile-password-form" onSubmit={handlePasswordSubmit} className="space-y-4 text-center">
              <div className="form-group text-center">
                <label htmlFor="current-pass" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 text-center">
                  Current Password
                </label>
                <input
                  id="current-pass"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 focus:border-indigo-400 text-sm text-slate-100 outline-none text-center font-semibold transition-all shadow-inner"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group text-center">
                <label htmlFor="new-pass" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 text-center">
                  New Password
                </label>
                <input
                  id="new-pass"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 focus:border-indigo-400 text-sm text-slate-100 outline-none text-center font-semibold transition-all shadow-inner"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </div>

              <div className="form-group text-center">
                <label htmlFor="confirm-pass" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 text-center">
                  Confirm New Password
                </label>
                <input
                  id="confirm-pass"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 focus:border-indigo-400 text-sm text-slate-100 outline-none text-center font-semibold transition-all shadow-inner"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
              </div>
            </form>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              form="profile-password-form"
              className="btn-primary w-full justify-center py-3.5 text-sm font-bold rounded-2xl shadow-lg"
              disabled={passwordLoading}
            >
              <FaLock size={14} />
              {passwordLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Module 6: Data Backup, Encryption & Instant Restore (Photo 1 Upgrade) ── */}
      <div className="glass-card p-8 sm:p-10 border border-slate-700/80 bg-slate-900/90 rounded-3xl shadow-2xl space-y-6 text-center">
        <div className="flex flex-col items-center justify-center text-center gap-3 border-b border-slate-800 pb-5">
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <FaDatabase size={24} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-100">Encrypted Data Backup & Instant Restore</h3>
            <p className="text-sm text-slate-300 mt-1">
              Export your complete financial records as JSON or restore your database state onto new devices
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/40 text-center transition-all flex flex-col justify-between space-y-4 shadow-lg">
            <div className="space-y-2">
              <div className="text-base font-extrabold text-slate-100 flex items-center justify-center gap-2">
                <FaDownload size={16} className="text-emerald-400" /> 1-Click JSON Backup
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download an encrypted JSON backup file containing all your transactions, assets, debts, and recurring bills.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              className="btn-primary w-full justify-center py-3 text-xs font-bold rounded-2xl shadow-md cursor-pointer"
            >
              {backupLoading ? 'Exporting...' : 'Export Full JSON Backup'}
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/40 text-center transition-all flex flex-col justify-between space-y-4 shadow-lg">
            <div className="space-y-2">
              <div className="text-base font-extrabold text-slate-100 flex items-center justify-center gap-2">
                <FaUpload size={16} className="text-cyan-400" /> Restore from Backup
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload a previously exported JSON backup file to instantly restore your financial records.
              </p>
            </div>
            <label className="btn-secondary w-full justify-center py-3 text-xs font-bold rounded-2xl shadow-md cursor-pointer inline-flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreJSON}
                disabled={restoreLoading}
                className="hidden"
              />
              {restoreLoading ? 'Restoring Data...' : 'Upload JSON File'}
            </label>
          </div>
        </div>
      </div>
    </motion.main>
  )
}
