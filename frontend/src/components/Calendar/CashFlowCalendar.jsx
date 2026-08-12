import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCalendarAlt, FaTimes, FaExchangeAlt } from 'react-icons/fa'
import { formatCurrency } from '../../utils/formatCurrency'
import './CashFlowCalendar.css'

export default function CashFlowCalendar({ transactions = [] }) {
  const [selectedDate, setSelectedDate] = useState(null)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  // Map daily totals
  const dailyData = {}
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    dailyData[dayStr] = {
      income: 0,
      expense: 0,
      txs: [],
    }
  }

  transactions.forEach((tx) => {
    if (tx.transactionDate && dailyData[tx.transactionDate]) {
      if (tx.type === 'INCOME') dailyData[tx.transactionDate].income += Number(tx.amount || 0)
      else dailyData[tx.transactionDate].expense += Number(tx.amount || 0)
      dailyData[tx.transactionDate].txs.push(tx)
    }
  })

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  return (
    <div className="ag-panel shadow-xl">
      <div className="ag-panel__header">
        <h3 className="ag-panel__title">
          <FaCalendarAlt className="text-cyan-400" /> 30-Day Cash Flow Calendar ({monthNames[month]} {year})
        </h3>
        <span className="ag-panel__badge">Live Matrix</span>
      </div>

      <div className="ag-panel__body p-4">
        {/* Day Names Row */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-slate-400 mb-2">
          <span>SUN</span>
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-12 rounded-lg bg-slate-950/20 border border-transparent" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            const data = dailyData[dayStr] || { income: 0, expense: 0, txs: [] }

            const hasIncome = data.income > 0
            const hasExpense = data.expense > 0

            return (
              <motion.button
                key={dayStr}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(dayStr)}
                className={`h-12 rounded-lg p-1 border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                  selectedDate === dayStr
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-mono font-bold text-slate-300">{dayNum}</span>
                <div className="flex items-center gap-1">
                  {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />}
                  {hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Date Inspection Modal */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md p-6 border border-slate-700 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FaExchangeAlt className="text-cyan-400" /> Transactions for {selectedDate}
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <FaTimes size={12} />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {(!dailyData[selectedDate] || dailyData[selectedDate].txs.length === 0) ? (
                  <p className="text-xs text-slate-500 text-center py-4">No transactions logged on this day.</p>
                ) : (
                  dailyData[selectedDate].txs.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{tx.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{tx.category} • {tx.paymentMethod}</div>
                      </div>
                      <span className={`font-mono font-extrabold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
