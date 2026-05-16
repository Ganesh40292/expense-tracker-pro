import { useMemo } from 'react'
import { motion } from 'framer-motion'

function Chip({ active, onClick, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      className={active ? 'sf-chip sf-chip--active' : 'sf-chip'}
    >
      {children}
    </motion.button>
  )
}

/**
 * Lightweight client-side filters for dashboard preview.
 * Note: your current backend dashboard endpoint returns aggregated values only,
 * so date filtering is applied to the client using transactions (if provided).
 */
export default function DashboardSmartFilters({
  range,
  setRange,
  transactions = [],
}) {
  const dateInfo = useMemo(() => {
    const now = new Date()

    const startOfDay = (d) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)

    if (range === 'TODAY') {
      return {
        start: startOfDay(now),
        end: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      }
    }

    const days = range === '7D' ? 7 : range === '30D' ? 30 : null
    if (days) {
      return {
        start: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      }
    }

    if (range === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return { start, end }
    }

    return null
  }, [range])

  // Not strictly used in rendering today, but kept for easy extension.
  // You can later wire this into chart data computation.
  const _txCount = useMemo(() => {
    if (!dateInfo || !transactions?.length) return 0
    return transactions.filter((t) => {
      const dt = new Date(t.transactionDate)
      return dt >= dateInfo.start && dt < dateInfo.end
    }).length
  }, [dateInfo, transactions])

  return (
    <div className="sf-row" role="group" aria-label="Dashboard date filters">
      <Chip active={range === 'TODAY'} onClick={() => setRange('TODAY')}>
        Today
      </Chip>
      <Chip active={range === '7D'} onClick={() => setRange('7D')}>
        7D
      </Chip>
      <Chip active={range === '30D'} onClick={() => setRange('30D')}>
        30D
      </Chip>
      <Chip
        active={range === 'THIS_MONTH'}
        onClick={() => setRange('THIS_MONTH')}
      >
        This month
      </Chip>
    </div>
  )
}

