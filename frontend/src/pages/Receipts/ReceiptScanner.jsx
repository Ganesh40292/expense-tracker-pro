import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Tesseract from 'tesseract.js'
import {
  FaUpload,
  FaFileImage,
  FaFilePdf,
  FaCheckCircle,
  FaTrash,
  FaDownload,
  FaLink,
  FaUnlink,
  FaSpinner,
  FaEye,
  FaChevronRight,
  FaChartLine,
  FaCoins,
  FaRegFileAlt,
  FaArrowLeft,
  FaSync,
} from 'react-icons/fa'
import {
  uploadReceipt,
  analyzeReceipt,
  getReceipts,
  deleteReceipt,
  getReceiptImageBlob,
  unlinkReceipt,
} from '../../services/receiptService'
import { addTransaction } from '../../services/transactionService'
import { CATEGORIES } from '../../utils/constants'
import PieChartComponent from '../../components/Charts/PieChartComponent'
import './ReceiptScanner.css'

function ReceiptScanner() {
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Drag-and-drop state
  const [dragActive, setDragActive] = useState(false)
  
  // OCR processing states
  const [processing, setProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState('')

  // Active receipt for preview & linkage
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [activeImageUrl, setActiveImageUrl] = useState(null)

  // Transaction form states
  const [showFillForm, setShowFillForm] = useState(false)
  const [txForm, setTxForm] = useState({
    title: '',
    amount: '',
    currency: 'INR',
    type: 'EXPENSE',
    category: CATEGORIES[0],
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [formError, setFormError] = useState('')

  // Bulk Upload Queue
  const [bulkQueue, setBulkQueue] = useState([])
  const [isBulkMode, setIsBulkMode] = useState(false)

  // Gallery view filter
  const [filter, setFilter] = useState('ALL') // ALL, LINKED, UNLINKED

  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchReceipts()
  }, [])

  const fetchReceipts = async () => {
    setLoading(true)
    try {
      const data = await getReceipts()
      // Sort: newest first
      setReceipts(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (err) {
      console.error(err)
      setError('Failed to fetch receipts list')
    } finally {
      setLoading(false)
    }
  }

  // Handle Drag Events
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle Drop
  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 1) {
        handleBulkSelection(files)
      } else {
        handleSingleFile(files[0])
      }
    }
  }

  // Handle manual selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      if (files.length > 1) {
        handleBulkSelection(files)
      } else {
        handleSingleFile(files[0])
      }
    }
  }

  // Handle single file flow
  const handleSingleFile = async (file) => {
    setError('')
    setSuccessMsg('')
    setOcrProgress(0)

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')

    setProcessing(true)
    setOcrStatus('Uploading file securely...')

    try {
      // 1. Upload to server to save metadata and get receipt ID
      const savedReceipt = await uploadReceipt(file)
      setActiveReceipt(savedReceipt)
      
      // Load image preview blob
      const imageUrl = await getReceiptImageBlob(savedReceipt.id)
      setActiveImageUrl(imageUrl)

      if (isPdf) {
        setOcrStatus('PDF registered successfully.')
        setOcrProgress(100)
        // PDF fallback: skip OCR, prompt manual entry
        setSuccessMsg('PDF Receipt uploaded successfully. Fill transaction details manually.')
        setTxForm({
          title: file.name.replace(/\.[^/.]+$/, ""), // remove extension
          amount: '',
          currency: 'INR',
          type: 'EXPENSE',
          category: 'Other',
          transactionDate: new Date().toISOString().split('T')[0],
          description: `[PDF Attachment] ${file.name}`,
        })
        setShowFillForm(true)
        setProcessing(false)
        fetchReceipts()
        return
      }

      // 2. Perform OCR client-side using tesseract.js
      setOcrStatus('Initializing OCR engine (WASM)...')
      
      Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrStatus(`Extracting text details...`)
              setOcrProgress(Math.round(m.progress * 100))
            }
          },
        }
      )
        .then(async ({ data: { text } }) => {
          setOcrStatus('Analyzing extracted fields...')
          // 3. Send text to backend for regex entity extraction
          const analyzed = await analyzeReceipt(savedReceipt.id, text)
          setActiveReceipt(analyzed)
          setSuccessMsg('OCR Scan completed successfully!')

          // Pre-populate transaction form
          setTxForm({
            title: analyzed.merchantName || 'Receipt Expense',
            amount: analyzed.totalAmount || '',
            currency: analyzed.currency || 'INR',
            type: 'EXPENSE',
            category: analyzed.category || CATEGORIES[0],
            transactionDate: analyzed.transactionDate || new Date().toISOString().split('T')[0],
            description: `[OCR Autopopulated] Scan from ${analyzed.originalFileName}`,
          })
          setShowFillForm(true)
          fetchReceipts()
        })
        .catch((ocrErr) => {
          console.error(ocrErr)
          setError('OCR analysis failed. You can still fill transaction details manually.')
          setTxForm({
            title: savedReceipt.originalFileName.replace(/\.[^/.]+$/, ""),
            amount: '',
            currency: 'INR',
            type: 'EXPENSE',
            category: CATEGORIES[0],
            transactionDate: new Date().toISOString().split('T')[0],
            description: `[Scan Failed] Manual entry for ${savedReceipt.originalFileName}`,
          })
          setShowFillForm(true)
        })
        .finally(() => {
          setProcessing(false)
        })

    } catch (uploadErr) {
      console.error(uploadErr)
      setError(uploadErr.response?.data?.message || 'File upload failed')
      setProcessing(false)
    }
  }

  // Handle Bulk Selection
  const handleBulkSelection = (files) => {
    setIsBulkMode(true)
    const queue = files.map((file, idx) => ({
      id: idx,
      file,
      name: file.name,
      size: file.size,
      status: 'queued', // queued, uploading, scanning, success, failed
      progress: 0,
      errorMsg: '',
    }))
    setBulkQueue(queue)
    processBulkQueue(queue)
  }

  // Process bulk files sequentially
  const processBulkQueue = async (currentQueue) => {
    for (let i = 0; i < currentQueue.length; i++) {
      const item = currentQueue[i]
      
      setBulkQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 10 } : q))
      )

      try {
        // 1. Upload
        const savedReceipt = await uploadReceipt(item.file)
        
        setBulkQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'scanning', progress: 40 } : q))
        )

        const isPdf = item.file.type === 'application/pdf' || item.file.name.endsWith('.pdf')

        if (isPdf) {
          // PDF skip ocr
          await analyzeReceipt(savedReceipt.id, "")
          setBulkQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'success', progress: 100 } : q))
          )
          continue
        }

        // 2. OCR
        const ocrResult = await Tesseract.recognize(
          item.file,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                const progVal = Math.round(40 + (m.progress * 50))
                setBulkQueue((prev) =>
                  prev.map((q) => (q.id === item.id ? { ...q, progress: progVal } : q))
                )
              }
            },
          }
        )

        // 3. Analyze
        await analyzeReceipt(savedReceipt.id, ocrResult.data.text)

        setBulkQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'success', progress: 100 } : q))
        )

      } catch (err) {
        console.error(err)
        setBulkQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'failed', errorMsg: 'Failed to process' } : q))
        )
      }
    }
    fetchReceipts()
  }

  // Trigger manual edit preview
  const handleSelectActiveReceipt = async (receipt) => {
    setError('')
    setSuccessMsg('')
    setActiveReceipt(receipt)
    setShowFillForm(true)

    // Load preview image
    try {
      const url = await getReceiptImageBlob(receipt.id)
      setActiveImageUrl(url)
    } catch (err) {
      console.error(err)
      setActiveImageUrl(null)
    }

    setTxForm({
      title: receipt.merchantName || 'Receipt Expense',
      amount: receipt.totalAmount || '',
      currency: receipt.currency || 'INR',
      type: 'EXPENSE',
      category: receipt.category || CATEGORIES[0],
      transactionDate: receipt.transactionDate || new Date().toISOString().split('T')[0],
      description: `[OCR Autopopulated] Scan from ${receipt.originalFileName}`,
    })
  }

  // Handle Form Change
  const handleFormChange = (e) => {
    setTxForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Submit Transaction Fill
  const handleSubmitTransaction = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!txForm.title || !txForm.amount || !txForm.category) {
      setFormError('Please fill all required fields')
      return
    }

    try {
      const payload = {
        ...txForm,
        amount: parseFloat(txForm.amount),
        receiptId: activeReceipt.id,
      }
      
      await addTransaction(payload)
      setSuccessMsg('Transaction created and linked successfully!')
      setShowFillForm(false)
      setActiveReceipt(null)
      setActiveImageUrl(null)
      fetchReceipts()
    } catch (err) {
      console.error(err)
      setFormError(err.response?.data?.message || 'Failed to link transaction')
    }
  }

  // Delete Receipt
  const handleDeleteReceipt = async (id, e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this receipt? The linked transaction (if any) will be unlinked.')) {
      try {
        await deleteReceipt(id)
        setSuccessMsg('Receipt deleted successfully')
        if (activeReceipt && activeReceipt.id === id) {
          setActiveReceipt(null)
          setActiveImageUrl(null)
          setShowFillForm(false)
        }
        fetchReceipts()
      } catch (err) {
        console.error(err)
        setError('Failed to delete receipt')
      }
    }
  }

  // Unlink Receipt
  const handleUnlinkReceipt = async (id, e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to unlink this receipt from its transaction?')) {
      try {
        await unlinkReceipt(id)
        setSuccessMsg('Receipt unlinked successfully')
        fetchReceipts()
      } catch (err) {
        console.error(err)
        setError('Failed to unlink receipt')
      }
    }
  }

  // File download helper
  const handleDownloadReceipt = async (id, originalName, e) => {
    e.stopPropagation()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8080/api/receipts/${id}/image`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = originalName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setError('Download failed')
    }
  }

  // Confidence Class Mapper
  const getConfidenceClass = (conf) => {
    if (!conf) return 'badge-low'
    if (conf.toLowerCase() === 'high') return 'badge-high'
    if (conf.toLowerCase() === 'medium') return 'badge-med'
    return 'badge-low'
  }

  // Filters logic
  const filteredReceipts = receipts.filter((rec) => {
    if (filter === 'LINKED') return rec.linked
    if (filter === 'UNLINKED') return !rec.linked
    return true
  })

  // Calculation of analytics
  const totalScanned = receipts.length
  const autoFilledCount = receipts.filter(r => r.linked).length
  const fillRate = totalScanned > 0 ? Math.round((autoFilledCount / totalScanned) * 100) : 0
  
  // Calculate average confidence (High = 3, Med = 2, Low = 1)
  const totalConfidencePoints = receipts.reduce((acc, curr) => {
    let pts = 0
    const checkPts = (val) => {
      if (!val) return 1
      if (val.toLowerCase() === 'high') return 3
      if (val.toLowerCase() === 'medium') return 2
      return 1
    }
    pts += checkPts(curr.confidenceMerchant)
    pts += checkPts(curr.confidenceAmount)
    pts += checkPts(curr.confidenceDate)
    pts += checkPts(curr.confidenceCategory)
    return acc + (pts / 4)
  }, 0)
  const avgConfidenceScore = totalScanned > 0 ? (totalConfidencePoints / totalScanned).toFixed(1) : 0
  let avgConfidenceLabel = 'Low'
  if (avgConfidenceScore >= 2.5) avgConfidenceLabel = 'High'
  else if (avgConfidenceScore >= 1.7) avgConfidenceLabel = 'Medium'

  // Categories distribution for Chart
  const categorySplit = receipts.reduce((acc, curr) => {
    if (!curr.category) return acc
    acc[curr.category] = (acc[curr.category] || 0) + 1
    return acc
  }, {})

  const pieChartData = Object.keys(categorySplit).map((key) => ({
    name: key,
    value: categorySplit[key],
  }))

  return (
    <motion.main
      className="page-glass receipts-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Page Header */}
      <div className="page-header">
        <h1>Receipt Scanner</h1>
        <div className="header-actions">
          <Link to="/dashboard" className="btn-secondary">
            <FaArrowLeft size={12} />
            Dashboard
          </Link>
          <button onClick={fetchReceipts} className="btn-secondary" title="Refresh receipts list">
            <FaSync size={12} className={loading ? 'spin-icon' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="ocr-alert ocr-alert--error">{error}</div>}
      {successMsg && <div className="ocr-alert ocr-alert--success">{successMsg}</div>}

      {/* Analytics widgets */}
      <div className="analytics-summary-grid">
        <div className="glass-card stat-tile">
          <div className="stat-tile__icon theme-glow-indigo">
            <FaRegFileAlt size={18} />
          </div>
          <div className="stat-tile__details">
            <span className="stat-tile__label">Scanned Receipts</span>
            <span className="stat-tile__value">{totalScanned}</span>
          </div>
        </div>

        <div className="glass-card stat-tile">
          <div className="stat-tile__icon theme-glow-emerald">
            <FaCheckCircle size={18} />
          </div>
          <div className="stat-tile__details">
            <span className="stat-tile__label">Linked Transactions</span>
            <span className="stat-tile__value">{autoFilledCount} ({fillRate}%)</span>
          </div>
        </div>

        <div className="glass-card stat-tile">
          <div className="stat-tile__icon theme-glow-cyan">
            <FaChartLine size={18} />
          </div>
          <div className="stat-tile__details">
            <span className="stat-tile__label">Avg Accuracy Score</span>
            <span className="stat-tile__value">{avgConfidenceScore} / 3.0 <span className={`badge-indicator ${getConfidenceClass(avgConfidenceLabel)}`}>{avgConfidenceLabel}</span></span>
          </div>
        </div>
      </div>

      <div className="scanner-layout-grid">
        {/* Left Side: Upload & Preview panels */}
        <div className="scanner-column-left">
          {/* File Upload card */}
          <div className="glass-card upload-container">
            <h2>Scan New Receipt</h2>
            <div
              className={`drag-drop-zone ${dragActive ? 'drag-drop-zone--active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className="upload-zone-content">
                <FaUpload size={40} className="upload-icon" />
                <p className="main-text">Drag & drop receipt image or PDF</p>
                <p className="sub-text">Supports JPG, PNG, WEBP, and PDF files. Click to browse.</p>
                <span className="camera-label">Supports Mobile Camera capture</span>
              </div>
            </div>

            {/* OCR Progress Bar */}
            {processing && (
              <div className="ocr-progress-card">
                <div className="progress-details">
                  <span>{ocrStatus}</span>
                  <span>{ocrProgress}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${ocrProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Active Receipt Preview and Form Auto-population */}
          {showFillForm && activeReceipt && (
            <div className="glass-card preview-editor-panel">
              <div className="panel-header">
                <h2>Extracted Transaction Fields</h2>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowFillForm(false)
                    setActiveReceipt(null)
                    setActiveImageUrl(null)
                  }}
                >
                  Close
                </button>
              </div>

              <div className="preview-split-content">
                {/* Visual Image Render */}
                <div className="image-preview-pane">
                  {activeImageUrl ? (
                    <div className="preview-img-container">
                      {activeReceipt.contentType === 'application/pdf' ? (
                        <div className="pdf-preview-fallback">
                          <FaFilePdf size={60} />
                          <span>PDF Attachment Preview not available in browser</span>
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={(e) => handleDownloadReceipt(activeReceipt.id, activeReceipt.originalFileName, e)}
                          >
                            <FaDownload /> Download PDF
                          </button>
                        </div>
                      ) : (
                        <>
                          <img src={activeImageUrl} alt="Scanned document" className="scan-image" />
                          {processing && <div className="scanning-laser-sweep" />}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="preview-image-empty">
                      <FaFileImage size={48} />
                      <span>Loading image file securely...</span>
                    </div>
                  )}
                  <div className="file-metadata">
                    <span>{activeReceipt.originalFileName}</span>
                    <span>{(activeReceipt.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                {/* Form fields & Confidence indicators */}
                <div className="form-preview-pane">
                  {formError && <div className="auth-error">{formError}</div>}
                  <form onSubmit={handleSubmitTransaction} className="auth-form">
                    <div className="form-group">
                      <div className="field-label-row">
                        <label htmlFor="tx-title">Merchant / Store Name</label>
                        <span className={`confidence-badge ${getConfidenceClass(activeReceipt.confidenceMerchant)}`}>
                          Merchant: {activeReceipt.confidenceMerchant || 'Low'}
                        </span>
                      </div>
                      <input
                        id="tx-title"
                        name="title"
                        type="text"
                        value={txForm.title}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <div className="field-label-row">
                          <label htmlFor="tx-amount">Amount</label>
                          <span className={`confidence-badge ${getConfidenceClass(activeReceipt.confidenceAmount)}`}>
                            Amount: {activeReceipt.confidenceAmount || 'Low'}
                          </span>
                        </div>
                        <input
                          id="tx-amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={txForm.amount}
                          onChange={handleFormChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="tx-currency">Currency</label>
                        <input
                          id="tx-currency"
                          name="currency"
                          type="text"
                          value={txForm.currency}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <div className="field-label-row">
                          <label htmlFor="tx-category">Category</label>
                          <span className={`confidence-badge ${getConfidenceClass(activeReceipt.confidenceCategory)}`}>
                            Category: {activeReceipt.confidenceCategory || 'Low'}
                          </span>
                        </div>
                        <select
                          id="tx-category"
                          name="category"
                          value={txForm.category}
                          onChange={handleFormChange}
                          required
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <div className="field-label-row">
                          <label htmlFor="tx-date">Transaction Date</label>
                          <span className={`confidence-badge ${getConfidenceClass(activeReceipt.confidenceDate)}`}>
                            Date: {activeReceipt.confidenceDate || 'Low'}
                          </span>
                        </div>
                        <input
                          id="tx-date"
                          name="transactionDate"
                          type="date"
                          value={txForm.transactionDate}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="tx-desc">Notes / Description</label>
                      <textarea
                        id="tx-desc"
                        name="description"
                        rows="2"
                        value={txForm.description}
                        onChange={handleFormChange}
                      />
                    </div>

                    <div className="form-actions-row">
                      <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                        Confirm & Create Transaction
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Queue Status */}
          {isBulkMode && bulkQueue.length > 0 && (
            <div className="glass-card bulk-queue-panel">
              <div className="panel-header">
                <h2>Bulk Processing Queue</h2>
                <button className="btn-close" onClick={() => {
                  setIsBulkMode(false)
                  setBulkQueue([])
                }}>Clear Queue</button>
              </div>
              <div className="bulk-items-list">
                {bulkQueue.map((item) => (
                  <div key={item.id} className="bulk-item-row">
                    <div className="bulk-item-info">
                      <span className="file-name">{item.name}</span>
                      <span className="file-size">{(item.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="bulk-item-status-col">
                      {item.status === 'queued' && <span className="status-label status-queued">Queued</span>}
                      {item.status === 'uploading' && <span className="status-label status-processing"><FaSpinner className="spin" /> Uploading</span>}
                      {item.status === 'scanning' && <span className="status-label status-processing"><FaSpinner className="spin" /> OCR Parsing</span>}
                      {item.status === 'success' && <span className="status-label status-success"><FaCheckCircle /> Ready</span>}
                      {item.status === 'failed' && <span className="status-label status-failed">Failed</span>}
                      
                      <div className="mini-progress-bar">
                        <div className="mini-progress-fill" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Category Splits Chart & Gallery view */}
        <div className="scanner-column-right">
          {/* Pie Chart Component */}
          {pieChartData.length > 0 && (
            <div className="glass-card chart-container-card">
              <h2>Scanned Categories Share</h2>
              <div className="scanner-chart-holder">
                <PieChartComponent data={pieChartData} />
              </div>
            </div>
          )}

          {/* Gallery card */}
          <div className="glass-card gallery-container">
            <div className="gallery-header">
              <h2>Receipt History</h2>
              <div className="gallery-filter-tabs">
                <button className={`tab-btn ${filter === 'ALL' ? 'tab-btn--active' : ''}`} onClick={() => setFilter('ALL')}>All</button>
                <button className={`tab-btn ${filter === 'UNLINKED' ? 'tab-btn--active' : ''}`} onClick={() => setFilter('UNLINKED')}>Unlinked</button>
                <button className={`tab-btn ${filter === 'LINKED' ? 'tab-btn--active' : ''}`} onClick={() => setFilter('LINKED')}>Linked</button>
              </div>
            </div>

            {loading ? (
              <div className="gallery-empty-state">
                <FaSpinner className="spin-icon text-muted" size={32} />
                <span>Loading receipts gallery...</span>
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="gallery-empty-state">
                <FaRegFileAlt size={40} className="text-muted" />
                <span>No receipts found in this filter</span>
              </div>
            ) : (
              <div className="gallery-scroller">
                {filteredReceipts.map((rec) => (
                  <div key={rec.id} className="receipt-gallery-card glass" onClick={() => handleSelectActiveReceipt(rec)}>
                    <div className="receipt-card-icon">
                      {rec.contentType === 'application/pdf' ? <FaFilePdf className="pdf-icon-color" size={24} /> : <FaFileImage className="img-icon-color" size={24} />}
                    </div>
                    <div className="receipt-card-details">
                      <span className="merchant-name">{rec.merchantName || 'Unknown Merchant'}</span>
                      <div className="meta-row">
                        <span className="date-meta">{rec.transactionDate || 'No date'}</span>
                        <span className="size-meta">{(rec.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="amount-row">
                        <span className="price-meta">
                          {rec.totalAmount ? `${rec.currency || 'INR'} ${rec.totalAmount.toFixed(2)}` : 'No amount'}
                        </span>
                        {rec.category && <span className="category-meta">{rec.category}</span>}
                      </div>
                    </div>

                    <div className="receipt-card-actions">
                      {rec.linked ? (
                        <button
                          className="btn-icon-only text-success"
                          title="Linked to Transaction. Click to Unlink."
                          onClick={(e) => handleUnlinkReceipt(rec.id, e)}
                        >
                          <FaLink size={13} />
                        </button>
                      ) : (
                        <span className="text-muted" title="Unlinked receipt">
                          <FaUnlink size={13} />
                        </span>
                      )}

                      <button
                        className="btn-icon-only text-indigo"
                        title="Download Document"
                        onClick={(e) => handleDownloadReceipt(rec.id, rec.originalFileName, e)}
                      >
                        <FaDownload size={13} />
                      </button>

                      <button
                        className="btn-icon-only text-danger"
                        title="Delete Receipt"
                        onClick={(e) => handleDeleteReceipt(rec.id, e)}
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.main>
  )
}

export default ReceiptScanner
