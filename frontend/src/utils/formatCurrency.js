export const formatCurrency = (amount = 0, locale = 'en-IN', currency = 'INR') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
