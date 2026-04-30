export const dynamic = 'force-dynamic'

import { getWorkers } from './actions'
import { WorkersList } from '@/components/workers/workers-list'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { OperationsDashboardSkeleton } from '@/components/dashboard/dashboard-skeletons'

export default async function WorkersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string, filter?: string }>
}) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const canManage = ['admin', 'operaciones', 'administracion'].includes(extendedUser?.role_id || '')

  return (
    <Suspense fallback={<OperationsDashboardSkeleton />}>
      <WorkersFetcher searchParams={searchParams} canManage={canManage} />
    </Suspense>
  )
}

async function WorkersFetcher({ 
  searchParams, 
  canManage 
}: { 
  searchParams: Promise<{ status?: string, filter?: string }>,
  canManage: boolean
}) {
  const { status, filter } = await searchParams
  const workers = await getWorkers(status, filter === 'new')

  return <WorkersList workers={workers} canManage={canManage} />
}
