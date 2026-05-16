import api from './api'

export const getMonthlyReport = async (userId) => {
  const response = await api.get(`/reports/monthly/${userId}`)
  return response.data
}

export const getExpenseSummary = async (userId) => {
  const response = await api.get(`/reports/summary/${userId}`)
  return response.data
}
