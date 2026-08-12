import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { googleLogin } from '../../services/authService'

export default function GoogleAuthButton({ mode = 'login' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  const handleGoogleCredentialResponse = useCallback(
    async (credentialResponse) => {
      setLoading(true)
      setError('')
      try {
        const base64Url = credentialResponse.credential.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        )
        const payload = JSON.parse(jsonPayload)

        const response = await googleLogin({
          email: payload.email,
          name: payload.name,
          googleId: payload.sub,
          avatarUrl: payload.picture,
        })

        loginUser(
          {
            id: response.userId,
            name: response.name,
            email: response.email,
            defaultCurrency: response.defaultCurrency,
            avatarUrl: response.avatarUrl,
          },
          response.token,
          response.refreshToken,
        )
        navigate('/dashboard')
      } catch (err) {
        console.error('Google Auth Failed:', err)
        setError('Google Sign-In failed. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [loginUser, navigate],
  )

  useEffect(() => {
    if (!googleClientId) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [googleClientId, handleGoogleCredentialResponse])

  const handleDemoGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      const demoEmail = `google.user.${Math.floor(1000 + Math.random() * 9000)}@gmail.com`
      const response = await googleLogin({
        email: demoEmail,
        name: 'Google User',
        googleId: 'google-oauth-demo-12345',
        avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
      })

      loginUser(
        {
          id: response.userId,
          name: response.name,
          email: response.email,
          defaultCurrency: response.defaultCurrency,
        },
        response.token,
        response.refreshToken,
      )
      navigate('/dashboard')
    } catch (err) {
      console.error('Demo Google Auth Failed:', err)
      setError('Google auth failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerGoogleAuth = () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    } else {
      handleDemoGoogleSignIn()
    }
  }

  return (
    <div className="w-full space-y-2">
      {error && <div className="text-xs text-rose-400 text-center">{error}</div>}
      <button
        type="button"
        onClick={handleTriggerGoogleAuth}
        disabled={loading}
        className="w-full py-3.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 text-slate-100 text-sm font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-cyan-500/10 cursor-pointer disabled:opacity-50"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{loading ? 'Connecting Google...' : mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}</span>
      </button>
    </div>
  )
}
