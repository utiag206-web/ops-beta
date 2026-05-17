import { getReportsData } from './actions'
import { ReportsDashboard } from '@/components/reports/reports-dashboard'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const data = await getReportsData()

  if (!data) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Centro de Inteligencia</h1>
        <p className="text-slate-500 font-medium">Análisis consolidado de operaciones, personal y costos</p>
      </div>

      <ReportsDashboard initialData={data} />
    </div>
  )
}
