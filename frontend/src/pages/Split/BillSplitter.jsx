import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaUsers, FaPlus, FaTrash, FaCalculator, FaShareAlt, FaCheck, FaArrowLeft, FaReceipt } from 'react-icons/fa'
import { formatCurrency } from '../../utils/formatCurrency'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'
import './BillSplitter.css'

export default function BillSplitter() {
  const { showToast } = useToast()

  const [billTitle, setBillTitle] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [payerName, setPayerName] = useState('You')
  const [participants, setParticipants] = useState(['You', 'Rahul', 'Priya'])
  const [newPerson, setNewPerson] = useState('')
  const [splitResult, setSplitResult] = useState(null)
  const [addingToTx, setAddingToTx] = useState(false)

  const handleAddParticipant = (e) => {
    e.preventDefault()
    if (!newPerson.trim()) return
    if (participants.includes(newPerson.trim())) {
      showToast('Participant already added', 'warning')
      return
    }
    setParticipants((prev) => [...prev, newPerson.trim()])
    setNewPerson('')
  }

  const handleRemoveParticipant = (person) => {
    if (participants.length <= 2) {
      showToast('Minimum 2 participants required', 'warning')
      return
    }
    setParticipants((prev) => prev.filter((p) => p !== person))
  }

  const handleCalculateSplit = (e) => {
    e.preventDefault()
    const total = Number(totalAmount)
    if (!total || total <= 0) {
      showToast('Please enter a valid bill amount', 'warning')
      return
    }

    const perPerson = Math.round((total / participants.length) * 100) / 100
    const owesList = participants
      .filter((p) => p !== payerName)
      .map((p) => ({
        from: p,
        to: payerName,
        amount: perPerson,
      }))

    setSplitResult({
      title: billTitle || 'Group Bill',
      total,
      payer: payerName,
      perPerson,
      owesList,
    })

    showToast('Settlement split calculated!', 'success')
  }

  const handleAddShareToTransactions = async () => {
    if (!splitResult) return
    setAddingToTx(true)
    try {
      await api.post('/transactions', {
        title: `Split Share: ${splitResult.title}`,
        amount: splitResult.perPerson,
        type: 'EXPENSE',
        category: 'Food',
        transactionDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI',
        notes: `Group Bill Split (${participants.length} people)`,
      })
      showToast(`Added ₹${splitResult.perPerson} to your transactions!`, 'success')
    } catch {
      showToast('Failed to add split share to transactions', 'error')
    } finally {
      setAddingToTx(false)
    }
  }

  const handleShareWhatsApp = () => {
    if (!splitResult) return
    const text = `💸 *Expense Split: ${splitResult.title}*\nTotal: ₹${splitResult.total}\nPaid by: ${splitResult.payer}\n\n*Settlement Summary (₹${splitResult.perPerson} per person):*\n` +
      splitResult.owesList.map((o) => `• ${o.from} owes ${o.to}: ₹${o.amount}`).join('\n') +
      `\n\nSent via ExpenseTracker Pro`

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <motion.main
      className="page-glass bill-splitter-page space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-100">
            <FaUsers className="text-cyan-400" size={24} />
            Group Bill & Expense Splitter
          </h1>
          <p className="text-xs text-slate-400">
            Split restaurant bills, rent, or trip expenses, generate settlement summaries, and share via WhatsApp
          </p>
        </div>
        <Link to="/dashboard" className="btn-secondary text-xs">
          <FaArrowLeft size={12} /> Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Card: Input Bill Form */}
        <div className="glass-card p-6 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <FaCalculator className="text-cyan-400" size={16} />
            <h3 className="text-sm font-bold text-slate-100">Bill Details & Participants</h3>
          </div>

          <form onSubmit={handleCalculateSplit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bill Title / Description</label>
              <input
                type="text"
                placeholder="e.g. Dinner at Punjab Grill"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/60 focus:border-cyan-400 text-xs text-slate-100 outline-none"
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Total Bill Amount (₹)</label>
                <input
                  type="number"
                  placeholder="2400"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/60 focus:border-cyan-400 text-xs text-slate-100 outline-none"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Who Paid the Full Bill?</label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/60 focus:border-cyan-400 text-xs text-slate-100 outline-none"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                >
                  {participants.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Participants list */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Participants ({participants.length})
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {participants.map((person) => (
                  <span
                    key={person}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center gap-2"
                  >
                    <span>{person}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(person)}
                      className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <FaTrash size={10} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add person name..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/60 text-xs text-slate-100 outline-none"
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="btn-secondary text-xs shrink-0"
                >
                  <FaPlus size={11} /> Add
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5 text-xs font-bold mt-2">
              <FaCalculator size={12} /> Calculate Settlement Matrix
            </button>
          </form>
        </div>

        {/* Right Card: Settlement Summary Matrix */}
        <div className="glass-card p-6 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <FaReceipt className="text-emerald-400" size={16} />
            <h3 className="text-sm font-bold text-slate-100">Settlement Summary</h3>
          </div>

          {!splitResult ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <FaUsers size={32} className="mx-auto text-slate-700" />
              <p className="text-xs">Fill out the bill details and click Calculate to view who owes whom.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Bill Amount:</span>
                  <strong className="text-slate-100 font-mono">{formatCurrency(splitResult.total)}</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Paid by:</span>
                  <strong className="text-cyan-400">{splitResult.payer}</strong>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Per Person Share:</span>
                  <strong className="text-emerald-400 font-extrabold font-mono text-sm">
                    {formatCurrency(splitResult.perPerson)}
                  </strong>
                </div>
              </div>

              {/* Owes List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Net Settlements:</h4>
                {splitResult.owesList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300">
                      <strong className="text-cyan-300">{item.from}</strong> owes <strong className="text-slate-100">{item.to}</strong>
                    </span>
                    <span className="font-mono font-bold text-amber-400">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FaShareAlt size={12} /> Share via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleAddShareToTransactions}
                  disabled={addingToTx}
                  className="flex-1 btn-primary py-2.5 justify-center text-xs"
                >
                  <FaCheck size={12} /> {addingToTx ? 'Adding...' : 'Add My Share to Transactions'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.main>
  )
}
