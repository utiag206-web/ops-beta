export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { IncidentsList } from '@/components/incidents/incidents-list'
import { getUserSession } from '@/lib/auth'
import { getIncidencias } from './actions'
import { OperationsDashboardSkeleton } from '@/components/dashboard/dashboard-skeletons'

export const metadata = {
  title: 'Incidencias | Sistema de Gestión',
  description: 'Reporte y seguimiento de incidencias en campo.',
}

async function IncidenciasFetcher({ user }: { user: any }) {
  const res = await getIncidencias()
  
  if (res.error) {
    return (
      <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] mt-8">
        <h2 className="text-xl font-black text-rose-700 flex items-center gap-3 mb-2">
          ❌ Error de Base de Datos
        </h2>
        <p className="text-rose-600 font-bold">{res.error}</p>
        <p className="text-rose-500 text-sm mt-4 italic">
          Esto suele ocurrir si no se han aplicado las migraciones SQL o si la caché del esquema de Supabase está desincronizada.
        </p>
      </div>
    )
  }

  return <IncidentsList initialData={res.data || []} user={user} />
}

export default async function IncidenciasPage() {
  const { extendedUser } = await getUserSession()

  if (!extendedUser) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<OperationsDashboardSkeleton />}>
        <IncidenciasFetcher user={extendedUser} />
      </Suspense>
    </div>
  )
}
