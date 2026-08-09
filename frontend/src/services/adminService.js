import api from './api'

export const getOverviewStats = async () => {
  const response = await api.get('/admin/dashboard/overview')
  return response.data
}

export const getPlatformAnalytics = async () => {
  const response = await api.get('/admin/dashboard/analytics')
  return response.data
}

export const getUsersList = async ({ search = '', role = '', enabled = '', page = 0, size = 10, sortBy = 'id', sortDir = 'asc' } = {}) => {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (role) params.append('role', role)
  if (enabled !== '') params.append('enabled', enabled)
  params.append('page', page)
  params.append('size', size)
  params.append('sortBy', sortBy)
  params.append('sortDir', sortDir)

  const response = await api.get(`/admin/users?${params.toString()}`)
  return response.data
}

export const getUserDetails = async (id) => {
  const response = await api.get(`/admin/users/${id}`)
  return response.data
}

export const changeUserRole = async (id, role) => {
  const response = await api.put(`/admin/users/${id}/role`, { role })
  return response.data
}

export const changeUserStatus = async (id, enabled) => {
  const response = await api.put(`/admin/users/${id}/status`, { enabled })
  return response.data
}

export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`)
  return response.data
}

export const getAuditLogs = async ({ search = '', action = '', startDate = '', endDate = '', page = 0, size = 10, sortBy = 'timestamp', sortDir = 'desc' } = {}) => {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (action) params.append('action', action)
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  params.append('page', page)
  params.append('size', size)
  params.append('sortBy', sortBy)
  params.append('sortDir', sortDir)

  const response = await api.get(`/admin/audit-logs?${params.toString()}`)
  return response.data
}

export const getSystemHealth = async () => {
  const response = await api.get('/admin/system/health')
  return response.data
}

export const getSystemSettings = async () => {
  const response = await api.get('/admin/system/settings')
  return response.data
}

export const updateSystemSettings = async (settings) => {
  const response = await api.put('/admin/system/settings', settings)
  return response.data
}

export const getAdminAlerts = async () => {
  const response = await api.get('/admin/notifications')
  return response.data
}
