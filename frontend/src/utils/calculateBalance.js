export const calculateBalance = (transactions = []) =>
  transactions.reduce((total, item) => {
    const amount = Number(item.amount || 0)
    return item.type === 'income' ? total + amount : total - amount
  }, 0)
