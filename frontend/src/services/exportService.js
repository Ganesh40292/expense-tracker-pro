import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { formatCurrency } from '../utils/formatCurrency'

// Utility to format date safely
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? dateString : date.toLocaleDateString()
}

/**
 * Generate and download a PDF Report
 * @param {Array} transactions 
 * @param {Object} user 
 * @param {Array} chartImages - Array of base64 image strings
 */
export const generatePDFReport = (transactions, user, chartImages = [], aiInsights = []) => {
  const doc = new jsPDF('p', 'pt', 'a4')
  
  // Header
  doc.setFontSize(22)
  doc.setTextColor(33, 37, 41)
  doc.text('Financial Report', 40, 50)
  
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 70)
  if (user?.name) {
    doc.text(`Account: ${user.name}`, 40, 85)
  }

  // Summary Metrics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  doc.setFontSize(14)
  doc.setTextColor(33, 37, 41)
  doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 40, 120)
  doc.text(`Total Expense: ${formatCurrency(totalExpense)}`, 250, 120)
  doc.text(`Net Balance: ${formatCurrency(balance)}`, 450, 120)

  let currentY = 150

  // AI Insights
  if (aiInsights && aiInsights.length > 0) {
    doc.setFontSize(14)
    doc.setTextColor(43, 90, 237) // primary brand color
    doc.text('AI Spending Insights', 40, currentY)
    currentY += 15

    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)

    aiInsights.forEach((insight) => {
      const splitText = doc.splitTextToSize(`• ${insight}`, 515)
      splitText.forEach((line) => {
        if (currentY + 15 > 800) {
          doc.addPage()
          currentY = 40
        }
        doc.text(line, 40, currentY)
        currentY += 15
      })
    })
    currentY += 10
  }

  // Chart Images (if any)
  if (chartImages.length > 0) {
    chartImages.forEach((imgBase64) => {
      // Assuming charts are 500x300, scale them to fit width (approx 515 max)
      const imgWidth = 515
      const imgHeight = 250
      
      // Check for page break
      if (currentY + imgHeight > 800) {
        doc.addPage()
        currentY = 40
      }
      
      doc.addImage(imgBase64, 'PNG', 40, currentY, imgWidth, imgHeight)
      currentY += imgHeight + 30
    })
  }

  // Transactions Table
  const tableColumn = ["Date", "Title", "Category", "Payment Method", "Type", "Amount"]
  const tableRows = transactions.map(t => [
    formatDate(t.transactionDate),
    t.title,
    t.category,
    t.paymentMethod || 'Cash',
    t.type === 'income' ? 'Income' : 'Expense',
    formatCurrency(t.amount)
  ])

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: 'striped',
    headStyles: { fillColor: [43, 90, 237] }, // primary brand color
    styles: { fontSize: 10, cellPadding: 5 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 40, left: 40, right: 40 },
    didParseCell: function(data) {
      // Color-code amounts
      if (data.section === 'body' && data.column.index === 5) {
        if (data.row.raw[4] === 'Income') {
          data.cell.styles.textColor = [16, 185, 129] // green
        } else {
          data.cell.styles.textColor = [239, 68, 68] // red
        }
      }
    }
  })

  doc.save(`Expense_Report_${new Date().toISOString().slice(0,10)}.pdf`)
}


const getExcelNumFmt = (currency = 'INR') => {
  const fmts = {
    'INR': '"₹"#,##0.00',
    'USD': '"$"#,##0.00',
    'EUR': '"€"#,##0.00',
    'GBP': '"£"#,##0.00',
    'JPY': '"¥"#,##0',
    'AED': '"AED " #,##0.00'
  }
  return fmts[currency.toUpperCase()] || '"$"#,##0.00'
}

/**
 * Generate and download an Excel Report
 * @param {Array} transactions 
 * @param {Object} user
 */
export const generateExcelReport = async (transactions, user) => {
  const workbook = new ExcelJS.Workbook()
  const userCurrency = user?.defaultCurrency || 'INR'
  const numFormat = getExcelNumFmt(userCurrency)
  
  // Sheet 1: Transactions
  const sheet = workbook.addWorksheet('Transactions')
  
  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Payment Method', key: 'paymentMethod', width: 20 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Amount', key: 'amount', width: 15 }
  ]

  // Style Header
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2B5AED' }
  }

  // Add Rows
  transactions.forEach(t => {
    const row = sheet.addRow({
      date: formatDate(t.transactionDate),
      title: t.title,
      category: t.category,
      paymentMethod: t.paymentMethod || 'Cash',
      type: t.type === 'income' ? 'Income' : 'Expense',
      amount: t.amount // Keep as number for Excel math
    })

    // Color code amounts
    const amountCell = row.getCell('amount')
    amountCell.numFmt = numFormat
    if (t.type === 'income') {
      amountCell.font = { color: { argb: 'FF10B981' } } // Green
    } else {
      amountCell.font = { color: { argb: 'FFEF4444' } } // Red
    }
  })

  // Add Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary')
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 }
  ]
  summarySheet.getRow(1).font = { bold: true }
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  
  summarySheet.addRow({ metric: 'Total Income', value: totalIncome }).getCell('value').numFmt = numFormat
  summarySheet.addRow({ metric: 'Total Expense', value: totalExpense }).getCell('value').numFmt = numFormat
  summarySheet.addRow({ metric: 'Net Balance', value: totalIncome - totalExpense }).getCell('value').numFmt = numFormat

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `Transactions_${new Date().toISOString().slice(0,10)}.xlsx`)
}


/**
 * Generate and download a CSV Report
 * @param {Array} transactions 
 */
export const generateCSVReport = (transactions) => {
  const headers = ["Date", "Title", "Category", "Payment Method", "Type", "Amount"]
  
  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""'
    const cleanStr = String(str).replace(/"/g, '""')
    return `"${cleanStr}"`
  }

  const rows = transactions.map(t => [
    escapeCSV(formatDate(t.transactionDate)),
    escapeCSV(t.title),
    escapeCSV(t.category),
    escapeCSV(t.paymentMethod || 'Cash'),
    escapeCSV(t.type === 'income' ? 'Income' : 'Expense'),
    t.amount
  ].join(','))

  const csvContent = [headers.join(','), ...rows].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `Transactions_${new Date().toISOString().slice(0,10)}.csv`)
}
