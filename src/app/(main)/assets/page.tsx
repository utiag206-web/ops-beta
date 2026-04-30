export const dynamic = 'force-dynamic'

import { getAssets } from './actions'
import { AssetsList } from '@/components/assets/assets-list'
import { Suspense } from 'react'
import { OperationsDashboardSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AssetsPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  return (
    <Suspense fallback={<OperationsDashboardSkeleton />}>
      <AssetsFetcher />
    </Suspense>
  )
}

async function AssetsFetcher() {
  const { data, error } = await getAssets()

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2rem] text-rose-700">
        <p className="font-black">Error al cargar activos:</p>
        <p className="text-sm font-medium">{error}</p>
      </div>
    )
  }

  return <AssetsList initialAssets={data || []} />
}
