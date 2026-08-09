import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// Utility to format date safely
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? dateString : date.toLocaleString()
}

/**
 * EXPORT USER DIRECTORY
 */
export const exportUsersPDF = (users) => {
  const doc = new jsPDF('p', 'pt', 'a4')
  
  doc.setFontSize(20)
  doc.setTextColor(33, 37, 41)
  doc.text('Expense Tracker - User Directory', 40, 50)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Exported on: ${new Date().toLocaleString()}`, 40, 70)
  doc.text(`Total Users: ${users.length}`, 40, 85)

  const tableColumn = ["ID", "Name", "Email", "Role", "Status", "Registered", "Tx Count"]
  const tableRows = users.map(u => [
    u.id,
    u.name,
    u.email,
    u.role,
    u.enabled ? 'Active' : 'Deactivated',
    formatDate(u.createdAt).split(',')[0],
    u.transactionCount
  ])

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 110,
    theme: 'striped',
    headStyles: { fillColor: [147, 51, 234] }, // Purple admin brand color
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: 40, left: 40, right: 40 },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 4) {
        if (data.cell.raw === 'Active') {
          data.cell.styles.textColor = [16, 185, 129] // green
        } else {
          data.cell.styles.textColor = [239, 68, 68] // red
        }
      }
    }
  })

  doc.save(`User_Directory_Report_${new Date().toISOString().slice(0,10)}.pdf`)
}

export const exportUsersExcel = async (users) => {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Users')
  
  sheet.columns = [
    { header: 'User ID', key: 'id', width: 10 },
    { header: 'Full Name', key: 'name', width: 25 },
    { header: 'Email Address', key: 'email', width: 30 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Registration Date', key: 'createdAt', width: 20 },
    { header: 'Transactions Tracked', key: 'txCount', width: 20 }
  ]

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF9333EA' } // Purple admin theme
  }

  users.forEach(u => {
    const row = sheet.addRow({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.enabled ? 'Active' : 'Deactivated',
      createdAt: formatDate(u.createdAt),
      txCount: u.transactionCount
    })

    const statusCell = row.getCell('status')
    if (u.enabled) {
      statusCell.font = { color: { argb: 'FF10B981' } }
    } else {
      statusCell.font = { color: { argb: 'FFEF4444' } }
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `User_Directory_${new Date().toISOString().slice(0,10)}.xlsx`)
}

export const exportUsersCSV = (users) => {
  const headers = ["User ID", "Full Name", "Email Address", "Role", "Status", "Registration Date", "Transactions Count"]
  const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`

  const rows = users.map(u => [
    u.id,
    escapeCSV(u.name),
    escapeCSV(u.email),
    escapeCSV(u.role),
    escapeCSV(u.enabled ? 'Active' : 'Deactivated'),
    escapeCSV(formatDate(u.createdAt)),
    u.transactionCount
  ].join(','))

  const csvContent = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `User_Directory_${new Date().toISOString().slice(0,10)}.csv`)
}


/**
 * EXPORT AUDIT LOGS
 */
export const exportAuditLogsPDF = (logs) => {
  const doc = new jsPDF('l', 'pt', 'a4') // landscape
  
  doc.setFontSize(20)
  doc.setTextColor(33, 37, 41)
  doc.text('Expense Tracker - System Audit Logs', 40, 50)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Exported on: ${new Date().toLocaleString()}`, 40, 70)
  doc.text(`Total Logs: ${logs.length}`, 40, 85)

  const tableColumn = ["ID", "Timestamp", "Action", "Actor ID", "IP Address", "User Agent", "Details"]
  const tableRows = logs.map(l => [
    l.id,
    formatDate(l.timestamp),
    l.action,
    l.userId || 'System/Guest',
    l.ipAddress || 'N/A',
    l.userAgent ? l.userAgent.substring(0, 30) + '...' : 'N/A',
    l.details || ''
  ])

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 110,
    theme: 'striped',
    headStyles: { fillColor: [147, 51, 234] },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: {
      6: { cellWidth: 250 } // details col wider
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: 40, left: 40, right: 40 }
  })

  doc.save(`Audit_Logs_Report_${new Date().toISOString().slice(0,10)}.pdf`)
}

export const exportAuditLogsExcel = async (logs) => {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Audit Logs')
  
  sheet.columns = [
    { header: 'Log ID', key: 'id', width: 10 },
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'Action Code', key: 'action', width: 20 },
    { header: 'Actor User ID', key: 'userId', width: 15 },
    { header: 'IP Address', key: 'ipAddress', width: 18 },
    { header: 'Browser User Agent', key: 'userAgent', width: 45 },
    { header: 'Log Details', key: 'details', width: 50 }
  ]

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF9333EA' }
  }

  logs.forEach(l => {
    sheet.addRow({
      id: l.id,
      timestamp: formatDate(l.timestamp),
      action: l.action,
      userId: l.userId || 'System/Anonymous',
      ipAddress: l.ipAddress || 'N/A',
      userAgent: l.userAgent || 'N/A',
      details: l.details || ''
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `Audit_Logs_${new Date().toISOString().slice(0,10)}.xlsx`)
}

export const exportAuditLogsCSV = (logs) => {
  const headers = ["Log ID", "Timestamp", "Action Code", "Actor User ID", "IP Address", "User Agent", "Log Details"]
  const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`

  const rows = logs.map(l => [
    l.id,
    escapeCSV(formatDate(l.timestamp)),
    escapeCSV(l.action),
    l.userId || 'Anonymous',
    escapeCSV(l.ipAddress || 'N/A'),
    escapeCSV(l.userAgent || 'N/A'),
    escapeCSV(l.details || '')
  ].join(','))

  const csvContent = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `Audit_Logs_${new Date().toISOString().slice(0,10)}.csv`)
}
