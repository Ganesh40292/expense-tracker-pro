/**
 * Computes gamification badges and daily transaction logging streak.
 */
export const getGamificationMetrics = (transactions = [], receiptsCount = 0, debts = []) => {
  if (!Array.isArray(transactions)) transactions = []

  // 1. Calculate Daily Logging Streak
  const dates = Array.from(
    new Set(
      transactions
        .map((t) => t.transactionDate)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a)),
    ),
  )

  let streak = 0
  const todayStr = new Date().toISOString().split('T')[0]
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
    let checkDate = dates.includes(todayStr) ? new Date() : yesterday
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (dates.includes(dateStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  // 2. Savings Rate Calculation for Savings Master Badge
  const now = new Date()
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const monthTx = transactions.filter((t) => t.transactionDate && t.transactionDate.startsWith(currentMonthPrefix))
  const totalIncome = monthTx.filter((t) => t.type === 'INCOME').reduce((acc, t) => acc + Number(t.amount || 0), 0)
  const totalExpense = monthTx.filter((t) => t.type === 'EXPENSE').reduce((acc, t) => acc + Number(t.amount || 0), 0)
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0

  // 3. Evaluate Badges
  const badges = [
    {
      id: 'savings-master',
      title: 'Savings Master',
      description: 'Achieved ≥20% monthly savings rate',
      icon: '🏆',
      unlocked: savingsRate >= 20,
      progress: `${savingsRate}% / 20%`,
    },
    {
      id: 'zero-debt-hero',
      title: 'Zero Debt Hero',
      description: 'Zero active debt balance',
      icon: '🛡️',
      unlocked: Array.isArray(debts) && debts.length === 0,
      progress: debts.length === 0 ? 'Unlocked' : `${debts.length} Active Debts`,
    },
    {
      id: 'ocr-ninja',
      title: 'OCR Ninja',
      description: 'Scanned ≥5 receipts via Gemini Vision AI',
      icon: '🥷',
      unlocked: receiptsCount >= 5,
      progress: `${receiptsCount} / 5 Receipts`,
    },
    {
      id: 'streak-champion',
      title: 'Streak Champion',
      description: 'Maintained a 3-day logging streak',
      icon: '🔥',
      unlocked: streak >= 3,
      progress: `${streak} / 3 Days`,
    },
  ]

  return {
    streak,
    savingsRate,
    badges,
  }
}
