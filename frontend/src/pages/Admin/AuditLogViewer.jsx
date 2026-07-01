import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaSearch,
  FaFilter,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
} from 'react-icons/fa'
import { getAuditLogs } from '../../services/adminService'
import {
  exportAuditLogsPDF,
  exportAuditLogsExcel,
  exportAuditLogsCSV,
} from '../../services/adminExportService'
import Loader from '../../components/Loader/Loader'
import './Admin.css'

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [sortBy] = useState('timestamp')
  const [sortDir] = useState('desc')

  // Export dropdown
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)

      // Transform dates to standard ISO strings (YYYY-MM-DDTHH:mm:ss) expected by Backend
      let formattedStart = ''
      let formattedEnd = ''

      if (startDate) {
        formattedStart = `${startDate}T00:00:00`
      }
      if (endDate) {
        formattedEnd = `${endDate}T23:59:59`
      }

      const data = await getAuditLogs({
        search,
        action: actionFilter,
        startDate: formattedStart,
        endDate: formattedEnd,
        page,
        size,
        sortBy,
        sortDir,
      })
      setLogs(data.content || [])
      setTotalElements(data.totalElements || 0)
      setTotalPages(data.totalPages || 0)
    } catch (err) {
      console.error('Failed to load audit logs', err)
    } finally {
      setLoading(false)
    }
  }, [search, actionFilter, startDate, endDate, page, size, sortBy, sortDir])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(0)
  }

  const handleActionChange = (e) => {
    setActionFilter(e.target.value)
    setPage(0)
  }

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value)
    setPage(0)
  }

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value)
    setPage(0)
  }

  const handleExport = async (format) => {
    setExportDropdownOpen(false)
    try {
      setExporting(true)
      
      let formattedStart = ''
      let formattedEnd = ''
      if (startDate) formattedStart = `${startDate}T00:00:00`
      if (endDate) formattedEnd = `${endDate}T23:59:59`

      // Fetch all records matching current filters for export
      const allData = await getAuditLogs({
        search,
        action: actionFilter,
        startDate: formattedStart,
        endDate: formattedEnd,
        page: 0,
        size: 99999, // Large size to fetch all filtered records
        sortBy,
        sortDir,
      })
      const exportList = allData.content || []

      if (format === 'pdf') {
        exportAuditLogsPDF(exportList)
      } else if (format === 'excel') {
        await exportAuditLogsExcel(exportList)
      } else if (format === 'csv') {
        exportAuditLogsCSV(exportList)
      }
    } catch (err) {
      console.error('Export failed', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">System Audit Trail</h1>
          <p className="admin-subtitle">Consolidated logs of registration, login attempts, user profile updates, and exports</p>
        </div>

        {/* Export options */}
        <div style={{ position: 'relative' }}>
          <button
            className="action-btn action-btn--primary"
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            disabled={exporting}
          >
            <FaDownload size={14} />
            <span>{exporting ? 'Exporting...' : 'Export Audit Trail'}</span>
          </button>
          
          <AnimatePresence>
            {exportDropdownOpen && (
              <motion.div
                className="export-dropdown glass-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <button onClick={() => handleExport('pdf')}>PDF Format</button>
                <button onClick={() => handleExport('excel')}>Excel Spreadsheet</button>
                <button onClick={() => handleExport('csv')}>CSV Format</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Advanced Filtering Console */}
      <div className="filter-panel glass-card advanced-filter-grid">
        <div className="search-bar-wrapper search-bar-wrapper--grid">
          <FaSearch className="search-bar-icon" />
          <input
            type="text"
            placeholder="Search details or user email..."
            value={search}
            onChange={handleSearchChange}
            className="search-bar-input"
          />
        </div>

        <div className="filters-wrapper filters-wrapper--grid">
          <div className="select-wrapper">
            <FaFilter className="select-icon" />
            <select value={actionFilter} onChange={handleActionChange} className="select-filter">
              <option value="">All Operations</option>
              <option value="REGISTER">REGISTER</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="LOGIN_BLOCKED">LOGIN_BLOCKED</option>
              <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
              <option value="PROFILE_UPDATED">PROFILE_UPDATED</option>
              <option value="EXPORT_PDF">EXPORT_PDF</option>
              <option value="EXPORT_EXCEL">EXPORT_EXCEL</option>
            </select>
          </div>

          <div className="date-input-wrapper">
            <FaCalendarAlt className="date-input-icon" />
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="date-filter-input"
              title="Start Date"
            />
          </div>

          <div className="date-input-wrapper">
            <FaCalendarAlt className="date-input-icon" />
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="date-filter-input"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <Loader />
      ) : (
        <div className="glass-card table-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map(l => (
                    <tr key={l.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <span className={`action-badge action-badge--${l.action.toLowerCase()}`}>
                          {l.action}
                        </span>
                      </td>
                      <td>
                        {l.userId ? (
                          <Link to={`/admin/users/${l.userId}`} className="actor-link">
                            User #{l.userId}
                          </Link>
                        ) : (
                          <span className="text-muted">System/Guest</span>
                        )}
                      </td>
                      <td>{l.ipAddress || 'N/A'}</td>
                      <td className="detail-table-desc" style={{ maxWidth: '300px' }}>
                        {l.details}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-table-cell">
                      No audit logs match current search rules
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="table-pagination">
              <span className="pagination-info">
                Showing Page {page + 1} of {totalPages} ({totalElements} logs total)
              </span>
              <div className="pagination-controls">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="pagination-btn"
                >
                  <FaChevronLeft size={10} />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="pagination-btn"
                >
                  <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AuditLogViewer
