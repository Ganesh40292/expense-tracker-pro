import { motion } from 'framer-motion'
import './AuroraBackground.css'
/**
 * AuroraBackground — Floating aurora gradient layer.
 * Pure CSS + Framer Motion. No Three.js, no Canvas.
 * Renders animated radial gradients in cyan/purple/blue.
 */
export default function AuroraBackground() {
  return (
    <div className="aurora-bg" aria-hidden="true">
      {/* Mesh gradient layer */}
      <div className="aurora-bg__mesh" />

      {/* Floating orbs */}
      <motion.div
        className="aurora-bg__orb aurora-bg__orb--1"
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -25, 15, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="aurora-bg__orb aurora-bg__orb--2"
        animate={{
          x: [0, -35, 25, 0],
          y: [0, 20, -30, 0],
          scale: [1, 0.93, 1.06, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="aurora-bg__orb aurora-bg__orb--3"
        animate={{
          x: [0, 20, -15, 0],
          y: [0, -18, 22, 0],
          scale: [1, 1.04, 0.97, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Grid overlay */}
      <div className="aurora-bg__grid" />

      {/* Noise texture */}
      <div className="aurora-bg__noise" />

      {/* Vignette */}
      <div className="aurora-bg__vignette" />
    </div>
  )
}
