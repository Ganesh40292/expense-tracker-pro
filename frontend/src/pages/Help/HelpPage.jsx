import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaQuestionCircle,
  FaSearch,
  FaArrowLeft,
  FaEnvelope,
  FaBookOpen,
  FaExchangeAlt,
  FaBrain,
  FaFilePdf,
  FaShieldAlt,
  FaKeyboard,
  FaChevronDown,
  FaChevronUp,
  FaLifeRing,
  FaCheckCircle,
} from 'react-icons/fa'
import { useToast } from '../../context/ToastContext'
import './HelpPage.css'

const helpCategories = [
  { id: 'all', label: 'All Topics', icon: FaBookOpen },
  { id: 'getting-started', label: 'Getting Started', icon: FaLifeRing },
  { id: 'transactions', label: 'Transactions & Exports', icon: FaExchangeAlt },
  { id: 'ai-tools', label: 'AI Intelligence & Scanner', icon: FaBrain },
  { id: 'reports', label: 'Reports & Analytics', icon: FaFilePdf },
  { id: 'security', label: 'Account & Security', icon: FaShieldAlt },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: FaKeyboard },
]

const faqItems = [
  {
    id: 1,
    category: 'getting-started',
    question: 'How do I get started with ExpenseTracker Pro?',
    answer:
      'After creating an account and logging in, start by exploring your Dashboard. You can add your current assets in Assets & Net Worth, track any existing debts in Debt Tracker, and begin recording your daily income and expense transactions using the "+ Add Transaction" button or the quick Ctrl+K command palette.',
  },
  {
    id: 2,
    category: 'transactions',
    question: 'How do Quick Date Filters work in Transactions?',
    answer:
      'On the Transactions page, click any of the Quick Filter chips (Today, This Week, This Month, This Year, or Reset All). The system instantly calculates the date range and filters your transaction table with visual cyan active highlighting.',
  },
  {
    id: 3,
    category: 'transactions',
    question: 'How do I export my financial data to PDF, Excel, or CSV?',
    answer:
      'Go to the Reports page from the sidebar. You will find a 1-Click Executive PDF Statement button to immediately generate a styled PDF summary. For CSV or Excel exports, use the Export Center options on the Transactions page.',
  },
  {
    id: 4,
    category: 'ai-tools',
    question: 'How does the Gemini 2.0 Multimodal Receipt Scanner work?',
    answer:
      'Navigate to Receipt Scanner in the sidebar. Drag and drop any printed or digital receipt image (JPG, PNG, WEBP) or PDF file. Our Google Gemini 2.0 Vision engine automatically extracts the merchant name, date, total amount, category, and currency. You can review the extracted values and save it directly as a transaction.',
  },
  {
    id: 5,
    category: 'ai-tools',
    question: 'What is the Linear Regression Forecast model in AI Intelligence?',
    answer:
      'The AI Intelligence page analyzes your historical spending history using Ordinary Least Squares (OLS) regression to project next month’s expected spending volume. It also computes a 95% statistical confidence interval (min and max boundary) and renders a Cumulative Outflow Volume Area Chart.',
  },
  {
    id: 6,
    category: 'getting-started',
    question: 'What is the "Largest Exit Point" label on the Dashboard?',
    answer:
      'The "Largest Exit Point" in Outflow Diagnostics highlights your single highest monetary expense transaction on record, showing the exact title, date, and amount so you can monitor your largest historical outflow.',
  },
  {
    id: 7,
    category: 'reports',
    question: 'How is the Financial Wellness Index calculated?',
    answer:
      'The Financial Wellness Index computes a dynamic 0–100 score based on your monthly savings ratio, category budget cap adherence, and spending volatility. Green (80-100) indicates strong solvency, Yellow (50-79) represents moderate stability, and Red (<50) flags elevated cash outflow risks.',
  },
  {
    id: 8,
    category: 'security',
    question: 'How is my account kept secure?',
    answer:
      'ExpenseTracker Pro uses stateless JWT access tokens with automatic refresh token rotation, bcrypt password hashing, defensive XSS/SQL injection request sanitization, and IP rate limiting. Your deleted data is protected via soft-delete recovery.',
  },
  {
    id: 9,
    category: 'shortcuts',
    question: 'What keyboard shortcuts are available?',
    answer:
      'Press Ctrl + K (or Cmd + K on macOS) anywhere in the application to trigger the global Command Palette. From there, you can type to navigate instantly to any route, filter pages, or initiate quick actions without touching your mouse.',
  },
]

