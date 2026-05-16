import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { getTransactionById } from '../../services/transactionService'
import { formatCurrency } from '../../utils/formatCurrency'
import Loader from '../../components/Loader/Loader'
import './Transactions.css'

function TransactionDetails() {
  const { user } = useAuth()
  const { id } = useParams()

  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return

    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getTransactionById(id)
        setTransaction(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load transaction')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user?.id])

  if (loading) return <Loader />

  return (
    <main className="transactions-page">
      <div className="transactions-header">
        <h1>Transaction Details</h1>
        <div className="header-actions">
          <Link to="/transactions" className="btn-secondary">
            Back to Transactions
          </Link>
        </div>
      </div>

      {error ? (
        <div className="auth-error">{error}</div>
      ) : transaction ? (
        <div className="transaction-details-card">
          <div className="detail-row">
            <div className="detail-label">Title</div>
            <div className="detail-value">{transaction.title}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Category</div>
            <div className="detail-value">{transaction.category}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Type</div>
            <div className="detail-value">{transaction.type}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Date</div>
            <div className="detail-value">{transaction.transactionDate}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Amount</div>
            <div className="detail-value">
              {transaction.type === 'INCOME' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
          </div>
          {transaction.description ? (
            <div className="detail-row">
              <div className="detail-label">Description</div>
              <div className="detail-value">{transaction.description}</div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="empty-state">Transaction not found.</div>
      )}
    </main>
  )
}

export default TransactionDetails

