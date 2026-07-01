import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FaHeartbeat,
  FaServer,
  FaDatabase,
  FaEnvelopeOpenText,
  FaSync,
  FaClock,
} from 'react-icons/fa'
import { getSystemHealth } from '../../services/adminService'
import Loader from '../../components/Loader/Loader'
import './Admin.css'

const SystemHealth = () => {
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealth = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      const data = await getSystemHealth()
      setHealth(data)
    } catch (err) {
      console.error('Failed to load system health', err)
      setError('Telemetry database connection failed.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  if (loading) return <Loader />

  if (error || !health) {
    return (
      <div className="admin-container">
        <div className="glass-card error-card">
          <p>{error || 'An error occurred'}</p>
          <button onClick={() => fetchHealth()} className="action-btn action-btn--secondary">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const { jvm, database, emailLogs, jobs } = health

  // Convert bytes to Megabytes for display
  const formatMB = (bytes) => {
    return `${Math.round(bytes / (1024 * 1024))} MB`
  }

  // Calculate memory usage percent
  const totalMemory = jvm.totalMemory
  const freeMemory = jvm.freeMemory
  const usedMemory = totalMemory - freeMemory
  const memoryPercent = Math.round((usedMemory / totalMemory) * 100)

  // Calculate email success rate
  const emailSent = emailLogs.sent || 0
  const emailFailed = emailLogs.failed || 0
  const emailTotal = emailSent + emailFailed
  const emailSuccessRate = emailTotal === 0 ? 100 : Math.round((emailSent / emailTotal) * 100)

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">System Health & Telemetry</h1>
          <p className="admin-subtitle">Monitor hardware resource allocation, DB latency, and job dispatch queues</p>
        </div>
        <button
          onClick={() => fetchHealth(true)}
          className="action-btn action-btn--secondary"
          disabled={refreshing}
        >
          <FaSync className={refreshing ? 'spin-animation' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Grid panels */}
      <div className="analytics-grid-two-cols">
        {/* Core JVM Telemetry */}
        <motion.div
          className="glass-card telemetry-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="card-header-with-icon">
            <FaServer className="card-header-icon color-purple" />
            <h3>JVM Execution Environment</h3>
          </div>
          <div className="telemetry-body">
            <div className="telemetry-stat-row">
              <span>Memory Allocation</span>
              <span>{formatMB(usedMemory)} / {formatMB(totalMemory)} ({memoryPercent}%)</span>
            </div>
            
            {/* Custom progress bar */}
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill progress-bar-fill--purple"
                style={{ width: `${memoryPercent}%` }}
              />
            </div>

            <div className="telemetry-stat-row" style={{ marginTop: '20px' }}>
              <span>Max Memory Threshold</span>
              <span>{formatMB(jvm.maxMemory)}</span>
            </div>

            <div className="telemetry-stat-row">
              <span>Active JVM Threads</span>
              <span>{jvm.activeThreads} threads</span>
            </div>
          </div>
        </motion.div>

        {/* Database Status Telemetry */}
        <motion.div
          className="glass-card telemetry-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="card-header-with-icon">
            <FaDatabase className="card-header-icon color-blue" />
            <h3>Database Engine</h3>
          </div>
          <div className="telemetry-body">
            <div className="telemetry-stat-row">
              <span>Connection Status</span>
              <span className={`status-pill ${database.status === 'UP' ? 'status-pill--active' : 'status-pill--inactive'}`}>
                {database.status === 'UP' ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <div className="telemetry-stat-row" style={{ marginTop: '20px' }}>
              <span>Ping Latency</span>
              <span className="telemetry-latency-value">{database.latencyMs} ms</span>
            </div>

            {/* Custom visual latency indicator */}
            <div className="latency-bar-container">
              <div
                className={`latency-bar-fill ${database.latencyMs < 50 ? 'latency-green' : database.latencyMs < 200 ? 'latency-yellow' : 'latency-red'}`}
                style={{ width: `${Math.min(100, (database.latencyMs / 300) * 100)}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Second row of grid panels */}
      <div className="analytics-grid-two-cols" style={{ marginTop: '24px' }}>
        {/* Email Logs Queue */}
        <motion.div
          className="glass-card telemetry-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header-with-icon">
            <FaEnvelopeOpenText className="card-header-icon color-emerald" />
            <h3>SMTP Mail Server Stats (Last 7 Days)</h3>
          </div>
          <div className="telemetry-body">
            <div className="telemetry-stat-row">
              <span>Delivery Success Rate</span>
              <span>{emailSuccessRate}%</span>
            </div>
            
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill progress-bar-fill--emerald"
                style={{ width: `${emailSuccessRate}%` }}
              />
            </div>

            <div className="telemetry-stat-row" style={{ marginTop: '20px' }}>
              <span>Sent Emails</span>
              <span>{emailSent} messages</span>
            </div>

            <div className="telemetry-stat-row">
              <span>Failed Dispatches</span>
              <span className={emailFailed > 0 ? 'text-danger' : ''}>{emailFailed} failures</span>
            </div>
          </div>
        </motion.div>

        {/* Job processor */}
        <motion.div
          className="glass-card telemetry-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header-with-icon">
            <FaClock className="card-header-icon color-amber" />
            <h3>Scheduler & Cron Workers</h3>
          </div>
          <div className="telemetry-body">
            <div className="telemetry-stat-row">
              <span>Recurring Expenses Runner</span>
              <span className="status-pill status-pill--active">RUNNING</span>
            </div>

            <div className="telemetry-stat-row" style={{ marginTop: '20px' }}>
              <span>Active Scheduled Calendars</span>
              <span>{jobs.activeRecurringExpenses} items</span>
            </div>

            <div className="telemetry-stat-row">
              <span>Daemon Thread Status</span>
              <span>Active / Waiting</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SystemHealth
