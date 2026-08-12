import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaChartPie, FaChartBar, FaChartLine, FaArrowLeft } from 'react-icons/fa'
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend } from 'recharts'
import useTransactions from '../../hooks/useTransactions'
import HealthScoreGauge from '../../components/HealthScore/HealthScoreGauge'
import './AnalyticsHub.css'

const COLORS = ['#818cf8', '#22d3ee', '#34d399', '#f43f5e', '#fbbf24', '#c084fc', '#f472b6']

export default function AnalyticsHub() {
  const { transactions } = useTransactions()

  // Category breakdown for Pie Chart & Radar
  const categoryTotals = {}
  transactions.forEach((tx) => {
    if (tx.type === 'EXPENSE') {
      const cat = tx.category || 'Other'
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(tx.amount || 0)
    }
  })

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }))
  const radarData = Object.entries(categoryTotals).map(([subject, A]) => ({ subject, A, fullMark: 100000 }))

  // Time Series Data for Line & Area Charts
  const timeMap = {}
  transactions.forEach((tx) => {
    const date = tx.transactionDate || 'Unknown'
    if (!timeMap[date]) timeMap[date] = { date, income: 0, expense: 0, net: 0 }
    if (tx.type === 'INCOME') timeMap[date].income += Number(tx.amount || 0)
    else timeMap[date].expense += Number(tx.amount || 0)
    timeMap[date].net = timeMap[date].income - timeMap[date].expense
  })

  const timeSeriesData = Object.values(timeMap).sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <motion.main
      className="page-glass analytics-hub-page space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-100">
            <FaChartPie className="text-cyan-400" size={24} />
            Master Financial Analytics Hub
          </h1>
          <p className="text-xs text-slate-400">
            Multi-dimensional analytical visualizations: Pie, Bar, Area, Radar, Line trends, and Solvency Gauges
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="btn-secondary text-xs">
            <FaArrowLeft size={12} /> Dashboard
          </Link>
        </div>
      </div>

      {/* ── Health Index Section ── */}
      <section>
        <HealthScoreGauge healthScore={{ score: 85, savingsRate: 32, discipline: 'EXCELLENT', explanations: ['Optimal savings ratio', 'Low volatility'], suggestions: [] }} />
      </section>

      {/* ── Charts Grid Row 1: Pie & Radar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Category Weight */}
        <div className="ag-panel shadow-xl">
          <div className="ag-panel__header">
            <h3 className="ag-panel__title">
              <FaChartPie className="text-cyan-400" /> Category Expenditure Share
            </h3>
            <span className="ag-panel__badge">Distribution</span>
          </div>
          <div className="ag-panel__body flex items-center justify-center" style={{ height: 280 }}>
            {pieData.length === 0 ? (
              <p className="text-xs text-slate-500">No expense records found.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 10,
                      color: '#f8fafc',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Radar Chart: Category Footprint */}
        <div className="ag-panel shadow-xl">
          <div className="ag-panel__header">
            <h3 className="ag-panel__title">
              <FaChartBar className="text-indigo-400" /> Category Risk & Volume Radar
            </h3>
            <span className="ag-panel__badge">Radar Matrix</span>
          </div>
          <div className="ag-panel__body flex items-center justify-center" style={{ height: 280 }}>
            {radarData.length === 0 ? (
              <p className="text-xs text-slate-500">No category data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <Radar name="Spending" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} />
                  <ChartTooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts Grid Row 2: Area & Line ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative Cash Flow Volume Area Chart */}
        <div className="ag-panel shadow-xl">
          <div className="ag-panel__header">
            <h3 className="ag-panel__title">
              <FaChartLine className="text-emerald-400" /> Cumulative Cash Outflow Volume
            </h3>
            <span className="ag-panel__badge">Area Trend</span>
          </div>
          <div className="ag-panel__body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <ChartTooltip />
                <Area type="monotone" dataKey="expense" stroke="#22d3ee" fill="url(#analyticsArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense Comparison Bar Chart */}
        <div className="ag-panel shadow-xl">
          <div className="ag-panel__header">
            <h3 className="ag-panel__title">
              <FaChartBar className="text-amber-400" /> Income vs Expense Timeline
            </h3>
            <span className="ag-panel__badge">Comparison</span>
          </div>
          <div className="ag-panel__body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeriesData}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <ChartTooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.main>
  )
}
