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
    if (downloading) return
    if (!transactions || transactions.length === 0) {
      showToast('No transactions found to generate PDF report.', 'warning')
      return
    }
    setDownloading(true)
    try {
      generatePDFReport(transactions, user, [], ['Personalized financial statement generated with ExpenseTracker Pro'])
      showToast('PDF Financial Report downloaded successfully!', 'success')
    } catch {
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

      {/* ── Summary Stats Banner ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FaChartBar size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Logged Transactions</div>
            <div className="text-xl font-extrabold text-slate-100">{transactions?.length || 0} Records</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FaCalendarAlt size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Reporting Range</div>
            <div className="text-xl font-extrabold text-slate-100">All Time</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <FaFilePdf size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Export Formats</div>
            <div className="text-xl font-extrabold text-slate-100">PDF • CSV • Excel</div>
          </div>
        </div>
      </div>

      <div className="reports-grid">
        {/* 1-Click PDF Download Card */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="report-card report-card--primary cursor-pointer"
          onClick={handleDownloadPdf}
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.85))',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.12)'
          }}
        >
          <div className="report-card__icon" style={{ color: '#ef4444' }}>
            <FaFilePdf size={26} />
          </div>
          <div className="report-card__text">
            <h3 className="flex items-center gap-2 text-slate-100 font-bold">
              1-Click Executive PDF Statement
              <span className="px-2 py-0.5 text-[9px] font-mono bg-red-900/60 text-red-300 border border-red-500/40 rounded-full">PDF</span>
            </h3>
            <p className="text-slate-300 text-xs">Generate styled PDF statement with summary totals & category breakdowns.</p>
          </div>
          <span className="report-card__arrow flex items-center justify-center w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
            <FaDownload size={14} />
          </span>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Link to="/reports/monthly" className="report-card report-card--primary" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(15, 23, 42, 0.85))' }}>
            <div className="report-card__icon" style={{ color: '#818cf8' }}>
              <FaCalendarAlt size={24} />
            </div>
            <div className="report-card__text">
              <h3 className="text-slate-100 font-bold">Monthly Breakdown Reports</h3>
              <p className="text-slate-300 text-xs">View income vs expense breakdown month by month with trend analysis.</p>
            </div>
            <span className="report-card__arrow">→</span>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Link to="/reports/summary" className="report-card report-card--cyan" style={{ background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(15, 23, 42, 0.85))' }}>
            <div className="report-card__icon" style={{ color: '#22d3ee' }}>
              <FaChartBar size={24} />
            </div>
            <div className="report-card__text">
              <h3 className="text-slate-100 font-bold">Category Summary & Charts</h3>
              <p className="text-slate-300 text-xs">Deep dive expense breakdown by category with interactive visual charts.</p>
            </div>
            <span className="report-card__arrow">→</span>
          </Link>
        </motion.div>
      </div>
    </motion.main>
  )
}

export default Reports
