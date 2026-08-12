import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuth from '../../hooks/useAuth'
import { useCurrency } from '../../context/CurrencyContext'
import api from '../../services/api'
import { FaChevronDown, FaCheck } from 'react-icons/fa'
import './CurrencySelector.css'

const currencies = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
]

export default function CurrencySelector() {
  const { user, loginUser, token } = useAuth()
  const { currency: contextCurrency, setCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  const currentCurrency = contextCurrency || user?.defaultCurrency || 'INR'
  const activeCurrency = currencies.find((c) => c.code === currentCurrency) || currencies[0]

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
    setCurrency(currencyCode)
    setIsOpen(false)

    if (!user) return

    const targetUserId = user?.id || user?.userId || 'me'
    setLoading(true)
    try {
      const response = await api.put(`/users/profile/${targetUserId}`, {
        name: user.name,
        email: user.email,
        defaultCurrency: currencyCode,
      })

      loginUser(
        {
          ...user,
          id: response.data.id || user?.id || user?.userId,
          userId: response.data.id || user?.userId || user?.id,
          defaultCurrency: response.data.defaultCurrency || currencyCode,
        },
        token,
      )
    } catch (err) {
      console.error('Failed to sync currency preference:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="currency-selector relative" ref={containerRef}>
      <button
        type="button"
        className="currency-selector__trigger flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400 text-xs font-bold text-slate-100 transition-all shadow-md cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={loading}
      >
        <span className="text-cyan-400 font-extrabold font-mono text-sm">{activeCurrency.symbol}</span>
        <span className="font-mono">{activeCurrency.code}</span>
        <FaChevronDown
          size={10}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="currency-selector__dropdown absolute right-0 mt-2 w-48 bg-slate-950/95 border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl p-1.5 space-y-1"
          >
            {currencies.map((c) => {
              const isSelected = c.code === currentCurrency
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono font-bold w-4 text-center">{c.symbol}</span>
                    <span>{c.label}</span>
                  </span>
                  {isSelected && <FaCheck size={10} className="text-cyan-400" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
