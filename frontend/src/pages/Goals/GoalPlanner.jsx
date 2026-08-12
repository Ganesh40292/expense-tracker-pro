import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaBullseye, FaPlus, FaTrash, FaCoins, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa'
import { formatCurrency } from '../../utils/formatCurrency'
import { useToast } from '../../context/ToastContext'
import './GoalPlanner.css'

export default function GoalPlanner() {
  const { showToast } = useToast()
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 65000,
      deadline: '2026-12-31',
      category: 'SAVINGS',
    },
    {
      id: 2,
      title: 'New M3 MacBook Pro',
      targetAmount: 180000,
      currentAmount: 120000,
      deadline: '2026-10-15',
      category: 'GADGETS',
    },
    {
      id: 3,
      title: 'EuroTrip Vacation',
      targetAmount: 250000,
      currentAmount: 90000,
      deadline: '2027-06-01',
      category: 'TRAVEL',
    },
  ])

  // New goal form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [deadline, setDeadline] = useState('')

  // Deposit modal state
  const [depositGoalId, setDepositGoalId] = useState(null)
  const [depositAmount, setDepositAmount] = useState('')

  const handleCreateGoal = (e) => {
    e.preventDefault()
    if (!title || !targetAmount) return

    const newGoal = {
      id: Date.now(),
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount || 0),
      deadline: deadline || '2026-12-31',
      category: 'SAVINGS',
    }

    setGoals((prev) => [...prev, newGoal])
    setIsAddModalOpen(false)
    setTitle('')
    setTargetAmount('')
    setCurrentAmount('')
    setDeadline('')
    showToast('Savings goal created successfully!', 'success')
  }

  const handleDeleteGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
    showToast('Goal deleted', 'info')
  }

  const handleDeposit = (e) => {
    e.preventDefault()
    if (!depositGoalId || !depositAmount) return

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === depositGoalId) {
          const updated = Math.min(g.targetAmount, g.currentAmount + Number(depositAmount))
          return { ...g, currentAmount: updated }
        }
        return g
      }),
    )

    setDepositGoalId(null)
    setDepositAmount('')
    showToast('Deposit added to savings target!', 'success')
  }

  return (
    <motion.main
      className="page-glass goal-planner-page space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-100">
            <FaBullseye className="text-cyan-400" size={24} />
            Savings Target & Goal Planner
          </h1>
          <p className="text-xs text-slate-400">
            Set custom financial milestones, track circular progress rings, and deposit funds towards your targets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary text-xs"
          >
            <FaPlus size={12} /> Add Savings Goal
          </button>
          <Link to="/dashboard" className="btn-secondary text-xs">
            <FaArrowLeft size={12} /> Dashboard
          </Link>
        </div>
      </div>

      {/* ── Goals Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
          const circumference = 2 * Math.PI * 40
          const strokeDashoffset = circumference - (circumference * pct) / 100

          return (
            <motion.div
              key={goal.id}
              whileHover={{ y: -4 }}
              className="glass-card p-6 border border-slate-800 flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {goal.category}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-100 mt-2">{goal.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                  title="Delete Goal"
                >
                  <FaTrash size={12} />
                </button>
              </div>

              {/* Circular Progress Ring + Amounts */}
              <div className="flex items-center gap-6 py-2">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke={pct >= 100 ? '#10b981' : '#22d3ee'}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-base font-black text-slate-100 font-mono">
                    {pct}%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Target</div>
                    <div className="text-sm font-extrabold text-slate-100">{formatCurrency(goal.targetAmount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Saved</div>
                    <div className="text-sm font-bold text-cyan-400">{formatCurrency(goal.currentAmount)}</div>
                  </div>
                </div>
              </div>

              {/* Deadline + Deposit Button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <FaCalendarAlt size={11} className="text-slate-500" />
                  <span>Target: {goal.deadline}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDepositGoalId(goal.id)}
                  disabled={pct >= 100}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <FaCoins size={11} /> + Deposit
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Add Goal Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-6 border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FaBullseye className="text-cyan-400" /> Create Savings Milestone
            </h3>
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Home Downpayment"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  placeholder="100000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Currently Saved (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Create Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Deposit Modal ── */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm p-6 border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FaCoins className="text-cyan-400" /> Add Deposit to Goal
            </h3>
            <form onSubmit={handleDeposit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit Amount (₹)</label>
                <input
                  type="number"
                  placeholder="5000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 outline-none"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.main>
  )
}
