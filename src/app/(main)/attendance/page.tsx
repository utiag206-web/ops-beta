import { getAttendance } from './actions'
import { AttendanceList } from '@/components/attendance/attendance-list'

export const dynamic = 'force-dynamic'
import { Calendar, Search, Filter } from 'lucide-react'

export default async function AttendancePage() {
  const records = await getAttendance()
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = records.filter(r => r.date === today)

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
              <Filter size={18} className="text-blue-600" />
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
