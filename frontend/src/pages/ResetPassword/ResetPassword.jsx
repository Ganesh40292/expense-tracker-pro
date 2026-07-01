import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { emailService } from '../../services/emailService'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid or missing reset token.')
    }
  }, [token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('Passwords do not match.')
      return
    }
    
    if (password.length < 6) {
      setStatus('error')
      setMessage('Password must be at least 6 characters.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await emailService.resetPassword(token, password)
      setStatus('success')
      setMessage(response)
      
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || 'Failed to reset password. Token may be expired.')
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-sidebar">
        <div className="auth-sidebar-content">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            Secure Your Account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            Choose a strong new password to protect your financial data.
          </motion.p>
        </div>
      </div>
      <div className="auth-form-container">
        <div className="auth-card">
          <h1>Create New Password</h1>
          <p className="auth-subtitle">Enter your new password below</p>

          {status === 'success' ? (
            <div className="auth-success" style={{ color: 'var(--success-color)', padding: '16px', background: 'rgba(52,211,153,0.1)', borderRadius: '8px', marginBottom: '16px' }}>
              {message} Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              {status === 'error' && <div className="auth-error">{message}</div>}

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === 'loading' || !token}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={status === 'loading' || !token}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={status === 'loading' || !token}>
                {status === 'loading' ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="auth-footer">
            <Link to="/login">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default ResetPassword
