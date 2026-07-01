import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import useTheme from '../../hooks/useTheme'

const COLORS = ['#818cf8', '#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#c084fc']

export default function BubbleChartComponent({ data }) {
  const containerRef = useRef(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // ResizeObserver for responsive re-rendering
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width, height: height || 300 })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return
    if (dimensions.width === 0) return

    // Filter out zero values and prepare nodes
    const validData = data.filter((d) => (d.expense || d.value) > 0)
    if (validData.length === 0) return

    const width = dimensions.width
    const height = dimensions.height

    // Clear previous renders
    d3.select(containerRef.current).selectAll('*').remove()

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('overflow', 'visible')

    const maxVal = d3.max(validData, (d) => d.expense || d.value)
    
    // Scale bubble sizes relative to the screen size
    const minRadius = width < 500 ? 15 : 25
    const maxRadius = width < 500 ? 50 : 80

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxVal])
      .range([minRadius, maxRadius])

    const nodes = validData.map((d, i) => ({
      ...d,
      r: radiusScale(d.expense || d.value),
      color: COLORS[i % COLORS.length],
    }))

    const simulation = d3
      .forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(15))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d) => d.r + 3).iterations(4)
      )
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04))

    const node = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(
        d3
          .drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      )
      .style('cursor', 'grab')

    // Glow filter
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Append Bubbles
    node
      .append('circle')
      .attr('r', (d) => d.r)
      .attr('fill', (d) => d.color)
      .attr('fill-opacity', 0.25)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 2)
      .style('filter', 'url(#glow)')
      .on('mouseover', function () {
        d3.select(this).attr('fill-opacity', 0.5)
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill-opacity', 0.25)
      })

    // Append Text (Category Name)
    node
      .append('text')
      .text((d) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('fill', isDark ? '#fff' : '#0f172a')
      .style('font-size', (d) => Math.min(d.r / 3.5, 14) + 'px')
      .style('font-weight', '700')
      .style('pointer-events', 'none')

    // Append Text (Amount)
    node
      .append('text')
      .text((d) => '₹' + Math.round(d.expense || d.value))
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('fill', isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.8)')
      .style('font-size', (d) => Math.min(d.r / 4, 12) + 'px')
      .style('font-family', 'monospace')
      .style('pointer-events', 'none')

    simulation.on('tick', () => {
      // Keep nodes within bounds
      node.attr('transform', (d) => {
        d.x = Math.max(d.r, Math.min(width - d.r, d.x))
        d.y = Math.max(d.r, Math.min(height - d.r, d.y))
        return `translate(${d.x},${d.y})`
      })
    })

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
      d3.select(this).style('cursor', 'grabbing')
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
      d3.select(this).style('cursor', 'grab')
    }

    return () => {
      simulation.stop()
    }
  }, [data, dimensions, theme])

  return (
    <div className="chart-wrap chart-wrap--bubble" style={{ height: '100%', minHeight: '300px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
