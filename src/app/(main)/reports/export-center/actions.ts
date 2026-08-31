'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { getCompanyTimezone } from '@/lib/date-utils'
import { ExportFilterValues, ReportPreviewResult, ExportResult, ExportAuditItem } from '@/lib/export-center/types'

// Helper for official corporate position and role names
function formatOfficialPosition(positionOrRole: string | null | undefined): string {
  if (!positionOrRole) return 'Colaborador'
  const key = positionOrRole.toLowerCase().trim()
  if (key === 'supervisor') return 'Líder de Cuadrilla'
  if (key === 'admin' || key === 'administrador') return 'Gerente General'
  if (key === 'gerente') return 'Gerencia General'
  if (key === 'jefe_area') return 'Jefe de Área'
  if (key === 'operaciones') return 'Mina'
  if (key === 'almacen') return 'Logística'
  if (key === 'mecanica') return 'Mecánica'
  if (key === 'soma') return 'Seguridad SOMA'
  if (key === 'cocina') return 'Cocina'
  if (key === 'trabajador' || key === 'worker') return 'Operario'
  return positionOrRole.charAt(0).toUpperCase() + positionOrRole.slice(1)
}

// Helper for case-insensitive, accent-insensitive area matching
function isAreaMatch(itemArea: string | null | undefined, filterArea: string | null | undefined): boolean {
  if (!filterArea || filterArea === 'all') return true
  if (!itemArea) return false
  const a = itemArea.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const b = filterArea.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  return a === b || a.includes(b) || b.includes(a)
}

export async function getExportAuxiliaryData() {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  const supabase = await createAdminClient()

  const [workersQuery, usersQuery, warehousesQuery, companyQuery] = await Promise.all([
    applyIsolation(
      supabase.from('workers').select('*, worker_personal(*), worker_financial(*)'),
      companyId,
      extendedUser.role_id
    ).order('name', { ascending: true }),

    applyIsolation(
      supabase.from('users').select('*'),
      companyId,
      extendedUser.role_id
    ).order('name', { ascending: true }),

    applyIsolation(
      supabase.from('warehouses').select('*'),
      companyId,
      extendedUser.role_id
    ).order('name', { ascending: true }),

    supabase.from('companies').select('*').eq('id', companyId).maybeSingle()
  ])

  const seenIds = new Set<string>()
  const workerList: any[] = []

  // 1. Add All Real Workers from workers table (including regular non-user collaborators)
  ;(workersQuery.data || []).forEach((w: any) => {
    const pers = Array.isArray(w.worker_personal) ? w.worker_personal[0] : w.worker_personal
    const effArea = w.area || pers?.area || 'General'
    const fullName = `${w.name || ''} ${w.last_name || ''}`.trim() || 'Colaborador'
    const doc = w.dni || w.document_number || w.documentNumber || pers?.dni || '-'
    seenIds.add(w.id)
    if (w.user_id) seenIds.add(w.user_id)

    workerList.push({
      id: w.id,
      name: w.name || '',
      user_id: w.user_id || null,
      email: w.email || null,
      fullName,
      dni: doc,
      position: formatOfficialPosition(w.position),
      area: effArea,
      status: w.status || 'active'
    })
  })

  // 2. Add or Merge System Users (Admins, Managers, Supervisors) without duplicating
  ;(usersQuery.data || []).forEach((u: any) => {
    if (seenIds.has(u.id)) return

    // Smart Match: Check if this user is already in workerList (by user_id, email, or first/full name)
    const existingWorker = workerList.find(w => 
      (w.user_id && w.user_id === u.id) ||
      (u.email && w.email && w.email.toLowerCase() === u.email.toLowerCase()) ||
      (u.name && w.fullName.toLowerCase().includes(u.name.toLowerCase().trim())) ||
      (u.name && w.name && u.name.toLowerCase().trim().startsWith(w.name.toLowerCase().trim()))
    )

    if (existingWorker) {
      // Upgrade existing worker with user's official role & area
      if (u.role_id) existingWorker.position = formatOfficialPosition(u.role_id)
      if (u.area) existingWorker.area = u.area
      seenIds.add(u.id)
      return
    }

    const doc = u.dni || u.document_number || '-'
    seenIds.add(u.id)

    workerList.push({
      id: u.id,
      name: u.name || '',
      user_id: u.id,
      email: u.email || null,
      fullName: u.name || u.email || 'Administrador',
      dni: doc,
      position: formatOfficialPosition(u.role_id),
      area: u.area || 'Administración',
      status: 'active'
    })
  })

  return {
    workers: workerList,
    warehouses: warehousesQuery.data || [],
    company: companyQuery.data || { name: 'Empresa Registrada', tax_id: '-' }
  }
}

/**
 * Registra una descarga en la tabla de auditoría
 */
async function logExportAudit(params: {
  companyId: string
  userId: string
  userName: string
  reportId: string
  reportTitle: string
  category: string
  format: string
  filters: Record<string, any>
  recordsCount: number
  status: string
}) {
  try {
    const supabase = await createAdminClient()
    await supabase.from('export_audit_logs').insert({
      company_id: params.companyId,
      user_id: params.userId,
      user_name: params.userName,
      report_id: params.reportId,
      report_title: params.reportTitle,
      category: params.category,
      format: params.format,
      filters_applied: params.filters,
      records_count: params.recordsCount,
      status: params.status
    })
  } catch (e) {
    console.warn('[EXPORT_AUDIT_LOG_WARNING] Could not save audit log:', e)
  }
}

/**
 * Consulta y normaliza los datos del reporte seleccionado con filtros estrictos
 */
