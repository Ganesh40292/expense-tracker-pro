import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUsers, FaPlus, FaTrash, FaCalculator, FaCheck, FaArrowLeft, FaReceipt, FaCoins, FaUserCheck, FaWhatsapp } from 'react-icons/fa'
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
  const [splitMode, setSplitMode] = useState('EQUAL') // 'EQUAL' or 'CUSTOM'
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
      showToast('Minimum 2 participants required for group split', 'warning')
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
      title: billTitle || 'Group Expense',
      total,
      payer: payerName,
      perPerson,
      owesList,
    })

    showToast('Settlement matrix computed!', 'success')
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
            Group Bill & Settlement Calculator
          </h1>
          <p className="text-sm text-slate-300">
            Split restaurant bills, rent, or group trip expenses, generate settlement matrices, and export WhatsApp links
          </p>
        </div>
        <Link to="/dashboard" className="btn-secondary text-sm px-4 py-2.5">
          <FaArrowLeft size={13} /> Dashboard
        </Link>
      </div>

      {/* ── Top Summary Hero Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border border-cyan-500/30 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950/95 flex items-center gap-4 rounded-3xl shadow-xl">
          <div className="p-3.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <FaCalculator size={24} />
          </div>
          <div>
            <div className="text-xs uppercase font-mono text-slate-400 font-bold">Split Strategy</div>
            <div className="text-lg font-extrabold text-slate-100 mt-0.5">Equal Division (1/N)</div>
          </div>
        </div>

        <div className="glass-card p-6 border border-indigo-500/30 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950/95 flex items-center gap-4 rounded-3xl shadow-xl">
          <div className="p-3.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <FaUserCheck size={22} />
          </div>
          <div>
            <div className="text-xs uppercase font-mono text-slate-400 font-bold">Active Group</div>
            <div className="text-lg font-extrabold text-slate-100 mt-0.5">{participants.length} Members</div>
          </div>
        </div>

        <div className="glass-card p-6 border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950/95 flex items-center gap-4 rounded-3xl shadow-xl">
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <FaCoins size={22} />
          </div>
          <div>
            <div className="text-xs uppercase font-mono text-slate-400 font-bold">Per Person Share</div>
            <div className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">
              {splitResult ? formatCurrency(splitResult.perPerson) : '₹0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Splitter Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Form Card */}
        <div className="glass-card p-8 sm:p-10 border border-slate-700/80 space-y-6 rounded-3xl bg-slate-900/90 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-3">
              <FaCalculator className="text-cyan-400" size={20} /> Expense & Member Config
            </h3>
            <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSplitMode('EQUAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  splitMode === 'EQUAL'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Equal Split
              </button>
            </div>
          </div>

          <form onSubmit={handleCalculateSplit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Expense Title / Description</label>
              <input
                type="text"
                placeholder="e.g. Weekend Villa Rental & Dinner"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 text-sm text-slate-100 outline-none transition-all shadow-inner"
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Total Bill Amount (₹)</label>
                <input
                  type="number"
                  placeholder="3500"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 text-sm text-slate-100 font-mono font-bold outline-none transition-all shadow-inner"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Who Paid upfront?</label>
                <select
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 text-sm text-slate-100 font-semibold outline-none transition-all"
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Group Members ({participants.length})
                </label>
                <span className="text-xs text-slate-400 font-mono">Min 2 People</span>
              </div>

              <div className="flex flex-wrap gap-2.5 mb-4">
                {participants.map((person) => (
                  <span
                    key={person}
                    className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-700/80 text-xs text-slate-200 flex items-center gap-2.5 shadow-sm font-semibold"
                  >
                    <span>{person}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(person)}
                      className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <FaTrash size={11} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Add friend's name..."
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 outline-none"
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="btn-secondary text-xs font-bold px-4 py-3.5 rounded-2xl shrink-0"
                >
                  <FaPlus size={12} /> Add Member
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3.5 text-sm font-bold rounded-2xl shadow-lg mt-2">
              <FaCalculator size={14} /> Calculate Settlement Matrix
            </button>
          </form>
        </div>

        {/* Right Settlement Summary Matrix Card */}
        <div className="glass-card p-8 sm:p-10 border border-slate-700/80 space-y-6 rounded-3xl bg-slate-900/90 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <FaReceipt className="text-emerald-400" size={20} />
            <h3 className="text-lg font-extrabold text-slate-100">Settlement Matrix & Balances</h3>
          </div>

          {!splitResult ? (
            <div className="p-10 text-center text-slate-500 space-y-3">
              <FaUsers size={36} className="mx-auto text-slate-700 animate-pulse" />
              <p className="text-xs">Configure the group bill on the left and click Calculate to generate settlements.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Summary Metrics */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Expense Volume:</span>
                    <strong className="text-slate-100 font-mono">{formatCurrency(splitResult.total)}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Upfront Payer:</span>
                    <strong className="text-cyan-400 flex items-center gap-1">
                      <FaUserCheck size={11} /> {splitResult.payer}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Exact Share Per Person:</span>
                    <strong className="text-emerald-400 font-extrabold font-mono text-sm">
                      {formatCurrency(splitResult.perPerson)}
                    </strong>
                  </div>
                </div>

                {/* Individual Owes List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">Pending Reimbursements:</h4>
                  {splitResult.owesList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs transition-all hover:border-slate-700"
                    >
                      <span className="text-slate-300">
                        <strong className="text-cyan-300 font-bold">{item.from}</strong> owes <strong className="text-slate-100 font-bold">{item.to}</strong>
                      </span>
                      <span className="font-mono font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <FaWhatsapp size={14} className="text-emerald-400" /> Share via WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={handleAddShareToTransactions}
                    disabled={addingToTx}
                    className="flex-1 btn-primary py-2.5 justify-center text-xs font-bold"
                  >
                    <FaCheck size={12} /> {addingToTx ? 'Saving Share...' : 'Add Share to My Log'}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.main>
  )
}
