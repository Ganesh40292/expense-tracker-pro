import api from './api'

export const createRecurringExpense = async (request) => {
  const response = await api.post('/v1/recurring', request)
  return response.data
}

export const getUserRecurringExpenses = async () => {
  const response = await api.get('/v1/recurring')
  return response.data
}

export const updateRecurringExpense = async (id, request) => {
  const response = await api.put(`/v1/recurring/${id}`, request)
  return response.data
}

export const deleteRecurringExpense = async (id) => {
  const response = await api.delete(`/v1/recurring/${id}`)
  return response.data
}

export const toggleRecurringExpenseStatus = async (id) => {
  const response = await api.put(`/v1/recurring/${id}/toggle`)
  return response.data
}
