import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuth from '../../hooks/useAuth'
import api from '../../services/api'
import './CurrencySelector.css'

const currencies = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' }
]

const CurrencySelector = () => {
  const { user, loginUser, token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  const currentCurrency = user?.defaultCurrency || 'INR'
  const activeCurrency = currencies.find(c => c.code === currentCurrency) || currencies[0]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = async (currencyCode) => {
    if (currencyCode === currentCurrency || loading) {
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const response = await api.put(`/users/profile/${user.id}`, {
        name: user.name,
        email: user.email,
        defaultCurrency: currencyCode
      })

      loginUser(
        {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          defaultCurrency: response.data.defaultCurrency
        },
        token
      )
      setIsOpen(false)
      // Force reload dashboard or statistics if necessary, or context state change handles it
    } catch (err) {
      console.error('Failed to update currency:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="currency-selector" ref={containerRef}>
      <button
        type="button"
        className="currency-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        <span className="currency-selector__option-symbol">{activeCurrency.symbol}</span>
        <span>{activeCurrency.code}</span>
        <span className={`currency-selector__chevron ${isOpen ? 'currency-selector__chevron--open' : ''}`}>▾</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="currency-selector__dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {currencies.map((currency) => (
              <button
                key={currency.code}
                type="button"
                className={`currency-selector__option ${currency.code === currentCurrency ? 'currency-selector__option--active' : ''}`}
                onClick={() => handleSelect(currency.code)}
              >
                <span>{currency.code} ({currency.symbol})</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CurrencySelector
