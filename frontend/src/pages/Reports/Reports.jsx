import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaCalendarAlt, FaChartBar, FaArrowLeft } from 'react-icons/fa'
import './Reports.css'

const cards = [
  {
    to: '/reports/monthly',
    icon: FaCalendarAlt,
    title: 'Monthly Reports',
    desc: 'View income vs expense breakdown by month',
    color: 'primary',
  },
  {
    to: '/reports/summary',
    icon: FaChartBar,
    title: 'Category Summary',
    desc: 'Expense breakdown by category with charts',
    color: 'cyan',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

function Reports() {
  return (
    <motion.main
      className="page-glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-header">
        <h1>Reports</h1>
        <Link to="/dashboard" className="btn-secondary">
          <FaArrowLeft size={12} />
          Dashboard
        </Link>
      </div>

      <div className="reports-grid">
        {cards.map(({ to, icon: Icon, title, desc, color }, i) => (
          <motion.div
            key={to}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Link to={to} className={`report-card report-card--${color}`}>
              <div className="report-card__icon">
                <Icon size={22} />
              </div>
              <div className="report-card__text">
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              <span className="report-card__arrow">→</span>
              <div className="report-card__glow" aria-hidden="true" />
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.main>
  )
}

export default Reports