async function queryReportDataset(actionKey: string, filters: ExportFilterValues, companyId: string, roleId: string, timezone: string) {
  const supabase = await createAdminClient()

  const {
    startDate,
    endDate,
    area,
    workerId,
    warehouseId,
    status,
    searchTerm,
    stockCondition,
    equipmentType,
    conceptType,
    paymentMethod,
    priority,
    severity,
    shift
  } = filters

  const search = searchTerm ? searchTerm.toLowerCase().trim() : ''

  switch (actionKey) {
    // ==========================================
    // RECURSOS HUMANOS (RRHH)
    // ==========================================
    case 'export_tareo_mensual': {
      // 1. Fetch Workers and Users for this company
      const [workersRes, usersRes] = await Promise.all([
        applyIsolation(
          supabase.from('workers').select('*, worker_personal(*), worker_financial(*)'),
          companyId,
          roleId
        ).order('name', { ascending: true }),
        applyIsolation(
          supabase.from('users').select('*'),
          companyId,
          roleId
        ).order('name', { ascending: true })
      ])

      const workerMap: Record<string, any> = {}

      ;(workersRes.data || []).forEach((w: any) => {
        const pers = Array.isArray(w.worker_personal) ? w.worker_personal[0] : w.worker_personal
        const effArea = w.area || pers?.area || 'General'
        if (area && area !== 'all' && !isAreaMatch(effArea, area)) return
        if (workerId && workerId !== 'all' && w.id !== workerId) return
        const doc = w.dni || w.document_number || w.documentNumber || pers?.dni || '-'

        workerMap[w.id] = {
          id: w.id,
          name: w.name || '',
          user_id: w.user_id || null,
          email: w.email || null,
          fullName: `${w.name || ''} ${w.last_name || ''}`.trim() || 'Colaborador',
          dni: doc,
          position: formatOfficialPosition(w.position),
          area: effArea
        }
      })

      ;(usersRes.data || []).forEach((u: any) => {
        const effArea = u.area || 'Administración'
        if (area && area !== 'all' && !isAreaMatch(effArea, area)) return
        if (workerId && workerId !== 'all' && u.id !== workerId) return

        // Smart Match: Check if this user is already in workerMap
        const existingKey = Object.keys(workerMap).find(k => {
          const w = workerMap[k]
          return (w.user_id && w.user_id === u.id) ||
                 (u.email && w.email && w.email.toLowerCase() === u.email.toLowerCase()) ||
                 (u.name && w.fullName.toLowerCase().includes(u.name.toLowerCase().trim())) ||
                 (u.name && w.name && u.name.toLowerCase().trim().startsWith(w.name.toLowerCase().trim()))
        })

        if (existingKey) {
          // Upgrade existing worker
          if (u.role_id) workerMap[existingKey].position = formatOfficialPosition(u.role_id)
          if (u.area) workerMap[existingKey].area = u.area
          // Map user ID alias to the canonical worker object
          workerMap[u.id] = workerMap[existingKey]
          return
        }

        const doc = u.dni || u.document_number || '-'
        workerMap[u.id] = {
          id: u.id,
          name: u.name || '',
          user_id: u.id,
          email: u.email || null,
          fullName: u.name || u.email || 'Administrador',
          dni: doc,
          position: formatOfficialPosition(u.role_id),
          area: effArea
        }
      })

      // 2. Fetch tareo_records (Matrix marks: T, D, F, INC, AD, P, etc.)
      let tareoQ = applyIsolation(
        supabase.from('tareo_records').select('worker_id, date, status, is_manual'),
        companyId,
        roleId
      )
      if (startDate) tareoQ = tareoQ.gte('date', startDate)
      if (endDate) tareoQ = tareoQ.lte('date', endDate)
      if (workerId && workerId !== 'all') tareoQ = tareoQ.eq('worker_id', workerId)

      // 3. Fetch attendance table (check_in, break_start, break_end, check_out, minutes_late, extra_hours)
      let attQ = applyIsolation(
        supabase.from('attendance').select('worker_id, date, check_in, break_start, break_end, check_out, status, minutes_late, extra_hours, is_extra'),
        companyId,
        roleId
      )
      if (startDate) attQ = attQ.gte('date', startDate)
      if (endDate) attQ = attQ.lte('date', endDate)
      if (workerId && workerId !== 'all') attQ = attQ.eq('worker_id', workerId)

      // 4. Fetch real punch logs from attendance_logs (in, out, break_start, break_end)
      let logsQ = applyIsolation(
        supabase.from('attendance_logs').select('worker_id, date_local, type, timestamp, latitude, longitude'),
        companyId,
        roleId
      ).order('timestamp', { ascending: true })
      if (startDate) logsQ = logsQ.gte('date_local', startDate)
      if (endDate) logsQ = logsQ.lte('date_local', endDate)
      if (workerId && workerId !== 'all') logsQ = logsQ.eq('worker_id', workerId)

      const [tareoRes, attRes, logsRes] = await Promise.all([tareoQ, attQ, logsQ])

      // Helper to format ISO or time strings into clean HH:mm format
      const formatTime = (val: string | null | undefined, fallback = '-') => {
        if (!val) return fallback
        if (val.includes('T')) {
          try {
            const d = new Date(val)
            return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' })
          } catch {
            return val
          }
        }
        if (val.includes(':')) {
          const parts = val.split(':')
          return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
        }
        return val
      }

      // Dictionary of tareo marks mapped by `${canonical_worker_id}_${date}`
      const markMap: Record<string, any> = {}

      // 1. Hydrate from tareo_records (status code: T, D, F, INC, AD, AC, P, PR, etc.)
      ;(tareoRes.data || []).forEach((t: any) => {
        const canonicalWorker = workerMap[t.worker_id]
        if (!canonicalWorker) return
        const key = `${canonicalWorker.id}_${t.date}`
        const rawStatus = (t.status || 'T').toUpperCase()
        let readableStatus = 'TRABAJADO'

        if (rawStatus === 'AC') {
          readableStatus = 'ASISTENCIA COMPLETA (AC)'
        } else if (rawStatus === 'T' || rawStatus === 'P') {
          readableStatus = 'TRABAJADO (PRESENTE)'
        } else if (rawStatus === 'PR') {
          readableStatus = 'PRESENTE C/ REFRIGERIO (PR)'
        } else if (rawStatus === 'D' || rawStatus === 'L') {
          readableStatus = 'DESCANSO'
        } else if (rawStatus === 'F') {
          readableStatus = 'FALTA INJUSTIFICADA'
        } else if (rawStatus === 'INC') {
          readableStatus = 'INCOMPLETO'
        } else if (rawStatus === 'AD') {
          readableStatus = 'ADELANTO / PERMISO'
        } else if (rawStatus === 'V') {
          readableStatus = 'VACACIONES'
        } else if (rawStatus === 'DM') {
          readableStatus = 'DESCANSO MÉDICO'
        } else {
          readableStatus = rawStatus
        }

        markMap[key] = {
          date: t.date,
          worker: canonicalWorker,
          status: readableStatus,
          check_in: '-',
          break_start: '-',
          break_end: '-',
          check_out: '-',
          minutes_late: 0,
          extra_hours: 0
        }
      })

      // 2. Hydrate & Enrich from attendance table (daily summaries)
      ;(attRes.data || []).forEach((a: any) => {
        const canonicalWorker = workerMap[a.worker_id]
        if (!canonicalWorker) return
        const key = `${canonicalWorker.id}_${a.date}`
        const current = markMap[key] || {
          date: a.date,
          worker: canonicalWorker,
          status: a.status || (a.check_in ? 'PRESENTE' : 'FALTA'),
          check_in: '-',
          break_start: '-',
          break_end: '-',
          check_out: '-',
          minutes_late: Number(a.minutes_late) || 0,
          extra_hours: Number(a.extra_hours) || 0
        }

        if (a.check_in) current.check_in = formatTime(a.check_in, '-')
        if (a.break_start) current.break_start = formatTime(a.break_start, '-')
        if (a.break_end) current.break_end = formatTime(a.break_end, '-')
        if (a.check_out) current.check_out = formatTime(a.check_out, '-')
        if (a.minutes_late) current.minutes_late = Number(a.minutes_late)
        if (a.extra_hours) current.extra_hours = Number(a.extra_hours)
        if (!markMap[key] && a.status) current.status = a.status

        markMap[key] = current
      })

      // 3. Hydrate & Enrich from attendance_logs (REAL GPS/MOBILE TIMESTAMPS: IN, BREAK, OUT)
      ;(logsRes.data || []).forEach((log: any) => {
        const canonicalWorker = workerMap[log.worker_id]
        if (!canonicalWorker) return
        const key = `${canonicalWorker.id}_${log.date_local}`
        const current = markMap[key] || {
          date: log.date_local,
          worker: canonicalWorker,
          status: 'PRESENTE (MARCACIÓN)',
          check_in: '-',
          break_start: '-',
          break_end: '-',
          check_out: '-',
          minutes_late: 0,
          extra_hours: 0
        }

        const logType = (log.type || '').toLowerCase()
        const formattedStamp = formatTime(log.timestamp, '-')

        if (logType === 'in' || logType === 'check_in') {
          // Earliest in punch
          if (current.check_in === '-' || formattedStamp < current.check_in) {
            current.check_in = formattedStamp
          }
        } else if (logType === 'break_start') {
          // Earliest break start
          if (current.break_start === '-' || formattedStamp < current.break_start) {
            current.break_start = formattedStamp
          }
        } else if (logType === 'break_end') {
          // Latest break end
          if (current.break_end === '-' || formattedStamp > current.break_end) {
            current.break_end = formattedStamp
          }
        } else if (logType === 'out' || logType === 'check_out') {
          // Latest out punch
          if (current.check_out === '-' || formattedStamp > current.check_out) {
            current.check_out = formattedStamp
          }
        }

        // If status was not set or generic, enrich it
        if (!markMap[key]) {
          if (current.check_in !== '-' && current.check_out !== '-') {
            current.status = 'ASISTENCIA COMPLETA (AC)'
          } else if (current.check_in !== '-' && current.break_start !== '-' && current.break_end === '-') {
            current.status = 'PRESENTE C/ REFRIGERIO (PR)'
          } else if (current.check_in !== '-') {
            current.status = 'PRESENTE (P)'
          }
        }

        markMap[key] = current
      })

      // Consolidate records by worker for monthly report, or by date if single date selected
      const isSingleDay = startDate && endDate && startDate === endDate

      let formatted: any[] = []
      let columns: any[] = []

      if (isSingleDay) {
        // Mode 1: Single Day Detailed Attendance
        columns = [
          { header: 'N°', key: '_index', width: 6 },
          { header: 'Fecha', key: 'date', width: 14 },
          { header: 'DNI / Doc', key: 'dni', width: 14 },
          { header: 'Trabajador', key: 'workerName', width: 28 },
          { header: 'Área', key: 'area', width: 18 },
          { header: 'Cargo / Función', key: 'position', width: 22 },
          { header: 'Hora Entrada', key: 'check_in', width: 15 },
          { header: 'Inicio Refrigerio', key: 'break_start', width: 16 },
          { header: 'Fin Refrigerio', key: 'break_end', width: 16 },
          { header: 'Hora Salida', key: 'check_out', width: 15 },
          { header: 'Tardanza (Min)', key: 'minutes_late', width: 16 },
          { header: 'Horas Extras', key: 'extra_hours', width: 14 },
          { header: 'Estado / Marcación', key: 'status', width: 24 }
        ]

        // Ensure every worker is present for that single day
        const singleDayRows: any[] = []
        const uniqueWorkers = Object.values(
          Object.values(workerMap).reduce((acc: any, w: any) => {
            acc[w.id] = w
            return acc
          }, {})
        )

        uniqueWorkers.forEach((w: any) => {
          const key = `${w.id}_${startDate}`
          const mark = markMap[key] || {
            date: startDate,
            worker: w,
            status: 'FALTA / SIN REGISTRO',
            check_in: '-',
            break_start: '-',
            break_end: '-',
            check_out: '-',
            minutes_late: 0,
            extra_hours: 0
          }

          singleDayRows.push({
            date: startDate,
            dni: w.dni || '-',
            workerName: w.fullName,
            area: w.area || '-',
            position: w.position || '-',
            check_in: mark.check_in || '-',
            break_start: mark.break_start || '-',
            break_end: mark.break_end || '-',
            check_out: mark.check_out || '-',
            minutes_late: Number(mark.minutes_late) || 0,
            extra_hours: Number(mark.extra_hours) || 0,
            status: mark.status || 'PROGRAMADO'
          })
        })

        singleDayRows.sort((a, b) => a.workerName.localeCompare(b.workerName))
        formatted = singleDayRows

      } else {
        // Mode 2: Consolidated Monthly Matrix (EXACTLY 1 Row Per Collaborator)
        columns = [
          { header: 'N°', key: '_index', width: 6 },
          { header: 'DNI / Doc', key: 'dni', width: 14 },
          { header: 'Trabajador', key: 'workerName', width: 28 },
          { header: 'Área', key: 'area', width: 18 },
          { header: 'Cargo / Función', key: 'position', width: 22 },
          { header: 'D. Trabajados', key: 'dias_trabajados', width: 15 },
          { header: 'D. Libres', key: 'dias_libres', width: 12 },
          { header: 'Faltas', key: 'faltas', width: 10 },
          { header: 'Horas Ord.', key: 'horas_ordinarias', width: 13 },
          { header: 'Horas Ext.', key: 'horas_extras', width: 13 },
          { header: 'Horas Efec.', key: 'horas_efectivas', width: 13 },
          { header: 'Min. Tardanza', key: 'minutos_tardanza', width: 15 },
          { header: 'Última Entrada', key: 'check_in', width: 15 },
          { header: 'Último Refrigerio', key: 'break_start', width: 16 },
          { header: 'Última Salida', key: 'check_out', width: 15 },
          { header: 'Estado / Resumen', key: 'status', width: 22 }
        ]

        // Group marks by unique canonical worker ID
        const uniqueWorkersMap: Record<string, any> = {}
        Object.values(workerMap).forEach((w: any) => {
          if (!uniqueWorkersMap[w.id]) {
            uniqueWorkersMap[w.id] = {
              worker: w,
              marks: []
            }
          }
        })

        Object.values(markMap).forEach((m: any) => {
          const wId = m.worker?.id
          if (wId && uniqueWorkersMap[wId]) {
            uniqueWorkersMap[wId].marks.push(m)
          }
        })

        const consolidatedRows: any[] = []

        Object.values(uniqueWorkersMap).forEach(({ worker: w, marks }) => {
          let diasTrab = 0
          let diasLib = 0
          let faltas = 0
          let tardanza = 0
          let horasExt = 0
          let horasOrd = 0
          let lastIn = '-'
          let lastBreak = '-'
          let lastOut = '-'
          let lastStatus = 'PROGRAMADO'

          // Sort marks of this worker by date DESC to extract latest punch
          marks.sort((a: any, b: any) => b.date.localeCompare(a.date))

          marks.forEach((m: any) => {
            const st = (m.status || '').toUpperCase()
            if (st.includes('TRABAJADO') || st.includes('ASISTENCIA') || st.includes('PRESENTE') || st === 'AC' || st === 'P' || st === 'PR') {
              diasTrab++
              horasOrd += 8
            } else if (st.includes('DESCANSO') || st === 'D' || st === 'L') {
              diasLib++
            } else if (st.includes('FALTA') || st === 'F') {
              faltas++
            }

            tardanza += Number(m.minutes_late) || 0
            horasExt += Number(m.extra_hours) || 0

            if (lastIn === '-' && m.check_in && m.check_in !== '-') lastIn = m.check_in
            if (lastBreak === '-' && m.break_start && m.break_start !== '-') lastBreak = `${m.break_start} - ${m.break_end || ''}`
            if (lastOut === '-' && m.check_out && m.check_out !== '-') lastOut = m.check_out
            if (lastStatus === 'PROGRAMADO' && m.status) lastStatus = m.status
          })

          const horasEfec = Math.max(0, horasOrd + horasExt - (tardanza / 60)).toFixed(1)

          consolidatedRows.push({
            dni: w.dni || '-',
            workerName: w.fullName,
            area: w.area || '-',
            position: w.position || '-',
            dias_trabajados: diasTrab,
            dias_libres: diasLib,
            faltas: faltas,
            horas_ordinarias: `${horasOrd}h`,
            horas_extras: `${horasExt.toFixed(1)}h`,
            horas_efectivas: `${horasEfec}h`,
            minutos_tardanza: `${tardanza}m`,
            check_in: lastIn,
            break_start: lastBreak,
            check_out: lastOut,
            status: lastStatus
          })
        })

        consolidatedRows.sort((a, b) => a.workerName.localeCompare(b.workerName))
        formatted = consolidatedRows
      }

      return { columns, data: formatted }
    }

    case 'export_trabajadores_padron': {
      const [workersRes, usersRes] = await Promise.all([
        applyIsolation(
          supabase.from('workers').select('*, worker_personal(*), worker_financial(*)'),
          companyId,
          roleId
        ).order('name', { ascending: true }),
        applyIsolation(
          supabase.from('users').select('id, name, email, role_id, area, created_at'),
          companyId,
          roleId
        ).order('name', { ascending: true })
      ])

      const seenNames = new Set<string>()

      let rows = (workersRes.data || []).map((w: any) => {
        const fin = Array.isArray(w.worker_financial) ? w.worker_financial[0] : w.worker_financial
        const pers = Array.isArray(w.worker_personal) ? w.worker_personal[0] : w.worker_personal
        const rawStatus = (w.status || 'ACTIVO').toLowerCase()
        const isActive = rawStatus === 'active' || rawStatus === 'activo'
        const effectiveArea = w.area || pers?.area || 'General'
        const fullName = `${w.name || ''} ${w.last_name || ''}`.trim()
        seenNames.add(fullName.toLowerCase())

        return {
          code: w.cod || w.codigo || `TR-${w.id?.substring(0, 4)}`,
          dni: w.document_number || w.dni || '-',
          name: w.name || '',
          last_name: w.last_name || '',
          fullName,
          position: formatOfficialPosition(w.position),
          area: effectiveArea,
          phone: w.phone || pers?.phone_number || '-',
          email: w.email || '-',
          status: isActive ? 'active' : 'inactive',
          statusDisplay: isActive ? 'ACTIVO' : 'INACTIVO / CESADO',
          hire_date: w.hire_date ? new Date(w.hire_date).toISOString().split('T')[0] : '-',
          salary: fin?.monthly_salary || 0,
          daily_rate: fin?.daily_rate || 0,
          address: pers?.address || '-'
        }
      })

      // Include admin/company users
      ;(usersRes.data || []).forEach((u: any) => {
        const uName = (u.name || u.email || 'Administrador').trim()
        if (seenNames.has(uName.toLowerCase())) return

        rows.push({
          code: `USR-${u.id?.substring(0, 4)}`,
          dni: u.dni || u.document_number || '-',
          name: uName,
          last_name: '',
          fullName: uName,
          position: formatOfficialPosition(u.role_id),
          area: u.area || 'Administración',
          phone: '-',
          email: u.email || '-',
          status: 'active',
          statusDisplay: 'ACTIVO (USUARIO / ADMIN)',
          hire_date: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '-',
          salary: 0,
          daily_rate: 0,
          address: '-'
        })
      })

      if (area && area !== 'all') {
        rows = rows.filter((w: any) => isAreaMatch(w.area, area))
      }
      if (status && status !== 'all') {
        rows = rows.filter((w: any) => w.status === status)
      }
      if (search) {
        rows = rows.filter((w: any) =>
          w.name.toLowerCase().includes(search) ||
          w.last_name.toLowerCase().includes(search) ||
          w.dni.includes(search) ||
          w.position.toLowerCase().includes(search) ||
          w.area.toLowerCase().includes(search)
        )
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Código', key: 'code', width: 14 },
        { header: 'DNI / Doc', key: 'dni', width: 14 },
        { header: 'Nombres', key: 'name', width: 22 },
        { header: 'Apellidos', key: 'last_name', width: 22 },
        { header: 'Cargo / Puesto', key: 'position', width: 22 },
        { header: 'Área', key: 'area', width: 18 },
        { header: 'Teléfono', key: 'phone', width: 16 },
        { header: 'Estado Laboral', key: 'statusDisplay', width: 16 },
        { header: 'Fecha Ingreso', key: 'hire_date', width: 16 }
      ]

      return { columns, data: rows }
    }

    case 'export_asistencias_detalle': {
      // 1. Fetch Workers and Users map
      const [workersRes, usersRes] = await Promise.all([
        applyIsolation(
          supabase.from('workers').select('*, worker_personal(*), worker_financial(*)'),
          companyId,
          roleId
        ).order('name', { ascending: true }),
        applyIsolation(
          supabase.from('users').select('*'),
          companyId,
          roleId
        ).order('name', { ascending: true })
      ])

      const workerMap: Record<string, any> = {}

      ;(workersRes.data || []).forEach((w: any) => {
        const pers = Array.isArray(w.worker_personal) ? w.worker_personal[0] : w.worker_personal
        const effArea = w.area || pers?.area || 'General'
        if (area && area !== 'all' && !isAreaMatch(effArea, area)) return
        if (workerId && workerId !== 'all' && w.id !== workerId) return
        const doc = w.dni || w.document_number || w.documentNumber || pers?.dni || '-'

        workerMap[w.id] = {
          id: w.id,
          name: w.name || '',
          user_id: w.user_id || null,
          email: w.email || null,
          fullName: `${w.name || ''} ${w.last_name || ''}`.trim() || 'Colaborador',
          dni: doc,
          position: formatOfficialPosition(w.position),
          area: effArea
        }
      })

      ;(usersRes.data || []).forEach((u: any) => {
        const effArea = u.area || 'Administración'
        if (area && area !== 'all' && !isAreaMatch(effArea, area)) return
        if (workerId && workerId !== 'all' && u.id !== workerId) return

        const existingKey = Object.keys(workerMap).find(k => {
          const w = workerMap[k]
          return (w.user_id && w.user_id === u.id) ||
                 (u.email && w.email && w.email.toLowerCase() === u.email.toLowerCase()) ||
                 (u.name && w.fullName.toLowerCase().includes(u.name.toLowerCase().trim())) ||
                 (u.name && w.name && u.name.toLowerCase().trim().startsWith(w.name.toLowerCase().trim()))
        })

        if (existingKey) {
          if (u.role_id) workerMap[existingKey].position = formatOfficialPosition(u.role_id)
          if (u.area) workerMap[existingKey].area = u.area
          workerMap[u.id] = workerMap[existingKey]
          return
        }

        const doc = u.dni || u.document_number || '-'
        workerMap[u.id] = {
          id: u.id,
          name: u.name || '',
          user_id: u.id,
          email: u.email || null,
          fullName: u.name || u.email || 'Administrador',
          dni: doc,
          position: formatOfficialPosition(u.role_id),
          area: effArea
        }
      })

      // 2. Fetch logs and attendance
      let logsQ = applyIsolation(
        supabase.from('attendance_logs').select('worker_id, date_local, type, timestamp, latitude, longitude'),
        companyId,
        roleId
      ).order('timestamp', { ascending: true })
      if (startDate) logsQ = logsQ.gte('date_local', startDate)
      if (endDate) logsQ = logsQ.lte('date_local', endDate)
      if (workerId && workerId !== 'all') logsQ = logsQ.eq('worker_id', workerId)

      let attQ = applyIsolation(
        supabase.from('attendance').select('worker_id, date, check_in, break_start, break_end, check_out, status, minutes_late, extra_hours, is_extra'),
        companyId,
        roleId
      )
      if (startDate) attQ = attQ.gte('date', startDate)
      if (endDate) attQ = attQ.lte('date', endDate)
      if (workerId && workerId !== 'all') attQ = attQ.eq('worker_id', workerId)

      let tareoQ = applyIsolation(
        supabase.from('tareo_records').select('worker_id, date, status, is_manual'),
        companyId,
        roleId
      )
      if (startDate) tareoQ = tareoQ.gte('date', startDate)
      if (endDate) tareoQ = tareoQ.lte('date', endDate)
      if (workerId && workerId !== 'all') tareoQ = tareoQ.eq('worker_id', workerId)

      const [logsRes, attRes, tareoRes] = await Promise.all([logsQ, attQ, tareoQ])

      const formatTime = (val: string | null | undefined, fallback = '-') => {
        if (!val) return fallback
        if (val.includes('T')) {
          try {
            const d = new Date(val)
            return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' })
          } catch {
            return val
          }
        }
        if (val.includes(':')) {
          const parts = val.split(':')
          return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
        }
        return val
      }

      const dayMarks: Record<string, any> = {}

      // Hydrate from tareo
      ;(tareoRes.data || []).forEach((t: any) => {
        const canonicalWorker = workerMap[t.worker_id]
        if (!canonicalWorker) return
        const key = `${canonicalWorker.id}_${t.date}`
        const rawStatus = (t.status || 'T').toUpperCase()
        let readableStatus = 'TRABAJADO'
        if (rawStatus === 'AC') readableStatus = 'ASISTENCIA COMPLETA (AC)'
        else if (rawStatus === 'T' || rawStatus === 'P') readableStatus = 'TRABAJADO (PRESENTE)'
        else if (rawStatus === 'PR') readableStatus = 'PRESENTE C/ REFRIGERIO (PR)'
        else if (rawStatus === 'D' || rawStatus === 'L') readableStatus = 'DESCANSO'
        else if (rawStatus === 'F') readableStatus = 'FALTA INJUSTIFICADA'
        else if (rawStatus === 'INC') readableStatus = 'INCOMPLETO'
        else if (rawStatus === 'AD') readableStatus = 'ADELANTO / PERMISO'
        else readableStatus = rawStatus

        dayMarks[key] = {
          date: t.date,
          worker: canonicalWorker,
          status: readableStatus,
          check_in: '-',
          break_start: '-',
          break_end: '-',
          check_out: '-',
          minutes_late: 0,
          extra_hours: 0
        }
      })

      // Hydrate from attendance
      ;(attRes.data || []).forEach((a: any) => {
        const canonicalWorker = workerMap[a.worker_id]
        if (!canonicalWorker) return
        const key = `${canonicalWorker.id}_${a.date}`
        const current = dayMarks[key] || {
          date: a.date,
          worker: canonicalWorker,
          status: a.status || (a.check_in ? 'PRESENTE' : 'FALTA'),
          check_in: '-',
          break_start: '-',
          break_end: '-',
          check_out: '-',
          minutes_late: Number(a.minutes_late) || 0,
          extra_hours: Number(a.extra_hours) || 0
        }

        if (a.check_in) current.check_in = formatTime(a.check_in, '-')
        if (a.break_start) current.break_start = formatTime(a.break_start, '-')
        if (a.break_end) current.break_end = formatTime(a.break_end, '-')
        if (a.check_out) current.check_out = formatTime(a.check_out, '-')
        if (a.minutes_late) current.minutes_late = Number(a.minutes_late)
        if (a.extra_hours) current.extra_hours = Number(a.extra_hours)
        if (!dayMarks[key] && a.status) current.status = a.status

        dayMarks[key] = current
      })

      // Hydrate from attendance_logs (GPS stamps)
      ;(logsRes.data || []).forEach((log: any) => {
        const canonicalWorker = workerMap[log.worker_id]
        if (!canonicalWorker) return
        const key = `${canonicalWorker.id}_${log.date_local}`
        const current = dayMarks[key] || {
          date: log.date_local,
          worker: canonicalWorker,
          status: 'PRESENTE',
          check_in: '-',
          break_start: '-',
          break_end: '-',
          check_out: '-',
          minutes_late: 0,
          extra_hours: 0
        }

        const logType = (log.type || '').toLowerCase()
        const formattedStamp = formatTime(log.timestamp, '-')

        if (logType === 'in' || logType === 'check_in') {
          if (current.check_in === '-' || formattedStamp < current.check_in) current.check_in = formattedStamp
        } else if (logType === 'break_start') {
          if (current.break_start === '-' || formattedStamp < current.break_start) current.break_start = formattedStamp
        } else if (logType === 'break_end') {
          if (current.break_end === '-' || formattedStamp > current.break_end) current.break_end = formattedStamp
        } else if (logType === 'out' || logType === 'check_out') {
          if (current.check_out === '-' || formattedStamp > current.check_out) current.check_out = formattedStamp
        }

        if (!dayMarks[key]) {
          if (current.check_in !== '-' && current.check_out !== '-') current.status = 'ASISTENCIA COMPLETA (AC)'
          else if (current.check_in !== '-' && current.break_start !== '-' && current.break_end === '-') current.status = 'PRESENTE C/ REFRIGERIO (PR)'
          else if (current.check_in !== '-') current.status = 'PRESENTE (P)'
        }

        dayMarks[key] = current
      })

      let rows = Object.values(dayMarks)

      // Fallback: If no records exist, list workers with status
      if (rows.length === 0 && Object.keys(workerMap).length > 0) {
        const fallbackDate = startDate || new Date().toISOString().split('T')[0]
        rows = Object.values(workerMap).map((w: any) => ({
          date: fallbackDate,
          worker: w,
          status: 'SIN REGISTRO',
          check_in: '-',
          break_start: '-',
          break_end: '-',
          check_out: '-',
          minutes_late: 0,
          extra_hours: 0
        }))
      }

      if (status === 'tardanza') {
        rows = rows.filter((r: any) => (Number(r.minutes_late) || 0) > 0)
      } else if (status === 'presente') {
        rows = rows.filter((r: any) => r.check_in !== '-' || (r.status || '').includes('PRESENTE') || (r.status || '').includes('ASISTENCIA') || (r.status || '').includes('TRABAJADO'))
      } else if (status === 'falta') {
        rows = rows.filter((r: any) => (r.status || '').includes('FALTA'))
      }

      rows.sort((a, b) => b.date.localeCompare(a.date) || a.worker.fullName.localeCompare(b.worker.fullName))

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha', key: 'date', width: 14 },
        { header: 'DNI / Doc', key: 'dni', width: 14 },
        { header: 'Trabajador', key: 'workerName', width: 28 },
        { header: 'Área', key: 'area', width: 18 },
        { header: 'Cargo / Función', key: 'position', width: 22 },
        { header: 'Hora Entrada', key: 'check_in', width: 15 },
        { header: 'Inicio Refrigerio', key: 'break_start', width: 16 },
        { header: 'Fin Refrigerio', key: 'break_end', width: 16 },
        { header: 'Hora Salida', key: 'check_out', width: 15 },
        { header: 'Tardanza (Min)', key: 'minutes_late', width: 16 },
        { header: 'Horas Extras', key: 'extra_hours', width: 14 },
        { header: 'Estado / Marcación', key: 'status', width: 24 }
      ]

      const formatted = rows.map((r: any) => ({
        date: r.date,
        dni: r.worker?.dni || '-',
        workerName: r.worker?.fullName || 'Trabajador',
        area: r.worker?.area || '-',
        position: r.worker?.position || '-',
        check_in: r.check_in || '-',
        break_start: r.break_start || '-',
        break_end: r.break_end || '-',
        check_out: r.check_out || '-',
        minutes_late: Number(r.minutes_late) || 0,
        extra_hours: Number(r.extra_hours) || 0,
        status: r.status || 'REGISTRADO'
      }))

      return { columns, data: formatted }
    }

    case 'export_bonos_transportes': {
      // 1. Fetch Workers Map & Payment Records
      const [workersRes, usersRes, bonusesRes, transportRes, paymentsRes] = await Promise.all([
        applyIsolation(
          supabase.from('workers').select('id, user_id, name, last_name, dni, document_number, position, area, worker_personal(area, dni)'),
          companyId,
          roleId
        ),
        applyIsolation(
          supabase.from('users').select('id, name, email, area, role_id'),
          companyId,
          roleId
        ),
        applyIsolation(
          supabase.from('bonuses').select('*'),
          companyId,
          roleId
        ),
        applyIsolation(
          supabase.from('transport_payments').select('*'),
          companyId,
          roleId
        ),
        applyIsolation(
          supabase.from('worker_payments').select('*'),
          companyId,
          roleId
        )
      ])

      const workerMap: Record<string, any> = {}
      ;(workersRes.data || []).forEach((w: any) => {
        const pers = Array.isArray(w.worker_personal) ? w.worker_personal[0] : w.worker_personal
        const fullName = `${w.name || ''} ${w.last_name || ''}`.trim() || 'Colaborador'
        const doc = w.dni || w.document_number || pers?.dni || '-'
        const effArea = w.area || pers?.area || 'General'

        const info = {
          id: w.id,
          fullName,
          dni: doc,
          area: effArea,
          position: formatOfficialPosition(w.position)
        }
        workerMap[w.id] = info
        if (w.user_id) workerMap[w.user_id] = info
      })

      ;(usersRes.data || []).forEach((u: any) => {
        if (!workerMap[u.id]) {
          workerMap[u.id] = {
            id: u.id,
            fullName: u.name || u.email || 'Administrador',
            dni: '-',
            area: u.area || 'Administración',
            position: formatOfficialPosition(u.role_id)
          }
        }
      })

      const listBonos = (conceptType === 'transporte') ? [] : (bonusesRes.data || []).map((b: any) => {
        const w = workerMap[b.worker_id] || { fullName: 'Colaborador', dni: '-', area: 'General' }
        return {
          type: 'BONIFICACIÓN',
          date: b.date || b.payment_date || b.created_at?.split('T')[0] || '-',
          dni: w.dni,
          workerName: w.fullName,
          area: w.area,
          concept: b.bonus_type || b.reason || b.concept || 'Bono de Producción',
          amount: Number(b.amount) || 0,
          status: (b.status === 'paid' || b.status === 'pagado') ? 'PAGADO' : 'PENDIENTE'
        }
      })

      const listTransport = (conceptType === 'bono') ? [] : (transportRes.data || []).map((t: any) => {
        const w = workerMap[t.worker_id] || { fullName: 'Colaborador', dni: '-', area: 'General' }
        return {
          type: 'PASAJE / TRANSPORTE',
          date: t.date || t.payment_date || t.created_at?.split('T')[0] || '-',
          dni: w.dni,
          workerName: w.fullName,
          area: w.area,
          concept: (t.origin && t.destination) ? `${t.origin} -> ${t.destination}` : (t.concept || t.reason || 'Pasaje de Traslado'),
          amount: Number(t.amount) || 0,
          status: (t.status === 'paid' || t.status === 'pagado') ? 'PAGADO' : 'PENDIENTE'
        }
      })

      const paymentTypeLabels: any = {
        salary: 'Sueldo / Planilla',
        advance: 'Adelanto de Sueldo',
        liquidation: 'Liquidación Laboral',
        extra: 'Pago Extraordinario'
      }

      const listPayments = (paymentsRes.data || []).map((p: any) => {
        const w = workerMap[p.worker_id] || { fullName: 'Colaborador', dni: '-', area: 'General' }
        return {
          type: 'PAGO / PLANILLA',
          date: p.date || p.payment_date || p.created_at?.split('T')[0] || '-',
          dni: w.dni,
          workerName: w.fullName,
          area: w.area,
          concept: `${paymentTypeLabels[p.payment_type] || 'Pago'} (${p.period || 'Periodo'})`,
          amount: Number(p.amount) || 0,
          status: (p.status === 'paid' || p.status === 'pagado') ? 'PAGADO' : 'PENDIENTE'
        }
      })

      let rows = [...listBonos, ...listTransport, ...listPayments]

      if (workerId && workerId !== 'all') {
        const targetWorker = workerMap[workerId]
        if (targetWorker) {
          rows = rows.filter(r => r.workerName === targetWorker.fullName || r.dni === targetWorker.dni)
        }
      }

      if (startDate) rows = rows.filter(r => r.date === '-' || r.date >= startDate)
      if (endDate) rows = rows.filter(r => r.date === '-' || r.date <= endDate)
      if (area && area !== 'all') rows = rows.filter(r => isAreaMatch(r.area, area))
      if (status && status !== 'all') rows = rows.filter(r => r.status.toLowerCase().includes(status.toLowerCase()))

      rows.sort((a, b) => b.date.localeCompare(a.date) || a.workerName.localeCompare(b.workerName))

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha', key: 'date', width: 14 },
        { header: 'Tipo Concepto', key: 'type', width: 22 },
        { header: 'DNI / Doc', key: 'dni', width: 14 },
        { header: 'Trabajador', key: 'workerName', width: 28 },
        { header: 'Área', key: 'area', width: 18 },
        { header: 'Detalle / Motivo', key: 'concept', width: 32 },
        { header: 'Monto (S/)', key: 'amount', width: 16 },
        { header: 'Estado', key: 'status', width: 14 }
      ]

      return { columns, data: rows }
    }

    case 'export_entregas_epp': {
      const [workersRes, usersRes, ppeRes] = await Promise.all([
        applyIsolation(
          supabase.from('workers').select('id, user_id, name, last_name, dni, document_number, position, area, worker_personal(area, dni)'),
          companyId,
          roleId
        ),
        applyIsolation(
          supabase.from('users').select('id, name, email, area, role_id'),
          companyId,
          roleId
        ),
        applyIsolation(
          supabase.from('ppe_deliveries').select('*'),
          companyId,
          roleId
        ).order('delivery_date', { ascending: false })
      ])

      const workerMap: Record<string, any> = {}
      ;(workersRes.data || []).forEach((w: any) => {
        const pers = Array.isArray(w.worker_personal) ? w.worker_personal[0] : w.worker_personal
        const fullName = `${w.name || ''} ${w.last_name || ''}`.trim() || 'Colaborador'
        const doc = w.dni || w.document_number || pers?.dni || '-'
        const effArea = w.area || pers?.area || 'General'

        const info = {
          id: w.id,
          fullName,
          dni: doc,
          position: formatOfficialPosition(w.position),
          area: effArea
        }
        workerMap[w.id] = info
        if (w.user_id) workerMap[w.user_id] = info
      })

      ;(usersRes.data || []).forEach((u: any) => {
        if (!workerMap[u.id]) {
          workerMap[u.id] = {
            id: u.id,
            fullName: u.name || u.email || 'Administrador',
            dni: '-',
            position: formatOfficialPosition(u.role_id),
            area: u.area || 'Administración'
          }
        }
      })

      let rows = (ppeRes.data || []).map((e: any) => {
        const w = workerMap[e.worker_id] || { fullName: 'Colaborador', dni: '-', position: '-', area: 'General' }
        const summary = e.ppe_type || 
                        (Array.isArray(e.items) ? e.items.map((i: any) => `${i.name || i.item} (${i.quantity || 1})`).join(', ') : null) || 
                        e.item || 
                        e.items_detail || 
                        'Equipo de Protección Personal'

        const isSigned = e.status === 'signed' || !!e.signature_url

        return {
          delivery_date: e.delivery_date || e.created_at?.split('T')[0] || '-',
          dni: w.dni,
          workerName: w.fullName,
          area: w.area,
          position: w.position,
          itemsSummary: summary,
          signed: isSigned ? 'FIRMADO DIGITAL' : 'PENDIENTE DE FIRMA'
        }
      })

      if (workerId && workerId !== 'all') {
        const targetWorker = workerMap[workerId]
        if (targetWorker) {
          rows = rows.filter((r: any) => r.workerName === targetWorker.fullName || r.dni === targetWorker.dni)
        }
      }

      if (startDate) rows = rows.filter((r: any) => r.delivery_date === '-' || r.delivery_date >= startDate)
      if (endDate) rows = rows.filter((r: any) => r.delivery_date === '-' || r.delivery_date <= endDate)
      if (area && area !== 'all') rows = rows.filter((r: any) => isAreaMatch(r.area, area))
      if (status === 'signed') rows = rows.filter((r: any) => r.signed.includes('FIRMADO'))
      if (status === 'pending') rows = rows.filter((r: any) => r.signed.includes('PENDIENTE'))

      rows.sort((a: any, b: any) => b.delivery_date.localeCompare(a.delivery_date) || a.workerName.localeCompare(b.workerName))

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha Entrega', key: 'delivery_date', width: 16 },
        { header: 'DNI / Doc', key: 'dni', width: 14 },
        { header: 'Trabajador', key: 'workerName', width: 28 },
        { header: 'Área', key: 'area', width: 18 },
        { header: 'Cargo', key: 'position', width: 20 },
        { header: 'Implementos Entregados', key: 'itemsSummary', width: 40 },
        { header: 'Firma Conforme', key: 'signed', width: 18 }
      ]

      return { columns, data: rows }
    }

    // ==========================================
    // MINA Y OPERACIONES (MINA)
    // ==========================================
    case 'export_produccion_mina': {
      let q = applyIsolation(
        supabase.from('production_control').select('*'),
        companyId,
        roleId
      )
      if (startDate) q = q.gte('date', startDate)
      if (endDate) q = q.lte('date', endDate)
      if (shift && shift !== 'all') q = q.eq('shift', shift)

      const { data } = await q.order('date', { ascending: false })

      let rows = data || []
      if (search) {
        rows = rows.filter((p: any) =>
          (p.workplace || '').toLowerCase().includes(search) ||
          (p.shift_supervisor || '').toLowerCase().includes(search) ||
          (p.observations || '').toLowerCase().includes(search)
        )
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha', key: 'date', width: 14 },
        { header: 'Turno', key: 'shift', width: 12 },
        { header: 'Labor / Frente', key: 'workplace', width: 24 },
        { header: 'Avance (m)', key: 'advance_meters', width: 16 },
        { header: 'Dumper Mineral', key: 'dumper_mineral', width: 16 },
        { header: 'Dumper Desmonte', key: 'dumper_waste', width: 16 },
        { header: 'Clavos', key: 'nails_qty', width: 12 },
        { header: 'Cambuchos', key: 'cambuchos', width: 12 },
        { header: 'Chocolate', key: 'chocolate_qty', width: 12 },
        { header: 'Supervisor Turno', key: 'shift_supervisor', width: 24 },
        { header: 'Observaciones', key: 'observations', width: 32 }
      ]

      const formatted = rows.map((p: any) => ({
        date: p.date,
        shift: p.shift?.toUpperCase() || 'DÍA',
        workplace: p.workplace || '-',
        advance_meters: p.advance_meters || '-',
        dumper_mineral: p.dumper_mineral || '-',
        dumper_waste: p.dumper_waste || '-',
        nails_qty: Number(p.nails_qty) || 0,
        cambuchos: Number(p.cambuchos) || 0,
        chocolate_qty: Number(p.chocolate_qty) || 0,
        shift_supervisor: p.shift_supervisor || 'Supervisor',
        observations: p.observations || ''
      }))

      return { columns, data: formatted }
    }

    case 'export_maderas_mina': {
      let q = applyIsolation(
        supabase.from('wood_control').select('*'),
        companyId,
        roleId
      )
      if (startDate) q = q.gte('date', startDate)
      if (endDate) q = q.lte('date', endDate)
      if (warehouseId && warehouseId !== 'all') q = q.eq('warehouse_id', warehouseId)
      if (shift && shift !== 'all') q = q.eq('shift', shift)

      const { data } = await q.order('date', { ascending: false })

      let rows = data || []
      if (search) {
        rows = rows.filter((w: any) => (w.workplace || '').toLowerCase().includes(search))
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha', key: 'date', width: 14 },
        { header: 'Turno', key: 'shift', width: 12 },
        { header: 'Labor / Frente', key: 'workplace', width: 24 },
        { header: 'Tablas 2" (Pzas)', key: 'boards_2in', width: 18 },
        { header: 'Rajas (Pzas)', key: 'rajas', width: 16 },
        { header: 'Puntal 8" (Pzas)', key: 'strut_8in', width: 18 },
        { header: 'Puntal 6" (Pzas)', key: 'strut_6in', width: 18 },
        { header: 'Puntal 4" (Pzas)', key: 'strut_4in', width: 18 },
        { header: 'Otros Detalles', key: 'others', width: 26 }
      ]

      const formatted = rows.map((w: any) => ({
        date: w.date,
        shift: w.shift?.toUpperCase() || 'DÍA',
        workplace: w.workplace || '-',
        boards_2in: Number(w.boards_2in) || 0,
        rajas: Number(w.rajas) || 0,
        strut_8in: Number(w.strut_8in) || 0,
        strut_6in: Number(w.strut_6in) || 0,
        strut_4in: Number(w.strut_4in) || 0,
        others: w.others || '-'
      }))

      return { columns, data: formatted }
    }

    case 'export_mantenimientos_equipos': {
      let q = applyIsolation(
        supabase.from('assets').select('*'),
        companyId,
        roleId
      )
      if (status && status !== 'all') q = q.eq('status', status)

      const { data } = await q.order('name', { ascending: true })

      let rows = data || []
      if (search) {
        rows = rows.filter((a: any) =>
          (a.name || '').toLowerCase().includes(search) ||
          (a.code || '').toLowerCase().includes(search) ||
          (a.brand || '').toLowerCase().includes(search) ||
          (a.model || '').toLowerCase().includes(search)
        )
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Código Activo', key: 'code', width: 16 },
        { header: 'Nombre del Equipo', key: 'name', width: 28 },
        { header: 'Categoría', key: 'type', width: 20 },
        { header: 'Marca y Modelo', key: 'brandModel', width: 24 },
        { header: 'N° Serie / Placa', key: 'serial_number', width: 20 },
        { header: 'Ubicación Actual', key: 'location', width: 22 },
        { header: 'Estado Operativo', key: 'status', width: 16 }
      ]

      const formatted = rows.map((a: any) => ({
        code: a.code || `EQ-${a.id?.substring(0, 4)}`,
        name: a.name || 'Maquinaria Mina',
        type: a.type || 'Equipo Pesado',
        brandModel: `${a.brand || ''} ${a.model || ''}`.trim() || 'N/A',
        serial_number: a.serial_number || '-',
        location: a.location || 'Mina Principal',
        status: (a.status || 'OPERATIVO').toUpperCase()
      }))

      return { columns, data: formatted }
    }

    case 'export_control_combustible': {
      let q = applyIsolation(
        supabase.from('fuel_logs').select('*'),
        companyId,
        roleId
      )
      if (startDate) q = q.gte('date', startDate)
      if (endDate) q = q.lte('date', endDate)

      const { data } = await q.order('date', { ascending: false })

      let rows = data || []
      if (search) {
        rows = rows.filter((f: any) =>
          (f.equipment_name || '').toLowerCase().includes(search) ||
          (f.operator_name || '').toLowerCase().includes(search) ||
          (f.observations || '').toLowerCase().includes(search)
        )
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha', key: 'date', width: 14 },
        { header: 'Equipo / Maquinaria', key: 'equipment_name', width: 28 },
        { header: 'Tipo Combustible', key: 'fuel_type', width: 18 },
        { header: 'Galones Suministrados', key: 'gallons', width: 20 },
        { header: 'Horómetro / Odómetro', key: 'hourmeter', width: 20 },
        { header: 'Operador / Conductor', key: 'operator_name', width: 26 },
        { header: 'Observaciones', key: 'observations', width: 32 }
      ]

      const formatted = rows.map((f: any) => ({
        date: f.date || f.created_at?.split('T')[0],
        equipment_name: f.equipment_name || f.asset_name || 'Equipo Mina',
        fuel_type: (f.fuel_type || 'DIESEL D-B5').toUpperCase(),
        gallons: Number(f.gallons || f.quantity) || 0,
        hourmeter: f.hourmeter || f.mileage || '-',
        operator_name: f.operator_name || 'Operador de Turno',
        observations: f.observations || ''
      }))

      return { columns, data: formatted }
    }

    case 'export_checklists_equipos': {
      let q = applyIsolation(
        supabase.from('equipment_checklists').select('*'),
        companyId,
        roleId
      )
      if (startDate) q = q.gte('date', startDate)
      if (endDate) q = q.lte('date', endDate)
      if (status && status !== 'all') q = q.eq('status', status)

      const { data } = await q.order('date', { ascending: false })

      let rows = data || []
      if (search) {
        rows = rows.filter((c: any) =>
          (c.equipment_name || '').toLowerCase().includes(search) ||
          (c.inspector_name || '').toLowerCase().includes(search)
        )
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha Inspección', key: 'date', width: 16 },
        { header: 'Equipo Inspeccionado', key: 'equipment_name', width: 28 },
        { header: 'Inspector / Responsable', key: 'inspector_name', width: 24 },
        { header: 'Turno', key: 'shift', width: 14 },
        { header: 'Resultado / Condición', key: 'statusDisplay', width: 22 },
        { header: 'Observaciones / Hallazgos', key: 'observations', width: 36 }
      ]

      const formatted = rows.map((c: any) => ({
        date: c.date || c.created_at?.split('T')[0],
        equipment_name: c.equipment_name || 'Maquinaria',
        inspector_name: c.inspector_name || 'Supervisor Mina',
        shift: (c.shift || 'DÍA').toUpperCase(),
        statusDisplay: (c.status || 'CONFORME').toUpperCase(),
        observations: c.observations || 'Sin observaciones críticas'
      }))

      return { columns, data: formatted }
    }

    case 'export_herramientas_taller': {
      let q = applyIsolation(
        supabase.from('workshop_tools').select('*'),
        companyId,
        roleId
      )
      if (status && status !== 'all') q = q.eq('status', status)

      const { data } = await q.order('name', { ascending: true })

      let rows = data || []
      if (search) {
        rows = rows.filter((t: any) =>
          (t.name || '').toLowerCase().includes(search) ||
          (t.code || '').toLowerCase().includes(search) ||
          (t.brand || '').toLowerCase().includes(search) ||
          (t.assigned_to || '').toLowerCase().includes(search)
        )
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Código Herramienta', key: 'code', width: 18 },
        { header: 'Nombre / Descripción', key: 'name', width: 30 },
        { header: 'Marca / Modelo', key: 'brand', width: 20 },
        { header: 'Custodio / Asignado A', key: 'assigned_to', width: 24 },
        { header: 'Ubicación / Taller', key: 'location', width: 20 },
        { header: 'Estado / Condición', key: 'statusDisplay', width: 18 }
      ]

      const formatted = rows.map((t: any) => ({
        code: t.code || `HERR-${t.id?.substring(0, 4)}`,
        name: t.name || 'Herramienta Mecánica',
        brand: t.brand || '-',
        assigned_to: t.assigned_to || 'Taller Central',
        location: t.location || 'Pañol Mina',
        statusDisplay: (t.status || 'OPERATIVO').toUpperCase()
      }))

      return { columns, data: formatted }
    }

    // ==========================================
    // CENTRO LOGÍSTICO (LOGÍSTICA)
    // ==========================================
    case 'export_catalogo_productos': {
      let q = applyIsolation(
        supabase.from('products').select('*, inventory_stock(quantity, warehouse_id)'),
        companyId,
        roleId
      )

      if (status && status !== 'all') {
        q = q.eq('status', status)
      }

      const { data } = await q.order('name', { ascending: true })

      let rows = (data || []).map((p: any) => {
        let totalStock = 0
        if (Array.isArray(p.inventory_stock)) {
          totalStock = p.inventory_stock.reduce((acc: number, s: any) => {
            if (warehouseId && warehouseId !== 'all' && s.warehouse_id !== warehouseId) return acc
            return acc + (Number(s.quantity) || 0)
          }, 0)
        }

        return {
          code: p.code || '-',
          name: p.name || 'Producto',
          description: p.description || '-',
          category: p.category || 'General',
          unit: p.unit || 'UND',
          min_stock: Number(p.min_stock) || 0,
          totalStock,
          statusDisplay: (p.status || 'ACTIVO').toUpperCase()
        }
      })

      if (search) {
        rows = rows.filter((p: any) =>
          p.code.toLowerCase().includes(search) ||
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
        )
      }

      if (stockCondition === 'with_stock') {
        rows = rows.filter((p: any) => p.totalStock > 0)
      } else if (stockCondition === 'no_stock') {
        rows = rows.filter((p: any) => p.totalStock <= 0)
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Código SKU', key: 'code', width: 16 },
        { header: 'Nombre del Producto', key: 'name', width: 30 },
        { header: 'Descripción', key: 'description', width: 34 },
        { header: 'Rubro / Categoría', key: 'category', width: 20 },
        { header: 'Unidad Medida', key: 'unit', width: 14 },
        { header: 'Stock Actual', key: 'totalStock', width: 16 },
        { header: 'Stock Mínimo', key: 'min_stock', width: 16 },
        { header: 'Estado', key: 'statusDisplay', width: 16 }
      ]

      return { columns, data: rows }
    }

    case 'export_stock_actual': {
      const { data: stockData } = await applyIsolation(
        supabase.from('inventory_stock').select('*, products(name, code, category, unit, min_stock), warehouses(name)'),
        companyId,
        roleId
      )

      let rows = (stockData || []).map((s: any) => {
        const qty = Number(s.quantity) || 0
        const min = Number(s.products?.min_stock) || 0
        let condition = 'NORMAL'

        if (qty === 0) condition = 'AGOTADO'
        else if (qty <= min) condition = 'CRÍTICO'
        else if (qty <= min * 1.5) condition = 'BAJO'

        return {
          code: s.products?.code || '-',
          productName: s.products?.name || 'Producto',
          category: s.products?.category || 'General',
          unit: s.products?.unit || 'UND',
          warehouseName: s.warehouses?.name || 'Almacén Central',
          warehouseId: s.warehouse_id,
          quantity: qty,
          minStock: min,
          condition
        }
      })

      if (warehouseId && warehouseId !== 'all') {
        rows = rows.filter((r: any) => r.warehouseId === warehouseId)
      }
      if (search) {
        rows = rows.filter((r: any) =>
          r.code.toLowerCase().includes(search) ||
          r.productName.toLowerCase().includes(search) ||
          r.category.toLowerCase().includes(search)
        )
      }
      if (status && status !== 'all') {
        if (status === 'normal') rows = rows.filter((r: any) => r.condition === 'NORMAL')
        else if (status === 'low') rows = rows.filter((r: any) => r.condition === 'BAJO')
        else if (status === 'critical') rows = rows.filter((r: any) => r.condition === 'CRÍTICO')
        else if (status === 'out_of_stock') rows = rows.filter((r: any) => r.condition === 'AGOTADO')
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Código SKU', key: 'code', width: 16 },
        { header: 'Descripción del Producto', key: 'productName', width: 32 },
        { header: 'Rubro / Categoría', key: 'category', width: 20 },
        { header: 'Unidad', key: 'unit', width: 12 },
        { header: 'Almacén', key: 'warehouseName', width: 22 },
        { header: 'Stock Físico', key: 'quantity', width: 16 },
        { header: 'Stock Mínimo', key: 'minStock', width: 16 },
        { header: 'Estado Existencia', key: 'condition', width: 18 }
      ]

      return { columns, data: rows }
    }

    case 'export_kardex_general': {
      let q = applyIsolation(
        supabase.from('inventory_movements').select('*, products(name, code, unit, category), warehouses(name), users(name)'),
        companyId,
        roleId
      )
      if (startDate) q = q.gte('created_at', startDate)
      if (endDate) q = q.lte('created_at', endDate + 'T23:59:59')
      if (warehouseId && warehouseId !== 'all') q = q.eq('warehouse_id', warehouseId)
      if (status && status !== 'all') q = q.eq('type', status)

      const { data } = await q.order('created_at', { ascending: true })

      let rows = (data || []).map((m: any) => ({
        createdAt: new Date(m.created_at).toLocaleString('es-PE', { timeZone: timezone }),
        code: m.products?.code || '-',
        productName: m.products?.name || '-',
        category: m.products?.category || 'General',
        type: m.type?.toUpperCase() || 'MOVIMIENTO',
        effect: m.effect === 'add' ? 'ENTRADA (+)' : 'SALIDA (-)',
        quantity: Number(m.quantity) || 0,
        unit: m.products?.unit || 'UND',
        warehouse: m.warehouses?.name || 'Almacén',
        doc: (m.document_type && m.document_number) ? `${m.document_type} ${m.document_number}` : (m.document_number || '-'),
        responsible: m.responsible_name || m.users?.name || 'Sistema',
        observation: m.observation || ''
      }))

      if (search) {
        rows = rows.filter((r: any) =>
          r.code.toLowerCase().includes(search) ||
          r.productName.toLowerCase().includes(search) ||
          r.doc.toLowerCase().includes(search) ||
          r.responsible.toLowerCase().includes(search)
        )
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha y Hora', key: 'createdAt', width: 20 },
        { header: 'Código SKU', key: 'code', width: 16 },
        { header: 'Producto', key: 'productName', width: 30 },
        { header: 'Rubro / Cat.', key: 'category', width: 18 },
        { header: 'Tipo Movimiento', key: 'type', width: 16 },
        { header: 'Efecto', key: 'effect', width: 14 },
        { header: 'Cantidad', key: 'quantity', width: 14 },
        { header: 'Unidad', key: 'unit', width: 12 },
        { header: 'Almacén', key: 'warehouse', width: 20 },
        { header: 'Documento / N° Op', key: 'doc', width: 22 },
        { header: 'Responsable', key: 'responsible', width: 24 },
        { header: 'Observación', key: 'observation', width: 32 }
      ]

      return { columns, data: rows }
    }

    // ==========================================
    // FINANZAS Y GESTIÓN (FINANZAS)
    // ==========================================
    case 'export_caja_chica_oficial': {
      let q = applyIsolation(
        supabase.from('petty_cash_transactions').select('*, users(name)'),
        companyId,
        roleId
      )
      if (startDate) q = q.gte('date', startDate)
      if (endDate) q = q.lte('date', endDate)
      if (area && area !== 'all') q = q.eq('area', area)
      if (status && status !== 'all') q = q.eq('type', status)
      if (paymentMethod && paymentMethod !== 'all') q = q.eq('payment_method', paymentMethod)

      const { data } = await q.order('date', { ascending: true })

      let runningBalance = 0
      let rows = (data || []).map((t: any) => {
        const amt = Number(t.amount) || 0
        const isIngreso = t.type === 'ingreso'
        if (isIngreso) runningBalance += amt
        else runningBalance -= amt

        return {
          date: t.date,
          type: isIngreso ? 'INGRESO' : 'EGRESO',
          area: t.area || 'Caja Principal',
          category: (t.category || 'General').toUpperCase(),
          reason: t.reason || '-',
          payment_method: (t.payment_method || 'EFECTIVO').toUpperCase(),
          operation_number: t.operation_number ? `OP-${t.operation_number}` : (t.voucher_url ? 'Con Comprobante' : '-'),
          responsible: t.users?.name || 'Sistema',
          ingreso: isIngreso ? amt : 0,
          egreso: !isIngreso ? amt : 0,
          balance: runningBalance
        }
      })

      if (search) {
        rows = rows.filter((r: any) =>
          r.reason.toLowerCase().includes(search) ||
          r.operation_number.toLowerCase().includes(search) ||
          r.responsible.toLowerCase().includes(search)
        )
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha', key: 'date', width: 14 },
        { header: 'Tipo Flujo', key: 'type', width: 14 },
        { header: 'Caja / Área', key: 'area', width: 18 },
        { header: 'Categoría', key: 'category', width: 18 },
        { header: 'Concepto / Motivo', key: 'reason', width: 36 },
        { header: 'Método Pago', key: 'payment_method', width: 16 },
        { header: 'N° Operación / Comp.', key: 'operation_number', width: 22 },
        { header: 'Responsable', key: 'responsible', width: 24 },
        { header: 'Ingreso (S/)', key: 'ingreso', width: 16 },
        { header: 'Egreso (S/)', key: 'egreso', width: 16 },
        { header: 'Saldo Acum. (S/)', key: 'balance', width: 18 }
      ]

      return { columns, data: rows }
    }

    case 'export_requerimientos_consolidado': {
      let q = applyIsolation(
        supabase.from('requirements').select('*, users!created_by(name)'),
        companyId,
        roleId
      )
      if (startDate) q = q.gte('created_at', startDate)
      if (endDate) q = q.lte('created_at', endDate + 'T23:59:59')
      if (area && area !== 'all') q = q.eq('area', area)
      if (status && status !== 'all') q = q.eq('status', status)
      if (priority && priority !== 'all') q = q.eq('priority', priority)

      const { data } = await q.order('created_at', { ascending: false })

      let rows = (data || []).map((r: any) => ({
        createdAt: r.created_at?.split('T')[0],
        title: r.title || 'Requerimiento de Compra',
        area: r.area || 'Mina',
        priority: (r.priority || 'MEDIA').toUpperCase(),
        status: (r.status || 'PENDIENTE').toUpperCase(),
        requester: r.users?.name || 'Personal Operativo',
        itemsDetail: Array.isArray(r.items) ? r.items.map((i: any) => `${i.description || i.name} (${i.quantity || 1} ${i.unit || 'und'})`).join(', ') : JSON.stringify(r.items || '')
      }))

      if (search) {
        rows = rows.filter((r: any) =>
          r.title.toLowerCase().includes(search) ||
          r.itemsDetail.toLowerCase().includes(search) ||
          r.requester.toLowerCase().includes(search)
        )
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha', key: 'createdAt', width: 16 },
        { header: 'Título / Resumen', key: 'title', width: 30 },
        { header: 'Área Solicitante', key: 'area', width: 20 },
        { header: 'Prioridad', key: 'priority', width: 14 },
        { header: 'Estado', key: 'status', width: 16 },
        { header: 'Solicitante', key: 'requester', width: 24 },
        { header: 'Detalle Ítems', key: 'itemsDetail', width: 45 }
      ]

      return { columns, data: rows }
    }

    // ==========================================
    // SEGURIDAD Y SALUD OCUPACIONAL (SOMA)
    // ==========================================
    case 'export_soma_charlas': {
      let q = applyIsolation(
        supabase.from('soma_talks').select('*, leader:users!leader_id(name)'),
        companyId,
        roleId
      )
      if (startDate) q = q.gte('date', startDate)
      if (endDate) q = q.lte('date', endDate)
      if (area && area !== 'all') q = q.eq('target_area', area)

      const { data } = await q.order('date', { ascending: false })

      let rows = (data || []).map((t: any) => ({
        date: t.date,
        topic: t.topic || 'Charla de 5 Minutos',
        location: t.location || 'Superficie / Bocamina',
        target_area: t.target_area || 'Operaciones Mina',
        leader: t.leader?.name || 'Supervisor SOMA',
        attendees_count: Number(t.attendees_count) || 0
      }))

      if (search) {
        rows = rows.filter((r: any) => r.topic.toLowerCase().includes(search) || r.leader.toLowerCase().includes(search))
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha', key: 'date', width: 14 },
        { header: 'Tema / Tópico de Charla', key: 'topic', width: 36 },
        { header: 'Ubicación / Frente', key: 'location', width: 24 },
        { header: 'Área Objetivo', key: 'target_area', width: 20 },
        { header: 'Líder / Expositor', key: 'leader', width: 24 },
        { header: 'Asistentes Registrados', key: 'attendees_count', width: 20 }
      ]

      return { columns, data: rows }
    }

    case 'export_soma_capacitaciones': {
      let q = applyIsolation(
        supabase.from('soma_trainings').select('*'),
        companyId,
        roleId
      )
      if (startDate) q = q.gte('date', startDate)
      if (endDate) q = q.lte('date', endDate)

      const { data } = await q.order('date', { ascending: false })

      let rows = (data || []).map((c: any) => ({
        date: c.date,
        title: c.title || 'Capacitación Anual HSEC',
        trainer: c.trainer || 'Área de Seguridad',
        expiry_date: c.expiry_date || 'No vence',
        attendees_count: Number(c.attendees_count) || 0
      }))

      if (search) {
        rows = rows.filter((r: any) => r.title.toLowerCase().includes(search) || r.trainer.toLowerCase().includes(search))
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha', key: 'date', width: 14 },
        { header: 'Nombre Capacitación', key: 'title', width: 36 },
        { header: 'Instructor / Entidad', key: 'trainer', width: 26 },
        { header: 'Vencimiento / Vigencia', key: 'expiry_date', width: 20 },
        { header: 'Asistentes Acreditados', key: 'attendees_count', width: 22 }
      ]

      return { columns, data: rows }
    }

    case 'export_soma_incidencias': {
      let q = applyIsolation(
        supabase.from('incidencias').select('*, users!reported_by(name)'),
        companyId,
        roleId
      )
      if (startDate) q = q.gte('created_at', startDate)
      if (endDate) q = q.lte('created_at', endDate + 'T23:59:59')
      if (status && status !== 'all') q = q.eq('status', status)
      if (severity && severity !== 'all') q = q.eq('severity', severity)

      const { data } = await q.order('created_at', { ascending: false })

      let rows = (data || []).map((i: any) => ({
        createdAt: i.created_at?.split('T')[0],
        title: i.title || 'Incidencia HSEC',
        category: (i.category || 'SOMA').toUpperCase(),
        severity: (i.severity || 'MEDIA').toUpperCase(),
        status: (i.status || 'ABIERTA').toUpperCase(),
        reporter: i.users?.name || 'Personal de Turno',
        description: i.description || ''
      }))

      if (search) {
        rows = rows.filter((r: any) =>
          r.title.toLowerCase().includes(search) ||
          r.description.toLowerCase().includes(search) ||
          r.reporter.toLowerCase().includes(search)
        )
      }

      const columns = [
        { header: 'N°', key: '_index', width: 6 },
        { header: 'Fecha Reporte', key: 'createdAt', width: 16 },
        { header: 'Título Incidencia', key: 'title', width: 30 },
        { header: 'Categoría', key: 'category', width: 18 },
        { header: 'Severidad', key: 'severity', width: 16 },
        { header: 'Estado', key: 'status', width: 14 },
        { header: 'Reportado Por', key: 'reporter', width: 24 },
        { header: 'Descripción / Hallazgo', key: 'description', width: 40 }
      ]

      return { columns, data: rows }
    }

    default:
      return { columns: [], data: [] }
  }
}

