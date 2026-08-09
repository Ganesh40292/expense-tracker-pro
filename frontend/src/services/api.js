import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Flag to prevent multiple simultaneous refresh attempts ──
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// ── Request Interceptor: Attach access token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response Interceptor: Handle token refresh ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Check if this is an expired token response
    const isTokenExpired =
      error.response &&
      error.response.status === 401 &&
      error.response.headers['x-token-expired'] === 'true'

    // Don't intercept refresh/login/register requests
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')

    if (isTokenExpired && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request — it'll be retried after the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        // No refresh token — force logout
        clearAuthAndRedirect()
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data

        // Update stored tokens
        localStorage.setItem('token', newAccessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // Update the user object in localStorage with new data
        const userData = {
          userId: response.data.userId,
          name: response.data.name,
          email: response.data.email,
          defaultCurrency: response.data.defaultCurrency,
        }
        localStorage.setItem('user', JSON.stringify(userData))

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        // Process queued requests
        processQueue(null, newAccessToken)

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuthAndRedirect()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Regular 401 (not expired token) — force logout
    if (
      error.response &&
      error.response.status === 401 &&
      !isAuthEndpoint
    ) {
      clearAuthAndRedirect()
    }

    return Promise.reject(error)
  },
)

function clearAuthAndRedirect() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export default api
