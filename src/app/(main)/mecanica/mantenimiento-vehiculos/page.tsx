import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getUserSession } from '@/lib/auth'
import { getMaintenanceRecords } from '@/app/(main)/mecanica/actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mantenimiento de Vehículos | Mecánica Inthaly OPS',
  description: 'Control de mantenimiento de equipos y vehículos livianos y pesados.',
}

export default async function MantenimientoVehiculosPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const { data: initialItems } = await getMaintenanceRecords('vehiculo')

  return (
    <MaintenanceView
      title="Control de Mantenimiento de Vehículos"
      subtitle="Gestión preventiva y correctiva de camionetas, volquetes y unidades de transporte."
      equipmentType="vehiculo"
      defaultEquipmentName=""
      defaultEquipmentCode=""
      storageKey="vehiculos"
      companyId={companyId}
      initialItems={initialItems || []}
      persistToServer={true}
    />
  )
}
