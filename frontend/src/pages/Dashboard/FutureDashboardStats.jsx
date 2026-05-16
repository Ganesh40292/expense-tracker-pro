import { useMemo } from 'react'
import AnimatedCounter from '../../components/AnimatedCounter/AnimatedCounter'
import { motion } from 'framer-motion'
import { formatCurrency } from '../../utils/formatCurrency'

function NeonStat({
  variant = 'primary',
  title,
  value,
  icon,
  formatValue,
  delay = 0,
}) {
  return (
    <motion.div
      className={`neo-card neo-card--${variant}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="neo-card__top">
        <div className="neo-card__title">{title}</div>
        <div className="neo-card__icon">{icon}</div>
      </div>
      <div className="neo-card__value">
        <AnimatedCounter
          value={value}
          durationMs={950}
          format={(n) => (formatValue ? formatValue(n) : `${n}`)}
        />
      </div>
      <div className="neo-card__glow" />
    </motion.div>
  )
}

export default function FutureDashboardStats({ dashboard }) {
  const income = dashboard?.totalIncome || 0
  const expense = dashboard?.totalExpense || 0
  const balance = dashboard?.balance || 0
  const txCount = dashboard?.transactionCount || 0

  const savings = useMemo(() => income - expense, [income, expense])

  return (
    <div className="bento-grid">
      <NeonStat
        variant="primary"
        title="Total Balance"
        value={balance}
        icon={'↗'}
        delay={0.05}
        formatValue={(n) => formatCurrency(n)}
      />

      <NeonStat
        variant="success"
        title="Total Income"
        value={income}
        icon={'↗'}
        delay={0.12}
        formatValue={(n) => formatCurrency(n)}
      />

      <NeonStat
        variant="danger"
        title="Total Expense"
        value={expense}
        icon={'↘'}
        delay={0.18}
        formatValue={(n) => formatCurrency(n)}
      />

      <NeonStat
        variant="info"
        title="Savings Overview"
        value={savings}
        icon={'↗'}
        delay={0.25}
        formatValue={(n) => formatCurrency(n)}
      />

      <div className="neo-card neo-card--count">
        <div className="neo-card__top">
          <div className="neo-card__title">Recent Transactions</div>
          <div className="neo-card__icon">TX</div>
        </div>
        <div className="neo-card__value">
          <AnimatedCounter
            value={txCount}
            durationMs={900}
            format={(n) => `${Math.round(n)}`}
          />
        </div>
        <div className="neo-card__glow" />
      </div>

      <div className="neo-card neo-card--placeholder">
        <div className="neo-card__top">
          <div className="neo-card__title">AI Insights</div>
          <div className="neo-card__icon">✨</div>
        </div>
        <div className="neo-card__sub">
          Tip: Track your expenses by category to unlock cleaner monthly insights.
        </div>
        <div className="neo-card__glow" />
      </div>
    </div>
  )
}

