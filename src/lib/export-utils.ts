import * as XLSX from 'xlsx'

export function exportKardexToExcel(records: any[], product: any, initialBalance: number) {
  const isIntegerUnit = product ? ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(product.unit.toUpperCase()) : false

  const dataToExport = records.map(m => {
    const displayEntrada = isIntegerUnit ? Math.round(m.entrada || 0) : (m.entrada || 0);
    const displaySalida = isIntegerUnit ? Math.round(m.salida || 0) : (m.salida || 0);
    const displayBal = isIntegerUnit ? Math.round(m.saldo_acumulado || 0) : (m.saldo_acumulado || 0);

    const dateStr = new Date(m.created_at).toLocaleDateString() + ' ' + new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const doc = m.doc_display || ((m.document_type && m.document_number) ? `${m.document_type} ${m.document_number}` : '')

    return {
      'Fecha y Hora': dateStr,
      'Tipo Movimiento': m.ui_type || 'Movimiento',
      'Documento': m.doc_display || doc,
      'Ubicación / Detalle': m.context_label ? `${m.context_label} (${m.warehouses?.name || ''})` : (m.warehouses?.name || m.location),
      'Entrada': m.entrada > 0 ? displayEntrada : '',
      'Salida': m.salida > 0 ? displaySalida : '',
      'Saldo Acumulado': displayBal,
      'Responsable': m.responsible_name || m.users?.name || 'Sistema',
      'Observación': m.observation || ''
    }
  })



  // Insert initial balance row at the very top
  dataToExport.unshift({
    'Fecha y Hora': '',
    'Tipo Movimiento': 'SALDO INICIAL',
    'Documento': '',
    'Ubicación / Detalle': '',
    'Entrada': '',
    'Salida': '',
    'Saldo Acumulado': isIntegerUnit ? Math.round(initialBalance) : initialBalance,
    'Responsable': '',
    'Observación': ''
  })

  const ws = XLSX.utils.json_to_sheet(dataToExport)
  const wb = XLSX.utils.book_new()
  
  // Adjust column widths roughly
  ws['!cols'] = [
    { wch: 20 }, // Fecha
    { wch: 15 }, // Op
    { wch: 15 }, // Doc
    { wch: 20 }, // Ubi
    { wch: 10 }, // In
    { wch: 10 }, // Out
    { wch: 15 }, // Bal
    { wch: 20 }, // Resp
    { wch: 30 }  // Obs
  ]

  XLSX.utils.book_append_sheet(wb, ws, `Kardex_${product?.code || 'Prod'}`)

  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `Kardex_${product?.code}_${date}.xlsx`)
}

export function exportReportsToExcel(reportName: string, items: any[]) {
  if (!items || items.length === 0) return

  const ws = XLSX.utils.json_to_sheet(items)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `Reporte_${reportName}_${date}.xlsx`)
}
