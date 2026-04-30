'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { 
  getTareoRecords, upsertTareoRecord,
  getTareoConfig, upsertTareoConfig, getTareoNotes, upsertTareoNote,
  getAttendancePunches, syncAttendancePunches
} from './actions'

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
}

const statusColors: any = {
  'AD': 'bg-white text-slate-800 font-bold',
  'AN': 'bg-white text-teal-800 font-bold',
  'DL': 'bg-white text-cyan-800 font-bold',
  'C': 'bg-white text-blue-800 font-bold',
  'DF': 'bg-white text-indigo-800 font-bold',
  'F': 'bg-white text-rose-600 font-bold',
  'S': 'bg-white text-orange-800 font-bold',
  'L': 'bg-white text-amber-800 font-bold',
  'DM': 'bg-sky-200 text-sky-900 font-bold',
  'INC': 'bg-yellow-200 text-yellow-900 font-bold',
  'P': 'bg-yellow-200 text-yellow-900 font-bold',
  'V': 'bg-purple-100 text-purple-800 font-bold',
  'X': 'bg-slate-400 text-white font-bold',
}

const autoColors: any = {
  'AD': 'bg-white text-slate-500', 
  'F': 'bg-white text-rose-400',
  'INC': 'bg-white text-yellow-600',
  'P': 'bg-white text-yellow-600',
}

const remunerables = ['AD', 'AN', 'DL', 'C', 'DF']

