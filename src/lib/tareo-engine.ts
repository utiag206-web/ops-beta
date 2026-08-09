import { CompanyAttendanceSettings, DEFAULT_HR_SETTINGS } from './company-hr-settings'

export interface DailyEvaluationResult {
  status: string
  isManual: boolean
  punchInTime: string | null
  punchOutTime: string | null
  breakStartTime?: string | null
  breakEndTime?: string | null
  tardinessMinutes: number
  earlyLeaveMinutes: number
  effectiveHours: number
  breakHours: number
  overtimeHours: number
  nightHours: number
  isLate: boolean
  isEarlyLeave: boolean
  isIncomplete: boolean
  punchesDetail?: Array<{
    type: string
    timestamp: string
    latitude?: number
    longitude?: number
    accuracy?: number
    address?: string
  }>
}

export interface WorkerMonthlySummary {
  workerId: string
  workerName: string
  position: string
  diasTrabajados: number
  diasLibres: number
  horasOrdinarias: number
  horasExtras: number
  horasEfectivas: number
  horasNocturnas: number
  horasRefrigerio: number
  minutosTardanza: number
  minutosSalidaAnticipada: number
  faltas: number
  vacaciones: number
  descansosMedicos: number
  suspensiones: number
  adelantos: number
  asistenciasCompletas: number
  diasIncompletos: number
  permisos: number
  totalDiasRegistrados: number
  totalHorasProgramadas: number
}

export interface ExecutiveTareoKPIs {
  totalTrabajadores: number
  presentesHoy: number
  ausentesHoy: number
  horasProgramadasMes: number
  horasEjecutadasMes: number
  diferenciaHorasMes: number
  horasEfectivasMes: number
  horasExtrasMes: number
  horasNocturnasMes: number
  horasRefrigerioMes: number
  minutosTardanzaAcumulados: number
  minutosSalidaAnticipadaAcumulados: number
  horasPerdidasTardanza: number
  porcentajeAsistencia: number
  porcentajePuntualidad: number
  porcentajeHorasEfectivas: number
  totalFaltas: number
  totalVacaciones: number
  totalDescansosMedicos: number
  totalSuspensiones: number
}

const REMUNERABLE_STATUSES = ['AD', 'AN', 'DL', 'C', 'DF', 'P']
const REST_STATUSES = ['L', 'DL', 'V']

/**
 * Redondea minutos según la regla configurada
 */
export function applyOvertimeRounding(minutes: number, roundingMode: 'NONE' | 'NEAREST_15' | 'NEAREST_30'): number {
  if (roundingMode === 'NONE' || minutes <= 0) return minutes
  const interval = roundingMode === 'NEAREST_15' ? 15 : 30
  return Math.round(minutes / interval) * interval
}

/**
 * Convierte string "HH:MM" o timestamp ISO a minutos transcurridos desde las 00:00
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  if (timeStr.includes('T')) {
    const d = new Date(timeStr)
    // Convert to America/Lima (UTC-5) minutes
    const hours = (d.getUTCHours() - 5 + 24) % 24
    return hours * 60 + d.getUTCMinutes()
  }
  const parts = timeStr.split(':')
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10)
}

/**
 * Evalúa las marcaciones reales o el estado manual de un trabajador en un día específico
 */
