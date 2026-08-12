import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaFileCsv, FaTimes, FaCheck, FaTable } from 'react-icons/fa'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'
import './CsvAutoMapperModal.css'

export default function CsvAutoMapperModal({ isOpen, onClose, onImportSuccess }) {
  const { showToast } = useToast()

  const [rawHeaders, setRawHeaders] = useState([])
  const [csvRows, setCsvRows] = useState([])

  // Column Mappings
  const [dateCol, setDateCol] = useState('')
  const [titleCol, setTitleCol] = useState('')
  const [amountCol, setAmountCol] = useState('')
  const [typeCol, setTypeCol] = useState('')

  const [importing, setImporting] = useState(false)

  if (!isOpen) return null

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0)
      if (lines.length === 0) {
        showToast('Empty CSV file', 'warning')
        return
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
      const rows = lines.slice(1, 11).map((line) => {
        const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
        const obj = {}
        headers.forEach((h, idx) => {
          obj[h] = vals[idx] || ''
        })
        return obj
      })

      setRawHeaders(headers)
      setCsvRows(rows)

      // Auto-detect columns
      headers.forEach((h) => {
        const lower = h.toLowerCase()
        if (lower.includes('date') || lower.includes('time')) setDateCol(h)
        if (lower.includes('desc') || lower.includes('title') || lower.includes('particular') || lower.includes('name')) setTitleCol(h)
        if (lower.includes('amount') || lower.includes('val') || lower.includes('rupee')) setAmountCol(h)
        if (lower.includes('type') || lower.includes('cr/dr') || lower.includes('dr/cr')) setTypeCol(h)
      })
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = async () => {
    if (!titleCol || !amountCol) {
      showToast('Please map Title and Amount columns', 'warning')
      return
    }

    setImporting(true)
    let importedCount = 0

    try {
      for (const row of csvRows) {
        const amt = parseFloat(row[amountCol] || '0')
        if (isNaN(amt) || amt === 0) continue

        const typeStr = (row[typeCol] || '').toLowerCase()
        const isIncome = typeStr.includes('cr') || typeStr.includes('credit') || typeStr.includes('income')

        await api.post('/transactions', {
          title: row[titleCol] || 'Bank Import',
          amount: Math.abs(amt),
          type: isIncome ? 'INCOME' : 'EXPENSE',
          category: 'General',
          transactionDate: row[dateCol] || new Date().toISOString().split('T')[0],
          paymentMethod: 'BANK_TRANSFER',
          notes: 'Imported via Bank CSV Auto-Mapper',
        })
        importedCount++
      }

      showToast(`Batch imported ${importedCount} transactions from Bank CSV!`, 'success')
      onImportSuccess && onImportSuccess()
      onClose()
    } catch {
      showToast('Error during batch import', 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-2xl p-6 border border-slate-700 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FaFileCsv className="text-cyan-400" size={18} /> Bank Statement CSV Auto-Mapper
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {rawHeaders.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-800 hover:border-cyan-500/40 rounded-2xl text-center space-y-3 transition-all cursor-pointer relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FaFileCsv size={40} className="mx-auto text-cyan-400" />
            <div>
              <p className="text-sm font-bold text-slate-200">Upload Bank CSV Statement</p>
              <p className="text-xs text-slate-400">Supports HDFC, SBI, ICICI, Axis, Credit Card statements</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Column Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Date Column</label>
                <select
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none"
                  value={dateCol}
                  onChange={(e) => setDateCol(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {rawHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Description Column *</label>
                <select
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none"
                  value={titleCol}
                  onChange={(e) => setTitleCol(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {rawHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Amount Column *</label>
                <select
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none"
                  value={amountCol}
                  onChange={(e) => setAmountCol(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {rawHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Type / Cr/Dr</label>
                <select
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none"
                  value={typeCol}
                  onChange={(e) => setTypeCol(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {rawHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Data Preview Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <FaTable className="text-cyan-400" /> Live Data Preview (First 5 Rows)
              </h4>
              <div className="overflow-x-auto max-h-40 border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="p-2 border-b border-slate-800">Date</th>
                      <th className="p-2 border-b border-slate-800">Description</th>
                      <th className="p-2 border-b border-slate-800">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(0, 5).map((r, idx) => (
                      <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                        <td className="p-2 font-mono text-slate-400">{dateCol ? r[dateCol] : '—'}</td>
                        <td className="p-2 font-semibold text-slate-100">{titleCol ? r[titleCol] : '—'}</td>
                        <td className="p-2 font-mono font-bold text-cyan-400">{amountCol ? r[amountCol] : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRawHeaders([])}
                className="btn-secondary text-xs"
              >
                Reset CSV
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing}
                className="btn-primary text-xs"
              >
                <FaCheck size={12} /> {importing ? 'Importing Transactions...' : 'Confirm & Import All'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