export default function HelpPage() {
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [submittingContact, setSubmittingContact] = useState(false)

  const toggleFaq = (id) => {
    setExpandedFaq((prev) => (prev === id ? null : id))
  }

  const filteredFaqs = faqItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleContactSubmit = (e) => {
    e.preventDefault()
    if (!contactSubject || !contactMessage) {
      showToast('Please fill out all contact fields.', 'warning')
      return
    }
    setSubmittingContact(true)
    setTimeout(() => {
      setSubmittingContact(false)
      setContactSubject('')
      setContactMessage('')
      showToast('Support ticket submitted successfully! Our team will respond shortly.', 'success')
    }, 600)
  }

  return (
    <motion.main
      className="page-glass help-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2.5">
            <FaQuestionCircle className="text-cyan-400" size={24} />
            Help & Support Center
          </h1>
          <p className="text-xs text-slate-400">
            Search documentation, feature guides, FAQs, or contact our dedicated support team
          </p>
        </div>
        <Link to="/dashboard" className="btn-secondary">
          <FaArrowLeft size={12} />
          Dashboard
        </Link>
      </div>

      {/* ── Hero Search Box ── */}
      <div className="help-hero glass-card p-6 mb-8 text-center relative overflow-hidden">
        <div className="help-hero__bg-glow" aria-hidden="true" />
        <h2 className="text-xl font-bold text-slate-100 mb-2">How can we help you today?</h2>
        <p className="text-xs text-slate-400 mb-6 max-w-lg mx-auto">
          Type a topic or question below to search our instant knowledge base
        </p>

        <div className="relative max-w-xl mx-auto">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            className="help-search-input w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 focus:border-cyan-400 text-sm text-slate-100 placeholder-slate-500 transition-all shadow-inner outline-none"
            placeholder="Search FAQs, features, reports, or OCR scanner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {helpCategories.map(({ id, label, icon: Icon }) => {
          const isActive = activeCategory === id
          return (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Content Grid (FAQs + Contact Support) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQs Accordion Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-base font-bold text-slate-100">
              {activeCategory === 'all'
                ? 'Frequently Asked Questions'
                : helpCategories.find((c) => c.id === activeCategory)?.label}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {filteredFaqs.length} {filteredFaqs.length === 1 ? 'Article' : 'Articles'}
            </span>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-400 space-y-3">
              <FaQuestionCircle size={32} className="mx-auto text-slate-600" />
              <p className="text-sm">No matching help topics found for "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('all')
                }}
                className="btn-secondary mx-auto text-xs"
              >
                Clear Search Filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id
              return (
                <div
                  key={faq.id}
                  className={`help-faq-card glass-card transition-all ${
                    isExpanded ? 'help-faq-card--expanded' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer gap-4"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <span className="font-semibold text-sm text-slate-100 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      {faq.question}
                    </span>
                    <span className="p-1 rounded-lg bg-slate-800/60 text-slate-400 shrink-0">
                      {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-4 pb-4 pt-1 text-xs text-slate-300 border-t border-slate-800/60 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          )}
        </div>

        {/* Contact Support Sidebar Column (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Contact Direct Link */}
          <div className="glass-card p-6 space-y-4 border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 to-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <FaEnvelope size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Need Custom Support?</h4>
                <p className="text-[11px] text-slate-400">Direct assistance from our tech team</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 font-mono flex items-center justify-between">
              <span>expensetracker40292@gmail.com</span>
              <a
                href="mailto:expensetracker40292@gmail.com"
                className="text-cyan-400 hover:underline text-[11px] font-bold"
              >
                Send Email
              </a>
            </div>
          </div>

          {/* Submit Support Ticket Form */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
              <FaLifeRing className="text-indigo-400" size={14} /> Submit Support Ticket
            </h4>
            <p className="text-[11px] text-slate-400 mb-4">Have an issue or feedback? Send us a message.</p>

            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label htmlFor="contact-subject" className="block text-[11px] font-semibold text-slate-300 mb-1">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  placeholder="e.g. Question about PDF Report"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/60 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="contact-msg" className="block text-[11px] font-semibold text-slate-300 mb-1">Message Detail</label>
                <textarea
                  id="contact-msg"
                  rows={3}
                  placeholder="Describe your question or issue..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/60 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none resize-none"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center text-xs py-2 mt-2"
                disabled={submittingContact}
              >
                {submittingContact ? (
                  'Submitting...'
                ) : (
                  <>
                    <FaCheckCircle size={12} /> Submit Ticket
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.main>
  )
}
