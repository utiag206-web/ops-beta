export const dynamic = 'force-dynamic'

import { getInventoryMovements, getProducts } from '../actions'
import { InventoryMovementsList } from '@/components/inventory/movements-list'
import { Suspense } from 'react'
import { OperationsDashboardSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function InventoryMovementsPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  return (
    <Suspense fallback={<OperationsDashboardSkeleton />}>
      <MovementsFetcher />
    </Suspense>
  )
}

async function MovementsFetcher() {
  const [movementsRes, productsRes] = await Promise.all([
    getInventoryMovements(),
    getProducts()
  ])

  if (movementsRes.error || productsRes.error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2rem] text-rose-700">
        <p className="font-black">Error al cargar movimientos:</p>
        <p className="text-sm font-medium">{movementsRes.error || productsRes.error}</p>
      </div>
    )
  }

  return (
    <InventoryMovementsList 
      initialMovements={movementsRes.data || []} 
      initialBalances={movementsRes.initialBalances}
      products={productsRes.data || []} 
    />
  )
}
