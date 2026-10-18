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
  getAttendancePunches, syncAttendancePunches, getTareoDashboardData,
  getAttendanceDayDetail
} from './actions'
import { AttendanceLocationModal, LocationPunch } from '@/components/attendance/AttendanceLocationModal'
import { createClient } from '@/lib/supabase/client'
import { calculateMonthlyTareoEngine, ExecutiveTareoKPIs, WorkerMonthlySummary } from '@/lib/tareo-engine'
import { CompanyAttendanceSettings, DEFAULT_HR_SETTINGS } from '@/lib/company-hr-settings'
import { exportTareoToExcel } from '@/lib/export-utils'
import { useOffline } from '@/components/providers/offline-provider'
import { addOperationToQueue } from '@/lib/offline-sync'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'

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
  'AC': 'bg-green-200 text-green-900 font-bold',
  'DL': 'bg-cyan-100 text-cyan-800 font-bold',
  'F': 'bg-rose-100 text-rose-800 font-bold',
  'S': 'bg-amber-100 text-amber-800 font-bold',
  'L': 'bg-slate-50 text-slate-500 font-bold',
  'DM': 'bg-sky-100 text-sky-800 font-bold',
  'INC': 'bg-orange-100 text-orange-800 font-bold',
  'P': 'bg-emerald-100 text-emerald-800 font-bold',
  'PR': 'bg-emerald-50 text-emerald-700 font-bold',
  'V': 'bg-purple-100 text-purple-800 font-bold',
}

const autoColors: any = {
  'AD': 'bg-slate-100 text-slate-500 font-bold', 
  'F': 'bg-rose-50 text-rose-400 font-bold',
  'INC': 'bg-orange-50 text-orange-400 font-bold',
  'P': 'bg-emerald-100 text-emerald-800 font-bold',
  'PR': 'bg-emerald-50 text-emerald-700 font-bold',
  'AC': 'bg-green-100 text-green-800 font-bold',
}

