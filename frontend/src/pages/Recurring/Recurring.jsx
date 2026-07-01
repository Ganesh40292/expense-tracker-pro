import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaSync, FaPlus, FaPlay, FaPause, FaTrash, FaCalendarAlt, FaTimes 
} from 'react-icons/fa'
import useRecurringExpenses from '../../hooks/useRecurringExpenses'
import { formatCurrency } from '../../utils/formatCurrency'
import { CATEGORIES, TRANSACTION_TYPES } from '../../utils/constants'
import useAuth from '../../hooks/useAuth'
import './Recurring.css'

function Recurring() {
  const {
    recurringExpenses,
    loading,
    fetchRecurringExpenses,
    addRecurringExpense,
    toggleRecurringStatus,
    deleteRecurringExpense
  } = useRecurringExpenses()

  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    title: '',
    amount: '',
    currency: user?.defaultCurrency || 'INR',
    type: 'EXPENSE',
    category: CATEGORIES[0],
    interval: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('Credit Card')

  useEffect(() => {
    fetchRecurringExpenses()
  }, [fetchRecurringExpenses])

  useEffect(() => {
    if (user?.defaultCurrency && !form.currency) {
      setForm(prev => ({ ...prev, currency: user.defaultCurrency }))
    }
  }, [user, form.currency])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.title || !form.amount || !form.startDate) {
      setFormError('Please fill all required fields')
      return
    }

    try {
      const prefix = `[${paymentMethod}] `
      const serializedDescription = form.description ? prefix + form.description.trim() : `[${paymentMethod}]`
      
      await addRecurringExpense({
        ...form,
        amount: parseFloat(form.amount),
        description: serializedDescription
      })
      
      setShowForm(false)
      setForm({
        title: '',
        amount: '',
        type: 'EXPENSE',
        category: CATEGORIES[0],
        interval: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        description: ''
      })
    } catch (err) {
      setFormError(err.message || 'Failed to add recurring expense')
    }
  }

  return (
    <motion.main 
      className="recurring-page page-glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="recurring-header">
        <h1><FaSync /> Recurring Expenses</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><FaTimes size={12}/> Cancel</> : <><FaPlus size={12}/> New Template</>}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass-card"
            style={{ marginBottom: '2rem', padding: '1.5rem' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h2>Create Recurring Schedule</h2>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
               <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Title</label>
                  <input name="title" type="text" placeholder="e.g. Netflix Subscription" value={form.title} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: 1.5 }}>
                  <label>Currency</label>
                  <select name="currency" value={form.currency} onChange={handleChange}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Amount</label>
                  <input name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value={TRANSACTION_TYPES.EXPENSE}>Expense</option>
                    <option value={TRANSACTION_TYPES.INCOME}>Income</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Interval</label>
                  <select name="interval" value={form.interval} onChange={handleChange}>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    {['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Wallet'].map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>End Date (Optional)</label>
                  <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
                </div>
              </div>
              
              <button type="submit" className="btn-primary">Save Schedule</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <p>Loading schedules...</p>
      ) : recurringExpenses.length === 0 ? (
        <div className="recurring-empty">
          <FaSync size={48} />
          <h3>No Recurring Expenses</h3>
          <p>Automate your regular bills and subscriptions by creating a schedule.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Get Started</button>
        </div>
      ) : (
        <div className="recurring-grid">
          {recurringExpenses.map(exp => (
            <motion.div 
              key={exp.id} 
              className={`recurring-card ${exp.status === 'PAUSED' ? 'recurring-card--paused' : ''}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="recurring-card__header">
                <div>
                  <div className="recurring-card__title">{exp.title}</div>
                  <div className="recurring-card__category">
                    <span className={`status-badge status-${exp.status.toLowerCase()}`}>
                      {exp.status}
                    </span>
                    &nbsp;• {exp.category}
                  </div>
                </div>
                <div className={`recurring-card__amount amount-${exp.type.toLowerCase()}`}>
                  {exp.type === 'INCOME' ? '+' : '-'}{formatCurrency(exp.amount)}
                </div>
              </div>
              
              <div className="recurring-card__details">
                <div className="recurring-detail-row">
                  <span className="recurring-detail-label">Interval</span>
                  <span className="recurring-detail-value">{exp.interval}</span>
                </div>
                <div className="recurring-detail-row">
                  <span className="recurring-detail-label">Next Payment</span>
                  <span className="recurring-detail-value" style={{ color: 'var(--primary-color)' }}>
                    {exp.nextRunDate}
                  </span>
                </div>
                <div className="recurring-detail-row">
                  <span className="recurring-detail-label">Started</span>
                  <span className="recurring-detail-value">{exp.startDate}</span>
                </div>
              </div>

              <div className="recurring-card__actions">
                <button 
                  className="btn-icon" 
                  onClick={() => toggleRecurringStatus(exp.id)}
                  title={exp.status === 'ACTIVE' ? 'Pause Schedule' : 'Resume Schedule'}
                >
                  {exp.status === 'ACTIVE' ? <FaPause /> : <FaPlay />}
                </button>
                <button 
                  className="btn-icon btn-icon--danger" 
                  onClick={() => {
                    if(window.confirm('Delete this recurring expense?')) {
                      deleteRecurringExpense(exp.id)
                    }
                  }}
                  title="Delete Schedule"
                >
                  <FaTrash />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.main>
  )
}

export default Recurring
