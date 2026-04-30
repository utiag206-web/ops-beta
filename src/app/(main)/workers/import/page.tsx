import { WorkerImport } from '@/components/workers/worker-import'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function WorkerImportPage() {
  const { extendedUser } = await getUserSession()
  const canManage = ['admin', 'operaciones'].includes(extendedUser?.role_id || '')

  if (!canManage) {
    redirect('/workers')
  }

  return <WorkerImport />
}