export default function TareoClient({ initialCycles, workers: propWorkers, userRole, companyId }: TareoPageProps) {
  const [workers, setWorkers] = useState<Worker[]>(propWorkers || [])
  const { isOnline, triggerSync } = useOffline()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tareoRecords, setTareoRecords] = useState<any[]>([])
  const [tareoNotes, setTareoNotes] = useState<any[]>([])
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
  const [attendanceSettings, setAttendanceSettings] = useState<CompanyAttendanceSettings>(DEFAULT_HR_SETTINGS.attendance_settings)
  const [loading, setLoading] = useState(true)
  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal de evidencia de ubicación y marcación GPS
  const [modalData, setModalData] = useState<{
    isOpen: boolean
    workerId: string
    workerName: string
    date: string
    punches: LocationPunch[]
  } | null>(null)

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

  // Clave de caché aislada por empresa, rol de usuario y periodo
  const cacheKeyPrefix = useMemo(() => {
    return `tareo_${companyId}_${userRole}_${currentMonthStr}`
  }, [companyId, userRole, currentMonthStr])

  // Hidratación inmediata desde caché (Stale-While-Revalidate)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const cachedRecords = localStorage.getItem(`${cacheKeyPrefix}_records`)
      const cachedNotes = localStorage.getItem(`${cacheKeyPrefix}_notes`)
      const cachedPunches = localStorage.getItem(`${cacheKeyPrefix}_punches`)
      const cachedSettings = localStorage.getItem(`${cacheKeyPrefix}_settings`)
      
      let hasData = false
      if (cachedRecords) {
        setTareoRecords(JSON.parse(cachedRecords))
        hasData = true
      }
      if (cachedNotes) {
        setTareoNotes(JSON.parse(cachedNotes))
      }
      if (cachedPunches) {
        setAttendanceLogs(JSON.parse(cachedPunches))
      }
      if (cachedSettings) {
        setAttendanceSettings(JSON.parse(cachedSettings))
      }
      const cachedWorkers = localStorage.getItem(`${cacheKeyPrefix}_workers`) || localStorage.getItem('workers_cache')
      if (cachedWorkers && (!propWorkers || propWorkers.length === 0)) {
        try {
          const parsedW = JSON.parse(cachedWorkers)
          if (Array.isArray(parsedW) && parsedW.length > 0) {
            setWorkers(parsedW)
          }
        } catch (_) {}
      }
      
      if (hasData) {
        setLoading(false)
      } else {
        setLoading(true)
      }
    } catch (e) {
      console.warn('[TAREO] Error al hidratar desde caché local:', e)
    }
  }, [cacheKeyPrefix])

  useEffect(() => {
    if (propWorkers && propWorkers.length > 0) {
      setWorkers(propWorkers)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${cacheKeyPrefix}_workers`, JSON.stringify(propWorkers))
      }
    }
  }, [propWorkers, cacheKeyPrefix])

  const loadData = useCallback(async (isBackground: boolean = false) => {
    if (!isBackground) {
      if (typeof window !== 'undefined') {
        const hasCache = !!localStorage.getItem(`${cacheKeyPrefix}_records`)
        if (!hasCache) setLoading(true)
      } else {
        setLoading(true)
      }
    }

    const start = daysInMonth[0].dateString
    const end = daysInMonth[daysInMonth.length - 1].dateString
    
    try {
      const res = await getTareoDashboardData(currentMonthStr, start, end)
      setTareoRecords(res.records)
      setTareoNotes(res.notes)
      setAttendanceLogs(res.punches)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${cacheKeyPrefix}_records`, JSON.stringify(res.records))
        localStorage.setItem(`${cacheKeyPrefix}_notes`, JSON.stringify(res.notes))
        localStorage.setItem(`${cacheKeyPrefix}_punches`, JSON.stringify(res.punches))
      }
      if ((res as any).attendanceSettings) {
        setAttendanceSettings((res as any).attendanceSettings)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`${cacheKeyPrefix}_settings`, JSON.stringify((res as any).attendanceSettings))
        }
      }
    } catch (e) {
      console.warn("[TAREO] Modo Offline: cargando datos de tareo desde caché local:", e)
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`${cacheKeyPrefix}_records`)
        if (cached) {
          try { setTareoRecords(JSON.parse(cached)) } catch (_) {}
        }
        const cachedNotes = localStorage.getItem(`${cacheKeyPrefix}_notes`)
        if (cachedNotes) {
          try { setTareoNotes(JSON.parse(cachedNotes)) } catch (_) {}
        }
        const cachedPunches = localStorage.getItem(`${cacheKeyPrefix}_punches`)
        if (cachedPunches) {
          try { setAttendanceLogs(JSON.parse(cachedPunches)) } catch (_) {}
        }
      }
    } finally {
      // Replay pending tareo operations onto records
      try {
        const { getPendingOperations } = await import('@/lib/offline-sync')
        const pending = await getPendingOperations()
        const tareoPending = pending.filter(p => p.entity === 'tareo')
        if (tareoPending.length > 0) {
          setTareoRecords(prev => {
            let updated = [...prev]
            for (const op of tareoPending) {
              if (op.action === 'upsert_tareo_record') {
                const { worker_id, date, status } = op.payload
                updated = updated.filter(r => !(r.worker_id === worker_id && r.date === date))
                if (status) updated.push({ worker_id, date, status, isPending: true })
              }
            }
            return updated
          })
        }
      } catch (_) {}
      setLoading(false)
    }
  }, [currentMonthStr, daysInMonth, cacheKeyPrefix])

  useEffect(() => {
    loadData(true)

    const supabase = createClient()
    const channel1 = supabase.channel(`tareo_attendance_${companyId}_${currentMonthStr}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance', 
        filter: `company_id=eq.${companyId}` 
      }, () => {
        loadData(true)
      })
      .subscribe()
      
    const channel2 = supabase.channel(`tareo_attendance_logs_${companyId}_${currentMonthStr}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance_logs', 
        filter: `company_id=eq.${companyId}` 
      }, () => {
        loadData(true)
      })
      .subscribe()

    // Robust Fallback: Poll every 30 seconds only if window is active
    const fallbackInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadData(true)
      }
    }, 30000)

    return () => {
      supabase.removeChannel(channel1)
      supabase.removeChannel(channel2)
      clearInterval(fallbackInterval)
    }
  }, [loadData, companyId, currentMonthStr])

  const filteredWorkers = useMemo(() => {
    const lowerSearch = (searchTerm || '').toLowerCase()
    return workers.filter(w => 
      (w.name || '').toLowerCase().includes(lowerSearch) ||
      (w.last_name || '').toLowerCase().includes(lowerSearch)
    )
  }, [workers, searchTerm])

  // Lógica del Motor de Tareo e Indicadores (intacta)
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
      const lat = l.latitude !== undefined && l.latitude !== null ? Number(l.latitude) : null
      const lng = l.longitude !== undefined && l.longitude !== null ? Number(l.longitude) : null
      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat !== 0) {
        gpsKeys.add(`${l.worker_id}-${l.date_local || l.date}`)
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
      if (isOnline) {
        const result = await upsertTareoRecord({ worker_id: workerId, date, status })
        if (!result.success) {
          setTareoRecords(oldRecords)
        }
      } else {
        await addOperationToQueue({
          id: uuidv4(),
          entity: 'tareo',
          action: 'upsert_tareo_record',
          payload: { id: uuidv4(), worker_id: workerId, date, status },
          company_id: companyId
        })
        if (typeof window !== 'undefined') {
          const updated = tareoRecords.filter(r => !(r.worker_id === workerId && r.date === date))
          if (status) updated.push({ worker_id: workerId, date, status, isPending: true })
          localStorage.setItem(`${cacheKeyPrefix}_records`, JSON.stringify(updated))
        }
        toast.info('Sin conexión. Tareo guardado localmente.')
        triggerSync()
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

  // Apertura del modal de evidencia y enriquecimiento bajo demanda
  const openLogModal = (workerId: string, date: string) => {
    const worker = workers.find(w => w.id === workerId)
    const workerName = worker ? `${worker.name} ${worker.last_name || ''}`.trim() : 'Trabajador'

    // Datos inmediatos desde la memoria local
    const localPunches: LocationPunch[] = attendanceLogs
      .filter(l => l.worker_id === workerId && l.date_local === date)
      .map(l => ({
        type: l.type,
        timestamp: l.timestamp,
        latitude: l.latitude != null ? Number(l.latitude) : undefined,
        longitude: l.longitude != null ? Number(l.longitude) : undefined,
        accuracy: l.accuracy != null ? Number(l.accuracy) : undefined,
        address: l.address || undefined
      }))

    setModalData({
      isOpen: true,
      workerId,
      workerName,
      date,
      punches: localPunches
    })

    // Enriquecer con direcciones, precisión o registro clásico de attendance si está online
    if (isOnline) {
      getAttendanceDayDetail(workerId, date).then(res => {
        if (res?.success) {
          let enrichedPunches: LocationPunch[] = (res.punches || []).map((p: any) => ({
            type: p.type,
            timestamp: p.timestamp,
            latitude: p.latitude != null ? Number(p.latitude) : undefined,
            longitude: p.longitude != null ? Number(p.longitude) : undefined,
            accuracy: p.accuracy != null ? Number(p.accuracy) : undefined,
            address: p.address || undefined
          }))

          // Fallback a la tabla attendance si no hubo attendance_logs
          if (enrichedPunches.length === 0 && res.attendance) {
            const att = res.attendance
            const fallbackPunches: LocationPunch[] = []
            if (att.check_in) {
              fallbackPunches.push({
                type: 'in',
                timestamp: `${date}T${att.check_in}`,
                latitude: (att.check_in_lat ?? att.latitude) != null ? Number(att.check_in_lat ?? att.latitude) : undefined,
                longitude: (att.check_in_lng ?? att.longitude) != null ? Number(att.check_in_lng ?? att.longitude) : undefined
              })
            }
            if (att.break_start) {
              fallbackPunches.push({
                type: 'break_start',
                timestamp: `${date}T${att.break_start}`
              })
            }
            if (att.break_end) {
              fallbackPunches.push({
                type: 'break_end',
                timestamp: `${date}T${att.break_end}`
              })
            }
            if (att.check_out) {
              fallbackPunches.push({
                type: 'out',
                timestamp: `${date}T${att.check_out}`,
                latitude: (att.check_out_lat ?? att.latitude) != null ? Number(att.check_out_lat ?? att.latitude) : undefined,
                longitude: (att.check_out_lng ?? att.longitude) != null ? Number(att.check_out_lng ?? att.longitude) : undefined
              })
            }
            enrichedPunches = fallbackPunches
          }

          setModalData(prev => {
            if (prev && prev.workerId === workerId && prev.date === date) {
              return { ...prev, punches: enrichedPunches }
            }
            return prev
          })
        }
      }).catch(err => {
        console.warn('[TAREO] Error al enriquecer detalle:', err)
      })
    }
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
            <span className="text-2xl font-black text-slate-800">{kpis.horasEfectivasMes}h</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 mt-1">{kpis.porcentajeHorasEfectivas}% ejecutado</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Horas Extras</span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600">+{kpis.horasExtrasMes}h</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 mt-1">Aprobadas</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Tardanzas</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600">{kpis.minutosTardanzaAcumulados}m</span>
          </div>
          <span className="text-[10px] font-bold text-rose-500/80 mt-1">{kpis.horasPerdidasTardanza}h perdidas</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Puntualidad</span>
            <ShieldCheck size={16} className="text-teal-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-teal-600">{kpis.porcentajePuntualidad}%</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 mt-1">Tolerancia: {attendanceSettings.late_tolerance_minutes}m</span>
        </div>
      </div>

      {/* MATRIZ OPERATIVA DE TAREO */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-x-auto relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-500">Cargando datos de tareo...</span>
            </div>
          </div>
        ) : null}

        {filteredWorkers.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm">No se encontraron trabajadores registrados.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 select-none">
                <th className="md:sticky md:left-0 z-30 bg-slate-50 border border-slate-300 px-0.5 py-1 text-center font-black w-[40px]">#</th>
                <th className="md:sticky md:left-[40px] z-30 bg-slate-50 border border-slate-300 px-2 py-1 text-left font-black w-[220px]">TRABAJADOR</th>
                <th className="md:sticky md:left-[260px] z-30 bg-slate-50 border border-slate-300 px-2 py-1 text-left font-black w-[130px]">CARGO</th>
                {daysInMonth.map(d => (
                  <th key={d.day} className={`border border-slate-300 p-0 text-center min-w-[32px] ${d.isWeekend ? 'bg-slate-200/50' : 'bg-slate-50'}`}>
                    <div className="text-[9px] text-slate-400 font-bold leading-none pt-0.5">{d.weekday}</div>
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

      {/* MODAL DE EVIDENCIA DE UBICACIÓN Y MARCADOR GPS */}
      {modalData && (
        <AttendanceLocationModal
          isOpen={modalData.isOpen}
          onClose={() => setModalData(null)}
          workerName={modalData.workerName}
          date={modalData.date}
          punches={modalData.punches}
        />
      )}
    </div>
  )
}

const WorkerRow = React.memo(function WorkerRow({ 
  worker, idx, daysInMonth, workerStatuses, summary, updatingCells, onCellUpdate, onOpenLogs, loggedPunches, gpsKeys, canWrite 
}: any) {
  return (
    <tr className="hover:bg-slate-50 relative group bg-white h-10">
      <td className="md:sticky md:left-0 z-20 bg-white group-hover:bg-slate-50 border border-slate-300 px-0.5 py-1 text-center text-[11px] font-bold text-slate-800 w-[40px]">{idx + 1}</td>
      <td className="md:sticky md:left-[40px] z-20 bg-white group-hover:bg-slate-50 border border-slate-300 px-2 py-1 text-[11px] font-black text-slate-900 truncate max-w-[220px] w-[220px]">{worker.name} {worker.last_name}</td>
      <td className="md:sticky md:left-[260px] z-20 bg-white group-hover:bg-slate-50 border border-slate-300 px-2 py-1 text-[10px] font-bold text-slate-500 truncate max-w-[130px] w-[130px]">{worker.position || '-'}</td>
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
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenLogs(worker.id, d.dateString)
                }}
                className="absolute bottom-0.5 right-0.5 p-0.5 cursor-pointer flex items-center justify-center transition-all hover:scale-125 z-10"
                title={hasGps ? "Ver evidencia GPS y marcaciones" : "Ver marcaciones (Sin ubicación GPS)"}
              >
                {hasGps ? (
                  <div className="bg-white rounded-full shadow-md p-0.5 border border-blue-400">
                    <MapPin size={10} className="text-blue-600 fill-blue-100" />
                  </div>
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm border border-white" />
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

function areRowsEqual(prevProps: any, nextProps: any) {
  if (prevProps.worker.id !== nextProps.worker.id) return false
  if (prevProps.idx !== nextProps.idx) return false
  if (prevProps.canWrite !== nextProps.canWrite) return false
  if (prevProps.daysInMonth.length !== nextProps.daysInMonth.length) return false
  if (prevProps.loggedPunches !== nextProps.loggedPunches) return false
  if (prevProps.gpsKeys !== nextProps.gpsKeys) return false
  if (prevProps.summary !== nextProps.summary) return false
  if (prevProps.updatingCells !== nextProps.updatingCells) return false
  
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
