import RequirementsPage from '@/components/requirements/requirements-list'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getRequirements } from './actions'
import { Suspense } from 'react'
import { OperationsDashboardSkeleton } from '@/components/dashboard/dashboard-skeletons'

export const metadata = {
  title: 'Requerimientos | Sistema de Gestión',
  description: 'Gestión de solicitudes y requerimientos internos.',
}

export default async function Page() {
  const { extendedUser } = await getUserSession()

  if (!extendedUser) {
    redirect('/login')
  }

  const userRole = extendedUser.role_id || 'trabajador'

  return (
    <div className="container mx-auto px-4 py-8 text-slate-800">
      <Suspense fallback={<OperationsDashboardSkeleton />}>
        <RequirementsFetcher userRole={userRole} />
      </Suspense>
    </div>
  )
}

async function RequirementsFetcher({ userRole }: { userRole: string }) {
  const initialData = await getRequirements({ status: 'todos', priority: 'todas' })
  // Si hay un error en backend, res.data será undefined, pasamos [] por seguridad
  return <RequirementsPage userRole={userRole} initialData={initialData.data || []} />
}
