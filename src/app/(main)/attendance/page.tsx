import { getAttendance } from './actions'
import { AttendanceList } from '@/components/attendance/attendance-list'
import { getStrictCompanyId, getUserSession, getActiveViewMode } from '@/lib/auth'
import { getCompanyTimezone, getCompanyLocalTime } from '@/lib/date-utils'
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const records = await getAttendance()
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  const viewMode = await getActiveViewMode()
  const isWorker = extendedUser?.role_id?.toLowerCase() === 'trabajador' || viewMode === 'WORKER'

  const ianaTimezone = await getCompanyTimezone(companyId)
  const { date: today } = getCompanyLocalTime(ianaTimezone)

  if (isWorker) {
    const totalDays = records.length
    const checkIns = records.filter((r: any) => r.check_in)
    const tardanzas = checkIns.filter((r: any) => {
      if (!r.check_in) return false
      return r.check_in > '08:05:00'
    }).length
    const puntuales = checkIns.length - tardanzas
    const incompletas = records.filter((r: any) => r.check_in && !r.check_out).length

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Mi Asistencia</h1>
          <p className="text-slate-500 font-medium text-xs">Consulta tu historial de marcaciones, horas de ingreso, salida y puntualidad.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Días Laborados</p>
            <p className="text-2xl font-black text-slate-800">{totalDays}</p>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Últimos 30 días</span>
          </div>

          <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Puntuales</p>
            <p className="text-2xl font-black text-emerald-700">{puntuales}</p>
            <span className="text-[8px] font-black text-emerald-600/80 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={10} /> Ingresos a tiempo
            </span>
          </div>

          <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100/50 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tardanzas</p>
            <p className="text-2xl font-black text-amber-700">{tardanzas}</p>
            <span className="text-[8px] font-black text-amber-600/80 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={10} /> Pasado las 08:05 AM
            </span>
          </div>

          <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incompletas</p>
            <p className="text-2xl font-black text-blue-700">{incompletas}</p>
            <span className="text-[8px] font-black text-blue-600/80 uppercase tracking-wider flex items-center gap-1">
              <Clock size={10} /> Sin marcar salida
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-md font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            Historial de Marcaciones
          </h2>
          <AttendanceList records={records} isWorker={true} />
        </div>
      </div>
    )
  }

  // Administrative view
  const todayRecords = records.filter((r: any) => r.date === today)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Asistencia</h1>
          <p className="text-slate-500">Monitoreo de ingresos y salidas del personal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 rounded-3xl text-white shadow-lg">
            <h3 className="text-4xl font-black mb-1">{todayRecords.length}</h3>
            <p className="text-blue-100 text-sm font-medium">Marcaciones Hoy</p>
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs text-blue-200">Personal en Planta</span>
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-blue-400 border-2 border-blue-700 flex items-center justify-center text-[10px] font-bold">
                    {i}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              Filtrar por Fecha
            </h4>
            <input 
              type="date" 
              defaultValue={today}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-800"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Registros Recientes
            </h4>
            <AttendanceList records={records} />
          </div>
        </div>
      </div>
    </div>
  )
}
