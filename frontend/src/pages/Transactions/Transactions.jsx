import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useTransactions from '../../hooks/useTransactions'
import { formatCurrency } from '../../utils/formatCurrency'
import { CATEGORIES, TRANSACTION_TYPES } from '../../utils/constants'
import { exportNodeToPDF } from '../../utils/exportReportsToPDF'
import {
  FaPlus,
  FaFilePdf,
  FaArrowLeft,
  FaTrash,
  FaTimes,
} from 'react-icons/fa'
import './Transactions.css'

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
}

function Transactions() {
  const {
    transactions,
    loading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
  } = useTransactions()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE',
    category: CATEGORIES[0],
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!form.title || !form.amount || !form.type || !form.category) {
      setFormError('Please fill all required fields')
      return
    }

    try {
      await addTransaction({ ...form, amount: parseFloat(form.amount) })
      setForm({
        title: '',
        amount: '',
        type: 'EXPENSE',
        category: CATEGORIES[0],
        transactionDate: new Date().toISOString().split('T')[0],
        description: '',
      })
      setShowForm(false)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add transaction')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id)
      } catch (err) {
        console.error('Delete failed:', err)
      }
    }
  }

  return (
    <motion.main
      className="page-glass"
      id="transactions-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-header">
        <h1>Transactions</h1>
        <div className="header-actions">
          <motion.button
            type="button"
            className="btn-primary"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const root = document.getElementById('transactions-root')
              if (!root) return
              exportNodeToPDF(root, { filename: 'expense-tracker-transactions.pdf' })
            }}
            disabled={loading || transactions.length === 0}
          >
            <FaFilePdf size={13} />
            Export PDF
          </motion.button>

          <motion.button
            type="button"
            className="btn-primary"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <FaTimes size={13} /> : <FaPlus size={13} />}
            {showForm ? 'Cancel' : 'Add Transaction'}
          </motion.button>

          <Link to="/dashboard" className="btn-secondary">
            <FaArrowLeft size={12} />
            Dashboard
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass-card tx-form-card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="tx-form-card__inner">
              <h2>New Transaction</h2>
              {formError && <div className="auth-error">{formError}</div>}
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tx-title">Title</label>
                    <input id="tx-title" name="title" type="text" placeholder="Transaction title" value={form.title} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tx-amount">Amount</label>
                    <input id="tx-amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={handleChange} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tx-type">Type</label>
                    <select id="tx-type" name="type" value={form.type} onChange={handleChange}>
                      <option value={TRANSACTION_TYPES.EXPENSE}>Expense</option>
                      <option value={TRANSACTION_TYPES.INCOME}>Income</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="tx-category">Category</label>
                    <select id="tx-category" name="category" value={form.category} onChange={handleChange}>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tx-date">Date</label>
                    <input id="tx-date" name="transactionDate" type="date" value={form.transactionDate} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tx-desc">Description</label>
                    <input id="tx-desc" name="description" type="text" placeholder="Optional description" value={form.description} onChange={handleChange} />
                  </div>
                </div>

                <button type="submit" className="btn-primary">Add Transaction</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <p className="loading-text">Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions yet. Add your first one!</p>
        </div>
      ) : (
        <div className="glass-card tx-table-card">
          <div className="tx-table-wrapper">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className="tx-table__row"
                  >
                    <td className="tx-table__date">{t.transactionDate}</td>
                    <td className="tx-table__title">{t.title}</td>
                    <td><span className="tx-table__category">{t.category}</span></td>
                    <td>
                      <span className={`badge badge-${t.type?.toLowerCase()}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`amount-${t.type?.toLowerCase()}`}>
                      {t.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </td>
                    <td>
                      <motion.button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDelete(t.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaTrash size={11} />
                        Delete
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.main>
  )
}

export default Transactions
