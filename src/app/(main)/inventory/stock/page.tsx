import { getInventoryStock, getProducts, getInventoryMovements } from '../actions'
import { InventoryStockList } from '@/components/inventory/inventory-stock-list'
import { Suspense } from 'react'
import { OperationsDashboardSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { getUserSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InventoryStockPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  return (
    <Suspense fallback={<OperationsDashboardSkeleton />}>
      <StockFetcher user={extendedUser} />
    </Suspense>
  )
}

async function StockFetcher({ user }: { user: any }) {
  const [stockRes, productsRes] = await Promise.all([
    getInventoryStock(),
    getProducts()
  ])

  if (stockRes.error || productsRes.error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2rem] text-rose-700">
        <p className="font-black">Error al cargar datos:</p>
        <p className="text-sm font-medium">{stockRes.error || productsRes.error}</p>
      </div>
    )
  }

  return (
    <InventoryStockList 
      initialStock={stockRes.data || []} 
      products={productsRes.data || []} 
      user={user}
    />
  )
}
