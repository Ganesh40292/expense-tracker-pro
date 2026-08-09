import { useMemo, useState, useEffect, useCallback } from 'react'
import { AuthContext } from './authContext'
import { logout as logoutApi } from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    if (!saved || saved === 'undefined') return null
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null
  })

  const [refreshToken, setRefreshToken] = useState(() => {
    return localStorage.getItem('refreshToken') || null
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    } else {
      localStorage.removeItem('refreshToken')
    }
  }, [refreshToken])

  const loginUser = useCallback((userData, jwtToken, jwtRefreshToken) => {
    setUser(userData)
    setToken(jwtToken)
    setRefreshToken(jwtRefreshToken || null)
  }, [])

  const logoutUser = useCallback(async () => {
    // Revoke the refresh token on the server before clearing local state
    const storedRefreshToken = localStorage.getItem('refreshToken')
    if (storedRefreshToken) {
      try {
        await logoutApi(storedRefreshToken)
      } catch {
        // If server revocation fails, still proceed with local logout
      }
    }

    setUser(null)
    setToken(null)
    setRefreshToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      refreshToken,
      isAuthenticated: Boolean(user && token),
      loginUser,
      logoutUser,
    }),
    [user, token, refreshToken, loginUser, logoutUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
