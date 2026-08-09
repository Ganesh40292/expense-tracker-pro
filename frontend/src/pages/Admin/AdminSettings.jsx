import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaCog, FaSave, FaExclamationCircle } from 'react-icons/fa'
import { getSystemSettings, updateSystemSettings } from '../../services/adminService'
import Loader from '../../components/Loader/Loader'
import './Admin.css'

const AdminSettings = () => {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState([])
  const [formValues, setFormValues] = useState({})
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const data = await getSystemSettings()
        setSettings(data || [])
        // Map list to key-value object
        const values = {}
        data.forEach(item => {
          values[item.key] = item.value
        })
        setFormValues(values)
      } catch (err) {
        console.error('Failed to load settings', err)
        setError('Failed to fetch system configurations.')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleInputChange = (key, value) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }))
    setSuccess(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      await updateSystemSettings(formValues)
      setSuccess('Configurations saved and cached successfully.')
    } catch (err) {
      console.error('Failed to save settings', err)
      setError('Could not persist system settings updates.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader />

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Global Platform Settings</h1>
          <p className="admin-subtitle">Manage SaaS parameters, dynamic lockout triggers, and maintenance modes</p>
        </div>
        <div className="admin-badge">
          <FaCog className="admin-badge-icon" />
          <span>Config Center</span>
        </div>
      </div>

      <div className="admin-settings-layout" style={{ marginTop: '24px' }}>
        <motion.div
          className="glass-card settings-form-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error && (
            <div className="form-alert alert-danger" style={{ marginBottom: '16px' }}>
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="form-alert alert-success" style={{ marginBottom: '16px' }}>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="admin-settings-form">
            <div className="settings-fields-group">
              {settings.map(item => {
                const isBoolean = item.value === 'true' || item.value === 'false'

                return (
                  <div key={item.key} className="settings-field-row">
                    <div className="settings-field-info">
                      <label className="field-label">{item.key.replace(/\./g, ' ').toUpperCase()}</label>
                      <span className="field-description">{item.description}</span>
                    </div>
                    <div className="settings-field-input-wrapper">
                      {isBoolean ? (
                        <div className="settings-toggle-wrapper">
                          <button
                            type="button"
                            onClick={() => handleInputChange(item.key, formValues[item.key] === 'true' ? 'false' : 'true')}
                            className={`settings-toggle-btn ${formValues[item.key] === 'true' ? 'settings-toggle-btn--active' : ''}`}
                          >
                            <span className="toggle-slider" />
                          </button>
                          <span className="toggle-value-label">
                            {formValues[item.key] === 'true' ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formValues[item.key] || ''}
                          onChange={(e) => handleInputChange(item.key, e.target.value)}
                          className="settings-text-input"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="settings-form-actions">
              <button
                type="submit"
                disabled={saving}
                className="action-btn action-btn--primary"
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <FaSave />
                <span>{saving ? 'Saving...' : 'Save Configurations'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminSettings
