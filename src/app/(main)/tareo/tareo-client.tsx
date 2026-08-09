'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, ChevronLeft, ChevronRight, Check, Download, Users, 
  UserCheck, UserX, Clock, TrendingUp, AlertTriangle, ShieldCheck, Zap,
  X, LogIn, LogOut, Utensils, CheckCircle2, MapPin, Info
} from 'lucide-react'
import { 
  getTareoRecords, upsertTareoRecord,
  getTareoConfig, upsertTareoConfig, getTareoNotes, upsertTareoNote,
  getAttendancePunches, syncAttendancePunches, getTareoDashboardData
} from './actions'
import { createClient } from '@/lib/supabase/client'
import { calculateMonthlyTareoEngine, ExecutiveTareoKPIs, WorkerMonthlySummary } from '@/lib/tareo-engine'
import { CompanyAttendanceSettings, DEFAULT_HR_SETTINGS } from '@/lib/company-hr-settings'
import { exportTareoToExcel } from '@/lib/export-utils'

interface Worker {
  id: string
  name: string
  last_name?: string
  position?: string
  daily_rate?: number
  monthly_salary?: number
}

interface TareoPageProps {
  initialCycles: any[]
  workers: Worker[]
  userRole: string
  companyId: string
}

const statusColors: any = {
  'AD': 'bg-slate-200 text-slate-800 font-bold',
  'AN': 'bg-teal-100 text-teal-800 font-bold',
  'DL': 'bg-cyan-100 text-cyan-800 font-bold',
  'C': 'bg-blue-100 text-blue-800 font-bold',
  'DF': 'bg-indigo-100 text-indigo-800 font-bold',
  'F': 'bg-rose-100 text-rose-800 font-bold',
  'S': 'bg-amber-100 text-amber-800 font-bold',
  'L': 'bg-slate-50 text-slate-500 font-bold',
  'DM': 'bg-sky-100 text-sky-800 font-bold',
  'INC': 'bg-orange-100 text-orange-800 font-bold',
  'P': 'bg-emerald-100 text-emerald-800 font-bold',
  'PR': 'bg-emerald-50 text-emerald-700 font-bold',
  'AC': 'bg-green-200 text-green-900 font-bold',
  'V': 'bg-purple-100 text-purple-800 font-bold',
  'X': 'bg-slate-400 text-white font-bold',
}

const autoColors: any = {
  'AD': 'bg-slate-100 text-slate-500 font-bold', 
  'F': 'bg-rose-50 text-rose-400 font-bold',
  'INC': 'bg-orange-50 text-orange-400 font-bold',
  'P': 'bg-emerald-100 text-emerald-800 font-bold',
  'PR': 'bg-emerald-50 text-emerald-700 font-bold',
  'AC': 'bg-green-100 text-green-800 font-bold',
}

