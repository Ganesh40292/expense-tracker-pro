import { useState, useCallback } from 'react'
import * as recurringService from '../services/recurringService'

export default function useRecurringExpenses() {
  const [recurringExpenses, setRecurringExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRecurringExpenses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await recurringService.getUserRecurringExpenses()
      setRecurringExpenses(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recurring expenses')
    } finally {
      setLoading(false)
    }
  }, [])

  const addRecurringExpense = async (request) => {
    const data = await recurringService.createRecurringExpense(request)
    setRecurringExpenses((prev) => [...prev, data])
    return data
  }

  const updateRecurringExpense = async (id, request) => {
    const data = await recurringService.updateRecurringExpense(id, request)
    setRecurringExpenses((prev) => prev.map((exp) => (exp.id === id ? data : exp)))
    return data
  }

  const deleteRecurringExpense = async (id) => {
    await recurringService.deleteRecurringExpense(id)
    setRecurringExpenses((prev) => prev.filter((exp) => exp.id !== id))
  }

  const toggleRecurringStatus = async (id) => {
    const data = await recurringService.toggleRecurringExpenseStatus(id)
    setRecurringExpenses((prev) => prev.map((exp) => (exp.id === id ? data : exp)))
    return data
  }

  return {
    recurringExpenses,
    loading,
    error,
    fetchRecurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringStatus
  }
}