export function evaluateDailyAttendance(
  dateStr: string,
  manualRecord: { status: string; is_manual?: boolean } | null,
  punches: Array<{
    type: string
    timestamp: string
    latitude?: number
    longitude?: number
    accuracy?: number
    address?: string
  }>,
  settings: CompanyAttendanceSettings
): DailyEvaluationResult {
  const dailyHours = settings.daily_hours || 8
  const officialEntryMin = timeToMinutes(settings.entry_time || '08:30')
  const officialExitMin = timeToMinutes(settings.exit_time || '18:00')
  const nominalBreakMin = settings.break_time_minutes || 60
  const lateTolerance = settings.late_tolerance_minutes || 15
  const gracePeriod = settings.tardiness_grace_period_minutes || 5

  // Si hay un estado guardado manualmente en tareo_records (ej: V, DM, S, DL, F, P, etc.) y ES manual
  if (manualRecord && manualRecord.status && manualRecord.is_manual) {
    const status = manualRecord.status
    const isWork = REMUNERABLE_STATUSES.includes(status)
    return {
      status,
      isManual: true,
      punchInTime: null,
      punchOutTime: null,
      tardinessMinutes: 0,
      earlyLeaveMinutes: 0,
      effectiveHours: isWork ? dailyHours : 0,
      breakHours: isWork ? (nominalBreakMin / 60) : 0,
      overtimeHours: 0,
      nightHours: 0,
      isLate: false,
      isEarlyLeave: false,
      isIncomplete: false,
      punchesDetail: punches
    }
  }

  // Evaluación automática por marcaciones físicas / GPS
  const ins = punches.filter(p => p.type === 'in').sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const outs = punches.filter(p => p.type === 'out').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const breakStarts = punches.filter(p => p.type === 'break_start').sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const breakEnds = punches.filter(p => p.type === 'break_end').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (ins.length === 0 && outs.length === 0) {
    return {
      status: 'F',
      isManual: false,
      punchInTime: null,
      punchOutTime: null,
      tardinessMinutes: 0,
      earlyLeaveMinutes: 0,
      effectiveHours: 0,
      breakHours: 0,
      overtimeHours: 0,
      nightHours: 0,
      isLate: false,
      isEarlyLeave: false,
      isIncomplete: false,
      punchesDetail: punches
    }
  }

  const firstIn = ins[0] ? ins[0].timestamp : null
  const lastOut = outs[0] ? outs[0].timestamp : null

  let punchInMinutes = firstIn ? timeToMinutes(firstIn) : null
  let punchOutMinutes = lastOut ? timeToMinutes(lastOut) : null

  // Si solo hay ingreso o solo salida ➔ Incompleto
  if (!punchInMinutes || !punchOutMinutes) {
    return {
      status: 'INC',
      isManual: false,
      punchInTime: firstIn,
      punchOutTime: lastOut,
      tardinessMinutes: 0,
      earlyLeaveMinutes: 0,
      effectiveHours: dailyHours / 2,
      breakHours: 0,
      overtimeHours: 0,
      nightHours: 0,
      isLate: false,
      isEarlyLeave: false,
      isIncomplete: true
    }
  }

  // 1. Tardanza
  let tardinessMinutes = 0
  let isLate = false
  const allowedEntryThreshold = officialEntryMin + lateTolerance + gracePeriod
  if (punchInMinutes > allowedEntryThreshold) {
    tardinessMinutes = punchInMinutes - officialEntryMin
    isLate = true
  }

  // 2. Salida Anticipada
  let earlyLeaveMinutes = 0
  let isEarlyLeave = false
  if (punchOutMinutes < officialExitMin) {
    earlyLeaveMinutes = officialExitMin - punchOutMinutes
    isEarlyLeave = true
  }

  // 3. Horas de Refrigerio y Horas Efectivas
  let actualBreakMin = nominalBreakMin
  const firstBreakStart = breakStarts[0] ? breakStarts[0].timestamp : null
  const lastBreakEnd = breakEnds[0] ? breakEnds[0].timestamp : null
  if (firstBreakStart && lastBreakEnd) {
    const bsMin = timeToMinutes(firstBreakStart)
    const beMin = timeToMinutes(lastBreakEnd)
    if (beMin > bsMin) {
      actualBreakMin = beMin - bsMin
    }
  }

  const totalElapsedMinutes = Math.max(0, punchOutMinutes - punchInMinutes)
  const netWorkMinutes = Math.max(0, totalElapsedMinutes - actualBreakMin)
  const effectiveHours = parseFloat((netWorkMinutes / 60).toFixed(2))

  // 4. Horas Extras
  let overtimeHours = 0
  if (settings.allow_overtime) {
    const overtimeMargin = settings.overtime_start_after_minutes || 0
    const minOvertimeMin = settings.min_overtime_minutes || 30
    const extraMinutesRaw = punchOutMinutes - (officialExitMin + overtimeMargin)

    if (extraMinutesRaw >= minOvertimeMin) {
      const roundedMinutes = applyOvertimeRounding(extraMinutesRaw, settings.rounding_mode || 'NONE')
      overtimeHours = parseFloat((roundedMinutes / 60).toFixed(2))
    }
  }

  // 5. Horas Nocturnas (22:00 a 06:00)
  let nightHours = 0
  const nightStart = 22 * 60 // 1320 min
  const nightEnd = 6 * 60 // 360 min
  if (punchOutMinutes > nightStart) {
    nightHours = parseFloat(((punchOutMinutes - nightStart) / 60).toFixed(2))
  }

  return {
    status: 'AD', // Asistencia Completa
    isManual: false,
    punchInTime: firstIn,
    punchOutTime: lastOut,
    breakStartTime: firstBreakStart,
    breakEndTime: lastBreakEnd,
    tardinessMinutes,
    earlyLeaveMinutes,
    effectiveHours,
    breakHours: parseFloat((actualBreakMin / 60).toFixed(2)),
    overtimeHours,
    nightHours,
    isLate,
    isEarlyLeave,
    isIncomplete: false,
    punchesDetail: punches
  }
}