export default function TareoClient({ initialCycles, workers, userRole, companyId }: TareoPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tareoRecords, setTareoRecords] = useState<any[]>([])
  const [tareoNotes, setTareoNotes] = useState<any[]>([])
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
  const [attendanceSettings, setAttendanceSettings] = useState<CompanyAttendanceSettings>(DEFAULT_HR_SETTINGS.attendance_settings)
  const [loading, setLoading] = useState(true)
  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  
  const [showLogsModal, setShowLogsModal] = useState<{workerId: string, date: string} | null>(null)
  const [activePunches, setActivePunches] = useState<{ time: string, type: 'in' | 'out' | 'break_start' | 'break_end', latitude?: number, longitude?: number, accuracy?: number, address?: string }[]>([])
  const [savingLog, setSavingLog] = useState(false)

  const loggedPunches = useMemo(() => {
    const set = new Set<string>()
    attendanceLogs.forEach(log => {
      set.add(`${log.worker_id}-${log.date_local}`)
    })
    return set
  }, [attendanceLogs])

  const canWrite = !!(userRole && !['trabajador', 'worker'].includes(userRole.toLowerCase()))
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  
  const currentMonthStr = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  }, [currentDate])

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const days = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(year, month, i + 1)
      return {
        day: i + 1,
        weekday: ["D", "L", "M", "M", "J", "V", "S"][date.getDay()],
        isWeekend: date.getDay() === 0,
        dateString: date.toISOString().split('T')[0]
      }
    })
  }, [currentDate])

  const loadData = useCallback(async (isBackground: boolean = false) => {
    if (!isBackground) setLoading(true)
    const start = daysInMonth[0].dateString
    const end = daysInMonth[daysInMonth.length - 1].dateString
    
    try {
      const res = await getTareoDashboardData(currentMonthStr, start, end)
      setTareoRecords(res.records)
      setTareoNotes(res.notes)
      setAttendanceLogs(res.punches)
      if ((res as any).attendanceSettings) {
        setAttendanceSettings((res as any).attendanceSettings)
      }
    } catch (e) {
      console.error("[TAREO] Error loading optimized data:", e)
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [currentMonthStr, daysInMonth])

  useEffect(() => {
    loadData()

    const supabase = createClient()
    const channel1 = supabase.channel('tareo_attendance_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, (payload) => {
        console.log('[REALTIME] Attendance event received:', payload)
        loadData(true)
      })
      .subscribe((status) => {
        console.log('[REALTIME] Attendance channel status:', status)
      })
      
    const channel2 = supabase.channel('tareo_attendance_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, (payload) => {
        console.log('[REALTIME] Attendance logs event received:', payload)
        loadData(true)
      })
      .subscribe((status) => {
        console.log('[REALTIME] Attendance logs channel status:', status)
      })

    // Robust Fallback: Poll every 30 seconds in the background
    const fallbackInterval = setInterval(() => {
      loadData(true)
    }, 30000)

    return () => {
      supabase.removeChannel(channel1)
      supabase.removeChannel(channel2)
      clearInterval(fallbackInterval)
    }
  }, [loadData, companyId])

  const filteredWorkers = useMemo(() => {
    const lowerSearch = (searchTerm || '').toLowerCase()
    return workers.filter(w => 
      (w.name || '').toLowerCase().includes(lowerSearch) ||
      (w.last_name || '').toLowerCase().includes(lowerSearch)
    )
  }, [workers, searchTerm])

  // Lógica del Motor de Tareo e Indicadores
  const { workerSummaries, kpis, workerStatusesMap, gpsKeys } = useMemo(() => {
    const map: Record<string, Record<string, { status: string; isManual: boolean }>> = {}
    
    const punchesGrouped = new Map<string, { in: number; out: number; break_start: number; break_end: number }>()
    attendanceLogs.forEach(log => {
      const key = `${log.worker_id}-${log.date_local}`
      const current = punchesGrouped.get(key) || { in: 0, out: 0, break_start: 0, break_end: 0 }
      if (log.type === 'in') current.in++
      if (log.type === 'out') current.out++
      if (log.type === 'break_start') current.break_start++
      if (log.type === 'break_end') current.break_end++
      punchesGrouped.set(key, current)
    })

    workers.forEach(w => {
      map[w.id] = {}
      daysInMonth.forEach(d => {
        const key = `${w.id}-${d.dateString}`
        const punches = punchesGrouped.get(key)
        let autoStatus = 'F'
        if (punches) {
          if (punches.in > 0 && punches.out > 0) autoStatus = 'AC'
          else if (punches.in > 0 && punches.break_start > 0 && punches.break_end === 0) autoStatus = 'PR'
          else if (punches.in > 0) autoStatus = 'P'
        }
        map[w.id][d.dateString] = { status: autoStatus, isManual: false }
      })
    })

    tareoRecords.forEach(r => {
      if (r.status && map[r.worker_id]) {
        map[r.worker_id][r.date] = { status: r.status, isManual: r.is_manual ?? true }
      }
    })

    const engineResult = calculateMonthlyTareoEngine(
      workers,
      daysInMonth,
      tareoRecords,
      attendanceLogs,
      attendanceSettings
    )

    const gpsKeys = new Set<string>()
    attendanceLogs.forEach(l => {
      if (l.latitude && l.longitude) {
        gpsKeys.add(`${l.worker_id}-${l.date_local}`)
      }
    })

    return {
      workerSummaries: engineResult.workerSummaries,
      kpis: engineResult.kpis,
      workerStatusesMap: map,
      gpsKeys
    }
  }, [attendanceLogs, tareoRecords, daysInMonth, workers, attendanceSettings])

  const handleCellUpdate = async (workerId: string, date: string, status: string | null) => {
    const key = `${workerId}-${date}`
    const oldRecords = [...tareoRecords]
    
    setTareoRecords(prev => {
      const filtered = prev.filter(r => !(r.worker_id === workerId && r.date === date))
      if (status) return [...filtered, { worker_id: workerId, date, status }]
      return filtered
    })
    
    setUpdatingCells(prev => {
      const next = new Set(prev)
      next.add(key)
      return next
    })
    
    try {
      const result = await upsertTareoRecord({ worker_id: workerId, date, status })
      if (!result.success) {
        setTareoRecords(oldRecords)
      }
    } catch {
      setTareoRecords(oldRecords)
    } finally {
      setUpdatingCells(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const openLogModal = (workerId: string, date: string) => {
    const existing = attendanceLogs
      .filter(l => l.worker_id === workerId && l.date_local === date)
      .map(l => {
        const dateObj = new Date(l.timestamp)
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' })
        return { 
          type: l.type as 'in'|'out'|'break_start'|'break_end', 
          time: timeStr,
          latitude: l.latitude,
          longitude: l.longitude,
          accuracy: l.accuracy,
          address: l.address
        }
      })
    
    setActivePunches(existing)
    setShowLogsModal({ workerId, date })
  }

  const handleExportExcel = () => {
    exportTareoToExcel({
      monthStr: currentMonthStr,
      workers: filteredWorkers,
      daysInMonth,
      workerStatusesMap,
      workerSummaries,
      kpis
    })
  }

  return (
    <div className="space-y-5">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Control de Tareo y Productividad</h1>
          </div>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
            Cálculo automatizado en tiempo real sincronizado con la Configuración de Empresa.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar trabajador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl w-52 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <ChevronLeft size={18} className="text-slate-600" />
            </button>
            <div className="px-3 font-black text-slate-700 min-w-[120px] text-center text-xs sm:text-sm">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <ChevronRight size={18} className="text-slate-600" />
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Download size={15} />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD EJECUTIVO DE KPIS OPERATIVOS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Presentes Hoy</span>
            <UserCheck size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-800">{kpis.presentesHoy}</span>
            <span className="text-[10px] text-slate-400 font-bold ml-1">/ {kpis.totalTrabajadores} reg.</span>
          </div>
          <div className="mt-1 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${kpis.porcentajeAsistencia}%` }} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Horas Programadas</span>
            <Clock size={16} className="text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-800">{kpis.horasProgramadasMes}h</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 mt-1">Jornada: {attendanceSettings.daily_hours}h/día</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Horas Efectivas</span>
            <TrendingUp size={16} className="text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-indigo-900">{kpis.horasEfectivasMes}h</span>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 mt-1">{kpis.porcentajeHorasEfectivas}% Cumplimiento</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Horas Extras</span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-900">{kpis.horasExtrasMes}h</span>
          </div>
          <span className="text-[10px] font-bold text-amber-600 mt-1">Redondeo: {attendanceSettings.rounding_mode || '15 min'}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Min. Tardanza</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-800">{kpis.minutosTardanzaAcumulados}m</span>
          </div>
          <span className="text-[10px] font-bold text-rose-600 mt-1">({kpis.horasPerdidasTardanza}h perdidas)</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">% Puntualidad</span>
            <ShieldCheck size={16} className="text-teal-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-teal-900">{kpis.porcentajePuntualidad}%</span>
          </div>
          <span className="text-[10px] font-bold text-teal-600 mt-1">Tol: {attendanceSettings.late_tolerance_minutes} min</span>
        </div>
      </div>

      {/* LEYENDA TAREO */}
      <div className="flex flex-wrap gap-2 px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <span className="text-[10px] font-black text-slate-400 tracking-tight mr-2 flex items-center">Leyenda Oficial:</span>
        {[
          { c: 'P', l: 'Presente', bg: 'bg-yellow-200 text-yellow-900' },
          { c: 'F', l: 'Falta', bg: 'bg-rose-100 text-rose-700' },
          { c: 'AD', l: 'Asist. Completa', bg: 'bg-slate-200 text-slate-800' },
          { c: 'V', l: 'Vacaciones', bg: 'bg-purple-100 text-purple-700' },
          { c: 'DM', l: 'Desc. Médico', bg: 'bg-sky-100 text-sky-700' },
          { c: 'DL', l: 'Desc. Laborado', bg: 'bg-cyan-100 text-cyan-700' },
          { c: 'INC', l: 'Incompleto', bg: 'bg-orange-100 text-orange-700' },
          { c: 'S', l: 'Suspensión', bg: 'bg-amber-100 text-amber-700' },
          { c: 'L', l: 'Libre', bg: 'bg-slate-100 text-slate-600' },
        ].map(item => (
          <div key={item.c} className="flex items-center gap-1.5 border border-slate-100 px-2 py-1 rounded-lg">
            <span className={`w-7 text-center text-[10px] font-black py-0.5 rounded ${item.bg}`}>{item.c}</span>
            <span className="text-[10px] font-bold text-slate-600">{item.l}</span>
          </div>
        ))}
      </div>

      {/* MATRIZ PRINCIPAL DE TAREO */}
      <div className="bg-white border border-slate-300 rounded-2xl overflow-x-auto relative z-0 shadow-sm">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-bold text-sm">Procesando Motor de Tareo...</span>
          </div>
        ) : (
          <table className="w-max text-left border-collapse whitespace-nowrap table-fixed">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th rowSpan={2} className="sticky left-0 z-20 bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] font-bold text-center w-[40px] align-middle">ITEM</th>
                <th rowSpan={2} className="sticky left-[40px] z-20 bg-slate-800 border border-slate-700 px-3 py-1 text-[11px] font-bold text-center w-[220px] align-middle">Apellidos y Nombres</th>
                <th rowSpan={2} className="sticky left-[260px] z-20 bg-slate-800 border border-slate-700 px-3 py-1 text-[11px] font-bold text-center w-[130px] align-middle">Cargo</th>
                {daysInMonth.map((d) => (
                  <th key={`wd-${d.day}`} className={`px-1 py-1 text-center border border-slate-700 min-w-[32px] ${d.isWeekend ? 'text-rose-400' : 'text-slate-100'}`}>
                    <div className="text-[11px] font-black uppercase">{d.weekday}</div>
                  </th>
                ))}
                <th colSpan={6} className="bg-indigo-700 border border-indigo-600 px-2 py-0.5 text-[10px] font-black text-center text-white">Resumen Inteligente de Producción</th>
              </tr>
              <tr className="bg-slate-800 text-white">
                {daysInMonth.map((d) => (
                  <th key={`d-${d.day}`} className="px-1 py-1 text-center border border-slate-700 min-w-[32px]">
                    <div className="text-[11px] font-black">{String(d.day).padStart(2, '0')}</div>
                  </th>
                ))}
                <th className="bg-blue-600 border border-blue-500 px-1 py-1 text-[9px] font-black text-center text-white w-14">D. TRAB</th>
                <th className="bg-blue-600 border border-blue-500 px-1 py-1 text-[9px] font-black text-center text-white w-14">D. LIB</th>
                <th className="bg-blue-600 border border-blue-500 px-1 py-1 text-[9px] font-black text-center text-white w-16">HORAS ORD</th>
                <th className="bg-amber-600 border border-amber-500 px-1 py-1 text-[9px] font-black text-center text-white w-16">HORAS EXT</th>
                <th className="bg-indigo-600 border border-indigo-500 px-1 py-1 text-[9px] font-black text-center text-white w-16">HORAS EFEC</th>
                <th className="bg-rose-600 border border-rose-500 px-1 py-1 text-[9px] font-black text-center text-white w-16">MIN TARD</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((worker, idx) => (
                <WorkerRow 
                  key={worker.id}
                  worker={worker}
                  idx={idx}
                  daysInMonth={daysInMonth}
                  workerStatuses={workerStatusesMap[worker.id] || {}}
                  summary={workerSummaries[worker.id]}
                  updatingCells={updatingCells}
                  onCellUpdate={handleCellUpdate}
                  onOpenLogs={openLogModal}
                  loggedPunches={loggedPunches}
                  gpsKeys={gpsKeys}
                  canWrite={canWrite}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-800 text-lg">Registro de Marcaciones</h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Fecha: {showLogsModal.date}
                </p>
              </div>
              <button 
                onClick={() => setShowLogsModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {activePunches.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Clock size={20} />
                  </div>
                  <p className="text-slate-500 font-bold text-sm">No hay marcaciones registradas para este día.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePunches.map((punch, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        punch.type === 'in' ? 'bg-emerald-100 text-emerald-600' :
                        punch.type === 'out' ? 'bg-amber-100 text-amber-600' :
                        punch.type === 'break_start' ? 'bg-orange-100 text-orange-600' :
                        'bg-teal-100 text-teal-600'
                      }`}>
                        {punch.type === 'in' ? <LogIn size={18} /> : 
                         punch.type === 'out' ? <LogOut size={18} /> : 
                         punch.type === 'break_start' ? <Utensils size={18} /> : 
                         <CheckCircle2 size={18} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-black text-slate-800 text-sm">
                            {punch.type === 'in' ? 'Entrada' : 
                             punch.type === 'out' ? 'Salida' : 
                             punch.type === 'break_start' ? 'Inicio Refrigerio' : 
                             'Fin Refrigerio'}
                          </p>
                          <span className="font-bold text-slate-500 text-sm">{punch.time}</span>
                        </div>
                        
                        {(punch.latitude && punch.longitude) ? (
                          <div className="mt-3 bg-slate-50 rounded-xl p-3 flex flex-col gap-2 border border-slate-100">
                            <div className="flex items-start gap-2 text-xs font-medium text-slate-600">
                              <MapPin size={14} className="shrink-0 text-blue-500 mt-0.5" />
                              <span className="leading-tight">
                                {punch.address || `${punch.latitude}, ${punch.longitude}`}
                                {punch.accuracy && <span className="block text-slate-400 text-[10px] mt-0.5">Precisión GPS: ±{Math.round(punch.accuracy)}m</span>}
                              </span>
                            </div>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${punch.latitude},${punch.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors py-1.5 px-3 rounded-lg text-center flex items-center justify-center gap-1.5 w-max"
                            >
                              Ver en Mapa
                            </a>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                            <Info size={12} />
                            <span>Sin datos de ubicación GPS</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function areRowsEqual(prevProps: any, nextProps: any) {
  if (prevProps.worker.id !== nextProps.worker.id) return false
  if (prevProps.idx !== nextProps.idx) return false
  if (prevProps.canWrite !== nextProps.canWrite) return false
  if (prevProps.daysInMonth.length !== nextProps.daysInMonth.length) return false
  
  const prevStatuses = prevProps.workerStatuses || {}
  const nextStatuses = nextProps.workerStatuses || {}
  
  for (const d of nextProps.daysInMonth) {
    const prev = prevStatuses[d.dateString] || { status: '', isManual: false }
    const next = nextStatuses[d.dateString] || { status: '', isManual: false }
    if (prev.status !== next.status || prev.isManual !== next.isManual) {
      return false
    }
  }

  return true
}

const WorkerRow = React.memo(function WorkerRow({ 
  worker, idx, daysInMonth, workerStatuses, summary, updatingCells, onCellUpdate, onOpenLogs, loggedPunches, gpsKeys, canWrite 
}: any) {
  return (
    <tr className="hover:bg-slate-50 relative group bg-white h-10">
      <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 border border-slate-300 px-0.5 py-1 text-center text-[11px] font-bold text-slate-800 w-[40px]">{idx + 1}</td>
      <td className="sticky left-[40px] z-20 bg-white group-hover:bg-slate-50 border border-slate-300 px-2 py-1 text-[11px] font-black text-slate-900 truncate max-w-[220px] w-[220px]">{worker.name} {worker.last_name}</td>
      <td className="sticky left-[260px] z-20 bg-white group-hover:bg-slate-50 border border-slate-300 px-2 py-1 text-[10px] font-bold text-slate-500 truncate max-w-[130px] w-[130px]">{worker.position || '-'}</td>
      {daysInMonth.map((d: any) => {
        const key = `${worker.id}-${d.dateString}`
        const eff = workerStatuses[d.dateString] || { status: '', isManual: false }
        const isUpdating = updatingCells.has(key)
        const colorClass = eff.isManual ? (statusColors[eff.status] || 'bg-white') : (autoColors[eff.status] || 'bg-white')
        const logged = loggedPunches.has(key)
        const hasGps = gpsKeys?.has(key)

        return (
          <td key={d.day} className={`p-0 border border-slate-300 relative ${colorClass} text-center align-middle min-w-[32px] h-10`}>
            <select
              value={eff.isManual ? eff.status : ''} 
              onChange={(e) => onCellUpdate(worker.id, d.dateString, e.target.value || null)}
              disabled={isUpdating || !canWrite}
              className={`w-full h-full text-[11px] font-bold text-center cursor-pointer outline-none bg-transparent hover:bg-black/5 transition-colors appearance-none ${isUpdating ? 'animate-pulse opacity-50' : ''}`}
            >
              <option value="">{eff.isManual ? '' : (eff.status || '-')}</option>
              {Object.keys(statusColors).map(s => (
                <option key={s} value={s} className="text-slate-900 bg-white font-bold text-center">
                  {s}
                </option>
              ))}
            </select>
            {logged && (
              <div 
                onClick={() => onOpenLogs(worker.id, d.dateString)}
                className={`absolute bottom-0 right-0 p-0.5 cursor-pointer flex items-center justify-center transition-all hover:scale-110 z-10`}
                title={hasGps ? "Ver registro (Incluye GPS)" : "Ver registro de marcaciones"}
              >
                {hasGps ? (
                  <div className="bg-white rounded-full shadow-sm p-0.5 border border-blue-200">
                    <MapPin size={10} className="text-blue-600 fill-blue-100" />
                  </div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm border border-white" />
                )}
              </div>
            )}
          </td>
        )
      })}
      <td className="px-1 py-0.5 text-[11px] text-blue-800 border border-slate-300 bg-blue-50/40 text-center font-black">{summary?.diasTrabajados || 0}</td>
      <td className="px-1 py-0.5 text-[11px] text-slate-600 border border-slate-300 bg-white text-center font-bold">{summary?.diasLibres || 0}</td>
      <td className="px-1 py-0.5 text-[11px] text-slate-900 border border-slate-300 bg-white text-center font-black">{summary?.horasOrdinarias || 0}h</td>
      <td className="px-1 py-0.5 text-[11px] text-amber-800 border border-slate-300 bg-amber-50/50 text-center font-black">{summary?.horasExtras || 0}h</td>
      <td className="px-1 py-0.5 text-[11px] text-indigo-900 border border-slate-300 bg-indigo-50/50 text-center font-black">{summary?.horasEfectivas || 0}h</td>
      <td className="px-1 py-0.5 text-[11px] text-rose-700 border border-slate-300 bg-rose-50/50 text-center font-black">{summary?.minutosTardanza || 0}m</td>
    </tr>
  )
}, areRowsEqual)
