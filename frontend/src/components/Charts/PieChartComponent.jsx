import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import useTheme from '../../hooks/useTheme'

const COLORS = ['#818cf8', '#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185']

const PieChartComponent = ({ data }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Dynamic Theme-Aware Styling Variables
  const cellStrokeColor = isDark ? 'rgba(15, 20, 40, 0.6)' : 'rgba(255, 255, 255, 0.8)'
  const tooltipBg = isDark ? 'rgba(15, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const tooltipBorder = isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.15)'
  const tooltipTextColor = isDark ? '#f0f4ff' : '#0f172a'
  const legendTextColor = isDark ? 'rgba(124, 141, 181, 0.9)' : 'rgba(71, 85, 105, 0.9)'

  return (
    <div className="chart-wrap chart-wrap--pie">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={isMobile ? 42 : 58}
            outerRadius={isMobile ? 68 : 88}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke={cellStrokeColor}
                strokeWidth={2}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: tooltipBg,
              border: tooltipBorder,
              backdropFilter: 'blur(16px)',
              borderRadius: 14,
              color: tooltipTextColor,
              boxShadow: isDark ? '0 20px 60px rgba(0, 0, 0, 0.4)' : '0 20px 60px rgba(99, 102, 241, 0.1)',
              fontSize: 13,
            }}
          />

          <Legend
            wrapperStyle={{
              bottom: -6,
              color: legendTextColor,
              fontSize: isMobile ? 11 : 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PieChartComponent