/**
 * Calcula el resumen mensual completo por trabajador y los KPIs ejecutivos del Tareo
 */
export function calculateMonthlyTareoEngine(
  workers: { id: string; name: string; last_name?: string; position?: string }[],
  daysInMonth: { day: number; dateString: string; isWeekend: boolean }[],
  manualRecords: { worker_id: string; date: string; status: string; is_manual?: boolean }[],
  attendancePunches: { worker_id: string; date_local: string; type: 'in' | 'out'; timestamp: string }[],
  settings: CompanyAttendanceSettings,
  todayStr?: string
): { workerSummaries: Record<string, WorkerMonthlySummary>; kpis: ExecutiveTareoKPIs } {
  const dailyHours = settings.daily_hours || 8
  const tzDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Lima"}));
  const today = todayStr || `${tzDate.getFullYear()}-${String(tzDate.getMonth()+1).padStart(2, '0')}-${String(tzDate.getDate()).padStart(2, '0')}`

  // Agrupar marcaciones por worker-date
  const punchesMap = new Map<string, { type: 'in' | 'out'; timestamp: string }[]>()
  attendancePunches.forEach(p => {
    const key = `${p.worker_id}-${p.date_local}`
    const list = punchesMap.get(key) || []
    list.push(p)
    punchesMap.set(key, list)
  })

  // Agrupar registros manuales
  const manualMap = new Map<string, { status: string; is_manual?: boolean }>()
  manualRecords.forEach(r => {
    manualMap.set(`${r.worker_id}-${r.date}`, { status: r.status, is_manual: r.is_manual })
  })

  const workerSummaries: Record<string, WorkerMonthlySummary> = {}
  let totalTrabajadores = workers.length
  let presentesHoy = 0
  let ausentesHoy = 0

  let acumuladoHorasProgramadas = 0
  let acumuladoHorasEjecutadas = 0
  let acumuladoHorasEfectivas = 0
  let acumuladoHorasExtras = 0
  let acumuladoHorasNocturnas = 0
  let acumuladoHorasRefrigerio = 0
  let acumuladoMinTardanza = 0
  let acumuladoMinSalidaAnticipada = 0

  let acumuladoAsistencias = 0
  let acumuladoFaltas = 0
  let acumuladoVacaciones = 0
  let acumuladoDescansosMedicos = 0
  let acumuladoSuspensiones = 0
  let acumuladoIncompletos = 0
  let totalDiasLaborablesEvaluados = 0
  let asistenciasPuntuales = 0

  workers.forEach(worker => {
    const fullName = `${worker.name || ''} ${worker.last_name || ''}`.trim()
    const summary: WorkerMonthlySummary = {
      workerId: worker.id,
      workerName: fullName,
      position: worker.position || '-',
      diasTrabajados: 0,
      diasLibres: 0,
      horasOrdinarias: 0,
      horasExtras: 0,
      horasEfectivas: 0,
      horasNocturnas: 0,
      horasRefrigerio: 0,
      minutosTardanza: 0,
      minutosSalidaAnticipada: 0,
      faltas: 0,
      vacaciones: 0,
      descansosMedicos: 0,
      suspensiones: 0,
      adelantos: 0,
      asistenciasCompletas: 0,
      diasIncompletos: 0,
      permisos: 0,
      totalDiasRegistrados: daysInMonth.length,
      totalHorasProgramadas: 0
    }

    daysInMonth.forEach(dayObj => {
      const dateKey = `${worker.id}-${dayObj.dateString}`
      const manual = manualMap.get(dateKey) || null
      const punches = punchesMap.get(dateKey) || []

      const evalResult = evaluateAttendanceInternal(dayObj, manual, punches, settings)

      // Verificar si es HOY para los KPIs ejecutivos de presentes/ausentes
      if (dayObj.dateString === today) {
        if (['AD', 'P', 'AN', 'C', 'DF'].includes(evalResult.status)) {
          presentesHoy++
        } else {
          ausentesHoy++
        }
      }

      // Horas programadas
      if (!dayObj.isWeekend && evalResult.status !== 'L') {
        summary.totalHorasProgramadas += dailyHours
        acumuladoHorasProgramadas += dailyHours
        totalDiasLaborablesEvaluados++
      }

      // Conteo por estados
      switch (evalResult.status) {
        case 'AD':
        case 'P':
        case 'AN':
        case 'C':
        case 'DF':
          summary.diasTrabajados++
          summary.asistenciasCompletas++
          summary.horasOrdinarias += dailyHours
          acumuladoHorasEjecutadas += dailyHours
          acumuladoAsistencias++
          if (!evalResult.isLate) asistenciasPuntuales++
          break
        case 'DL':
        case 'L':
          summary.diasLibres++
          break
        case 'F':
          summary.faltas++
          acumuladoFaltas++
          break
        case 'INC':
          summary.diasIncompletos++
          summary.diasTrabajados += 0.5
          summary.horasOrdinarias += (dailyHours / 2)
          acumuladoHorasEjecutadas += (dailyHours / 2)
          acumuladoIncompletos++
          break
        case 'V':
          summary.vacaciones++
          acumuladoVacaciones++
          break
        case 'DM':
          summary.descansosMedicos++
          acumuladoDescansosMedicos++
          break
        case 'S':
          summary.suspensiones++
          acumuladoSuspensiones++
          break
      }

      // Tiempos
      summary.horasExtras += evalResult.overtimeHours
      summary.horasEfectivas += evalResult.effectiveHours
      summary.horasNocturnas += evalResult.nightHours
      summary.horasRefrigerio += evalResult.breakHours
      summary.minutosTardanza += evalResult.tardinessMinutes
      summary.minutosSalidaAnticipada += evalResult.earlyLeaveMinutes

      acumuladoHorasExtras += evalResult.overtimeHours
      acumuladoHorasEfectivas += evalResult.effectiveHours
      acumuladoHorasNocturnas += evalResult.nightHours
      acumuladoHorasRefrigerio += evalResult.breakHours
      acumuladoMinTardanza += evalResult.tardinessMinutes
      acumuladoMinSalidaAnticipada += evalResult.earlyLeaveMinutes
    })

    // Redondear decimales
    summary.horasOrdinarias = parseFloat(summary.horasOrdinarias.toFixed(2))
    summary.horasExtras = parseFloat(summary.horasExtras.toFixed(2))
    summary.horasEfectivas = parseFloat(summary.horasEfectivas.toFixed(2))
    summary.horasNocturnas = parseFloat(summary.horasNocturnas.toFixed(2))
    summary.horasRefrigerio = parseFloat(summary.horasRefrigerio.toFixed(2))

    workerSummaries[worker.id] = summary
  })

  // Métricas ejecutivas globales
  const porcentajeAsistencia = totalDiasLaborablesEvaluados > 0
    ? parseFloat(((acumuladoAsistencias / totalDiasLaborablesEvaluados) * 100).toFixed(1))
    : 100

  const porcentajePuntualidad = acumuladoAsistencias > 0
    ? parseFloat(((asistenciasPuntuales / acumuladoAsistencias) * 100).toFixed(1))
    : 100

  const porcentajeHorasEfectivas = acumuladoHorasProgramadas > 0
    ? parseFloat(((acumuladoHorasEfectivas / acumuladoHorasProgramadas) * 100).toFixed(1))
    : 100

  const kpis: ExecutiveTareoKPIs = {
    totalTrabajadores,
    presentesHoy,
    ausentesHoy,
    horasProgramadasMes: parseFloat(acumuladoHorasProgramadas.toFixed(2)),
    horasEjecutadasMes: parseFloat(acumuladoHorasEjecutadas.toFixed(2)),
    diferenciaHorasMes: parseFloat((acumuladoHorasEjecutadas - acumuladoHorasProgramadas).toFixed(2)),
    horasEfectivasMes: parseFloat(acumuladoHorasEfectivas.toFixed(2)),
    horasExtrasMes: parseFloat(acumuladoHorasExtras.toFixed(2)),
    horasNocturnasMes: parseFloat(acumuladoHorasNocturnas.toFixed(2)),
    horasRefrigerioMes: parseFloat(acumuladoHorasRefrigerio.toFixed(2)),
    minutosTardanzaAcumulados: acumuladoMinTardanza,
    minutosSalidaAnticipadaAcumulados: acumuladoMinSalidaAnticipada,
    horasPerdidasTardanza: parseFloat((acumuladoMinTardanza / 60).toFixed(2)),
    porcentajeAsistencia,
    porcentajePuntualidad,
    porcentajeHorasEfectivas,
    totalFaltas: acumuladoFaltas,
    totalVacaciones: acumuladoVacaciones,
    totalDescansosMedicos: acumuladoDescansosMedicos,
    totalSuspensiones: acumuladoSuspensiones
  }

  return { workerSummaries, kpis }
}

function evaluateAttendanceInternal(
  dayObj: { day: number; dateString: string; isWeekend: boolean },
  manualRecord: { status: string; is_manual?: boolean } | null,
  punches: { type: 'in' | 'out'; timestamp: string }[],
  settings: CompanyAttendanceSettings
): DailyEvaluationResult {
  return evaluateDailyAttendance(dayObj.dateString, manualRecord, punches, settings)
}
