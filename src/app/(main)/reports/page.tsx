import { getReportsData } from './actions'
import { getWorkersShort } from '../workers/actions'
import { ReportsDashboard } from '@/components/reports/reports-dashboard'
 
export default async function ReportsPage(props: { searchParams: Promise<{ month?: string, year?: string, workerId?: string }> }) {
  const searchParams = await props.searchParams
  const month = searchParams.month ? parseInt(searchParams.month, 10) : undefined
  const year = searchParams.year ? parseInt(searchParams.year, 10) : undefined
  const workerId = searchParams.workerId || undefined
 
  const [data, workers] = await Promise.all([
    getReportsData(month, year, workerId),
    getWorkersShort()
  ])
 
  if (!data) return null
 
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Centro de Inteligencia</h1>
          <p className="text-slate-500 font-medium">Análisis consolidado de operaciones, personal y costos</p>
        </div>

        <a
          href="/reports/export-center"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
        >
          <span>Ir al Centro de Exportaciones</span>
          <span className="bg-emerald-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">NUEVO</span>
        </a>
      </div>
 
      <ReportsDashboard 
        initialData={data} 
        workers={workers} 
        selectedWorkerId={workerId} 
      />
    </div>
  )
}
