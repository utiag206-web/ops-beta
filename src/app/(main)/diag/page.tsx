export const dynamic = 'force-dynamic'

import { getUserSession } from '@/lib/auth'
import { getDashboardStats } from '../dashboard/actions'

export default async function DiagPage() {
  const session = await getUserSession()
  
  let dashboardStats = null
  let dashboardError = null
  try {
    dashboardStats = await getDashboardStats()
  } catch (e: any) {
    dashboardError = { message: e.message, stack: e.stack }
  }

  return (
    <div className="p-8 font-mono text-sm whitespace-pre bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Diagnostic Session & Stats Data</h1>
      <hr className="mb-4" />
      
      <h2 className="text-lg font-bold mt-8 mb-2">Session</h2>
      {JSON.stringify(session, null, 2)}
      
      <h2 className="text-lg font-bold mt-8 mb-2">Dashboard Stats</h2>
      {dashboardError ? (
        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl mb-4">
          Error: {dashboardError.message}
        </div>
      ) : null}
      {JSON.stringify(dashboardStats, null, 2)}
    </div>
  )
}

