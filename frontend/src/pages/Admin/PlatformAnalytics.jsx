import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { FaChartBar } from 'react-icons/fa'
import { getPlatformAnalytics } from '../../services/adminService'
import Loader from '../../components/Loader/Loader'
import './Admin.css'

const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1']

const PlatformAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const data = await getPlatformAnalytics()
        setAnalytics(data)
      } catch (err) {
        console.error('Failed to load analytics', err)
        setError('Failed to fetch platform analytics.')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) return <Loader />

  if (error || !analytics) {
    return (
      <div className="admin-container">
        <div className="glass-card error-card">
          <p>{error || 'An error occurred'}</p>
        </div>
      </div>
    )
  }

  // Pre-process Category distribution data (take top 7 and group others)
  const sortedCategories = [...(analytics.categoryDistribution || [])].sort((a, b) => b.total - a.total)
  const categoryData = sortedCategories.slice(0, 6).map(c => ({
    name: c.category,
    value: Math.round(c.total),
    count: c.count
  }))
  if (sortedCategories.length > 6) {
    const othersSum = sortedCategories.slice(6).reduce((sum, c) => sum + c.total, 0)
    const othersCount = sortedCategories.slice(6).reduce((sum, c) => sum + c.count, 0)
    categoryData.push({ name: 'Others', value: Math.round(othersSum), count: othersCount })
  }

  // Currency default data mapping
  const currencyData = (analytics.currencyDistribution || []).map(c => ({
    name: c.currency,
    value: c.count
  }))

  // Recurring expense status data mapping
  const recurringData = (analytics.recurringAdoption || []).map(r => ({
    name: r.status,
    count: r.count,
    amount: Math.round(r.total)
  }))

  // User signup growth chart data formatting
  const userGrowthData = (analytics.userGrowth || []).map(item => {
    const [year, month] = item.period.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    const formattedPeriod = isNaN(date.getTime())
      ? item.period
      : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    return { ...item, periodFormatted: formattedPeriod }
  })

  // Transaction growth chart data formatting
  const transactionGrowthData = (analytics.transactionGrowth || []).map(item => {
    const [year, month] = item.period.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    const formattedPeriod = isNaN(date.getTime())
      ? item.period
      : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    return { ...item, periodFormatted: formattedPeriod }
  })

  return (
    <div className="admin-container">
      {/* Title */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Platform Analytics</h1>
          <p className="admin-subtitle">Inspect user growth, transaction volume changes, and feature adoption</p>
        </div>
        <div className="admin-badge">
          <FaChartBar className="admin-badge-icon" />
          <span>Usage Insights</span>
        </div>
      </div>

      {/* Grid of growth charts */}
      <div className="analytics-grid-two-cols">
        {/* User Growth */}
        <motion.div
          className="glass-card chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="chart-header">
            <h3>User Registration Growth</h3>
            <p>New account creations aggregated monthly</p>
          </div>
          <div className="chart-body" style={{ height: '260px' }}>
            {userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGlow2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="periodFormatted" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10, 15, 30, 0.9)',
                      borderColor: 'rgba(192, 132, 252, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="count" name="New Users" stroke="#c084fc" strokeWidth={3} fillOpacity={1} fill="url(#purpleGlow2)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-fallback">No growth logs recorded</div>
            )}
          </div>
        </motion.div>

        {/* Transaction volume growth */}
        <motion.div
          className="glass-card chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="chart-header">
            <h3>Transaction Volume & Count</h3>
            <p>Monthly transaction counts and total base volume (USD)</p>
          </div>
          <div className="chart-body" style={{ height: '260px' }}>
            {transactionGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionGrowthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="periodFormatted" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10, 15, 30, 0.9)',
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }} />
                  <Bar dataKey="count" name="Tx Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="volume" name="Volume (USD)" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-fallback">No transaction logs recorded</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Grid of distribution charts */}
      <div className="analytics-grid-three-cols" style={{ marginTop: '24px' }}>
        {/* Category distribution */}
        <motion.div
          className="glass-card chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="chart-header">
            <h3>Global Category Spend</h3>
            <p>Total transaction base amount by category (USD)</p>
          </div>
          <div className="chart-body" style={{ height: '240px', display: 'flex', justifyContent: 'center' }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend wrapperStyle={{ fontSize: '10px', bottom: 5 }} layout="horizontal" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-fallback">No category logs recorded</div>
            )}
          </div>
        </motion.div>

        {/* Currency preferences */}
        <motion.div
          className="glass-card chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3>Default Currency Choice</h3>
            <p>Percentage of users choosing default currency</p>
          </div>
          <div className="chart-body" style={{ height: '240px', display: 'flex', justifyContent: 'center' }}>
            {currencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currencyData}
                    cx="50%"
                    cy="45%"
                    innerRadius={0}
                    outerRadius={75}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {currencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px', bottom: 5 }} layout="horizontal" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-fallback">No currency preferences recorded</div>
            )}
          </div>
        </motion.div>

        {/* Recurring Expense Adoption */}
        <motion.div
          className="glass-card chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="chart-header">
            <h3>Recurring Expense Status</h3>
            <p>Active vs Paused vs Cancelled counts</p>
          </div>
          <div className="chart-body" style={{ height: '240px' }}>
            {recurringData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recurringData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10, 15, 30, 0.9)',
                      borderColor: 'rgba(168, 85, 247, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="count" name="Schedules" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="amount" name="Volume (USD)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-fallback">No recurring expenses tracked</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default PlatformAnalytics
