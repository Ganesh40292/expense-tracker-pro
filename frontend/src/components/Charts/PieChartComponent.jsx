import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#818cf8', '#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185']

const PieChartComponent = ({ data }) => {
  return (
    <div className="chart-wrap chart-wrap--pie">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="rgba(15, 20, 40, 0.6)"
                strokeWidth={2}
              />
            ))}
          </Pie>

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
              bottom: -6,
              color: 'rgba(124, 141, 181, 0.9)',
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PieChartComponent
