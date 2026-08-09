import * as XLSX from 'xlsx'

export function exportKardexToExcel(records: any[], product: any, initialBalance: number) {
  const isIntegerUnit = product ? ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(product.unit.toUpperCase()) : false

  const dataToExport = records.map(m => {
    const displayEntrada = isIntegerUnit ? Math.round(m.entrada || 0) : (m.entrada || 0)
    const displaySalida = isIntegerUnit ? Math.round(m.salida || 0) : (m.salida || 0)
    const displayBal = isIntegerUnit ? Math.round(m.saldo_acumulado || 0) : (m.saldo_acumulado || 0)

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
  
  ws['!cols'] = [
    { wch: 20 }, // Fecha
    { wch: 15 }, // Op
    { wch: 15 }, // Doc
    { wch: 20 }, // Ubi
    { wch: 10 }, // In
    { wch: 10 }, // Out
    { wch: 15 }, // Bal
    { wch: 20 }, // Resp
    { wch: 30 } // Obs
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

export function exportPettyCashToExcel(options: {
  transactions: any[]
  areaName: string
  companyInfo?: { name?: string; tax_id?: string; address?: string } | null
  userName?: string
  filterType?: string
  searchTerm?: string
}) {
  const { transactions, areaName, companyInfo, userName, filterType = 'all', searchTerm = '' } = options

  const categoryMap: Record<string, string> = {
    alimentos: 'Alimentos',
    transporte: 'Transporte',
    mantenimiento: 'Mantenimiento',
    utiles: 'Útiles',
    emergencia: 'Emergencia',
    otros: 'Otros',
    fondo_inicial: 'Fondo Inicial',
    reposicion: 'Reposición',
    reembolso: 'Reembolso',
    transferencia: 'Transferencia Interna',
  }

  const now = new Date()
  const formattedNow = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`

  let totalIngresos = 0
  let totalEgresos = 0

  transactions.forEach(t => {
    const amt = Number(t.amount) || 0
    if (t.type === 'ingreso') {
      totalIngresos += amt
    } else {
      totalEgresos += amt
    }
  })

  const saldoNeto = totalIngresos - totalEgresos
  const totalMovimientos = transactions.length

  const filterLabel = filterType === 'ingreso' ? 'SOLO INGRESOS' : filterType === 'egreso' ? 'SOLO EGRESOS' : 'TODOS LOS MOVIMIENTOS'
  const searchLabel = searchTerm.trim() ? `"${searchTerm.trim()}"` : 'NINGUNA'

  const rows: any[][] = [
    ['REPORTE OFICIAL Y AUDITABLE DE CAJA CHICA'],
    ['Empresa:', companyInfo?.name || 'Inthaly ERP', '', 'RUC / ID Fiscal:', companyInfo?.tax_id || 'Sin Especificar'],
    ['Área / Caja:', areaName, '', 'Fecha Generación:', formattedNow],
    ['Exportado Por:', userName || 'Usuario Autorizado', '', 'Filtro Tipo:', filterLabel],
    ['Dirección:', companyInfo?.address || 'N/A', '', 'Búsqueda Texto:', searchLabel],
    [],
    ['RESUMEN DE CAJA (MOVIMIENTOS SELECCIONADOS)'],
    ['Total Ingresos (S/)', totalIngresos, '', 'Total Egresos (S/)', totalEgresos, '', 'Saldo Neto (S/)', saldoNeto, '', 'Cant. Movimientos', totalMovimientos],
    [],
    [
      'N° Op / Ref',
      'Fecha',
      'Hora',
      'Tipo Movimiento',
      'Categoría',
      'Motivo / Concepto',
      'Método Pago',
      'Comprobante / N° Op',
      'Área / Caja',
      'Responsable',
      'Ingreso (S/)',
      'Egreso (S/)',
      'Saldo Acumulado (S/)'
    ]
  ]

  let runningBalance = 0
  transactions.forEach((t, idx) => {
    const amt = Number(t.amount) || 0
    const isIngreso = t.type === 'ingreso'
    if (isIngreso) {
      runningBalance += amt
    } else {
      runningBalance -= amt
    }

    const tDate = t.date ? new Date(t.date) : new Date()
    const fechaStr = tDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const horaStr = tDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })

    const ref = t.operation_number ? `OP-${t.operation_number}` : `MOV-${String(idx + 1).padStart(4, '0')}`
    const cat = categoryMap[t.category] || t.category || 'General'
    const doc = t.operation_number ? `Op: ${t.operation_number}` : (t.voucher_url ? 'Con Comprobante' : 'Sin Comprobante')

    rows.push([
      ref,
      fechaStr,
      horaStr,
      isIngreso ? 'INGRESO' : 'EGRESO',
      cat,
      t.reason || '-',
      t.payment_method ? String(t.payment_method).toUpperCase() : 'EFECTIVO',
      doc,
      t.area || areaName,
      t.responsible?.name || 'Sistema',
      isIngreso ? amt : 0,
      !isIngreso ? amt : 0,
      runningBalance
    ])
  })

  rows.push([
    'TOTALES GENERALES',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalIngresos,
    totalEgresos,
    saldoNeto
  ])

  const ws = XLSX.utils.aoa_to_sheet(rows)

  ws['!cols'] = [
    { wch: 16 }, // Ref
    { wch: 14 }, // Fecha
    { wch: 10 }, // Hora
    { wch: 14 }, // Tipo
    { wch: 18 }, // Categoría
    { wch: 38 }, // Motivo / Concepto
    { wch: 16 }, // Método Pago
    { wch: 22 }, // Comprobante
    { wch: 18 }, // Área
    { wch: 24 }, // Responsable
    { wch: 16 }, // Ingreso
    { wch: 16 }, // Egreso
    { wch: 20 }  // Saldo
  ]

  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 10 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Caja_${areaName.replace(/[^a-zA-Z0-9]/g, '_')}`)

  const dateFileStr = now.toISOString().split('T')[0]
  const cleanArea = areaName.toLowerCase().replace(/[^a-z0-9]/g, '_')
  XLSX.writeFile(wb, `Reporte_CajaChica_${cleanArea}_${dateFileStr}.xlsx`)
}

export function exportTareoToExcel(options: {
  monthStr: string
  workers: any[]
  daysInMonth: any[]
  workerStatusesMap: any
  workerSummaries: any
  kpis: any
  companyInfo?: { name?: string; tax_id?: string } | null
}) {
  const { monthStr, workers, daysInMonth, workerStatusesMap, workerSummaries, kpis, companyInfo } = options
  const now = new Date()
  const formattedNow = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`

  const matrixRows: any[] = []

  // Encabezado institucional
  matrixRows.push({ A: companyInfo?.name || 'EMPRESA REGISTRADA', B: '', C: '', D: '' })
  matrixRows.push({ A: companyInfo?.tax_id ? `RUC: ${companyInfo.tax_id}` : 'RUC: 20000000001', B: '', C: '', D: '' })
  matrixRows.push({ A: `REPORTE OFICIAL DE TAREO Y ASISTENCIA - MES: ${monthStr}`, B: '', C: '', D: '' })
  matrixRows.push({ A: `Generado el: ${formattedNow}`, B: '', C: '', D: '' })
  matrixRows.push({}) // Fila vacía

  // Resumen Ejecutivo KPIs
  matrixRows.push({ A: '--- RESUMEN EJECUTIVO DE PRODUCTIVIDAD Y CUMPLIMIENTO ---' })
  matrixRows.push({ A: 'Trabajadores Registrados:', B: kpis?.totalTrabajadores || 0, C: 'Horas Programadas:', D: kpis?.horasProgramadasMes || 0 })
  matrixRows.push({ A: 'Presentes Hoy:', B: kpis?.presentesHoy || 0, C: 'Horas Ejecutadas:', D: kpis?.horasEjecutadasMes || 0 })
  matrixRows.push({ A: 'Ausentes Hoy:', B: kpis?.ausentesHoy || 0, C: 'Horas Efectivas:', D: kpis?.horasEfectivasMes || 0 })
  matrixRows.push({ A: '% Asistencia General:', B: `${kpis?.porcentajeAsistencia || 100}%`, C: 'Horas Extras Total:', D: kpis?.horasExtrasMes || 0 })
  matrixRows.push({ A: '% Puntualidad:', B: `${kpis?.porcentajePuntualidad || 100}%`, C: 'Minutos Tardanza:', D: kpis?.minutosTardanzaAcumulados || 0 })
  matrixRows.push({}) // Fila vacía

  // Fila de encabezado de la matriz de Tareo
  const headerObj: any = {
    ITEM: 'ITEM',
    TRABAJADOR: 'Apellidos y Nombres',
    CARGO: 'Cargo'
  }

  daysInMonth.forEach((d: any) => {
    headerObj[`D_${d.day}`] = `${d.weekday} ${d.day}`
  })

  headerObj['DT'] = 'Días Trab.'
  headerObj['DL'] = 'Días Lib.'
  headerObj['HO'] = 'Horas Ord.'
  headerObj['HE'] = 'Horas Ext.'
  headerObj['HEF'] = 'Horas Efec.'
  headerObj['TAR'] = 'Min. Tard.'

  matrixRows.push(headerObj)

  // Filas por trabajador
  workers.forEach((w: any, idx: number) => {
    const summary = workerSummaries[w.id] || {}
    const statuses = workerStatusesMap[w.id] || {}

    const rowObj: any = {
      ITEM: idx + 1,
      TRABAJADOR: `${w.name} ${w.last_name || ''}`.trim(),
      CARGO: w.position || '-'
    }

    daysInMonth.forEach((d: any) => {
      const eff = statuses[d.dateString] || { status: '' }
      rowObj[`D_${d.day}`] = eff.status || '-'
    })

    rowObj['DT'] = summary.diasTrabajados || 0
    rowObj['DL'] = summary.diasLibres || 0
    rowObj['HO'] = summary.horasOrdinarias || 0
    rowObj['HE'] = summary.horasExtras || 0
    rowObj['HEF'] = summary.horasEfectivas || 0
    rowObj['TAR'] = summary.minutosTardanza || 0

    matrixRows.push(rowObj)
  })

  const ws = XLSX.utils.json_to_sheet(matrixRows, { skipHeader: true })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Tareo_${monthStr}`)
  XLSX.writeFile(wb, `Matriz_Tareo_${monthStr}_${now.toISOString().split('T')[0]}.xlsx`)
}
