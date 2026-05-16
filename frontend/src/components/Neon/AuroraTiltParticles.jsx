import { useEffect, useMemo, useRef } from 'react'
import './AuroraTiltParticles.css'
import '../../styles/aurora-tilt-particles.css'

export default function AuroraTiltParticles({ className = '' }) {
  const rootRef = useRef(null)

  const particles = useMemo(() => {
    const count = 56
    return Array.from({ length: count }).map((_, i) => ({
      i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      d: 5 + Math.random() * 6,
    }))
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const tiles = el.querySelectorAll('.tilt-3d')

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height

      // [-1..1]
      const dx = (px - 0.5) * 2
      const dy = (py - 0.5) * 2

      tiles.forEach((t) => {
        t.style.transform = `rotateX(${(-dy * 6).toFixed(2)}deg) rotateY(${(dx * 7).toFixed(2)}deg) translateZ(10px)`
      })
    }

    const onLeave = () => {
      tiles.forEach((t) => {
        t.style.transform = 'none'
      })
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)

    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div ref={rootRef} className={`aurora-ai ${className}`} aria-hidden="true">
      <div className="aurora-ai__aurora" />

      <div className="aurora-ai__orbs">
        <span />
        <span />
        <span />
      </div>

      <div className="aurora-ai__particles">
        {particles.map((p) => (
          <span
            key={p.i}
            className="aurora-ai__particle"
            style={{
              '--x': p.x,
              '--y': p.y,
              '--d': `${p.d}s`,
              '--i': p.i,
            }}
          />
        ))}
      </div>

      <div className="aurora-ai__vignette" />
    </div>
  )
}

