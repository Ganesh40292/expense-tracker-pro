import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaBrain,
  FaLightbulb,
  FaExclamationTriangle,
  FaChevronRight,
  FaCheckCircle,
  FaTimes,
  FaPlus,
  FaTrash,
  FaBullseye,
  FaPiggyBank,
  FaCalendarAlt,
  FaChartLine,
  FaInfoCircle,
  FaTrophy,
} from 'react-icons/fa'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ReferenceArea,
} from 'recharts'
import useAuth from '../../hooks/useAuth'
import useTransactions from '../../hooks/useTransactions'
import { formatCurrency } from '../../utils/formatCurrency'
import {
  getAiIntelligence,
  getBudgets,
  saveBudget,
  deleteBudget,
  getGoals,
  createGoal,
  deleteGoal,
  getGoalProjection,
} from '../../services/aiService'
import './AiIntelligence.css'

const categoriesList = ["Food", "Bills", "Health", "Education", "Travel", "Shopping", "Entertainment", "Other"]

export default function AiIntelligence() {
  const { user } = useAuth()
  const { transactions } = useTransactions()
  const [intel, setIntel] = useState(null)
  const [dbBudgets, setDbBudgets] = useState([])
  const [dbGoals, setDbGoals] = useState([])
  const [goalProjections, setGoalProjections] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Explanation Overlay Modal State
  const [explanationModal, setExplanationModal] = useState({ isOpen: false, title: '', content: '' })

  // Forms State
  const [budgetForm, setBudgetForm] = useState({ category: 'Food', amount: '' })
  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    category: 'CUSTOM',
  })

  // Load dashboard data
  const loadData = async () => {
    try {
      setLoading(true)
      const [intelData, budgetsData, goalsData] = await Promise.all([
        getAiIntelligence(),
        getBudgets(),
        getGoals(),
      ])
      
      setIntel(intelData)
      setDbBudgets(budgetsData)
      setDbGoals(goalsData)

      // Fetch projections for all goals
      const projections = {}
      await Promise.all(
        goalsData.map(async (goal) => {
          try {
            const proj = await getGoalProjection(goal.id)
            projections[goal.id] = proj
          } catch (e) {
            console.error(`Failed to fetch projection for goal ${goal.id}`, e)
          }
        })
      )
      setGoalProjections(projections)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch financial intelligence insights. Please add more transaction history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ── Forecast composite chart data processing ──
  const compositeChartData = useMemo(() => {
    if (!transactions || transactions.length === 0 || !intel?.predictions) return []

    // Group expenses by calendar month
    const monthlyTotals = {}
    transactions
      .filter((t) => t.type === 'EXPENSE' || t.type === 'expense')
      .forEach((t) => {
        const date = new Date(t.transactionDate)
        if (isNaN(date.getTime())) return
        const key = date.toLocaleString('default', { month: 'short', year: 'numeric' })
        monthlyTotals[key] = (monthlyTotals[key] || 0) + t.amount
      })

    // Convert to sorted list of objects
    const dataPoints = Object.entries(monthlyTotals).map(([month, amount]) => ({
      name: month,
      Historical: Number(amount.toFixed(2)),
      Forecast: null,
    }))

    // Sort chronologically by converting key back to date
    dataPoints.sort((a, b) => new Date(a.name) - new Date(b.name))

    // Append next month forecast
    const forecastVal = intel.predictions.nextMonthForecast
    if (forecastVal > 0) {
      // Create a key for next month
      const lastMonthDate = dataPoints.length > 0 ? new Date(dataPoints[dataPoints.length - 1].name) : new Date()
      const nextMonthDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 1)
      const nextMonthKey = nextMonthDate.toLocaleString('default', { month: 'short', year: 'numeric' }) + ' (AI)'

      // Connect the last point to the forecast line
      if (dataPoints.length > 0) {
        dataPoints[dataPoints.length - 1].Forecast = dataPoints[dataPoints.length - 1].Historical
      }

      dataPoints.push({
        name: nextMonthKey,
        Historical: null,
        Forecast: Number(forecastVal.toFixed(2)),
        MinRange: Number(intel.predictions.confidenceRangeMin.toFixed(2)),
        MaxRange: Number(intel.predictions.confidenceRangeMax.toFixed(2)),
      })
    }

    return dataPoints
  }, [transactions, intel])

  // ── Category vs Budget limit chart data processing ──
  const categoryChartData = useMemo(() => {
    if (!intel?.predictions?.categoryForecasts) return []

    const forecasts = intel.predictions.categoryForecasts
    const budgetMap = {}
    dbBudgets.forEach((b) => {
      budgetMap[b.category] = b.amount
    })

    return Object.entries(forecasts).map(([cat, val]) => ({
      category: cat,
      Forecast: Number(val.toFixed(2)),
      Limit: budgetMap[cat] || budgetMap['ALL'] || null,
    }))
  }, [intel, dbBudgets])

  // ── Handle Budget Save ──
  const handleBudgetSubmit = async (e) => {
    e.preventDefault()
    if (!budgetForm.amount || isNaN(budgetForm.amount) || parseFloat(budgetForm.amount) <= 0) return
    try {
      await saveBudget({
        category: budgetForm.category,
        amount: parseFloat(budgetForm.amount),
      })
      setBudgetForm({ category: 'Food', amount: '' })
      loadData()
    } catch (err) {
      console.error(err)
      alert('Failed to save budget.')
    }
  }

  // ── Handle Quick Budget Recommendation Save ──
  const handleSaveRecommendation = async (rec) => {
    try {
      await saveBudget({
        category: rec.category,
        amount: rec.recommendedAmount,
      })
      loadData()
    } catch (err) {
      console.error(err)
      alert('Failed to apply recommended budget.')
    }
  }

  // ── Handle Budget Delete ──
  const handleBudgetDelete = async (id) => {
    if (!window.confirm('Delete this budget limit?')) return
    try {
      await deleteBudget(id)
      loadData()
    } catch (err) {
      console.error(err)
      alert('Failed to delete budget.')
    }
  }

  // ── Handle Goal Submit ──
  const handleGoalSubmit = async (e) => {
    e.preventDefault()
    const { name, targetAmount, currentAmount, targetDate, category } = goalForm
    if (!name || !targetAmount || !targetDate) return
    try {
      await createGoal({
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || 0),
        targetDate,
        category,
      })
      setGoalForm({
        name: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: '',
        category: 'CUSTOM',
      })
      loadData()
    } catch (err) {
      console.error(err)
      alert('Failed to create saving goal.')
    }
  }

  // ── Handle Goal Delete ──
  const handleGoalDelete = async (id) => {
    if (!window.confirm('Delete this saving goal?')) return
    try {
      await deleteGoal(id)
      loadData()
    } catch (err) {
      console.error(err)
      alert('Failed to delete goal.')
    }
  }

  // ── Show Explain Overlay ──
  const openExplanation = (title, content) => {
    setExplanationModal({ isOpen: true, title, content })
  }

  if (loading) {
    return (
      <div className="ai-intel-loading">
        <div className="ai-spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Analyzing transactions & running forecasting regressions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ai-empty-state">
        <FaBrain className="ai-empty-icon" style={{ color: 'var(--primary)' }} />
        <h3>Awaiting Spending Data</h3>
        <p>{error}</p>
      </div>
    )
  }

  const defaultCurrency = user?.defaultCurrency || 'INR'

  return (
    <div className="ai-intel-container">
      {/* Header */}
      <div className="ai-intel-header">
        <div>
          <h1 className="ai-intel-title">
            Financial <span style={{ color: 'var(--accent-cyan)' }}>Intelligence</span>
          </h1>
          <p className="ai-intel-subtitle">AI-assisted projections, health scores, and spending recommendations</p>
        </div>
      </div>

      {/* Anomaly Alerts */}
      {intel?.anomalies && intel.anomalies.length > 0 && (
        <div className="ai-intel-alerts">
          {intel.anomalies.slice(0, 3).map((anomaly) => (
            <motion.div
              key={anomaly.transactionId}
              className={`ai-alert-card ${anomaly.severity.toLowerCase()}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FaExclamationTriangle className="ai-alert-icon" />
              <div className="ai-alert-content">
                <h5 className="ai-alert-title">
                  Unusual spending detected in {anomaly.category}
                </h5>
                <p className="ai-alert-reason">
                  Transaction: <strong>{anomaly.title}</strong> for{' '}
                  <span className="font-mono font-bold text-red-500">
                    {formatCurrency(anomaly.amount, defaultCurrency)}
                  </span>
                  . {anomaly.reason}
                </p>
                <div className="ai-alert-suggestion">
                  <strong>Recommendation:</strong> {anomaly.suggestion}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Grid Top: Health Score + Forecast */}
      <div className="ai-intel-grid-top">
        {/* Health Score Widget */}
        <div className="ai-intel-card">
          <h3 className="ai-card-title">
            <FaTrophy style={{ color: '#f59e0b' }} /> Financial Health
          </h3>
          <div className="ai-health-widget">
            <div className="ai-health-score-outer">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="var(--glass-border)"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={
                    intel.healthScore.score >= 80
                      ? '#10b981'
                      : intel.healthScore.score >= 50
                      ? '#3b82f6'
                      : '#f59e0b'
                  }
                  strokeWidth="8"
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * intel.healthScore.score) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="ai-health-score-inner">
                <span className="ai-health-score-value">{intel.healthScore.score}</span>
                <span className="ai-health-score-label">Score</span>
              </div>
            </div>

            <h4 className={`ai-health-status ${intel.healthScore.discipline.toLowerCase()}`}>
              {intel.healthScore.discipline.replace('_', ' ')}
            </h4>
            <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>
              Current Savings Rate: <strong>{intel.healthScore.savingsRate}%</strong>
            </p>

            <div className="ai-health-explanations">
              {intel.healthScore.explanations.map((exp, i) => (
                <div key={i} className="ai-health-bullet">
                  <FaInfoCircle className="ai-health-bullet-icon explanation" />
                  <span>{exp}</span>
                </div>
              ))}
              {intel.healthScore.suggestions.map((sug, i) => (
                <div key={i} className="ai-health-bullet">
                  <FaLightbulb className="ai-health-bullet-icon suggestion" />
                  <span>{sug}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast Graph */}
        <div className="ai-intel-card">
          <h3 className="ai-card-title">
            <FaChartLine style={{ color: 'var(--primary)' }} /> Spending Trends & Regression Forecast
          </h3>

          <div className="ai-forecast-metrics">
            <div className="ai-metric-item">
              <span className="ai-metric-label">Next Month Forecast</span>
              <span className="ai-metric-val">
                {formatCurrency(intel.predictions.nextMonthForecast, defaultCurrency)}
              </span>
            </div>
            <div className="ai-metric-item">
              <span className="ai-metric-label">Yearly projected</span>
              <span className="ai-metric-val">
                {formatCurrency(intel.predictions.yearlyEstimate, defaultCurrency)}
              </span>
            </div>
            <div className="ai-metric-item">
              <span className="ai-metric-label">Recurring projected</span>
              <span className="ai-metric-val">
                {formatCurrency(intel.predictions.recurringProjected, defaultCurrency)}
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <ComposedChart data={compositeChartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <ChartTooltip
                  contentStyle={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--glass-border)',
                    borderRadius: 12,
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend tick={{ fontSize: 11 }} />
                
                {/* Confidence intervals Reference Area for next month forecast */}
                {compositeChartData.length > 0 && (
                  <ReferenceArea
                    x1={compositeChartData[compositeChartData.length - 1].name}
                    x2={compositeChartData[compositeChartData.length - 1].name}
                    fill="rgba(99, 102, 241, 0.1)"
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="Historical"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Historical Spending"
                />
                <Line
                  type="monotone"
                  dataKey="Forecast"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#ef4444' }}
                  name="AI Regression Forecast"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Middle: Savings Opportunities + Recommended Budgets */}
      <div className="ai-intel-grid-middle">
        {/* Savings Opportunities */}
        <div className="ai-intel-card">
          <h3 className="ai-card-title">
            <FaLightbulb style={{ color: '#10b981' }} /> Savings Opportunities
          </h3>
          <div className="ai-list-items">
            {intel?.savingsOpportunities && intel.savingsOpportunities.length > 0 ? (
              intel.savingsOpportunities.map((opp, i) => (
                <div key={i} className="ai-saving-card">
                  <div className="ai-saving-header">
                    <span className="ai-saving-title">{opp.title}</span>
                    <span className={`ai-saving-badge ${opp.confidence.toLowerCase()}`}>
                      {opp.confidence} Confidence
                    </span>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    Potential Monthly Savings:{' '}
                    <span className="ai-saving-amount">
                      {formatCurrency(opp.potentialSavings, defaultCurrency)}
                    </span>
                  </div>
                  <p className="ai-saving-reason">{opp.reasoning}</p>
                  <button
                    className="ai-explain-overlay-trigger"
                    onClick={() =>
                      openExplanation(
                        opp.title,
                        `Why did the AI recommend this savings opportunity?\n\n- Model logic: Subscription Scanner / Overspending Analyzer.\n- Detection parameters: Identifies repeated, identical values (matching billing cycles) or spends exceeding past 3-month averages by > 20%.\n- Recommendation: Standard financial discipline advises reviewing and canceling unused subscriptions and trimming high-volatility category wants.`
                      )
                    }
                  >
                    <FaInfoCircle /> Explain Recommendation
                  </button>
                </div>
              ))
            ) : (
              <div className="ai-empty-state" style={{ padding: '20px 0' }}>
                <p>No high-probability saving opportunities found yet. Keep tracking transactions!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Budgets */}
        <div className="ai-intel-card">
          <h3 className="ai-card-title">
            <FaBrain style={{ color: 'var(--primary)' }} /> AI Recommended Budgets
          </h3>
          <div className="ai-list-items" style={{ marginBottom: 16 }}>
            {intel?.budgets && intel.budgets.length > 0 ? (
              intel.budgets.map((rec, i) => {
                const isConfigured = dbBudgets.some((b) => b.category === rec.category)
                return (
                  <div key={i} className="ai-list-item">
                    <div className="ai-item-left">
                      <div className="ai-item-name">{rec.category}</div>
                      <div className="ai-item-details">{rec.reasoning}</div>
                    </div>
                    <div className="ai-item-right">
                      <div className="ai-item-value">
                        {formatCurrency(rec.recommendedAmount, defaultCurrency)}
                      </div>
                      {!isConfigured ? (
                        <button
                          className="ai-btn ai-btn-primary ai-btn-small"
                          onClick={() => handleSaveRecommendation(rec)}
                        >
                          <FaPlus /> Apply
                        </button>
                      ) : (
                        <span className="text-xs text-green font-bold flex items-center gap-1">
                          <FaCheckCircle /> Applied
                        </span>
                      )}
                      <button
                        className="ai-explain-overlay-trigger"
                        style={{ margin: 0 }}
                        onClick={() =>
                          openExplanation(
                            `${rec.category} Budget Recommendation`,
                            `Why did the AI recommend this budget?\n\n- Calculation Formula: 90% of the historical average monthly category spending (${formatCurrency(
                              rec.currentSpending,
                              defaultCurrency
                            )}).\n- Constraint Checks: Assesses the recommended value against the user's Monthly Income under the 50/30/20 budget framework. Capped at 35% of the respective bucket (Needs vs Wants) allowance to ensure balanced distribution.`
                          )
                        }
                      >
                        <FaInfoCircle />
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="ai-empty-state" style={{ padding: '20px 0' }}>
                <p>No budget recommendations. Add category expenditures to get calculations.</p>
              </div>
            )}
          </div>

          {/* Add custom budget form */}
          <form onSubmit={handleBudgetSubmit} className="ai-form-row double">
            <div className="ai-form-group">
              <label className="ai-form-label">Category</label>
              <select
                className="ai-form-input"
                value={budgetForm.category}
                onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="ai-form-group">
              <label className="ai-form-label">Amount limit ({defaultCurrency})</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  placeholder="Limit e.g. 5000"
                  className="ai-form-input"
                  style={{ flex: 1 }}
                  value={budgetForm.amount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                  required
                />
                <button type="submit" className="ai-btn ai-btn-primary">
                  Set
                </button>
              </div>
            </div>
          </form>

          {/* Existing Configured Budgets List */}
          {dbBudgets.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h5 className="ai-form-label" style={{ marginBottom: 8 }}>Configured Budget Limits</h5>
              <div className="ai-list-items" style={{ maxHeight: 180 }}>
                {dbBudgets.map((b) => (
                  <div key={b.id} className="ai-list-item">
                    <div>
                      <div className="ai-item-name">{b.category}</div>
                      <div className="ai-item-details">Limit set by you</div>
                    </div>
                    <div className="ai-item-right">
                      <div className="ai-item-value">{formatCurrency(b.amount, defaultCurrency)}</div>
                      <button
                        className="ai-btn ai-btn-danger ai-btn-small"
                        onClick={() => handleBudgetDelete(b.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Bottom: Goals & Projections */}
      <div className="ai-intel-card" style={{ marginBottom: 24 }}>
        <h3 className="ai-card-title">
          <FaBullseye style={{ color: '#3b82f6' }} /> Saving Goals & Smart Projections
        </h3>

        <div className="ai-intel-grid-middle" style={{ margin: 0 }}>
          {/* Active Goals list */}
          <div>
            <h5 className="ai-form-label" style={{ marginBottom: 12 }}>Active Saving Goals</h5>
            <div className="ai-list-items">
              {dbGoals.length > 0 ? (
                dbGoals.map((goal) => {
                  const proj = goalProjections[goal.id]
                  const pct = proj ? proj.currentProgressPercent : 0
                  return (
                    <div key={goal.id} className="ai-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="ai-item-name">{goal.name} ({goal.category})</div>
                          <div className="ai-item-details">
                            Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="ai-item-right">
                          <div className="ai-item-value">
                            {formatCurrency(goal.currentAmount, defaultCurrency)} / {formatCurrency(goal.targetAmount, defaultCurrency)}
                          </div>
                          <button
                            className="ai-btn ai-btn-danger ai-btn-small"
                            onClick={() => handleGoalDelete(goal.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ width: '100%', height: 6, background: 'var(--glass-border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#3b82f6', borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>

                      {/* AI Projection Summary */}
                      {proj && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, background: 'rgba(255,255,255,0.01)', padding: '6px 10px', borderRadius: 6 }}>
                          <div>
                            Estimated Completion:{' '}
                            <strong>{new Date(proj.estimatedCompletionDate).toLocaleDateString()}</strong>
                          </div>
                          <div>
                            Suggested Monthly Savings:{' '}
                            <strong style={{ color: '#10b981' }}>{formatCurrency(proj.suggestedMonthlySavings, defaultCurrency)}</strong>
                          </div>
                          <div>
                            Status:{' '}
                            <span style={{ color: proj.onTrack ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                              {proj.onTrack ? 'ON TRACK' : 'OFF TRACK'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="ai-empty-state" style={{ padding: '20px 0' }}>
                  <FaPiggyBank style={{ fontSize: 30, opacity: 0.5, marginBottom: 8 }} />
                  <p>No saving goals configured. Set one below to trace target completion dates!</p>
                </div>
              )}
            </div>
          </div>

          {/* Goal Add Form */}
          <div>
            <h5 className="ai-form-label" style={{ marginBottom: 12 }}>Create Saving Goal</h5>
            <form onSubmit={handleGoalSubmit}>
              <div className="ai-form-row">
                <div className="ai-form-group">
                  <label className="ai-form-label">Goal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Emergency Fund"
                    className="ai-form-input"
                    value={goalForm.name}
                    onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="ai-form-row double">
                <div className="ai-form-group">
                  <label className="ai-form-label">Target Amount ({defaultCurrency})</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    className="ai-form-input"
                    value={goalForm.targetAmount}
                    onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                    required
                  />
                </div>
                <div className="ai-form-group">
                  <label className="ai-form-label">Currently Saved ({defaultCurrency})</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    className="ai-form-input"
                    value={goalForm.currentAmount}
                    onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                  />
                </div>
              </div>

              <div className="ai-form-row double">
                <div className="ai-form-group">
                  <label className="ai-form-label">Target Date</label>
                  <input
                    type="date"
                    className="ai-form-input"
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                    required
                  />
                </div>
                <div className="ai-form-group">
                  <label className="ai-form-label">Category</label>
                  <select
                    className="ai-form-input"
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                  >
                    <option value="EMERGENCY_FUND">Emergency Fund</option>
                    <option value="VACATION">Vacation</option>
                    <option value="VACATION">Bike/Car</option>
                    <option value="EDUCATION">Education</option>
                    <option value="CUSTOM">Custom Goal</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="ai-btn ai-btn-primary" style={{ width: '100%', marginTop: 12 }}>
                Create Saving Goal
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Explanation Modal Overlay */}
      <AnimatePresence>
        {explanationModal.isOpen && (
          <div className="ai-overlay" onClick={() => setExplanationModal({ isOpen: false, title: '', content: '' })}>
            <motion.div
              className="ai-overlay-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="ai-overlay-header">
                <h4 className="ai-overlay-title">{explanationModal.title}</h4>
                <button
                  className="ai-overlay-close"
                  onClick={() => setExplanationModal({ isOpen: false, title: '', content: '' })}
                >
                  <FaTimes />
                </button>
              </div>
              <div style={{ whiteSpace: 'pre-line', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {explanationModal.content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
