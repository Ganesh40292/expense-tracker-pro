import { useEffect, useMemo, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

/**
 * AnimatedCounter
 * - Animates a number from 0 to `value`
 * - Uses framer-motion spring for smooth fintech-style motion
 */
export default function AnimatedCounter({
  value = 0,
  format = (n) => `${n}`,
  durationMs = 900,
}) {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : 0
  const [display, setDisplay] = useState(0)

  const spring = useSpring(0, {
    stiffness: 120,
    damping: 18,
    mass: 0.6,
  })

  useEffect(() => {
    const start = performance.now()
    const target = safeValue

    const tick = () => {
      const now = performance.now()
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      const next = target * eased
      setDisplay(next)
      if (t < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [safeValue, durationMs])

  const formatted = useMemo(() => format(display), [display, format])

  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {formatted}
    </motion.span>
  )
}

