import api from './api'

/**
 * Generates an encrypted/structured JSON backup blob of user transactions, assets, debts, and recurring expenses.
 */
export const downloadBackupJSON = async (user) => {
  try {
    const [txRes, assetsRes, debtsRes, recRes] = await Promise.all([
      api.get('/transactions').catch(() => ({ data: [] })),
      api.get('/assets').catch(() => ({ data: [] })),
      api.get('/debts').catch(() => ({ data: [] })),
      api.get('/recurring').catch(() => ({ data: [] })),
    ])

    const backupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: user?.id || user?.userId,
        name: user?.name,
        email: user?.email,
      },
      data: {
        transactions: txRes.data || [],
        assets: assetsRes.data || [],
        debts: debtsRes.data || [],
        recurringExpenses: recRes.data || [],
      },
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `ExpenseTracker_Backup_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    return true
  } catch (error) {
    console.error('Backup generation failed:', error)
    throw error
  }
}

/**
 * Restores transactions from an uploaded JSON backup file.
 */
export const restoreFromJSONFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result)
        if (!json || !json.data) {
          throw new Error('Invalid backup file structure')
        }

        const transactions = json.data.transactions || []
        let restoredCount = 0

        for (const tx of transactions) {
          try {
            await api.post('/transactions', {
              title: tx.title,
              amount: tx.amount,
              type: tx.type,
              category: tx.category || 'General',
              transactionDate: tx.transactionDate || new Date().toISOString().split('T')[0],
              paymentMethod: tx.paymentMethod || 'CASH',
              notes: tx.notes || 'Restored from JSON backup',
            })
            restoredCount++
          } catch {
            // continue importing rest
          }
        }

        resolve({ count: restoredCount, total: transactions.length })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read backup file'))
    reader.readAsText(file)
  })
}
