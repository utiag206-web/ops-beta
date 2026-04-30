'use client'

import { useState, useEffect } from 'react'
import { Clock, LogIn, LogOut, CheckCircle2, Loader2, Calendar } from 'lucide-react'
import { checkIn, checkOut } from '@/app/(main)/attendance/actions'

interface AttendanceMarkerProps {
  initialStatus?: any
}

export function AttendanceMarker({ initialStatus }: AttendanceMarkerProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCheckIn = async () => {
    setIsPending(true)
    setError(null)
    try {
      const result = await checkIn()
      if (result.success) {
        setStatus(result.data)
      } else {
        setError(result.error ?? null)
      }
    } catch (err) {
      setError('Error al registrar ingreso')
    } finally {
      setIsPending(false)
    }
  }

  const handleCheckOut = async () => {
    setIsPending(true)
    setError(null)
    try {
      const result = await checkOut()
      if (result.success) {
        setStatus({ ...status, check_out: new Date().toLocaleTimeString('en-GB') })
      } else {
        setError(result.error ?? null)
      }
    } catch (err) {
      setError('Error al registrar salida')
    } finally {
      setIsPending(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Marca de Asistencia</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Registro Diario</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-slate-800 tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hora Actual</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entrada</p>
          <p className="text-lg font-bold text-slate-700">
            {status?.check_in || '--:--'}
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Salida</p>
          <p className="text-lg font-bold text-slate-700">
            {status?.check_out || '--:--'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {!status?.check_in ? (
        <button
          onClick={handleCheckIn}
          disabled={isPending}
          className="w-full h-14 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-300 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          {isPending ? <Loader2 className="animate-spin" size={24} /> : <LogIn size={24} />}
          MARCAR ENTRADA
        </button>
      ) : !status?.check_out ? (
        <button
          onClick={handleCheckOut}
          disabled={isPending}
          className="w-full h-14 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 disabled:from-slate-400 disabled:to-slate-300 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-amber-200 transition-all active:scale-95"
        >
          {isPending ? <Loader2 className="animate-spin" size={24} /> : <LogOut size={24} />}
          MARCAR SALIDA
        </button>
      ) : (
        <div className="w-full h-14 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl font-bold flex items-center justify-center gap-3">
          <CheckCircle2 size={24} />
          JORNADA COMPLETADA
        </div>
      )}
    </div>
  )
}

function AlertCircle({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
