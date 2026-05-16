import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const LineChartComponent = ({ data }) => {
  return (
    <div className="chart-wrap chart-wrap--line">
      <ResponsiveContainer>
        <LineChart data={data}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#22d3ee" />
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
            tick={{ fontSize: 12 }}
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

          <Line
            type="monotone"
            dataKey="amount"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={{ r: 4, fill: '#818cf8', stroke: 'rgba(15, 20, 40, 0.6)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#22d3ee', stroke: '#818cf8', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default LineChartComponent
