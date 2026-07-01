import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useTransactions from '../../hooks/useTransactions'
import { useFilteredTransactions } from '../../hooks/useFilteredTransactions'
import AdvancedFilterPanel from '../../components/AdvancedFilterPanel/AdvancedFilterPanel'
import { formatCurrency, convertCurrency } from '../../utils/formatCurrency'
import useAuth from '../../hooks/useAuth'
import ExportCenter from '../../components/ExportCenter/ExportCenter'
import { CATEGORIES, TRANSACTION_TYPES } from '../../utils/constants'
import {
  FaPlus,
  FaFileExport,
  FaArrowLeft,
  FaTrash,
  FaTimes,
  FaReceipt,
  FaUndo,
} from 'react-icons/fa'
import './Transactions.css'

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.02, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
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

  const filterState = useFilteredTransactions(transactions)
  const { filteredTransactions } = filterState
  
  const { user } = useAuth()
  const [isExportCenterOpen, setIsExportCenterOpen] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE',
    category: CATEGORIES[0],
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    currency: user?.defaultCurrency || 'INR',
  })
  const [paymentMethod, setPaymentMethod] = useState('Cash')
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
      // Serialize paymentMethod into the description database field
      const prefix = `[${paymentMethod}] `
      const serializedDescription = form.description ? prefix + form.description.trim() : `[${paymentMethod}]`

      await addTransaction({
        ...form,
        description: serializedDescription,
        amount: parseFloat(form.amount),
      })

      setForm({
        title: '',
        amount: '',
        type: 'EXPENSE',
        category: CATEGORIES[0],
        transactionDate: new Date().toISOString().split('T')[0],
        description: '',
        currency: user?.defaultCurrency || 'INR',
      })
      setPaymentMethod('Cash')
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
            style={{ background: 'var(--theme-color, #10b981)', color: '#fff' }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsExportCenterOpen(true)}
            disabled={loading || filteredTransactions.length === 0}
          >
            <FaFileExport size={13} />
            Export Report
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

      {/* ── New Transaction Form overlay ── */}
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
                  <div className="form-group">
                    <label htmlFor="tx-currency">Currency</label>
                    <select id="tx-currency" name="currency" value={form.currency} onChange={handleChange}>
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="AED">AED (د.إ)</option>
                    </select>
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
                    <label htmlFor="tx-date">Date</label>
                    <input id="tx-date" name="transactionDate" type="date" value={form.transactionDate} onChange={handleChange} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tx-category">Category</label>
                    <select id="tx-category" name="category" value={form.category} onChange={handleChange}>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="tx-payment">Payment Method</label>
                    <select id="tx-payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      {['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Wallet'].map((pm) => (
                        <option key={pm} value={pm}>{pm}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="tx-desc">Description (Notes)</label>
                  <input id="tx-desc" name="description" type="text" placeholder="Optional notes details" value={form.description} onChange={handleChange} />
                </div>

                <button type="submit" className="btn-primary">Add Transaction</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Advanced Search and Filters console ── */}
      {!loading && transactions.length > 0 && (
        <AdvancedFilterPanel filterState={filterState} rawTransactions={transactions} />
      )}

      {/* ── Transactions Listing ── */}
      {loading ? (
        <p className="loading-text">Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <div className="empty-state glass-card">
          <FaReceipt size={36} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: 12 }} />
          <h3>No transactions yet</h3>
          <p>Add your first income or expense transaction to begin tracking.</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="empty-state glass-card">
          <FaReceipt size={36} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: 12 }} />
          <h3>No search results match filters</h3>
          <p>Try refining your categories, amount criteria, or keyword query terms.</p>
          <button type="button" onClick={filterState.clearAllFilters} className="btn-secondary" style={{ marginTop: 12 }}>
            <FaUndo size={11} /> Clear All Filters
          </button>
        </div>
      ) : (
        <div className="glass-card tx-table-card">
          <div className="tx-table-wrapper">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title & Notes</th>
                  <th>Category & Payment</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className="tx-table__row"
                  >
                    <td className="tx-table__date" data-label="Date">{t.transactionDate}</td>
                    <td className="tx-table__title" data-label="Title & Notes">
                      <div className="tx-title-container">
                        <span className="tx-title-text">{t.title}</span>
                        {t.cleanDescription && (
                          <span className="tx-desc-text">{t.cleanDescription}</span>
                        )}
                      </div>
                    </td>
                    <td data-label="Category & Payment">
                      <div className="tx-cat-container">
                        <span className="tx-table__category">{t.category}</span>
                        <span className="badge-payment">{t.paymentMethod}</span>
                      </div>
                    </td>
                    <td data-label="Type">
                      <span className={`badge badge-${t.type?.toLowerCase()}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`amount-${t.type?.toLowerCase()}`} data-label="Amount">
                      {t.type === 'INCOME' ? '+' : '-'}
                      {t.currency?.toUpperCase() === (user?.defaultCurrency || 'INR').toUpperCase() ? (
                        formatCurrency(t.amount)
                      ) : (
                        <>
                          {formatCurrency(convertCurrency(t.baseAmount, user?.defaultCurrency || 'INR'))}
                          <span className="tx-original-amount" style={{ fontSize: '11px', opacity: 0.7, marginLeft: '6px', display: 'block' }}>
                            ({formatCurrency(t.amount, null, t.currency)})
                          </span>
                        </>
                      )}
                    </td>
                    <td data-label="Actions">
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

      <ExportCenter 
        isOpen={isExportCenterOpen}
        onClose={() => setIsExportCenterOpen(false)}
        transactions={filteredTransactions}
        user={user}
      />
    </motion.main>
  )
}

export default Transactions
