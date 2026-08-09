import api from './api'

export const getAiIntelligence = async () => {
  const response = await api.get('/ai/intelligence')
  return response.data
}

export const getBudgets = async () => {
  const response = await api.get('/budgets')
  return response.data
}

export const saveBudget = async (budgetData) => {
  const response = await api.post('/budgets', budgetData)
  return response.data
}

export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`)
  return response.data
}

export const getGoals = async () => {
  const response = await api.get('/goals')
  return response.data
}

export const createGoal = async (goalData) => {
  const response = await api.post('/goals', goalData)
  return response.data
}

export const updateGoal = async (id, goalData) => {
  const response = await api.put(`/goals/${id}`, goalData)
  return response.data
}

export const deleteGoal = async (id) => {
  const response = await api.delete(`/goals/${id}`)
  return response.data
}

export const getGoalProjection = async (id) => {
  const response = await api.get(`/goals/${id}/projection`)
  return response.data
}
