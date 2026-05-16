import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { getExpenseSummary } from '../../services/reportService'
import { formatCurrency } from '../../utils/formatCurrency'
import Loader from '../../components/Loader/Loader'
import './Reports.css'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function SummaryReports() {
  const { user } = useAuth()
  const [summaryData, setSummaryData] = useState([])
  const [loading, setLoading] = useState(true)

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Reports - Expense by Category', 14, 15)
    
    const tableColumn = ["Category", "Total", "Percentage"]
    const tableRows = []
    
    const currentTotal = summaryData.reduce((sum, r) => sum + (r.total || 0), 0)
    
    summaryData.forEach(row => {
      const percentage = currentTotal > 0 ? ((row.total / currentTotal) * 100).toFixed(1) : 0
      const rowData = [
        row.category,
        formatCurrency(row.total || 0),
        `${percentage}%`
      ]
      tableRows.push(rowData)
    })
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20
    })
    
    doc.save('summary_report.pdf')
  }

  useEffect(() => {
    if (!user?.id) return

    setLoading(true)
    getExpenseSummary(user.id)
      .then((data) => setSummaryData(data))
      .catch((err) => console.error('Expense summary error:', err))
      .finally(() => setLoading(false))
  }, [user?.id])

  const total = useMemo(() => {
    return (summaryData || []).reduce((sum, r) => sum + (r.total || 0), 0)
  }, [summaryData])

  return (
    <main className="reports-page">
      <div className="reports-header">
        <h1>Reports - Expense by Category</h1>
        <div className="reports-actions">
          <Link to="/reports/monthly" className="btn-secondary">
            Monthly Income vs Expense
          </Link>
          <button onClick={exportPDF} className="btn-primary">
            Export to PDF
          </button>
          <Link to="/dashboard" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="reports-content">
          <section className="report-section">
            {summaryData.length === 0 ? (
              <p className="empty-state">No expense data available yet.</p>
            ) : (
              <div className="table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Total</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row, index) => (
                      <tr key={index}>
                        <td>{row.category}</td>
                        <td>{formatCurrency(row.total || 0)}</td>
                        <td>
                          <div className="percentage-bar">
                            <div
                              className="percentage-fill"
                              style={{
                                width: `${total > 0 ? ((row.total / total) * 100).toFixed(1) : 0}%`,
                              }}
                            />
                            <span>
                              {total > 0 ? ((row.total / total) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default SummaryReports

