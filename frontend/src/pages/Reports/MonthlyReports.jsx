import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { getMonthlyReport } from '../../services/reportService'
import { formatCurrency } from '../../utils/formatCurrency'
import Loader from '../../components/Loader/Loader'
import './Reports.css'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function MonthlyReports() {
  const { user } = useAuth()
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Reports - Monthly Income vs Expense', 14, 15)
    
    const tableColumn = ["Month", "Income", "Expense", "Net"]
    const tableRows = []
    
    monthlyData.forEach(row => {
      const rowData = [
        row.month,
        formatCurrency(row.income || 0),
        formatCurrency(row.expense || 0),
        formatCurrency((row.income || 0) - (row.expense || 0))
      ]
      tableRows.push(rowData)
    })
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20
    })
    
    doc.save('monthly_report.pdf')
  }

  useEffect(() => {
    if (!user?.id) return

    setLoading(true)
    getMonthlyReport(user.id)
      .then((data) => setMonthlyData(data))
      .catch((err) => console.error('Monthly report error:', err))
      .finally(() => setLoading(false))
  }, [user?.id])

  return (
    <main className="reports-page">
      <div className="reports-header">
        <h1>Reports - Monthly Income vs Expense</h1>
        <div className="reports-actions">
          <Link to="/reports/summary" className="btn-secondary">
            Expense by Category
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
            {monthlyData.length === 0 ? (
              <p className="empty-state">No monthly data available yet.</p>
            ) : (
              <div className="table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Income</th>
                      <th>Expense</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((row, index) => (
                      <tr key={index}>
                        <td data-label="Month">{row.month}</td>
                        <td className="amount-income" data-label="Income">{formatCurrency(row.income || 0)}</td>
                        <td className="amount-expense" data-label="Expense">{formatCurrency(row.expense || 0)}</td>
                        <td
                          data-label="Net"
                          className={
                            (row.income || 0) - (row.expense || 0) >= 0
                              ? 'amount-income'
                              : 'amount-expense'
                          }
                        >
                          {formatCurrency((row.income || 0) - (row.expense || 0))}
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

export default MonthlyReports

