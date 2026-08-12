import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend } from 'recharts'
import { FaChartBar } from 'react-icons/fa'

export default function MoMComparisonChart({ transactions = [] }) {
  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`

  const categories = ['Food', 'Bills', 'Health', 'Education', 'Travel', 'Shopping', 'Entertainment']

  const chartData = categories.map((cat) => {
    const currentSpending = transactions
      .filter((t) => t.category === cat && t.type === 'EXPENSE' && t.transactionDate && t.transactionDate.startsWith(currentMonthStr))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0)

    const prevSpending = transactions
      .filter((t) => t.category === cat && t.type === 'EXPENSE' && t.transactionDate && t.transactionDate.startsWith(prevMonthStr))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0)

    return {
      category: cat,
      'Current Month': currentSpending,
      'Previous Month': prevSpending,
    }
  })

  return (
    <div className="ag-panel shadow-xl">
      <div className="ag-panel__header">
        <h3 className="ag-panel__title">
          <FaChartBar className="text-cyan-400" /> Month-over-Month Category Comparison
        </h3>
        <span className="ag-panel__badge">MoM Delta</span>
      </div>

      <div className="ag-panel__body" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
            <ChartTooltip
              contentStyle={{
                background: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Current Month" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Previous Month" fill="#818cf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
