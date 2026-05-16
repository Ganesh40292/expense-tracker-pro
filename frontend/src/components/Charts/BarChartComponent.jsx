import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const BarChartComponent = ({ data }) => {
  return (
    <div className="chart-wrap chart-wrap--bar">
      <ResponsiveContainer>
        <BarChart data={data}>
          <defs>
            <linearGradient id="barIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="barExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="rgba(99, 102, 241, 0.08)"
            strokeDasharray="4 6"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="rgba(124, 141, 181, 0.6)"
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: 'rgba(99, 102, 241, 0.1)' }}
          />
          <YAxis
            stroke="rgba(124, 141, 181, 0.6)"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: 'rgba(99, 102, 241, 0.1)' }}
          />

          <Tooltip
            contentStyle={{
              background: 'rgba(15, 20, 40, 0.9)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              backdropFilter: 'blur(16px)',
              borderRadius: 14,
              color: '#f0f4ff',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
              fontSize: 13,
            }}
          />

          <Legend
            wrapperStyle={{
              color: 'rgba(124, 141, 181, 0.9)',
              fontSize: 12,
            }}
          />

          <Bar dataKey="income" fill="url(#barIncome)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" fill="url(#barExpense)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BarChartComponent
