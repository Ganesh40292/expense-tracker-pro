import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function NotFound() {
  return (
    <main className="auth-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <motion.div
        style={{
          textAlign: 'center',
          padding: '60px 40px',
          background: 'var(--card-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl)',
          backdropFilter: 'blur(20px)',
          boxShadow: 'var(--shadow-card)',
          maxWidth: 400,
          position: 'relative',
          zIndex: 1,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 style={{
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: -3,
          background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 8px',
        }}>
          404
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Page not found
        </p>
        <Link to="/dashboard" className="btn-primary">
          Go to Dashboard
        </Link>
      </motion.div>
    </main>
  )
}

export default NotFound
