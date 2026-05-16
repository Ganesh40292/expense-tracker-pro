import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { getDashboardData } from '../../services/dashboardService'
import { getMonthlyReport, getExpenseSummary } from '../../services/reportService'
import { formatCurrency } from '../../utils/formatCurrency'
import AnimatedCounter from '../../components/AnimatedCounter/AnimatedCounter'
import PieChartComponent from '../../components/Charts/PieChartComponent'
import LineChartComponent from '../../components/Charts/LineChartComponent'
import BubbleChartComponent from '../../components/Charts/BubbleChartComponent'
import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaPiggyBank,
  FaReceipt,
  FaLightbulb,
  FaChartLine,
  FaExchangeAlt,
} from 'react-icons/fa'
import './Dashboard.css'

/* ── Animation variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

const floatVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

/* ── Stat card config ── */
const statCards = [
  { key: 'balance', title: 'Total Balance', icon: FaWallet, variant: 'primary', field: 'balance' },
  { key: 'income', title: 'Total Income', icon: FaArrowUp, variant: 'success', field: 'totalIncome' },
  { key: 'expense', title: 'Total Expense', icon: FaArrowDown, variant: 'danger', field: 'totalExpense' },
  { key: 'savings', title: 'Net Savings', icon: FaPiggyBank, variant: 'info', field: '_savings' },
  { key: 'txCount', title: 'Transactions', icon: FaReceipt, variant: 'purple', field: 'transactionCount' },
]

/* ── Range options ── */
const ranges = [
  { value: 'TODAY', label: 'Today' },
  { value: '7D', label: '7D' },
  { value: '30D', label: '30D' },
  { value: 'THIS_MONTH', label: 'This Month' },
]

