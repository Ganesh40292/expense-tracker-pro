import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useTransactions from '../../hooks/useTransactions'
import { useFilteredTransactions } from '../../hooks/useFilteredTransactions'
import AdvancedFilterPanel from '../../components/AdvancedFilterPanel/AdvancedFilterPanel'
import useAuth from '../../hooks/useAuth'
import { useToast } from '../../context/ToastContext'
import { useCurrency } from '../../context/CurrencyContext'
import ExportCenter from '../../components/ExportCenter/ExportCenter'
import api from '../../services/api'
import { CATEGORIES, TRANSACTION_TYPES } from '../../utils/constants'
import {
  FaPlus,
  FaFileExport,
  FaArrowLeft,
  FaTrash,
  FaTimes,
  FaReceipt,
  FaUndo,
  FaUpload,
  FaFileCsv,
  FaTrashRestore,
  FaBan,
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
  const { filteredTransactions, startDate, endDate, setStartDate, setEndDate, clearAllFilters } = filterState
  
  const { user } = useAuth()
  const { showToast } = useToast()
  const { formatCurrency } = useCurrency()

  const [isExportCenterOpen, setIsExportCenterOpen] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [importing, setImporting] = useState(false)

  // Trash bin state
  const [viewTrash, setViewTrash] = useState(false)
  const [trashList, setTrashList] = useState([])
  const [trashLoading, setTrashLoading] = useState(false)

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

  const fetchTrash = async () => {
    setTrashLoading(true)
    try {
      const res = await api.get('/transactions/trash')
      setTrashList(res.data)
    } catch (err) {
      showToast('Failed to load trash items', 'error')
    } finally {
      setTrashLoading(false)
    }
  }

  const handleToggleTrash = () => {
    if (!viewTrash) {
      fetchTrash()
    }
    setViewTrash(!viewTrash)
  }

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
      const prefix = `[${paymentMethod}] `
      const serializedDescription = form.description ? prefix + form.description.trim() : `[${paymentMethod}]`

      await addTransaction({
        ...form,
        description: serializedDescription,
        amount: parseFloat(form.amount),
      })

      showToast('Transaction added successfully!', 'success')

      // ── Category Budget Threshold Warning Check ──
      if (form.type === 'EXPENSE') {
        try {
          const budgetRes = await api.get('/budgets')
          const budgets = budgetRes.data || []
          const catBudget = budgets.find((b) => b.category === form.category)
          if (catBudget) {
            const currentSpent = catBudget.spentAmount || 0
            const cap = catBudget.amount || 1
            const newTotal = currentSpent + parseFloat(form.amount || 0)
            const percent = (newTotal / cap) * 100
            if (percent >= 100) {
              showToast(`🚨 OVER BUDGET ALERT: ${form.category} budget exceeded (${percent.toFixed(0)}% used)!`, 'error')
            } else if (percent >= 80) {
              showToast(`⚠️ BUDGET WARNING: ${form.category} is at ${percent.toFixed(0)}% of monthly limit.`, 'warning')
            }
          }
        } catch (e) {}
      }

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
      const msg = err.response?.data?.message || 'Failed to add transaction'
      setFormError(msg)
      showToast(msg, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Move this transaction to Trash Bin?')) {
      try {
        await deleteTransaction(id)
        showToast('Moved to Trash Bin', 'warning')
      } catch (err) {
        showToast('Delete failed', 'error')
      }
    }
  }

  const handleRestore = async (id) => {
    try {
      await api.put(`/transactions/${id}/restore`)
      showToast('Transaction restored!', 'success')
      fetchTrash()
      fetchTransactions()
    } catch (err) {
      showToast('Restore failed', 'error')
    }
  }

  const handlePermanentDelete = async (id) => {
    if (window.confirm('Permanently delete this transaction? This cannot be undone.')) {
      try {
        await api.delete(`/transactions/${id}/permanent`)
        showToast('Permanently deleted', 'info')
        fetchTrash()
      } catch (err) {
        showToast('Permanent deletion failed', 'error')
      }
    }
  }

  const handleCsvImportSubmit = async (e) => {
    e.preventDefault()
    if (!csvFile) {
      showToast('Please select a CSV file to import', 'warning')
      return
    }

    setImporting(true)
    const formData = new FormData()
    formData.append('file', csvFile)

    try {
      const res = await api.post('/transactions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      showToast(`Imported ${res.data.length} transactions successfully!`, 'success')
      setShowImportModal(false)
      setCsvFile(null)
      fetchTransactions()
    } catch (err) {
      showToast('CSV import failed. Check file formatting.', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleExportCsvDirect = async () => {
    try {
      const res = await api.get('/transactions/export/csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showToast('CSV report downloaded!', 'success')
    } catch (err) {
      showToast('Failed to export CSV', 'error')
    }
  }

  // Quick Date Preset Handlers
  const handleDatePreset = (preset) => {
    const today = new Date()
    let start = null
    let end = today.toISOString().split('T')[0]

    if (preset === 'TODAY') {
      start = end
    } else if (preset === 'THIS_WEEK') {
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(today.setDate(diff))
      start = monday.toISOString().split('T')[0]
    } else if (preset === 'THIS_MONTH') {
      start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    } else if (preset === 'THIS_YEAR') {
      start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
    } else {
      clearAllFilters()
      return
    }

    setStartDate(start)
    setEndDate(end)
    showToast(`Filtered by ${preset.replace('_', ' ')}`, 'info')
  }

  return (
    <motion.main
      className="page-glass"
      id="transactions-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{viewTrash ? 'Trash Bin' : 'Transactions'}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {viewTrash ? 'Restore or permanently delete removed expenses' : 'Track and manage your income & expense history'}
          </p>
        </div>

        <div className="header-actions flex-wrap">
          <motion.button
            type="button"
            className={`btn-secondary ${viewTrash ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : ''}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleToggleTrash}
          >
            <FaTrash size={12} />
            {viewTrash ? 'Active Transactions' : 'Trash Bin'}
          </motion.button>

          {!viewTrash && (
            <>
              <motion.button
                type="button"
                className="btn-secondary"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowImportModal(true)}
              >
                <FaUpload size={12} />
                Import CSV
              </motion.button>

              <motion.button
                type="button"
                className="btn-secondary"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExportCsvDirect}
              >
                <FaFileCsv size={13} />
                Export CSV
              </motion.button>

              <motion.button
                type="button"
                className="btn-primary"
                style={{ background: 'var(--theme-color, #10b981)', color: '#fff' }}
                whileHover={{ scale: 1.03 }}
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
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? <FaTimes size={13} /> : <FaPlus size={13} />}
                {showForm ? 'Cancel' : 'Add Transaction'}
              </motion.button>
            </>
          )}

          <Link to="/dashboard" className="btn-secondary">
            <FaArrowLeft size={12} />
            Dashboard
          </Link>
        </div>
      </div>

      {/* ── Quick Date Presets Bar ── */}
      {!viewTrash && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium shrink-0">Quick Filter:</span>
          {['ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR'].map((preset) => (
            <button
              key={preset}
              onClick={() => handleDatePreset(preset)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-cyan-500/20 border border-slate-700/50 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 font-medium transition-colors shrink-0"
            >
              {preset === 'ALL' ? 'Reset All' : preset.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {/* ── CSV Import Modal ── */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 text-slate-100 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-lg text-cyan-400">
                  <FaFileCsv className="w-5 h-5" />
                  <span>Import Transactions from CSV</span>
                </div>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                  <FaTimes />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Upload a CSV file containing columns: <code className="text-cyan-300 font-mono">title, amount, type, category, date, description</code>.
              </p>

              <form onSubmit={handleCsvImportSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block">
                    <FaUpload className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
                    <span className="text-sm font-medium text-slate-200 block">
                      {csvFile ? csvFile.name : 'Click to select or drop CSV file'}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">Supports standard bank CSV exports</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={importing || !csvFile}
                    className="btn-primary"
                  >
                    {importing ? 'Importing...' : 'Upload & Process CSV'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── New Transaction Form overlay ── */}
      <AnimatePresence>
        {showForm && !viewTrash && (
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
      {!viewTrash && !loading && transactions.length > 0 && (
        <AdvancedFilterPanel filterState={filterState} rawTransactions={transactions} />
      )}

      {/* ── Trash Bin View ── */}
      {viewTrash ? (
        trashLoading ? (
          <p className="loading-text">Loading trash bin items...</p>
        ) : trashList.length === 0 ? (
          <div className="empty-state glass-card">
            <FaTrash size={36} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: 12 }} />
            <h3>Trash bin is empty</h3>
            <p>Deleted transactions will appear here where you can restore them.</p>
          </div>
        ) : (
          <div className="glass-card tx-table-card">
            <div className="tx-table-wrapper">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title & Category</th>
                    <th>Amount</th>
                    <th>Deleted At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashList.map((t, i) => (
                    <tr key={t.id} className="tx-table__row opacity-75">
                      <td className="tx-table__date">{t.transactionDate}</td>
                      <td>
                        <div className="font-semibold text-slate-200">{t.title}</div>
                        <div className="text-xs text-slate-400">{t.category}</div>
                      </td>
                      <td className="font-mono">{formatCurrency(t.amount, t.currency)}</td>
                      <td className="text-xs text-slate-400">{t.deletedAt ? new Date(t.deletedAt).toLocaleString() : 'Recently'}</td>
                      <td className="flex items-center gap-2 py-3">
                        <button
                          type="button"
                          className="btn-secondary text-emerald-400 hover:text-emerald-300 border-emerald-500/30"
                          onClick={() => handleRestore(t.id)}
                        >
                          <FaTrashRestore size={11} />
                          Restore
                        </button>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handlePermanentDelete(t.id)}
                        >
                          <FaBan size={11} />
                          Delete Forever
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Active Transactions Table */
        loading ? (
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
                        {formatCurrency(t.amount, t.currency)}
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
        )
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
