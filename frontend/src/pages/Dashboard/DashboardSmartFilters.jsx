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
}) {
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

