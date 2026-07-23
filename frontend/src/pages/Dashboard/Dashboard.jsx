import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import useTransactions from '../../hooks/useTransactions'
import { useFilteredTransactions } from '../../hooks/useFilteredTransactions'
import useRecurringExpenses from '../../hooks/useRecurringExpenses'
import AdvancedFilterPanel from '../../components/AdvancedFilterPanel/AdvancedFilterPanel'
import { formatCurrency, convertCurrency } from '../../utils/formatCurrency'
import AnimatedCounter from '../../components/AnimatedCounter/AnimatedCounter'
import PieChartComponent from '../../components/Charts/PieChartComponent'
import LineChartComponent from '../../components/Charts/LineChartComponent'
import BubbleChartComponent from '../../components/Charts/BubbleChartComponent'
import BarChartComponent from '../../components/Charts/BarChartComponent'
import ExportCenter from '../../components/ExportCenter/ExportCenter'
import HealthScoreGauge from '../../components/HealthScore/HealthScoreGauge'
import BillCalendar from '../../components/BillCalendar/BillCalendar'
import html2canvas from 'html2canvas'
import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaPiggyBank,
  FaReceipt,
  FaLightbulb,
  FaChartLine,
  FaExchangeAlt,
  FaCalendarAlt,
  FaTags,
  FaHeartbeat,
  FaTrophy,
  FaFileExport,
} from 'react-icons/fa'
import './Dashboard.css'

/* ── Animation variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
}

/* ── Inline SVG Sparkline ── */
function Sparkline({ data, stroke = '#818cf8', fill = 'rgba(129, 140, 248, 0.1)' }) {
  if (!data || data.length < 2) return null
  const width = 100
  const height = 30
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min === 0 ? 1 : max - min
  
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  const pathData = `M ${points}`
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <path d={areaData} fill={fill} stroke="none" />
      <path d={pathData} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── 3D Tilt Card Component ── */
function TiltCard({ children, variant, className = '' }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 25 })
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 25 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"])

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
      whileHover={{ scale: 1.02, zIndex: 5 }}
    >
      <div style={{ transform: "translateZ(30px)", pointerEvents: "none" }}>
        {children}
      </div>
      <div className="ag-stat-card__glow" aria-hidden="true" />
    </motion.div>
  )
}

import { useToast } from '../../context/ToastContext'
import { useCurrency } from '../../context/CurrencyContext'
import api from '../../services/api'
import { CATEGORIES } from '../../utils/constants'

