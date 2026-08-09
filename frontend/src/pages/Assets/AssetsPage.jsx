import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FaCoins, FaPlus, FaTrash, FaChartLine } from 'react-icons/fa'
import api from '../../services/api'

export default function AssetsPage() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('STOCKS')
  const [institution, setInstitution] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [purchaseValue, setPurchaseValue] = useState('')

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/assets')
      if (res.data && res.data.length > 0) {
        setAssets(res.data)
      }
    } catch {
      console.log('Using local assets state fallback')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAssets()
    })
  }, [fetchAssets])

  const handleAddAsset = async (e) => {
    e.preventDefault()
    if (!name || !currentValue) return

    const newAsset = {
      name,
      type,
      institution,
      currentValue: parseFloat(currentValue),
      purchaseValue: purchaseValue ? parseFloat(purchaseValue) : parseFloat(currentValue),
      currency: 'INR'
    }

    try {
      const res = await api.post('/assets', newAsset)
      setAssets([...assets, res.data])
    } catch {
      setAssets([...assets, { ...newAsset, id: Date.now() }])
    }

    setName('')
    setInstitution('')
    setCurrentValue('')
    setPurchaseValue('')
  }

  const handleDeleteAsset = async (id) => {
    try {
      await api.delete(`/assets/${id}`)
    } catch {
      // fallback
    }
    setAssets(assets.filter(a => a.id !== id))
  }

  const totalNetWorth = assets.reduce((sum, a) => sum + (parseFloat(a.currentValue) || 0), 0)
  const totalGain = assets.reduce((sum, a) => {
    const curr = parseFloat(a.currentValue) || 0
    const purch = parseFloat(a.purchaseValue) || curr
    return sum + (curr - purch)
  }, 0)

  return (
    <div className="page-glass">
      <div className="page-header">
        <div>
          <h1>Assets & Net Worth Portfolio</h1>
          <p className="auth-subtitle" style={{ margin: 0 }}>
            Track investments, savings, real estate, and asset growth
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: '#34d399' }}>
            <FaCoins size={22} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Total Net Worth</h3>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 900, color: '#f0f4ff', margin: 0 }}>
            ₹{totalNetWorth.toLocaleString('en-IN')}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: '#22d3ee' }}>
            <FaChartLine size={22} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Unrealized Gain / Return</h3>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 900, color: totalGain >= 0 ? '#34d399' : '#fb7185', margin: 0 }}>
            {totalGain >= 0 ? '+' : ''}₹{totalGain.toLocaleString('en-IN')}
          </p>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#f0f4ff' }}>Portfolio Holdings</h2>
          {assets.length === 0 ? (
            <div className="empty-state">No assets added yet. Track your first investment!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {assets.map((asset) => (
                <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(15,20,40,0.5)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, color: '#f0f4ff', fontSize: '15px' }}>{asset.name}</h4>
                      <span className="badge badge-income">{asset.type}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', color: '#7c8db5', fontSize: '13px' }}>
                      {asset.institution && `${asset.institution} • `}Purchase: ₹{(asset.purchaseValue || asset.currentValue).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
                      ₹{parseFloat(asset.currentValue).toLocaleString('en-IN')}
                    </span>
                    <button onClick={() => handleDeleteAsset(asset.id)} className="btn-delete" aria-label="Delete asset">
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#f0f4ff' }}>Add Investment Asset</h2>
          <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label>Asset Name</label>
              <input type="text" placeholder="e.g. S&P 500 Index Fund" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Asset Class</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="STOCKS">Stocks / Equities</option>
                <option value="MUTUAL_FUNDS">Mutual Funds / ETFs</option>
                <option value="SAVINGS">Savings / Fixed Deposit</option>
                <option value="REAL_ESTATE">Real Estate</option>
                <option value="GOLD">Gold / Precious Metals</option>
                <option value="CRYPTO">Crypto Assets</option>
                <option value="OTHER">Other Holdings</option>
              </select>
            </div>
            <div className="form-group">
              <label>Institution / Broker</label>
              <input type="text" placeholder="e.g. Vanguard / HDFC" value={institution} onChange={(e) => setInstitution(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Current Valuation (₹)</label>
              <input type="number" placeholder="250000" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Initial Purchase Cost (₹)</label>
              <input type="number" placeholder="200000" value={purchaseValue} onChange={(e) => setPurchaseValue(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
              <FaPlus size={12} /> Add to Portfolio
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
