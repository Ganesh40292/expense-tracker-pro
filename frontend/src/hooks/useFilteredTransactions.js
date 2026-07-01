import { useState, useMemo } from 'react'

export function useFilteredTransactions(transactions) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [dateRange, setDateRange] = useState('ALL')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([])
  const [sortBy, setSortBy] = useState('LATEST')

  // Helper to parse transaction metadata (extract bracketed payment method)
  const parsedTransactions = useMemo(() => {
    return transactions.map((t) => {
      let paymentMethod = 'Cash' // default fallback
      let cleanDescription = t.description || ''
      
      if (cleanDescription) {
        const match = cleanDescription.match(/^\[(Cash|UPI|Credit Card|Debit Card|Bank Transfer|Wallet)\]\s*(.*)/i)
        if (match) {
          paymentMethod = match[1]
          cleanDescription = match[2]
        }
      }
      
      return {
        ...t,
        paymentMethod,
        cleanDescription,
      }
    })
  }, [transactions])

  // Filter and sort logic
  const filteredTransactions = useMemo(() => {
    let result = [...parsedTransactions]

    // 1. Global Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.cleanDescription && t.cleanDescription.toLowerCase().includes(query)) ||
          t.category.toLowerCase().includes(query) ||
          t.paymentMethod.toLowerCase().includes(query)
      )
    }

    // 2. Multi-select Categories
    if (selectedCategories.length > 0) {
      result = result.filter((t) => selectedCategories.includes(t.category))
    }

    // 3. Date Range
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    result = result.filter((t) => {
      const txDate = new Date(t.transactionDate)
      if (dateRange === 'TODAY') {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        return txDate >= start && txDate <= today
      }
      if (dateRange === '7D') {
        const start = new Date()
        start.setDate(today.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        return txDate >= start && txDate <= today
      }
      if (dateRange === '30D') {
        const start = new Date()
        start.setDate(today.getDate() - 30)
        start.setHours(0, 0, 0, 0)
        return txDate >= start && txDate <= today
      }
      if (dateRange === 'THIS_MONTH') {
        return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear()
      }
      if (dateRange === 'LAST_MONTH') {
        const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1
        const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()
        
        const start = new Date(year, lastMonth, 1)
        const end = new Date(year, lastMonth + 1, 0, 23, 59, 59, 999)
        return txDate >= start && txDate <= end
      }
      if (dateRange === 'THIS_YEAR') {
        return txDate.getFullYear() === today.getFullYear()
      }
      if (dateRange === 'CUSTOM') {
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate)
          const end = new Date(customEndDate)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
          return txDate >= start && txDate <= end
        }
      }
      return true
    })

    // 4. Amount Range
    if (minAmount !== '') {
      result = result.filter((t) => t.amount >= parseFloat(minAmount))
    }
    if (maxAmount !== '') {
      result = result.filter((t) => t.amount <= parseFloat(maxAmount))
    }

    // 5. Payment Methods
    if (selectedPaymentMethods.length > 0) {
      result = result.filter((t) => selectedPaymentMethods.includes(t.paymentMethod))
    }

    // 6. Sorting
    if (sortBy === 'LATEST') {
      result.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
    } else if (sortBy === 'OLDEST') {
      result.sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate))
    } else if (sortBy === 'HIGHEST') {
      result.sort((a, b) => b.amount - a.amount)
    } else if (sortBy === 'LOWEST') {
      result.sort((a, b) => a.amount - b.amount)
    } else if (sortBy === 'CATEGORY') {
      result.sort((a, b) => a.category.localeCompare(b.category))
    } else if (sortBy === 'TITLE') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  }, [
    parsedTransactions,
    searchQuery,
    selectedCategories,
    dateRange,
    customStartDate,
    customEndDate,
    minAmount,
    maxAmount,
    selectedPaymentMethods,
    sortBy,
  ])

  // Active Filter Chips list
  const activeFilterChips = useMemo(() => {
    const chips = []
    if (searchQuery.trim()) {
      chips.push({ id: 'search', label: `Search: "${searchQuery}"`, type: 'search' })
    }
    selectedCategories.forEach((cat) => {
      chips.push({ id: `category-${cat}`, label: `Category: ${cat}`, type: 'category', value: cat })
    })
    if (dateRange !== 'ALL') {
      const labels = {
        TODAY: 'Today',
        '7D': 'Last 7 Days',
        '30D': 'Last 30 Days',
        THIS_MONTH: 'This Month',
        LAST_MONTH: 'Previous Month',
        THIS_YEAR: 'This Year',
        CUSTOM: `Custom: ${customStartDate} to ${customEndDate}`,
      }
      chips.push({ id: 'date', label: labels[dateRange] || dateRange, type: 'date' })
    }
    if (minAmount !== '' || maxAmount !== '') {
      let label = ''
      if (minAmount !== '' && maxAmount !== '') {
        label = `₹${minAmount} - ₹${maxAmount}`
      } else if (minAmount !== '') {
        label = `≥ ₹${minAmount}`
      } else {
        label = `≤ ₹${maxAmount}`
      }
      chips.push({ id: 'amount', label, type: 'amount' })
    }
    selectedPaymentMethods.forEach((pm) => {
      chips.push({ id: `pm-${pm}`, label: `Payment: ${pm}`, type: 'payment', value: pm })
    })

    return chips
  }, [searchQuery, selectedCategories, dateRange, customStartDate, customEndDate, minAmount, maxAmount, selectedPaymentMethods])

  const removeFilter = (chip) => {
    if (chip.type === 'search') setSearchQuery('')
    else if (chip.type === 'category') setSelectedCategories((prev) => prev.filter((c) => c !== chip.value))
    else if (chip.type === 'date') setDateRange('ALL')
    else if (chip.type === 'amount') {
      setMinAmount('')
      setMaxAmount('')
    } else if (chip.type === 'payment') setSelectedPaymentMethods((prev) => prev.filter((p) => p !== chip.value))
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategories([])
    setDateRange('ALL')
    setCustomStartDate('')
    setCustomEndDate('')
    setMinAmount('')
    setMaxAmount('')
    setSelectedPaymentMethods([])
    setSortBy('LATEST')
  }

  return {
    searchQuery,
    setSearchQuery,
    selectedCategories,
    setSelectedCategories,
    dateRange,
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    selectedPaymentMethods,
    setSelectedPaymentMethods,
    sortBy,
    setSortBy,
    filteredTransactions,
    activeFilterChips,
    removeFilter,
    clearAllFilters,
  }
}
