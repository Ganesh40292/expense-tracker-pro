export const formatCurrency = (amount = 0, locale = null, currency = null) => {
  if (!currency || !locale) {
    try {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const userObj = JSON.parse(savedUser)
        if (userObj && userObj.defaultCurrency) {
          if (!currency) currency = userObj.defaultCurrency
        }
      }
    } catch (e) {
      console.error('Error parsing user for default currency formatting', e)
    }
  }

  // Fallbacks
  if (!currency) currency = 'INR'
  if (!locale) {
    // Map common currencies to their locales
    const currencyLocaleMap = {
      'INR': 'en-IN',
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'JPY': 'ja-JP',
      'AED': 'ar-AE'
    }
    locale = currencyLocaleMap[currency.toUpperCase()] || 'en-US'
  }

  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

export const convertCurrency = (baseAmount = 0, toCurrency = 'INR') => {
  const ratesToUsd = {
    'USD': 1.00,
    'INR': 83.50,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 155.20,
    'AED': 3.67
  }
  const rate = ratesToUsd[toCurrency.toUpperCase()] || 1.00
  return baseAmount * rate
}
