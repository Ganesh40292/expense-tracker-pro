import api from './api'

export const getCategories = async () => {
  const response = await api.get('/categories')
  return response.data
}

export const addCategory = async (categoryName) => {
  const response = await api.post('/categories', { categoryName })
  return response.data
}

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`)
  return response.data
}
