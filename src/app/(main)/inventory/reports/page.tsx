import { redirect } from 'next/navigation'
import { getUserSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'
import { ReportsClient } from './reports-client'
import { getStockByWarehouse, getLowStockProducts, getDormantProducts, getTopConsumedProducts } from './actions'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const { user } = await getUserSession()

  if (!user) {
    redirect('/login')
  }

  // Pre-fetch all data on server side for blazing fast initial render
  const [
    stockWarehouseVal,
    lowStockVal,
    dormantVal,
    topConsumedVal
  ] = await Promise.all([
    getStockByWarehouse(),
    getLowStockProducts(),
    getDormantProducts(),
    getTopConsumedProducts()
  ])

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="bg-rose-100 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            </div>
            Reportes Analíticos
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Métricas clave e inteligencia de inventario para la toma de decisiones.
          </p>
        </div>
      </div>

      <ReportsClient 
        stockWarehouse={stockWarehouseVal.data || []}
        lowStock={lowStockVal.data || []}
        dormant={dormantVal.data || []}
        topConsumed={topConsumedVal.data || []}
      />
    </div>
  )
}
