export interface ExcelExportOptions {
  fileName: string
  sheetName: string
  title: string
  companyInfo?: { name?: string; tax_id?: string; address?: string } | null
  userName?: string
  filterSummary?: Record<string, any>
  columns: { header: string; key: string; width?: number; format?: string }[]
  data: any[]
  summaryRows?: { label: string; value: any }[]
}

export async function generateExecutiveExcel(options: ExcelExportOptions) {
  const XLSX = await import('xlsx')
  const {
    fileName,
    sheetName,
    title,
    companyInfo,
    userName,
    filterSummary = {},
    columns,
    data,
    summaryRows = []
  } = options

  const now = new Date()
  const formattedDate = `${now.toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Lima' })}`

  // Format filter summary as string
  const activeFilters = Object.entries(filterSummary)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '' && val !== 'all')
    .map(([key, val]) => `${key.toUpperCase()}: ${val}`)
    .join(' | ') || 'TODOS LOS REGISTROS'

  // Build matrix with official institutional header
  const rows: any[][] = [
    [title.toUpperCase()],
    ['Empresa:', companyInfo?.name || 'Inthaly OPS', '', 'RUC / ID Fiscal:', companyInfo?.tax_id || '-'],
    ['Generado Por:', userName || 'Usuario Autorizado', '', 'Fecha y Hora:', `${formattedDate} (Hora Perú)`],
    ['Filtros Aplicados:', activeFilters, '', 'Total Registros:', data.length],
    []
  ]

  // Add Summary Rows if provided
  if (summaryRows.length > 0) {
    rows.push(['--- RESUMEN EJECUTIVO ---'])
    summaryRows.forEach(item => {
      rows.push([item.label, item.value])
    })
    rows.push([])
  }

  // Header row
  const headerRow = columns.map(c => c.header)
  rows.push(headerRow)

  // Data rows
  data.forEach((item, index) => {
    const row = columns.map(col => {
      if (col.key === '_index') return index + 1
      const val = item[col.key]
      return val !== undefined && val !== null ? val : ''
    })
    rows.push(row)
  })

  // Convert AOA to Sheet
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  ws['!cols'] = columns.map(col => ({
    wch: col.width || Math.max(col.header.length + 4, 14)
  }))

  // Create workbook and write
  const wb = XLSX.utils.book_new()
  const safeSheetName = sheetName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31)
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName)

  const dateStr = now.toISOString().split('T')[0]
  const cleanFileName = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dateStr}.xlsx`
  XLSX.writeFile(wb, cleanFileName)
}

export function generateCsv(fileName: string, columns: { header: string; key: string }[], data: any[]) {
  const headerLine = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',')
  const lines = data.map((item, index) => {
    return columns.map(col => {
      if (col.key === '_index') return index + 1
      const val = item[col.key]
      const text = val !== undefined && val !== null ? String(val) : ''
      return `"${text.replace(/"/g, '""')}"`
    }).join(',')
  })

  const csvContent = '\uFEFF' + [headerLine, ...lines].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const dateStr = new Date().toISOString().split('T')[0]
  link.setAttribute('href', url)
  link.setAttribute('download', `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dateStr}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