/**
 * Vista previa rápida (Retorna X registros encontrados + top 5 filas para validación visual)
 */
export async function previewReportData(actionKey: string, filters: ExportFilterValues): Promise<ReportPreviewResult> {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    const timezone = await getCompanyTimezone(companyId)

    const result = await queryReportDataset(actionKey, filters, companyId, extendedUser.role_id, timezone)

    return {
      success: true,
      totalCount: result.data.length,
      columns: result.columns,
      sampleRows: result.data.slice(0, 5)
    }
  } catch (err: any) {
    console.error('[PREVIEW_REPORT_ERROR]:', err.message)
    return {
      success: false,
      totalCount: 0,
      columns: [],
      sampleRows: [],
      error: err.message
    }
  }
}

/**
 * Generación completa del reporte y registro de auditoría
 */
export async function fetchReportData(actionKey: string, filters: ExportFilterValues): Promise<ExportResult> {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    const timezone = await getCompanyTimezone(companyId)

    const result = await queryReportDataset(actionKey, filters, companyId, extendedUser.role_id, timezone)

    // Auditar la exportación
    await logExportAudit({
      companyId,
      userId: extendedUser.id,
      userName: extendedUser.display_name || extendedUser.email || 'Usuario',
      reportId: actionKey,
      reportTitle: actionKey.replace('export_', '').toUpperCase(),
      category: 'export-center',
      format: filters.format || 'excel',
      filters,
      recordsCount: result.data.length,
      status: 'success'
    })

    return {
      success: true,
      columns: result.columns,
      data: result.data
    }
  } catch (err: any) {
    console.error(`[FETCH_REPORT_ERROR]: Action ${actionKey}:`, err.message)
    return {
      success: false,
      columns: [],
      data: [],
      error: err.message
    }
  }
}

/**
 * Obtiene el historial reciente de auditoría de exportaciones
 */
export async function getExportAuditLogs(): Promise<ExportAuditItem[]> {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    const supabase = await createAdminClient()

    const { data } = await applyIsolation(
      supabase.from('export_audit_logs').select('*'),
      companyId,
      extendedUser.role_id
    ).order('created_at', { ascending: false }).limit(15)

    return (data || []).map((item: any) => ({
      id: item.id,
      userName: item.user_name || 'Usuario',
      reportId: item.report_id,
      reportTitle: item.report_title,
      category: item.category,
      format: item.format,
      filtersApplied: item.filters_applied || {},
      recordsCount: item.records_count || 0,
      status: item.status || 'success',
      createdAt: item.created_at
    }))
  } catch (err) {
    return []
  }
}
