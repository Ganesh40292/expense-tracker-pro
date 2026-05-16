import { useMemo, useState, useCallback } from 'react'
import { TransactionContext } from './transactionContext'
import {
  getTransactions,
  addTransaction as addTransactionApi,
  updateTransaction as updateTransactionApi,
  deleteTransaction as deleteTransactionApi,
} from '../services/transactionService'

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTransactions()
      setTransactions(data)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const addTransaction = useCallback(async (data) => {
    const newTransaction = await addTransactionApi(data)
    setTransactions((prev) => [newTransaction, ...prev])
    return newTransaction
  }, [])

  const updateTransaction = useCallback(async (id, data) => {
    const updated = await updateTransactionApi(id, data)
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? updated : t)),
    )
    return updated
  }, [])

  const deleteTransaction = useCallback(async (id) => {
    await deleteTransactionApi(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      transactions,
      loading,
      setTransactions,
      fetchTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    }),
    [transactions, loading, fetchTransactions, addTransaction, updateTransaction, deleteTransaction],
  )

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}
