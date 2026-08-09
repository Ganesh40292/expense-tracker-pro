import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { emailService } from '../../services/emailService'
// You can reuse Login.css or add your own global auth styles here

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await emailService.forgotPassword(email)
      setStatus('success')
      setMessage(response)
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || 'Failed to send reset link. Please try again.')
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
            Forgot Password?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            Don't worry! Enter your email and we'll send you a link to reset your password.
          </motion.p>
        </div>
      </div>
      <div className="auth-form-container">
        <div className="auth-card">
          <h1>Reset Password</h1>
          <p className="auth-subtitle">Get back to tracking your finances</p>

          {status === 'success' ? (
            <div className="auth-success" style={{ color: 'var(--success-color)', padding: '16px', background: 'rgba(52,211,153,0.1)', borderRadius: '8px', marginBottom: '16px' }}>
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              {status === 'error' && <div className="auth-error">{message}</div>}

              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="auth-footer">
            Remembered your password? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default ForgotPassword

