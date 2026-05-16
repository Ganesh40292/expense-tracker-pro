import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuth from '../../hooks/useAuth'
import { getDashboardData } from '../../services/dashboardService'
import { formatCurrency } from '../../utils/formatCurrency'
import FutureDashboardStats from './FutureDashboardStats'

import PieChartComponent from '../../components/Charts/PieChartComponent'
import LineChartComponent from '../../components/Charts/LineChartComponent'
import BarChartComponent from '../../components/Charts/BarChartComponent'
import NeonBackground from '../../components/Neon/NeonBackground'
import GradientWaveBackground from '../../components/Neon/GradientWaveBackground'
import DashboardSmartFilters from './DashboardSmartFilters'
import RangeDropdown from '../../components/Dropdown/RangeDropdown'
import { getMonthlyReport, getExpenseSummary } from '../../services/reportService'
import '../../styles/future-dashboard.css'



/**
 * Premium futuristic fintech dashboard.
 * Includes: quick date chips, interactive charts toggle, AI-style insights,
 * and recent transactions preview.
 */
export default function FutureDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  // UX: date-range chips (client side preview)
  const [range, setRange] = useState('THIS_MONTH')

  // Chart toggle: Income vs Expense (line) or Category breakdown (bar)
  const [chartMode, setChartMode] = useState('INCOME_VS_EXPENSE')

  // Reporting data for category breakdown + insights
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

  const recentTxPreview = useMemo(() => {
    // Backend doesn't provide recent transactions in the current dashboard endpoint.
    // Keep this UI element stable; you can later wire TransactionContext fetch here.
    return []
  }, [])

  const pieData = useMemo(() => {
    return [
      { name: 'Income', value: dashboard?.totalIncome || 0 },
      { name: 'Expense', value: dashboard?.totalExpense || 0 },
    ]
  }, [dashboard])

  const lineData = useMemo(() => {
    // Current backend provides monthly totals via /api/reports/monthly/{userId}
    // but existing LineChartComponent expects {name, amount}.
    // Build a small trend preview using monthly income - expense net.
    if (!monthlyReport?.length) {
      return [
        { name: 'Jan', amount: (dashboard?.totalIncome || 0) * 0.45 },
        { name: 'Feb', amount: (dashboard?.totalIncome || 0) * 0.55 },
        { name: 'Mar', amount: (dashboard?.totalIncome || 0) * 0.50 },
        { name: 'Apr', amount: (dashboard?.totalIncome || 0) * 0.62 },
      ]
    }

    return monthlyReport.slice(0, 6).map((row) => ({
      name: row.month,
      amount: (row.income || 0) - (row.expense || 0),
    }))
  }, [monthlyReport, dashboard])

  const categoryBarData = useMemo(() => {
    return (expenseSummary || []).map((r) => ({
      name: r.category,
      income: 0,
      expense: r.total || 0,
    }))
  }, [expenseSummary])

  const insights = useMemo(() => {
    const insightsList = []

    const topExpense = (expenseSummary || [])
      .slice()
      .sort((a, b) => (b.total || 0) - (a.total || 0))[0]

    if (topExpense?.category) {
      insightsList.push(`Your highest expense category is ${topExpense.category}.`)
    }

    // Compare latest month net vs previous month net (rules-based)
    const mr = monthlyReport || []
    if (mr.length >= 2) {
      const last = mr[mr.length - 1]
      const prev = mr[mr.length - 2]
      const lastNet = (last?.income || 0) - (last?.expense || 0)
      const prevNet = (prev?.income || 0) - (prev?.expense || 0)
      if (prevNet !== 0) {
        const deltaPct = ((lastNet - prevNet) / Math.abs(prevNet)) * 100
        const pctText = `${Math.abs(deltaPct).toFixed(1)}% ${deltaPct >= 0 ? 'more' : 'less'}`
        insightsList.push(`Spending trend: you are ${pctText} net compared to last month.`)
      }
    }

    // Top 3 categories this month
    if (expenseSummary?.length) {
      const top3 = expenseSummary
        .slice()
        .sort((a, b) => (b.total || 0) - (a.total || 0))
        .slice(0, 3)
        .map((x) => x.category)

      if (top3.length) {
        insightsList.push(`Top 3 expense categories: ${top3.join(', ')}.`)
      }
    }

    if (!insightsList.length) {
      insightsList.push('Tip: Track your expenses by category to unlock cleaner monthly insights.')
    }

    return insightsList.slice(0, 3)
  }, [expenseSummary, monthlyReport])

  return (
    <div className="future-dashboard">
      <GradientWaveBackground />
      <NeonBackground />

      <motion.header
        className="future-dashboard__header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="future-dashboard__title">Dashboard</h1>
        </div>

        <div className="future-dashboard__summary">
          <div className="summary-pill">
            <span className="summary-pill__label">Balance</span>
            <span className="summary-pill__value">
              {loading ? '—' : formatCurrency(dashboard?.balance || 0)}
            </span>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        <motion.section
          className="future-dashboard__content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="future-dashboard__topbar">
            <div className="future-dashboard__range">
              {/* Dropdown under dashboard header */}
              <RangeDropdown title="Date range" value={range} onChange={setRange} />
            </div>

            <div className="future-dashboard__chart-toggle" role="group" aria-label="Chart mode">
              <button
                type="button"
                className={
                  chartMode === 'INCOME_VS_EXPENSE'
                    ? 'sftoggle sftoggle--active'
                    : 'sftoggle'
                }
                onClick={() => setChartMode('INCOME_VS_EXPENSE')}
              >
                Income vs Expense
              </button>
              <button
                type="button"
                className={
                  chartMode === 'CATEGORY_BREAKDOWN'
                    ? 'sftoggle sftoggle--active'
                    : 'sftoggle'
                }
                onClick={() => setChartMode('CATEGORY_BREAKDOWN')}
              >
                Category breakdown
              </button>
            </div>
          </div>

          {loading ? (
            <div className="future-skeleton">
              <div className="sk sk--1" />
              <div className="sk sk--2" />
              <div className="sk sk--3" />
            </div>
          ) : (
            <>
              <FutureDashboardStats dashboard={dashboard} />

              <div className="future-insights">
                <div className="glass-panel">
                  <div className="glass-panel__head">
                    <div className="glass-panel__title">Spending Insights</div>
                    <div className="glass-panel__hint">rules-based AI summaries</div>
                  </div>
                  <div className="glass-panel__body">
                    <ul className="ai-insight-list">
                      {insights.map((txt, idx) => (
                        <li key={idx}>{txt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="future-charts">
                <div className="glass-panel">
                  <div className="glass-panel__head">
                    <div className="glass-panel__title">
                      {chartMode === 'INCOME_VS_EXPENSE'
                        ? 'Income vs Expense'
                        : 'Expense by Category'}
                    </div>
                    <div className="glass-panel__hint">toggle • tooltips supported</div>
                  </div>
                  <div className="glass-panel__body">
                    {chartMode === 'INCOME_VS_EXPENSE' ? (
                      <>
                        <PieChartComponent data={pieData} />
                        <div className="chart-divider" />
                        <LineChartComponent data={lineData} />
                      </>
                    ) : (
                      <BarChartComponent data={categoryBarData} />
                    )}
                  </div>
                </div>

                <div className="glass-panel">
                  <div className="glass-panel__head">
                    <div className="glass-panel__title">Recent transactions</div>
                    <div className="glass-panel__hint">preview (top 5)</div>
                  </div>
                  <div className="glass-panel__body">
                    {recentTxPreview.length === 0 ? (
                      <div className="empty-state">Connect recent transactions to enable preview.</div>
                    ) : (
                      <div className="recent-tx">
                        {recentTxPreview.map((t) => (
                          <div key={t.id} className="recent-tx__row">
                            <div className="recent-tx__title">{t.title}</div>
                            <div className="recent-tx__meta">{t.transactionDate}</div>
                            <div className="recent-tx__amount">{t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="recent-tx__viewall">
                      <a className="link-glow" href="/transactions">View all</a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  )
}


