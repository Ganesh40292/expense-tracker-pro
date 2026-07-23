import { useState, useEffect } from 'react'
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
import useTheme from '../../hooks/useTheme'

const LineChartComponent = ({ data }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Dynamic Theme-Aware Styling Variables
  const gridColor = isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.15)'
  const axisColor = isDark ? 'rgba(124, 141, 181, 0.6)' : 'rgba(71, 85, 105, 0.8)'
  const axisLineColor = isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)'
  const tooltipBg = isDark ? 'rgba(15, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)'
  const tooltipBorder = isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.15)'
  const tooltipTextColor = isDark ? '#f0f4ff' : '#0f172a'
  const legendTextColor = isDark ? 'rgba(124, 141, 181, 0.9)' : 'rgba(71, 85, 105, 0.9)'
  const dotStrokeColor = isDark ? 'rgba(15, 20, 40, 0.6)' : 'rgba(255, 255, 255, 0.8)'

  return (
    <div className="chart-wrap chart-wrap--line" style={{ width: '100%', minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={300} minWidth={0}>
        <LineChart data={data} margin={isMobile ? { left: -10, right: 4 } : undefined}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke={gridColor}
            strokeDasharray="4 6"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke={axisColor}
            tick={{ fontSize: isMobile ? 10 : 12, fill: axisColor }}
            axisLine={{ stroke: axisLineColor }}
          />
          <YAxis
            stroke={axisColor}
            tick={{ fontSize: isMobile ? 10 : 12, fill: axisColor }}
            axisLine={{ stroke: axisLineColor }}
            width={isMobile ? 40 : 60}
          />

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
              color: legendTextColor,
              fontSize: isMobile ? 11 : 12,
            }}
          />

          <Line
            type="monotone"
            dataKey="amount"
            stroke="url(#lineGradient)"
            strokeWidth={isMobile ? 2 : 3}
            dot={{ r: isMobile ? 3 : 4, fill: '#818cf8', stroke: dotStrokeColor, strokeWidth: 2 }}
            activeDot={{ r: isMobile ? 5 : 6, fill: '#22d3ee', stroke: '#818cf8', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default LineChartComponent