export default function Dashboard() {
  const { user } = useAuth()
  const { transactions, loading, fetchTransactions } = useTransactions()
  const { showToast } = useToast()
  const { formatCurrency: contextFormatCurrency } = useCurrency()
  const [activeTab, setActiveTab] = useState('TRENDS')

  const [budgets, setBudgets] = useState([])
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ category: CATEGORIES[0], amount: '' })

  const fetchBudgets = async () => {
    try {
      const res = await api.get('/budgets')
      setBudgets(res.data)
    } catch (err) {
      console.error('Failed to fetch budgets', err)
    }
  }

  const convertedTransactions = useMemo(() => {
    const defaultCurrency = user?.defaultCurrency || 'INR';
    return transactions.map(t => {
      const amount = t.currency?.toUpperCase() === defaultCurrency.toUpperCase()
        ? t.amount
        : convertCurrency(t.baseAmount, defaultCurrency);
      return {
        ...t,
        originalAmount: t.amount,
        amount: amount
      };
    });
  }, [transactions, user?.defaultCurrency]);

  const filterState = useFilteredTransactions(convertedTransactions)
  const { filteredTransactions, setDateRange, dateRange } = filterState
  
  const { recurringExpenses, fetchRecurringExpenses } = useRecurringExpenses()

  const [isExportCenterOpen, setIsExportCenterOpen] = useState(false)

  const getChartSnapshots = async () => {
    const chartElement = document.querySelector('.ag-chart-viewport')
    if (!chartElement) return []
    try {
      const canvas = await html2canvas(chartElement, { scale: 2, useCORS: true })
      return [canvas.toDataURL('image/png')]
    } catch (err) {
      console.error('Error capturing chart:', err)
      return []
    }
  }

  useEffect(() => {
    fetchTransactions()
    fetchRecurringExpenses()
  }, [fetchTransactions, fetchRecurringExpenses])

  useEffect(() => {
    setDateRange('THIS_MONTH')
  }, [setDateRange])

  /* ── Upcoming Payments Logic ── */
  const upcomingPayments = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return recurringExpenses
      .filter(exp => exp.status === 'ACTIVE')
      .map(exp => {
        const nextDate = new Date(exp.nextRunDate)
        const diffTime = nextDate - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return { ...exp, diffDays, isOverdue: diffDays < 0 }
      })
      .filter(exp => exp.diffDays <= 14)
      .sort((a, b) => a.diffDays - b.diffDays)
  }, [recurringExpenses])

  /* ── 3. Real-Time Math Computations ── */
  const stats = useMemo(() => {
    let income = 0
    let expense = 0
    filteredTransactions.forEach((t) => {
      if (t.type === 'INCOME') {
        income += t.amount
      } else {
        expense += t.amount
      }
    })
    const savings = income - expense
    const savingsRatio = income > 0 ? (savings / income) * 100 : 0
    return { income, expense, savings, savingsRatio }
  }, [filteredTransactions])

  // Overall account totals (unfiltered)
  const accountTotals = useMemo(() => {
    let balance = 0
    let income = 0
    let expense = 0
    convertedTransactions.forEach((t) => {
      if (t.type === 'INCOME') {
        balance += t.amount
        income += t.amount
      } else {
        balance -= t.amount
        expense += t.amount
      }
    })
    return { balance, income, expense }
  }, [convertedTransactions])

  /* ── 4. Sparkline Generators (Unfiltered Trends) ── */
  const balanceSparklineData = useMemo(() => {
    const sorted = [...convertedTransactions].sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate))
    const history = []
    sorted.reduce((running, t) => {
      const next = running + (t.type === 'INCOME' ? t.amount : -t.amount)
      history.push(next)
      return next
    }, 0)
    return history.slice(-10)
  }, [convertedTransactions])

  const expenseSparklineData = useMemo(() => {
    const expenses = convertedTransactions
      .filter((t) => t.type === 'EXPENSE')
      .sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate))
      .map((t) => t.amount)
    return expenses.slice(-10)
  }, [convertedTransactions])

  const incomeSparklineData = useMemo(() => {
    const incomes = convertedTransactions
      .filter((t) => t.type === 'INCOME')
      .sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate))
      .map((t) => t.amount)
    return incomes.slice(-10)
  }, [convertedTransactions])

  /* ── 5. Financial Health Scoring System ── */
  const healthScoreStats = useMemo(() => {
    const { savingsRatio, income, expense } = stats
    if (filteredTransactions.length === 0) return { score: 0, label: 'No Data' }

    // Ratio component (up to 45 pts)
    let ratioScore = 0
    if (savingsRatio >= 30) ratioScore = 45
    else if (savingsRatio > 0) ratioScore = (savingsRatio / 30) * 45

    // Adherence component (up to 35 pts)
    let adherenceScore = 0
    const expenseRatio = income > 0 ? expense / income : 1.5
    if (expenseRatio <= 0.6) adherenceScore = 35
    else if (expenseRatio <= 1) adherenceScore = (1 - (expenseRatio - 0.6) / 0.4) * 35

    // Consistency component based on record length (up to 20 pts)
    const volumeScore = Math.min((filteredTransactions.length / 5) * 20, 20)

    const score = Math.round(ratioScore + adherenceScore + volumeScore)
    let label = 'Risky'
    if (score >= 80) label = 'Excellent'
    else if (score >= 60) label = 'Good'
    else if (score >= 40) label = 'Moderate'

    return { score, label }
  }, [stats, filteredTransactions])

  /* ── 6. Advanced Analytics & Highest Expense Insights ── */
  const expenseInsights = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === 'EXPENSE')
    if (expenses.length === 0) return null

    // Largest transaction
    const largestTx = expenses.reduce((max, t) => (t.amount > max.amount ? t : max), expenses[0])

    // Highest category
    const catMap = {}
    expenses.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount
    })
    const highestCat = Object.keys(catMap).reduce((a, b) => (catMap[a] > catMap[b] ? a : b))

    // Highest month
    const monthMap = {}
    expenses.forEach((t) => {
      const m = new Date(t.transactionDate).toLocaleString('default', { month: 'short', year: '2-digit' })
      monthMap[m] = (monthMap[m] || 0) + t.amount
    })
    const highestMonth = Object.keys(monthMap).reduce((a, b) => (monthMap[a] > monthMap[b] ? a : b), 'None')

    // Average monthly expense
    const uniqueMonths = Object.keys(monthMap).length || 1
    const totalExp = expenses.reduce((sum, t) => sum + t.amount, 0)
    const avgExpense = totalExp / uniqueMonths

    return { largestTx, highestCat, highestMonth, avgExpense, totalExpenses: totalExp }
  }, [filteredTransactions])

  /* ── 7. Dynamic Smart Insight Engine ── */
  const insights = useMemo(() => {
    const list = []
    if (filteredTransactions.length === 0) {
      return [{ icon: '💡', text: 'Log some transactions to unlock financial feedback.' }]
    }

    const { savingsRatio } = stats
    if (savingsRatio >= 25) {
      list.push({ icon: '🎯', text: `Excellent savings! You saved ${savingsRatio.toFixed(0)}% of your income.` })
    } else if (savingsRatio < 10 && savingsRatio >= 0) {
      list.push({ icon: '⚠️', text: `Low savings cushion (${savingsRatio.toFixed(0)}%). Try setting a strict budget.` })
    } else if (savingsRatio < 0) {
      list.push({ icon: '🚨', text: 'Warning: Deficit spending! Expenses exceed income in this window.' })
    }

    if (expenseInsights) {
      list.push({ icon: '📊', text: `Primary spending center: ${expenseInsights.highestCat}.` })
      list.push({ icon: '💸', text: `Largest exit: ${expenseInsights.largestTx.title} (₹${expenseInsights.largestTx.amount}).` })
      if (expenseInsights.avgExpense > 0) {
        list.push({ icon: '📈', text: `Average month outflow runs around ₹${expenseInsights.avgExpense.toFixed(0)}.` })
      }
    }

    return list.slice(0, 3)
  }, [filteredTransactions, stats, expenseInsights])

  /* ── 8. Multi-Chart Trend Aggregators ── */
  const trendChartData = useMemo(() => {
    const isShort = ['TODAY', '7D', '30D', 'THIS_MONTH'].includes(dateRange)

    if (isShort) {
      const dailyMap = {}
      filteredTransactions.forEach((t) => {
        const date = new Date(t.transactionDate)
        const label = date.toLocaleDateString('default', { month: 'short', day: 'numeric' })
        if (!dailyMap[label]) {
          dailyMap[label] = { name: label, income: 0, expense: 0, amount: 0 }
        }
        if (t.type === 'INCOME') {
          dailyMap[label].income += t.amount
        } else {
          dailyMap[label].expense += t.amount
        }
        dailyMap[label].amount = dailyMap[label].income - dailyMap[label].expense
      })
      return Object.values(dailyMap).sort((a, b) => new Date(a.name) - new Date(b.name))
    } else {
      const monthlyMap = {}
      filteredTransactions.forEach((t) => {
        const date = new Date(t.transactionDate)
        const label = date.toLocaleString('default', { month: 'short' })
        if (!monthlyMap[label]) {
          monthlyMap[label] = { name: label, income: 0, expense: 0, amount: 0 }
        }
        if (t.type === 'INCOME') {
          monthlyMap[label].income += t.amount
        } else {
          monthlyMap[label].expense += t.amount
        }
        monthlyMap[label].amount = monthlyMap[label].income - monthlyMap[label].expense
      })
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return Object.values(monthlyMap).sort((a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name))
    }
  }, [filteredTransactions, dateRange])

  const categoryBreakdownData = useMemo(() => {
    const catMap = {}
    filteredTransactions.forEach((t) => {
      if (t.type === 'EXPENSE') {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount
      }
    })
    return Object.keys(catMap)
      .map((cat) => ({
        name: cat,
        value: catMap[cat],
        expense: catMap[cat],
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredTransactions])

  const recentTransactions = useMemo(() => {
    return [...filteredTransactions].slice(0, 4)
  }, [filteredTransactions])

  // Radial scoring variables
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (healthScoreStats.score / 100) * circumference

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
          <h1 className="ag-dashboard__title">Fintech Analytics</h1>
          <p className="ag-dashboard__subtitle">
            Welcome back, <span className="ag-highlight">{user?.name || 'User'}</span>. Real-time monetary diagnostics.
          </p>
        </div>

        {/* Global Account balance summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <motion.div
            className="ag-dashboard__balance-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span className="ag-dashboard__balance-label">Overall Balance</span>
            <span className="ag-dashboard__balance-value">
              {loading ? '—' : formatCurrency(accountTotals.balance)}
            </span>
          </motion.div>
          <motion.button
            className="btn-primary"
            style={{ background: 'var(--theme-color, #10b981)', height: '100%', color: '#fff' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExportCenterOpen(true)}
            disabled={loading || filteredTransactions.length === 0}
          >
            <FaFileExport size={16} />
            <span style={{ marginLeft: 8 }}>Export</span>
          </motion.button>
        </div>
      </motion.header>

      {/* ── Advanced Search and Filters console ── */}
      {!loading && transactions.length > 0 && (
        <AdvancedFilterPanel filterState={filterState} rawTransactions={transactions} />
      )}


      {/* ── Main Dashboard content ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            className="ag-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[1, 2, 3, 4].map((i) => (
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
            {/* ── Financial Health Speed-Gauge Section ── */}
            <section style={{ marginBottom: '24px' }}>
              <HealthScoreGauge healthScore={healthScoreStats} />
            </section>

            {/* ── Stats Grid ── */}
            <motion.section className="ag-stats-grid" variants={containerVariants}>
              {/* Card 1: Balance (Filtered window) */}
              <TiltCard variant="primary">
                <div className="ag-stat-card__header">
                  <span className="ag-stat-card__title">Selected Net Flow</span>
                  <span className="ag-stat-card__icon">
                    <FaWallet size={15} />
                  </span>
                </div>
                <div className="ag-stat-card__body">
                  <div className="ag-stat-card__value">
                    <AnimatedCounter value={stats.savings} format={formatCurrency} />
                  </div>
                  <div className="ag-stat-card__footer">
                    <Sparkline data={balanceSparklineData} stroke="#818cf8" fill="rgba(129, 140, 248, 0.08)" />
                    <span className="ag-trend-text">Overall Trend</span>
                  </div>
                </div>
              </TiltCard>

              {/* Card 2: Income */}
              <TiltCard variant="success">
                <div className="ag-stat-card__header">
                  <span className="ag-stat-card__title">Total Inflow</span>
                  <span className="ag-stat-card__icon ag-stat-card__icon--success">
                    <FaArrowUp size={15} />
                  </span>
                </div>
                <div className="ag-stat-card__body">
                  <div className="ag-stat-card__value">
                    <AnimatedCounter value={stats.income} format={formatCurrency} />
                  </div>
                  <div className="ag-stat-card__footer">
                    <Sparkline data={incomeSparklineData} stroke="#34d399" fill="rgba(52, 211, 153, 0.08)" />
                    <span className="ag-trend-text">Inflow log</span>
                  </div>
                </div>
              </TiltCard>

              {/* Card 3: Expenses */}
              <TiltCard variant="danger">
                <div className="ag-stat-card__header">
                  <span className="ag-stat-card__title">Total Outflow</span>
                  <span className="ag-stat-card__icon ag-stat-card__icon--danger">
                    <FaArrowDown size={15} />
                  </span>
                </div>
                <div className="ag-stat-card__body">
                  <div className="ag-stat-card__value">
                    <AnimatedCounter value={stats.expense} format={formatCurrency} />
                  </div>
                  <div className="ag-stat-card__footer">
                    <Sparkline data={expenseSparklineData} stroke="#fb7185" fill="rgba(251, 113, 133, 0.08)" />
                    <span className="ag-trend-text">Outflow log</span>
                  </div>
                </div>
              </TiltCard>

              {/* Card 4: Savings Progress */}
              <TiltCard variant="info">
                <div className="ag-stat-card__header">
                  <span className="ag-stat-card__title">Savings Buffer</span>
                  <span className="ag-stat-card__icon ag-stat-card__icon--info">
                    <FaPiggyBank size={15} />
                  </span>
                </div>
                <div className="ag-stat-card__body">
                  <div className="ag-stat-card__value">
                    {stats.savingsRatio.toFixed(0)}%
                  </div>
                  <div className="ag-savings-progress">
                    <div className="ag-savings-progress__bar">
                      <div
                        className="ag-savings-progress__fill"
                        style={{ width: `${Math.min(Math.max(stats.savingsRatio, 0), 100)}%` }}
                      />
                    </div>
                    <span className="ag-trend-text">Ratio target (20%)</span>
                  </div>
                </div>
              </TiltCard>
            </motion.section>

            {/* ── Subscriptions & Bill Calendar Timeline ── */}
            <section style={{ marginBottom: '24px' }}>
              <BillCalendar recurringExpenses={recurringExpenses} />
            </section>

            {/* ── Upcoming Payments Panel ── */}
            {upcomingPayments.length > 0 && (
              <motion.section className="ag-analytics-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '24px' }} variants={containerVariants}>
                <motion.div className="ag-panel glass-card" variants={cardVariants}>
                  <div className="ag-panel__header">
                    <div className="ag-panel__title">
                      <FaCalendarAlt size={14} />
                      <span>Upcoming Recurring Payments</span>
                    </div>
                    <Link to="/recurring" className="ag-panel__link">Manage Subscriptions</Link>
                  </div>
                  <div className="ag-panel__body" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                    {upcomingPayments.map(payment => (
                      <div key={payment.id} style={{ 
                        minWidth: '250px', 
                        padding: '16px', 
                        borderRadius: 'var(--radius-xl)', 
                        background: 'var(--glass-bg)',
                        border: payment.isOverdue ? '1px solid var(--danger-color)' : '1px solid var(--border)',
                        position: 'relative'
                      }}>
                        {payment.isOverdue && (
                          <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--danger-color)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>
                            OVERDUE
                          </div>
                        )}
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px' }}>{payment.title}</h4>
                        <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', color: payment.type === 'INCOME' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                          {payment.type === 'INCOME' ? '+' : '-'}{formatCurrency(payment.amount)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <span>{new Date(payment.nextRunDate).toLocaleDateString()}</span>
                          <span style={{ fontWeight: 'bold', color: payment.diffDays === 0 ? 'var(--warning-color)' : 'inherit' }}>
                            {payment.diffDays === 0 ? 'Today' : payment.diffDays > 0 ? `In ${payment.diffDays} days` : `${Math.abs(payment.diffDays)} days ago`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.section>
            )}
            {/* ── Category Budget Limits & Warning Alerts ── */}
            <motion.section className="ag-analytics-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '24px' }} variants={containerVariants}>
              <motion.div className="ag-panel glass-card" variants={cardVariants}>
                <div className="ag-panel__header">
                  <div className="ag-panel__title">
                    <FaTags size={14} />
                    <span>Category Budget Tracking & Warnings</span>
                  </div>
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition-all cursor-pointer"
                  >
                    + Set Category Budget
                  </button>
                </div>
                <div className="ag-panel__body">
                  {budgets.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No category budgets configured yet. Click "+ Set Category Budget" to set monthly spending targets!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {budgets.map((b) => {
                        const pct = b.percentage || 0
                        const isOver = pct > 100
                        const isWarning = pct >= 80 && pct <= 100
                        const colorClass = isOver
                          ? 'bg-rose-500 shadow-rose-900/50'
                          : isWarning
                          ? 'bg-amber-500 shadow-amber-900/50'
                          : 'bg-emerald-500 shadow-emerald-900/50'

                        return (
                          <div key={b.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm text-slate-200">{b.category}</span>
                                {isOver && (
                                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-950 text-rose-300 border border-rose-500/50 rounded-full animate-pulse">
                                    Over Budget!
                                  </span>
                                )}
                                {isWarning && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/50 rounded-full">
                                    Near Limit
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
                                <span>Spent: {contextFormatCurrency(b.spentAmount)}</span>
                                <span>Cap: {contextFormatCurrency(b.amount)}</span>
                              </div>
                            </div>
                            <div>
                              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                                <div
                                  className={`h-full transition-all duration-500 rounded-full ${colorClass}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <div className="text-right text-[11px] font-semibold text-slate-400 font-mono">
                                {pct.toFixed(1)}% Used
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.section>

            {/* Budget Set Modal */}
            <AnimatePresence>
              {showBudgetModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-6 text-slate-100 shadow-2xl"
                  >
                    <h3 className="text-lg font-bold text-cyan-400 mb-4">Set Category Monthly Budget</h3>
                    <form onSubmit={handleBudgetSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Select Category</label>
                        <select
                          value={budgetForm.category}
                          onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Monthly Budget Limit</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          placeholder="e.g. 5000"
                          value={budgetForm.amount}
                          onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowBudgetModal(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                          Save Budget
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* ── Advanced Scoring & Analytics Row ── */}
            <motion.section className="ag-analytics-grid" variants={containerVariants}>
              {/* Financial Health Gauge */}
              <motion.div className="ag-panel ag-panel--health glass-card" variants={cardVariants}>
                <div className="ag-panel__header">
                  <div className="ag-panel__title">
                    <FaHeartbeat size={14} />
                    <span>Health Diagnostics</span>
                  </div>
                  <span className="ag-panel__badge">Live Scoring</span>
                </div>
                <div className="ag-panel__body ag-health-body">
                  <div className="ag-health-circle-wrap">
                    <svg width="100" height="100" viewBox="0 0 100 100" className="health-gauge">
                      <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--border)" strokeWidth="6" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="url(#healthScoreGradient)"
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <defs>
                        <linearGradient id="healthScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="var(--accent-cyan)" />
                        </linearGradient>
                      </defs>
                      <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="health-gauge__score">
                        {healthScoreStats.score}
                      </text>
                      <text x="50%" y="70%" textAnchor="middle" dominantBaseline="middle" className="health-gauge__label">
                        {healthScoreStats.label}
                      </text>
                    </svg>
                  </div>
                  <div className="ag-health-details">
                    <div className="ag-health-detail-item">
                      <span className="ag-health-detail-label">Savings Cushion Score</span>
                      <span className="ag-health-detail-value">{Math.round(stats.savingsRatio)} / 100</span>
                    </div>
                    <div className="ag-health-detail-item">
                      <span className="ag-health-detail-label">Outflow Consistency</span>
                      <span className="ag-health-detail-value">
                        {filteredTransactions.length > 5 ? 'High Consistency' : 'Insufficient data'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Highest Outflow Insights Card */}
              <motion.div className="ag-panel ag-panel--outflow glass-card" variants={cardVariants}>
                <div className="ag-panel__header">
                  <div className="ag-panel__title">
                    <FaTrophy size={14} />
                    <span>Outflow Diagnostics</span>
                  </div>
                  <span className="ag-panel__badge">Anomalies</span>
                </div>
                <div className="ag-panel__body ag-outflow-body">
                  {expenseInsights ? (
                    <div className="ag-outflow-grid">
                      <div className="ag-outflow-item">
                        <span className="ag-outflow-label">Top Category</span>
                        <span className="ag-outflow-value">{expenseInsights.highestCat}</span>
                      </div>
                      <div className="ag-outflow-item">
                        <span className="ag-outflow-label">Highest Month</span>
                        <span className="ag-outflow-value">{expenseInsights.highestMonth}</span>
                      </div>
                      <div className="ag-outflow-item ag-outflow-item--full">
                        <span className="ag-outflow-label">Largest Exit Point</span>
                        <span className="ag-outflow-value ag-outflow-value--highlight">
                          {expenseInsights.largestTx.title} (₹{expenseInsights.largestTx.amount})
                        </span>
                        <span className="ag-outflow-date">{expenseInsights.largestTx.transactionDate}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="ag-recent-empty">No transaction outflow logs recorded in this system.</div>
                  )}
                </div>
              </motion.div>

              {/* Insights and Tips */}
              <motion.div className="ag-panel ag-panel--ai glass-card" variants={cardVariants}>
                <div className="ag-panel__header">
                  <div className="ag-panel__title">
                    <FaLightbulb size={14} />
                    <span>Dynamic Analytics Tips</span>
                  </div>
                  <span className="ag-panel__badge">Automated</span>
                </div>
                <div className="ag-panel__body">
                  <ul className="ag-insight-list">
                    {insights.map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.3 }}
                      >
                        <span className="ag-insight-list__icon">{item.icon}</span>
                        <span>{item.text}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </motion.section>

            {/* ── Dynamic Chart Console & Recent Transactions ── */}
            <motion.section className="ag-charts-grid" variants={containerVariants}>
              {/* Dynamic Chart Container */}
              <motion.div className="ag-panel ag-panel--chart glass-card" variants={cardVariants}>
                <div className="ag-panel__header ag-panel__header--tabs">
                  <div className="ag-panel__chart-tabs">
                    {[
                      { key: 'TRENDS', label: 'Trends (Line)' },
                      { key: 'COMPARISON', label: 'Comparison (Bar)' },
                      { key: 'BREAKDOWN', label: 'Breakdown (Donut)' },
                      { key: 'DISTRIBUTION', label: 'Distribution (Bubble)' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`ag-chart-tab ${activeTab === tab.key ? 'ag-chart-tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ag-panel__body">
                  <div className="ag-chart-viewport">
                    {filteredTransactions.length === 0 ? (
                      <div className="ag-recent-empty">No transaction data matches selection. Adjust filters above.</div>
                    ) : (
                      <AnimatePresence mode="wait">
                        {activeTab === 'TRENDS' && (
                          <motion.div key="trends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <LineChartComponent data={trendChartData} />
                          </motion.div>
                        )}
                        {activeTab === 'COMPARISON' && (
                          <motion.div key="comparison" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <BarChartComponent data={trendChartData} />
                          </motion.div>
                        )}
                        {activeTab === 'BREAKDOWN' && (
                          <motion.div key="breakdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <PieChartComponent data={categoryBreakdownData} />
                          </motion.div>
                        )}
                        {activeTab === 'DISTRIBUTION' && (
                          <motion.div key="distribution" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <BubbleChartComponent data={categoryBreakdownData} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Recent activity card */}
              <motion.div className="ag-panel ag-panel--recent glass-card" variants={cardVariants}>
                <div className="ag-panel__header">
                  <div className="ag-panel__title">
                    <FaExchangeAlt size={14} />
                    <span>Recent Activity</span>
                  </div>
                  <Link to="/transactions" className="ag-panel__link">
                    View all
                  </Link>
                </div>
                <div className="ag-panel__body">
                  {recentTransactions.length > 0 ? (
                    <div className="ag-recent-list">
                      {recentTransactions.map((tx) => (
                        <div key={tx.id} className="ag-recent-item">
                          <div className="ag-recent-item__left">
                            <span className="ag-recent-item__title">{tx.title}</span>
                            <span className="ag-recent-item__category">{tx.category}</span>
                          </div>
                          <div className="ag-recent-item__right">
                            <span className={`ag-recent-item__amount ag-recent-item__amount--${tx.type.toLowerCase()}`}>
                              {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                              {tx.currency?.toUpperCase() !== (user?.defaultCurrency || 'INR').toUpperCase() && (
                                <span className="tx-original-amount" style={{ fontSize: '10px', opacity: 0.6, display: 'block', fontWeight: 'normal' }}>
                                  ({formatCurrency(tx.originalAmount, null, tx.currency)})
                                </span>
                              )}
                            </span>
                            <span className="ag-recent-item__date">{tx.transactionDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ag-recent-empty">
                      <FaReceipt size={24} style={{ opacity: 0.4, marginBottom: 8 }} />
                      <p>No activity logged.</p>
                      <Link to="/transactions" className="btn-primary" style={{ fontSize: 12, minHeight: 'auto', padding: '6px 14px', marginTop: 8 }}>
                        Add transaction
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <ExportCenter 
        isOpen={isExportCenterOpen}
        onClose={() => setIsExportCenterOpen(false)}
        transactions={filteredTransactions}
        user={user}
        getChartSnapshots={getChartSnapshots}
      />
    </div>
  )
}
