import api from './api'

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials)
  return response.data
}

export const register = async (payload) => {
  const response = await api.post('/auth/register', payload)
  return response.data
}

export const refreshToken = async (refreshToken) => {
  const response = await api.post('/auth/refresh', { refreshToken })
  return response.data
}

export const logout = async (refreshToken) => {
  const response = await api.post('/auth/logout', { refreshToken })
  return response.data
}

export const logoutAll = async () => {
  const response = await api.post('/auth/logout-all')
  return response.data
}

export const getActiveSessions = async () => {
  const response = await api.get('/sessions')
  return response.data
}

export const revokeSession = async (sessionId) => {
  const response = await api.delete(`/sessions/${sessionId}`)
  return response.data
}

export const revokeAllOtherSessions = async () => {
  const response = await api.delete('/sessions')
  return response.data
}

export const getAuditActivity = async () => {
  const response = await api.get('/audit/activity')
  return response.data
}
