import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaFilePdf, FaFileExcel, FaFileCsv, FaTimes, FaSpinner, FaChartBar } from 'react-icons/fa'
import { generatePDFReport, generateExcelReport, generateCSVReport } from '../../services/exportService'
import { getAiIntelligence } from '../../services/aiService'
import './ExportCenter.css'

const exportOptions = [
  {
    id: 'pdf',
    title: 'PDF Report',
    desc: 'Professional report with charts and summaries.',
    icon: FaFilePdf,
    color: '#ef4444' // red
  },
  {
    id: 'excel',
    title: 'Excel Worksheet',
    desc: 'Categorized sheets with colored cells & formatting.',
    icon: FaFileExcel,
    color: '#10b981' // green
  },
  {
    id: 'csv',
    title: 'CSV Data',
    desc: 'Raw comma-separated values for database import.',
    icon: FaFileCsv,
    color: '#3b82f6' // blue
  }
]

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
}

const ExportCenter = ({ isOpen, onClose, transactions, user, getChartSnapshots = null }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setError('')

      if (transactions.length === 0) {
        throw new Error('No transactions found to export based on current filters.')
      }

      if (selectedFormat === 'pdf') {
        let snapshots = []
        if (includeCharts && getChartSnapshots) {
          snapshots = await getChartSnapshots()
        }
        
        let aiInsights = []
        try {
          const intelData = await getAiIntelligence()
          if (intelData && intelData.insights) {
            aiInsights = intelData.insights
          }
        } catch (e) {
          console.warn('Could not fetch AI insights for PDF report:', e)
        }
        
        generatePDFReport(transactions, user, snapshots, aiInsights)
      } else if (selectedFormat === 'excel') {
        await generateExcelReport(transactions, user)
      } else if (selectedFormat === 'csv') {
        generateCSVReport(transactions)
      }
      
      // Close modal on success (optional)
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      setError(err.message || 'An error occurred during export.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="export-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="export-modal__header">
              <h2>Export Center</h2>
              <button className="export-modal__close" onClick={onClose} aria-label="Close Export Center">
                <FaTimes />
              </button>
            </div>

            <div className="export-modal__body">
              <p className="export-modal__subtitle">
                Exporting <strong>{transactions.length}</strong> transactions based on current filters.
              </p>

              <div className="export-options-grid">
                {exportOptions.map((opt) => (
                  <div 
                    key={opt.id}
                    className={`export-card ${selectedFormat === opt.id ? 'export-card--active' : ''}`}
                    onClick={() => setSelectedFormat(opt.id)}
                    style={{ '--theme-color': opt.color }}
                  >
                    <div className="export-card__icon" style={{ color: opt.color }}>
                      <opt.icon size={24} />
                    </div>
                    <div className="export-card__content">
                      <h3>{opt.title}</h3>
                      <p>{opt.desc}</p>
                    </div>
                    {selectedFormat === opt.id && (
                      <motion.div className="export-card__indicator" layoutId="indicator" />
                    )}
                  </div>
                ))}
              </div>

              {selectedFormat === 'pdf' && (
                <div className="export-settings">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                    />
                    <span className="checkbox-custom"></span>
                    Include Dashboard Charts in PDF
                  </label>
                </div>
              )}

              {error && <div className="export-error">{error}</div>}
            </div>

            <div className="export-modal__footer">
              <button className="btn-secondary" onClick={onClose} disabled={isExporting}>
                Cancel
              </button>
              <button 
                className="btn-primary btn-export" 
                onClick={handleExport}
                disabled={isExporting || transactions.length === 0}
              >
                {isExporting ? (
                  <>
                    <FaSpinner className="spinner" /> Generating...
                  </>
                ) : (
                  'Download Report'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExportCenter
