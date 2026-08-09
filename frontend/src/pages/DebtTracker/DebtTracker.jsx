import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaCreditCard, FaCalculator, FaPlus, FaTrash, FaChartLine } from 'react-icons/fa'

export default function DebtTracker() {
  const [debts, setDebts] = useState([])

  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [minPayment, setMinPayment] = useState('')
  const [extraPayment, setExtraPayment] = useState(2000)

  const handleAddDebt = (e) => {
    e.preventDefault()
    if (!name || !balance) return
    const newDebt = {
      id: Date.now(),
      name,
      balance: parseFloat(balance),
      interestRate: parseFloat(interestRate) || 12,
      minPayment: parseFloat(minPayment) || parseFloat(balance) * 0.05
    }
    setDebts([...debts, newDebt])
    setName('')
    setBalance('')
    setInterestRate('')
    setMinPayment('')
  }

  const handleDeleteDebt = (id) => {
    setDebts(debts.filter(d => d.id !== id))
  }

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0)

  return (
    <div className="page-glass">
      <div className="page-header">
        <div>
          <h1>Debt & Loan Payoff Tracker</h1>
          <p className="auth-subtitle" style={{ margin: 0 }}>
            Calculate snowball vs. avalanche strategies to eliminate debt faster
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: '#fb7185' }}>
            <FaCreditCard size={22} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Total Debt Balance</h3>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 900, color: '#f0f4ff', margin: 0 }}>
            ₹{totalDebt.toLocaleString('en-IN')}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: '#818cf8' }}>
            <FaCalculator size={22} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Total Monthly Commitments</h3>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 900, color: '#818cf8', margin: 0 }}>
            ₹{totalMinPayment.toLocaleString('en-IN')}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: '#34d399' }}>
            <FaChartLine size={22} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Accelerated Payoff Buffer</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#94a3c4', fontSize: '14px' }}>+₹</span>
            <input
              type="number"
              value={extraPayment}
              onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
              style={{ background: 'rgba(15,20,40,0.6)', border: '1px solid rgba(99,102,241,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '8px', width: '120px', fontWeight: 700 }}
            />
            <span style={{ color: '#94a3c4', fontSize: '13px' }}>/mo</span>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#f0f4ff' }}>Active Liabilities</h2>
          {debts.length === 0 ? (
            <div className="empty-state">No debts tracked. Congratulations on zero debt!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {debts.map((debt) => (
                <div key={debt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(15,20,40,0.5)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#f0f4ff', fontSize: '15px' }}>{debt.name}</h4>
                    <p style={{ margin: '4px 0 0', color: '#7c8db5', fontSize: '13px' }}>
                      Interest: <strong style={{ color: '#fb7185' }}>{debt.interestRate}% APR</strong> • Min Pay: ₹{debt.minPayment.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#f0f4ff' }}>
                      ₹{debt.balance.toLocaleString('en-IN')}
                    </span>
                    <button onClick={() => handleDeleteDebt(debt.id)} className="btn-delete" aria-label="Delete debt">
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#f0f4ff' }}>Add Debt Liability</h2>
          <form onSubmit={handleAddDebt} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label>Debt Title</label>
              <input type="text" placeholder="e.g. Car Loan" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Current Balance (₹)</label>
              <input type="number" placeholder="50000" value={balance} onChange={(e) => setBalance(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Interest Rate (% APR)</label>
              <input type="number" step="0.1" placeholder="12.5" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Minimum Monthly Payment (₹)</label>
              <input type="number" placeholder="1500" value={minPayment} onChange={(e) => setMinPayment(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
              <FaPlus size={12} /> Add Liability
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
