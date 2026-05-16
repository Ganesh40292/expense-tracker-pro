import React from 'react'
import './NeonBackground.css'

const NeonBackground = () => {
  return (
    <div className="neon-bg" aria-hidden="true">
      <div className="neon-bg__mesh" />
      <div className="neon-bg__grid" />

      <div className="neon-bg__orbs">
        <div className="orb orb--a" />
        <div className="orb orb--b" />
        <div className="orb orb--c" />
        <div className="orb orb--d" />
      </div>

      <div className="neon-bg__vignette" />
    </div>
  )
}

export default NeonBackground

