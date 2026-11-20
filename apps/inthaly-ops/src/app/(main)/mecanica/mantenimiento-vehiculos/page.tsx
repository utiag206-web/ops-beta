import { Suspense } from 'react'
import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getMaintenanceRecords, getMaintenanceCounts } from '@/app/(main)/mecanica/actions'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mantenimiento de Vehículos y Transporte | Mecánica Inthaly OPS',
  description: 'Control de mantenimiento preventivo y correctivo para vehículos y transporte.',
}

export default async function MantenimientoVehiculosPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const [res, counts] = await Promise.all([
    getMaintenanceRecords('vehiculo'),
    getMaintenanceCounts()
  ])
  const initialItems = res.success && res.data ? res.data : []

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold">Cargando centro de mantenimiento...</div>}>
      <MaintenanceView
        title="Control de Mantenimiento de Vehículos y Transporte"
        subtitle="Control preventivo y correctivo para camionetas, camiones, volquetes y montacargas."
        equipmentType="vehiculo"
        defaultEquipmentName=""
        defaultEquipmentCode=""
        storageKey="vehiculos_mant"
        companyId={companyId}
        initialItems={initialItems}
        categoryCounts={counts}
        persistToServer={true}
      />
    </Suspense>
  )
}