/* ── 3D Tilt Card Component ── */
function TiltCard({ children, variant, className = '' }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 25 })
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 25 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`ag-stat-card ag-stat-card--${variant} ${className}`}
      variants={cardVariants}
      whileHover={{ scale: 1.04, zIndex: 10 }}
    >
      {/* translateZ makes the content physically pop out from the tilted card background */}
      <div style={{ transform: "translateZ(40px)", pointerEvents: "none" }}>
        {children}
      </div>
      <div className="ag-stat-card__glow" aria-hidden="true" />
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('THIS_MONTH')
  const [chartMode, setChartMode] = useState('INCOME_VS_EXPENSE')
  const [expenseSummary, setExpenseSummary] = useState([])
  const [monthlyReport, setMonthlyReport] = useState([])

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.all([
      getDashboardData(user.id),
      getMonthlyReport(user.id),
      getExpenseSummary(user.id),
    ])
      .then(([dash, monthly, summary]) => {
        setDashboard(dash)
        setMonthlyReport(monthly)
        setExpenseSummary(summary)
      })
      .catch((err) => console.error('Dashboard error:', err))
      .finally(() => setLoading(false))
  }, [user])

  /* ── Derived data ── */
  const savings = useMemo(
    () => (dashboard?.totalIncome || 0) - (dashboard?.totalExpense || 0),
    [dashboard],
  )

  const pieData = useMemo(
    () => [
      { name: 'Income', value: dashboard?.totalIncome || 0 },
      { name: 'Expense', value: dashboard?.totalExpense || 0 },
    ],
    [dashboard],
  )

  const lineData = useMemo(() => {
    if (monthlyReport?.length) {
      return monthlyReport.slice(0, 6).map((row) => ({
        name: row.month,
        amount: (row.income || 0) - (row.expense || 0),
      }))
    }
    return [
      { name: 'Jan', amount: (dashboard?.totalIncome || 0) * 0.45 },
      { name: 'Feb', amount: (dashboard?.totalIncome || 0) * 0.55 },
      { name: 'Mar', amount: (dashboard?.totalIncome || 0) * 0.50 },
      { name: 'Apr', amount: (dashboard?.totalIncome || 0) * 0.62 },
    ]
  }, [monthlyReport, dashboard])

  const categoryBarData = useMemo(
    () =>
      (expenseSummary || []).map((r) => ({
        name: r.category,
        income: 0,
        expense: r.total || 0,
      })),
    [expenseSummary],
  )

  const insights = useMemo(() => {
    const list = []
    const topExpense = (expenseSummary || [])
      .slice()
      .sort((a, b) => (b.total || 0) - (a.total || 0))[0]
    if (topExpense?.category) {
      list.push({ icon: '📊', text: `Highest category: ${topExpense.category}` })
    }
    const mr = monthlyReport || []
    if (mr.length >= 2) {
      const last = mr[mr.length - 1]
      const prev = mr[mr.length - 2]
      const lastNet = (last?.income || 0) - (last?.expense || 0)
      const prevNet = (prev?.income || 0) - (prev?.expense || 0)
      if (prevNet !== 0) {
        const deltaPct = ((lastNet - prevNet) / Math.abs(prevNet)) * 100
        const pctText = `${Math.abs(deltaPct).toFixed(1)}% ${deltaPct >= 0 ? 'more' : 'less'}`
        list.push({ icon: '📈', text: `Trend: ${pctText} net vs last month` })
      }
    }
    if (expenseSummary?.length) {
      const top3 = expenseSummary
        .slice()
        .sort((a, b) => (b.total || 0) - (a.total || 0))
        .slice(0, 3)
        .map((x) => x.category)
      if (top3.length) {
        list.push({ icon: '🎯', text: `Top categories: ${top3.join(', ')}` })
      }
    }
    if (!list.length) {
      list.push({ icon: '💡', text: 'Track by category to unlock insights' })
    }
    return list.slice(0, 3)
  }, [expenseSummary, monthlyReport])

  const getStatValue = (field) => {
    if (field === '_savings') return savings
    return dashboard?.[field] || 0
  }

  const isMoneyField = (field) => field !== 'transactionCount'

  return (
    <div className="ag-dashboard">
      {/* ── Header ── */}
      <motion.header
        className="ag-dashboard__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="ag-dashboard__header-left">
          <h1 className="ag-dashboard__title">Dashboard</h1>
          <p className="ag-dashboard__subtitle">
            Welcome back, <span className="ag-highlight">{user?.name || 'User'}</span>
          </p>
        </div>

        <motion.div
          className="ag-dashboard__balance-card"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className="ag-dashboard__balance-label">Current Balance</span>
          <span className="ag-dashboard__balance-value">
            {loading ? '—' : formatCurrency(dashboard?.balance || 0)}
          </span>
        </motion.div>
      </motion.header>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            className="ag-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="ag-skeleton__card" />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* ── Stat Cards — Bento Grid ── */}
            <motion.section className="ag-stats-grid" variants={containerVariants}>
              {statCards.map(({ key, title, icon: Icon, variant, field }) => (
                <TiltCard key={key} variant={variant}>
                  <div className="ag-stat-card__header">
                    <span className="ag-stat-card__title">{title}</span>
                    <span className={`ag-stat-card__icon ag-stat-card__icon--${variant}`}>
                      <Icon size={16} />
                    </span>
                  </div>
                  <div className="ag-stat-card__value">
                    <AnimatedCounter
                      value={getStatValue(field)}
                      durationMs={950}
                      format={(n) =>
                        isMoneyField(field) ? formatCurrency(n) : `${Math.round(n)}`
                      }
                    />
                  </div>
                </TiltCard>
              ))}

              {/* AI Insights mini card */}
              <TiltCard variant="insight" className="ag-stat-card--insight">
                <div className="ag-stat-card__header">
                  <span className="ag-stat-card__title">AI Insights</span>
                  <span className="ag-stat-card__icon ag-stat-card__icon--insight">
                    <FaLightbulb size={16} />
                  </span>
                </div>
                <div className="ag-insight-mini">
                  {insights[0]?.text || 'Add data for insights'}
                </div>
              </TiltCard>
            </motion.section>

            {/* ── Controls Bar ── */}
            <motion.div className="ag-controls" variants={floatVariants}>
              <div className="ag-range-chips" role="group" aria-label="Date range">
                {ranges.map(({ value, label }) => (
                  <motion.button
                    key={value}
                    type="button"
                    className={`ag-chip ${range === value ? 'ag-chip--active' : ''}`}
                    onClick={() => setRange(value)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>

              <div className="ag-chart-toggle" role="group" aria-label="Chart mode">
                <button
                  type="button"
                  className={`ag-toggle-btn ${chartMode === 'INCOME_VS_EXPENSE' ? 'ag-toggle-btn--active' : ''}`}
                  onClick={() => setChartMode('INCOME_VS_EXPENSE')}
                >
                  Income vs Expense
                </button>
                <button
                  type="button"
                  className={`ag-toggle-btn ${chartMode === 'CATEGORY_BREAKDOWN' ? 'ag-toggle-btn--active' : ''}`}
                  onClick={() => setChartMode('CATEGORY_BREAKDOWN')}
                >
                  Categories
                </button>
              </div>
            </motion.div>

            {/* ── Charts + Insights — Bento ── */}
            <motion.section className="ag-charts-grid" variants={containerVariants}>
              {/* Insights panel */}
              <motion.div className="ag-panel ag-panel--insights" variants={cardVariants}>
                <div className="ag-panel__header">
                  <div className="ag-panel__title">
                    <FaLightbulb size={14} />
                    <span>Spending Insights</span>
                  </div>
                  <span className="ag-panel__badge">AI-powered</span>
                </div>
                <div className="ag-panel__body">
                  <ul className="ag-insight-list">
                    {insights.map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.12, duration: 0.4 }}
                      >
                        <span className="ag-insight-list__icon">{item.icon}</span>
                        <span>{item.text}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Main chart */}
              <motion.div className="ag-panel ag-panel--chart" variants={cardVariants}>
                <div className="ag-panel__header">
                  <div className="ag-panel__title">
                    <FaChartLine size={14} />
                    <span>
                      {chartMode === 'INCOME_VS_EXPENSE'
                        ? 'Income vs Expense'
                        : 'Expense by Category'}
                    </span>
                  </div>
                  <span className="ag-panel__badge">Interactive</span>
                </div>
                <div className="ag-panel__body">
                  <AnimatePresence mode="wait">
                    {chartMode === 'INCOME_VS_EXPENSE' ? (
                      <motion.div
                        key="ive"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="ag-chart-duo"
                      >
                        <PieChartComponent data={pieData} />
                        <LineChartComponent data={lineData} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="cat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <BubbleChartComponent data={categoryBarData} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Recent transactions panel */}
              <motion.div className="ag-panel ag-panel--recent" variants={cardVariants}>
                <div className="ag-panel__header">
                  <div className="ag-panel__title">
                    <FaExchangeAlt size={14} />
                    <span>Recent Activity</span>
                  </div>
                  <Link to="/transactions" className="ag-panel__link">
                    View all →
                  </Link>
                </div>
                <div className="ag-panel__body">
                  <div className="ag-recent-empty">
                    <FaReceipt size={24} />
                    <p>Connect transactions to see activity</p>
                    <Link to="/transactions" className="btn-primary" style={{ fontSize: 13, padding: '8px 18px' }}>
                      Go to Transactions
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
