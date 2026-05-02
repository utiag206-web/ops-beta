import { redirect } from 'next/navigation'
import { getUserSession } from '@/lib/auth'
import { getProducts, getWarehouses } from '@/app/(dashboard)/inventory/actions'
import { KardexClient } from './kardex-client'

export const dynamic = 'force-dynamic'

export default async function KardexPage() {
  const { user } = await getUserSession()

  if (!user) {
    redirect('/login')
  }

  const [productsRes, warehousesRes] = await Promise.all([
    getProducts(),
    getWarehouses()
  ])

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M3 15h6"/><path d="M3 18h6"/><path d="M13 15v6"/><path d="M17 15v6"/></svg>
            </div>
            Kardex
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Trazabilidad histórica formal de operaciones de inventario.
          </p>
        </div>
      </div>

      <KardexClient 
        products={productsRes.data || []} 
        warehouses={warehousesRes.data || []} 
      />
    </div>
  )
}
