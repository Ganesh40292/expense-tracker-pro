import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaUndo,
} from 'react-icons/fa'
import { CATEGORIES } from '../../utils/constants'
import './AdvancedFilterPanel.css'

const CATEGORY_COLORS = {
  Food: '#fb7185',
  Transport: '#fbbf24',
  Rent: '#a78bfa',
  Utilities: '#22d3ee',
  Entertainment: '#818cf8',
  Others: '#94a3b8',
  Salary: '#34d399',
  Freelance: '#60a5fa',
}

const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Wallet']

export default function AdvancedFilterPanel({ filterState, rawTransactions }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPmDropdown, setShowPmDropdown] = useState(false)

  const {
    searchQuery, setSearchQuery,
    selectedCategories, setSelectedCategories,
    dateRange, setDateRange,
    customStartDate, setCustomStartDate,
    customEndDate, setCustomEndDate,
    minAmount, setMinAmount,
    maxAmount, setMaxAmount,
    selectedPaymentMethods, setSelectedPaymentMethods,
    sortBy, setSortBy,
    activeFilterChips,
    removeFilter,
    clearAllFilters
  } = filterState

  // Compute dynamic category counts from current search matching transactions
  const categoryCounts = useMemo(() => {
    const counts = {}
    rawTransactions.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return counts
  }, [rawTransactions])

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const togglePaymentMethod = (pm) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(pm) ? prev.filter((p) => p !== pm) : [...prev, pm]
    )
  }

  const applyPredefinedAmount = (min, max) => {
    setMinAmount(min)
    setMaxAmount(max)
  }

  const hasActiveFilters = activeFilterChips.length > 0

  return (
    <div className="filter-panel glass-card">
      {/* ── Search Bar always visible ── */}
      <div className="filter-panel__search-row">
        <div className="filter-search-input">
          <FaSearch className="filter-search-input__icon" />
          <input
            type="text"
            placeholder="Search title, description, category, payment method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="filter-search-input__clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <FaTimes size={10} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={`filter-toggle-btn ${isOpen ? 'filter-toggle-btn--active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <FaFilter size={12} />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="filter-toggle-btn__badge">{activeFilterChips.length}</span>
          )}
          {isOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        </button>
      </div>

      {/* ── Collapsible filter panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="filter-panel__content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="filter-grid">
              {/* Date Filtering */}
              <div className="filter-section">
                <h4>Date Range</h4>
                <div className="filter-date-options">
                  {[
                    { value: 'ALL', label: 'All Time' },
                    { value: 'TODAY', label: 'Today' },
                    { value: '7D', label: 'Last 7 Days' },
                    { value: '30D', label: 'Last 30 Days' },
                    { value: 'THIS_MONTH', label: 'This Month' },
                    { value: 'LAST_MONTH', label: 'Previous Month' },
                    { value: 'THIS_YEAR', label: 'This Year' },
                    { value: 'CUSTOM', label: 'Custom Range...' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`filter-btn-chip ${dateRange === option.value ? 'filter-btn-chip--active' : ''}`}
                      onClick={() => setDateRange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {dateRange === 'CUSTOM' && (
                  <motion.div
                    className="filter-custom-dates"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="filter-input-group">
                      <label htmlFor="custom-start">Start</label>
                      <input
                        id="custom-start"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="filter-input-group">
                      <label htmlFor="custom-end">End</label>
                      <input
                        id="custom-end"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Amount Filtering */}
              <div className="filter-section">
                <h4>Amount Range</h4>
                <div className="filter-amount-predefined">
                  <button
                    type="button"
                    className="filter-btn-chip"
                    onClick={() => applyPredefinedAmount('', '500')}
                  >
                    Below ₹500
                  </button>
                  <button
                    type="button"
                    className="filter-btn-chip"
                    onClick={() => applyPredefinedAmount('500', '2000')}
                  >
                    ₹500 - ₹2,000
                  </button>
                  <button
                    type="button"
                    className="filter-btn-chip"
                    onClick={() => applyPredefinedAmount('2000', '')}
                  >
                    ₹2,000+
                  </button>
                </div>
                <div className="filter-amount-custom">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                  <span className="filter-amount-separator">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="filter-section filter-section--payment">
                <h4>Payment Method</h4>
                <div className="filter-dropdown-wrapper">
                  <button
                    type="button"
                    className="filter-dropdown-trigger"
                    onClick={() => setShowPmDropdown(!showPmDropdown)}
                  >
                    <span>
                      {selectedPaymentMethods.length === 0
                        ? 'Select Methods'
                        : `${selectedPaymentMethods.length} selected`}
                    </span>
                    <FaChevronDown size={10} />
                  </button>
                  <AnimatePresence>
                    {showPmDropdown && (
                      <motion.div
                        className="filter-dropdown-menu"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                      >
                        {PAYMENT_METHODS.map((pm) => (
                          <label key={pm} className="filter-dropdown-item">
                            <input
                              type="checkbox"
                              checked={selectedPaymentMethods.includes(pm)}
                              onChange={() => togglePaymentMethod(pm)}
                            />
                            <span>{pm}</span>
                          </label>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sorting System */}
              <div className="filter-section">
                <h4>Sort By</h4>
                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="LATEST">Latest</option>
                  <option value="OLDEST">Oldest</option>
                  <option value="HIGHEST">Highest Amount</option>
                  <option value="LOWEST">Lowest Amount</option>
                  <option value="CATEGORY">Category</option>
                  <option value="TITLE">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Category Filtering (Full width row) */}
            <div className="filter-section filter-section--categories">
              <h4>Categories</h4>
              <div className="filter-categories-grid">
                {CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat] || 0
                  const isSelected = selectedCategories.includes(cat)
                  const color = CATEGORY_COLORS[cat] || '#818cf8'
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`filter-category-chip ${isSelected ? 'filter-category-chip--active' : ''}`}
                      onClick={() => toggleCategory(cat)}
                      style={{
                        '--category-color': color,
                        '--category-color-light': `${color}15`,
                      }}
                    >
                      <span className="filter-category-chip__dot" />
                      <span className="filter-category-chip__name">{cat}</span>
                      <span className="filter-category-chip__count">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active Filter Chips ── */}
      {hasActiveFilters && (
        <div className="filter-panel__chips-row">
          <div className="filter-chips-list">
            {activeFilterChips.map((chip) => (
              <span key={chip.id} className="filter-chip">
                <span>{chip.label}</span>
                <button
                  type="button"
                  className="filter-chip__remove"
                  onClick={() => removeFilter(chip)}
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <FaTimes size={8} />
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            className="filter-clear-all"
            onClick={clearAllFilters}
          >
            <FaUndo size={9} />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  )
}
