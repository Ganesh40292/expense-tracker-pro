import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaCalendarAlt, FaChartBar, FaArrowLeft, FaFilePdf, FaDownload } from 'react-icons/fa'
import useTransactions from '../../hooks/useTransactions'
import useAuth from '../../hooks/useAuth'
import { generatePDFReport } from '../../services/exportService'
import { useToast } from '../../context/ToastContext'
import './Reports.css'

function Reports() {
  const { transactions } = useTransactions()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    if (!transactions || transactions.length === 0) {
      showToast('No transactions found to generate PDF report.', 'warning')
      return
    }
    setDownloading(true)
    try {
      generatePDFReport(transactions, user, [], ['Personalized financial statement generated with ExpenseTracker Pro'])
      showToast('PDF Financial Report downloaded successfully!', 'success')
    } catch (err) {
      showToast('Failed to generate PDF statement.', 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <motion.main
      className="page-glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-header">
        <div>
          <h1>Financial Reports & Downloads</h1>
          <p className="text-xs text-slate-400">Export executive statements or view analytical breakdowns</p>
        </div>
        <Link to="/dashboard" className="btn-secondary">
          <FaArrowLeft size={12} />
          Dashboard
        </Link>
      </div>

      <div className="reports-grid">
        {/* 1-Click PDF Download Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="report-card report-card--primary cursor-pointer"
          onClick={handleDownloadPdf}
          style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          <div className="report-card__icon" style={{ color: '#ef4444' }}>
            <FaFilePdf size={24} />
          </div>
          <div className="report-card__text">
            <h3 className="flex items-center gap-2">
              1-Click Executive PDF Statement
              <span className="px-2 py-0.5 text-[9px] font-mono bg-red-900/60 text-red-300 border border-red-500/40 rounded-full">PDF</span>
            </h3>
            <p>Generate styled PDF statement with summary totals & category breakdowns.</p>
          </div>
          <span className="report-card__arrow flex items-center justify-center w-8 h-8 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
            <FaDownload size={14} />
          </span>
        </motion.div>

        <motion.div>
          <Link to="/reports/monthly" className="report-card report-card--primary">
            <div className="report-card__icon">
              <FaCalendarAlt size={22} />
            </div>
            <div className="report-card__text">
              <h3>Monthly Reports</h3>
              <p>View income vs expense breakdown by month</p>
            </div>
            <span className="report-card__arrow">→</span>
          </Link>
        </motion.div>

        <motion.div>
          <Link to="/reports/summary" className="report-card report-card--cyan">
            <div className="report-card__icon">
              <FaChartBar size={22} />
            </div>
            <div className="report-card__text">
              <h3>Category Summary</h3>
              <p>Expense breakdown by category with charts</p>
            </div>
            <span className="report-card__arrow">→</span>
          </Link>
        </motion.div>
      </div>
    </motion.main>
  )
}

export default Reports
