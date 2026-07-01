import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FaUsers,
  FaExchangeAlt,
  FaCoins,
  FaShieldAlt,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
} from 'react-icons/fa'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { getOverviewStats } from '../../services/adminService'
import Loader from '../../components/Loader/Loader'
import './Admin.css'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getOverviewStats()
        setStats(data)
      } catch (err) {
        console.error('Failed to load overview stats', err)
        setError('Failed to fetch platform metrics.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <Loader />

  if (error) {
    return (
      <div className="admin-container">
        <div className="glass-card error-card">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Transform dailyActivity object into Recharts array format
  const chartData = Object.entries(stats.dailyActivity || {}).map(([date, count]) => {
    // Format date string from YYYY-MM-DD to MMM DD
    const d = new Date(date)
    const formattedDate = isNaN(d.getTime())
      ? date
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { date: formattedDate, transactions: count }
  })

  // Format currency value in USD (since tracked expenses are in USD base amount)
  const formatUSD = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const overviewCards = [
    {
      title: 'Total Platform Users',
      value: stats.totalUsers,
      growth: stats.userGrowthRate,
      icon: FaUsers,
      color: 'purple',
      desc: 'Registered accounts',
    },
    {
      title: 'Active Users (30 Days)',
      value: stats.activeUsers,
      growth: null,
      icon: FaCheckCircle,
      color: 'emerald',
      desc: 'Users transacted or logged in',
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions,
      growth: stats.transactionGrowthRate,
      icon: FaExchangeAlt,
      color: 'blue',
      desc: 'Tracked records processed',
    },
    {
      title: 'Total Tracked Expenses',
      value: formatUSD(stats.totalExpensesTracked),
      growth: null,
      icon: FaCoins,
      color: 'amber',
      desc: 'Cumulative USD base value',
    },
  ]

  return (
    <div className="admin-container">
      {/* Title Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">System Overview</h1>
          <p className="admin-subtitle">Real-time platform metrics and SaaS operational logs</p>
        </div>
        <div className="admin-badge">
          <FaShieldAlt className="admin-badge-icon" />
          <span>Platform Admin</span>
        </div>
      </div>

      {/* Overview Bento Grid */}
      <motion.div
        className="admin-bento-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {overviewCards.map((card, idx) => (
          <motion.div key={idx} className="glass-card bento-card" variants={cardVariants}>
            <div className={`bento-icon-container bento-icon-container--${card.color}`}>
              <card.icon size={20} />
            </div>
            <div className="bento-content">
              <span className="bento-label">{card.title}</span>
              <div className="bento-value-wrapper">
                <span className="bento-value">{card.value}</span>
                {card.growth !== null && (
                  <span className={`bento-growth ${card.growth >= 0 ? 'growth-up' : 'growth-down'}`}>
                    {card.growth >= 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                    {Math.abs(card.growth)}%
                  </span>
                )}
              </div>
              <span className="bento-desc">{card.desc}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Activity Charts section */}
      <div className="admin-charts-section">
        <motion.div
          className="glass-card chart-card chart-card--wide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="chart-header">
            <h3>Transaction Activity (Last 30 Days)</h3>
            <p>Aggregated transaction creations across all system users</p>
          </div>
          <div className="chart-body" style={{ height: '320px', width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10, 15, 30, 0.9)',
                      borderColor: 'rgba(168, 85, 247, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="transactions"
                    stroke="#a855f7"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#purpleGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-fallback">
                <span>No recent transactions recorded</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard
