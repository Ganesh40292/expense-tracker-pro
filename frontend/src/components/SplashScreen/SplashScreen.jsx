import { useEffect } from 'react'
import { motion } from 'framer-motion'
import './SplashScreen.css'

const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    // Total duration before unmounting
    const timer = setTimeout(() => {
      onComplete()
    }, 3800)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      className="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', transition: { duration: 0.8, ease: 'easeInOut' } }}
    >
      {/* Background ambient orbs */}
      <motion.div 
        className="splash-orb splash-orb--1"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="splash-orb splash-orb--2"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="splash-content">
        {/* Anti-Gravity 3D Logo */}
        <motion.div
          className="splash-logo-wrapper"
          initial={{ rotateX: 60, rotateZ: -45, rotateY: -90, scale: 0.3, opacity: 0 }}
          animate={{ 
            rotateX: [60, 15, 10], 
            rotateZ: [-45, 0, 0], 
            rotateY: [-90, 0, 5], 
            scale: [0.3, 1, 1.05], 
            opacity: [0, 1, 1] 
          }}
          transition={{ 
            duration: 3.5, 
            times: [0, 0.6, 1], 
            ease: [0.16, 1, 0.3, 1] 
          }}
        >
          {/* Layer 1: Deep Drop Shadow */}
          <div className="splash-layer splash-layer--shadow" />
          
          {/* Layer 2: Glowing Mesh Board */}
          <div className="splash-layer splash-layer--back">
            <div className="splash-grid-pattern" />
          </div>
          
          {/* Layer 3: Neon Outline Core */}
          <div className="splash-layer splash-layer--middle" />

          {/* Layer 4: Glassmorphic Floating Top */}
          <div className="splash-layer splash-layer--front">
            <span className="splash-letter splash-letter--e">E</span>
            <span className="splash-letter splash-letter--t">T</span>
          </div>

          {/* Orbiting Ring */}
          <motion.svg className="splash-orbit" viewBox="0 0 200 200">
            <motion.circle 
              cx="100" cy="100" r="98" 
              fill="none" 
              stroke="url(#orbit-grad)" 
              strokeWidth="2"
              initial={{ pathLength: 0, rotate: -90 }}
              animate={{ pathLength: 1, rotate: 180 }}
              transition={{ duration: 2.5, ease: 'easeInOut', delay: 0.5 }}
            />
            <defs>
              <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </motion.svg>
        </motion.div>

        {/* Text Reveal */}
        <motion.div
          className="splash-text-container"
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, delay: 1.2, ease: 'easeOut' }}
        >
          <h1 className="splash-title">
            ExpenseTracker
          </h1>
          <motion.div 
            className="splash-loading-bar"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, delay: 1.5, ease: "easeInOut" }}
          />
          <p className="splash-subtitle">Master Your Financial Future...</p>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default SplashScreen
