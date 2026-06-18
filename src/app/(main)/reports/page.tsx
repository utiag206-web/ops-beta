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
      <div>
        <h1 className="text-2xl font-black text-slate-800">Centro de Inteligencia</h1>
        <p className="text-slate-500 font-medium">Análisis consolidado de operaciones, personal y costos</p>
      </div>
 
      <ReportsDashboard 
        initialData={data} 
        workers={workers} 
        selectedWorkerId={workerId} 
      />
    </div>
  )
}