export default function TareoClient({ initialCycles, workers, userRole }: TareoPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tareoRecords, setTareoRecords] = useState<any[]>([])
  const [tareoNotes, setTareoNotes] = useState<any[]>([])
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
  const [dailyHours, setDailyHours] = useState<number>(10.25)
  const [loading, setLoading] = useState(true)
  const [updatingCell, setUpdatingCell] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [showLogsModal, setShowLogsModal] = useState<{workerId: string, date: string} | null>(null)
  const [activePunches, setActivePunches] = useState<{ time: string, type: 'in' | 'out' }[]>([])
  const [savingLog, setSavingLog] = useState(false)

  const canWrite = userRole === 'admin' || userRole === 'gerente' || userRole === 'operaciones'

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

  const loadData = useCallback(async () => {
    setLoading(true)
    const start = daysInMonth[0].dateString
    const end = daysInMonth[daysInMonth.length - 1].dateString
    
    try {
      const [records, notes, config, punches] = await Promise.all([
        getTareoRecords(start, end),
        getTareoNotes(currentMonthStr),
        getTareoConfig(currentMonthStr),
        getAttendancePunches(start, end)
      ])
      
      setTareoRecords(records)
      setTareoNotes(notes)
      setDailyHours(config?.daily_hours || 10.25)
      setAttendanceLogs(punches)
    } finally {
      setLoading(false)
    }
  }, [currentMonthStr, daysInMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredWorkers = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase()
    return workers.filter(w => 
      w.name.toLowerCase().includes(lowerSearch) ||
      (w.last_name?.toLowerCase().includes(lowerSearch))
    )
  }, [workers, searchTerm])

  const effectiveStatusesMap = useMemo(() => {
    const map = new Map<string, { status: string; isManual: boolean }>()
    
    const punchesGrouped = new Map<string, { in: number; out: number }>()
    attendanceLogs.forEach(log => {
      const key = `${log.worker_id}-${log.date_local}`
      const current = punchesGrouped.get(key) || { in: 0, out: 0 }
      if (log.type === 'in') current.in++
      if (log.type === 'out') current.out++
      punchesGrouped.set(key, current)
    })

    workers.forEach(w => {
      daysInMonth.forEach(d => {
        const key = `${w.id}-${d.dateString}`
        const punches = punchesGrouped.get(key)
        let autoStatus = 'F'
        if (punches) {
          if (punches.in > 0 && punches.out > 0) autoStatus = 'AD'
          else if (punches.in > 0) autoStatus = 'INC'
        }
        map.set(key, { status: autoStatus, isManual: false })
      })
    })

    tareoRecords.forEach(r => {
      if (r.status) {
        map.set(`${r.worker_id}-${r.date}`, { status: r.status, isManual: true })
      }
    })

    return map
  }, [attendanceLogs, tareoRecords, daysInMonth, workers])

  const handleCellUpdate = async (workerId: string, date: string, status: string | null) => {
    const key = `${workerId}-${date}`
    setUpdatingCell(key)
    const result = await upsertTareoRecord({ worker_id: workerId, date, status })
    if (result.success) {
      setTareoRecords(prev => {
        const filtered = prev.filter(r => !(r.worker_id === workerId && r.date === date))
        if (status) return [...filtered, { worker_id: workerId, date, status }]
        return filtered
      })
    }
    setUpdatingCell(null)
  }

  const openLogModal = (workerId: string, date: string) => {
    const existing = attendanceLogs
      .filter(l => l.worker_id === workerId && l.date_local === date)
      .map(l => {
        const dateObj = new Date(l.timestamp)
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' })
        return { type: l.type as 'in'|'out', time: timeStr }
      })
    
    setActivePunches(existing)
    setShowLogsModal({ workerId, date })
  }

  const saveLogs = async () => {
    if (!showLogsModal) return
    setSavingLog(true)
    const result = await syncAttendancePunches({
      worker_id: showLogsModal.workerId,
      date_local: showLogsModal.date,
      punches: activePunches.filter(p => p.time !== '')
    })
    
    if (result.success) {
      const newLogs = activePunches
        .filter(p => p.time !== '')
        .map(p => ({
          worker_id: showLogsModal.workerId,
          date_local: showLogsModal.date,
          type: p.type,
          timestamp: `${showLogsModal.date}T${p.time}:00-05:00`
        }))
        
      setAttendanceLogs(prev => [
        ...prev.filter(l => !(l.worker_id === showLogsModal.workerId && l.date_local === showLogsModal.date)),
        ...newLogs
      ])
      setShowLogsModal(null)
    }
    setSavingLog(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Matriz de Tareo</h1>
          <p className="text-slate-500 font-medium text-sm">Validación visual horizontal base Excel.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar trabajador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl w-56 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <ChevronLeft size={18} className="text-slate-600" />
            </button>
            <div className="px-3 font-black text-slate-700 min-w-[120px] text-center text-sm uppercase">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <ChevronRight size={18} className="text-slate-600" />
            </button>
          </div>
          
          {(userRole === 'admin' || userRole === 'company_admin') && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-500 uppercase">Horas Diarias</span>
              <input 
                type="number" 
                step="0.01"
                value={dailyHours}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0
                  setDailyHours(val)
                  upsertTareoConfig(currentMonthStr, val)
                }}
                className="w-16 bg-white border border-slate-200 rounded font-bold text-xs p-1 text-center"
              />
            </div>
          )}
        </div>
      </div>

      {/* LEYENDA TAREO */}
      <div className="flex flex-wrap gap-2 px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center">Leyenda:</span>
        {[
          { c: 'P', l: 'Presente', bg: 'bg-yellow-200' },
          { c: 'F', l: 'Falta', bg: 'bg-rose-100 text-rose-600' },
          { c: 'AD', l: 'Adelanto', bg: 'bg-slate-100' },
          { c: 'V', l: 'Vacaciones', bg: 'bg-purple-100 text-purple-600' },
          { c: 'DM', l: 'Desc. Médico', bg: 'bg-sky-100 text-sky-600' },
          { c: 'DL', l: 'Desc. Laborado', bg: 'bg-cyan-100 text-cyan-600' },
          { c: 'INC', l: 'Incompleto', bg: 'bg-orange-100 text-orange-600' },
          { c: 'S', l: 'Suspensión', bg: 'bg-amber-100 text-amber-600' },
          { c: 'L', l: 'Libre', bg: 'bg-slate-50 text-slate-400' },
        ].map(item => (
          <div key={item.c} className="flex items-center gap-1.5 border border-slate-50 px-2 py-1 rounded-lg">
            <span className={`w-7 text-center text-[10px] font-black py-0.5 rounded ${item.bg}`}>{item.c}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">{item.l}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-400 overflow-x-auto relative z-0">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-bold text-sm">Sincronizando...</span>
          </div>
        ) : (
          <table className="w-max text-left border-collapse whitespace-nowrap table-fixed">
            <thead>
              <tr className="bg-[#0f244a] text-white">
                <th rowSpan={2} className="sticky left-0 z-20 bg-[#0f244a] border border-slate-400 px-2 py-1 text-[11px] font-bold text-center w-10 align-middle">ITEM</th>
                <th rowSpan={2} className="sticky left-[40px] z-20 bg-[#0f244a] border border-slate-400 px-3 py-1 text-[11px] font-bold text-center w-64 align-middle uppercase">Apellidos y Nombres</th>
                <th rowSpan={2} className="sticky left-[296px] z-20 bg-[#0f244a] border border-slate-400 px-3 py-1 text-[11px] font-bold text-center w-36 align-middle uppercase">Cargo</th>
                {daysInMonth.map((d) => (
                  <th key={`wd-${d.day}`} className={`px-1 py-0.5 text-center border border-slate-400 min-w-[28px] ${d.isWeekend ? 'text-rose-400' : 'text-slate-100'}`}>
                    <div className="text-[10px] lowercase">{d.weekday === 'D' ? 'dom' : d.weekday}</div>
                  </th>
                ))}
                <th colSpan={5} className="bg-[#e47e30] border border-slate-400 px-2 py-0.5 text-[10px] font-bold text-center uppercase text-white">Resumen</th>
              </tr>
              <tr className="bg-[#0f244a] text-white">
                {daysInMonth.map((d) => (
                  <th key={`d-${d.day}`} className="px-1 py-1 text-center border border-slate-400 min-w-[32px]">
                    <div className="text-[11px] font-black">{String(d.day).padStart(2, '0')}</div>
                  </th>
                ))}
                <th className="bg-[#3a75c4] border border-slate-400 px-1 py-1 text-[10px] font-black text-center text-white w-16">DÍAS TRAB.</th>
                <th className="bg-[#3a75c4] border border-slate-400 px-1 py-1 text-[10px] font-black text-center text-white w-16">HORAS DIA</th>
                <th className="bg-[#3a75c4] border border-slate-400 px-1 py-1 text-[10px] font-black text-center text-white w-16">TOTAL HH</th>
                <th className="bg-[#3a75c4] border border-slate-400 px-1 py-1 text-[10px] font-black text-center text-white w-16">DÍAS LIB.</th>
                <th className="bg-[#3a75c4] border border-slate-400 px-1 py-1 text-[10px] font-black text-center text-white w-16">TOTAL DÍAS</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker, idx) => (
                  <WorkerRow 
                    key={worker.id}
                    worker={worker}
                    idx={idx}
                    daysInMonth={daysInMonth}
                    effectiveStatusesMap={effectiveStatusesMap}
                    dailyHours={dailyHours}
                    updatingCell={updatingCell}
                    onCellUpdate={handleCellUpdate}
                    onOpenLogs={openLogModal}
                    attendanceLogs={attendanceLogs}
                    canWrite={canWrite}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }

function WorkerRow({ worker, idx, daysInMonth, effectiveStatusesMap, dailyHours, updatingCell, onCellUpdate, onOpenLogs, attendanceLogs, canWrite }: any) {
  const totals = useMemo(() => {
    let works = 0
    let libres = 0
    daysInMonth.forEach((d: any) => {
      const eff = effectiveStatusesMap.get(`${worker.id}-${d.dateString}`)
      if (eff) {
        if (remunerables.includes(eff.status)) works++
        if (['L', 'DL'].includes(eff.status)) libres++
      }
    })
    return { works, libres, total: works + libres, hh: (works * dailyHours).toFixed(2) }
  }, [worker.id, daysInMonth, effectiveStatusesMap, dailyHours])

  return (
    <tr className="hover:bg-slate-50 relative group bg-white h-10">
      <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 border border-slate-400 px-1 py-1 text-center text-[11px] font-bold text-slate-800">{idx + 1}</td>
      <td className="sticky left-[40px] z-20 bg-white group-hover:bg-slate-50 border border-slate-400 px-2 py-1 text-[11px] font-black text-slate-900 uppercase truncate max-w-[220px]">{worker.name} {worker.last_name}</td>
      <td className="sticky left-[260px] z-20 bg-white group-hover:bg-slate-50 border border-slate-400 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase truncate max-w-[140px]">{worker.position || '-'}</td>
      {daysInMonth.map((d: any) => {
        const key = `${worker.id}-${d.dateString}`
        const eff = effectiveStatusesMap.get(key) || { status: '', isManual: false }
        const isUpdating = updatingCell === key
        const colorClass = eff.isManual ? (statusColors[eff.status] || 'bg-white') : (autoColors[eff.status] || 'bg-white')
        const logged = attendanceLogs.some((l: any) => l.worker_id === worker.id && l.date_local === d.dateString)

        return (
          <td key={d.day} className={`p-0 border border-slate-400 relative ${colorClass} text-center align-middle min-w-[32px] h-10`}>
            <select
              value={eff.isManual ? eff.status : ''} 
              onChange={(e) => onCellUpdate(worker.id, d.dateString, e.target.value || null)}
              disabled={isUpdating || !canWrite}
              className={`w-full h-full text-[11px] font-bold text-center cursor-pointer outline-none bg-transparent hover:bg-black/5 transition-colors appearance-none ${isUpdating ? 'animate-pulse opacity-50' : ''}`}
            >
              <option value="">{eff.isManual ? '' : (eff.status || '-')}</option>
              {Object.keys(statusColors).map(s => (
                <option key={s} value={s} className="text-slate-900 bg-white font-bold">
                  {s}
                </option>
              ))}
            </select>
            <div 
              onClick={() => onOpenLogs(worker.id, d.dateString)}
              className={`absolute top-0 right-0 w-2 h-2 cursor-pointer ${logged ? 'bg-blue-600' : 'bg-slate-200 opacity-20 hover:opacity-100'}`}
            />
          </td>
        )
      })}
      <td className="px-1 py-0.5 text-[11px] text-rose-700 border border-slate-400 bg-white text-center font-black">{totals.works}</td>
      <td className="px-1 py-0.5 text-[11px] text-slate-600 border border-slate-400 bg-white text-center font-bold">{dailyHours}</td>
      <td className="px-1 py-0.5 text-[11px] text-rose-800 border border-slate-400 bg-rose-50 text-center font-black">{totals.hh}</td>
      <td className="px-1 py-0.5 text-[11px] text-slate-800 border border-slate-400 bg-white text-center font-bold">{totals.libres}</td>
      <td className="px-1 py-0.5 text-[11px] text-white border border-slate-400 bg-slate-800 text-center font-black">{totals.total}</td>
    </tr>
  )
}
