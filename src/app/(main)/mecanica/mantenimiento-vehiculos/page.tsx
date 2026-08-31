import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mantenimiento de Vehículos | Mecánica Inthaly OPS',
  description: 'Control de mantenimiento de equipos y vehículos livianos y pesados.',
}

export default async function MantenimientoVehiculosPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  return (
    <MaintenanceView
      title="Control de Mantenimiento de Vehículos"
      subtitle="Gestión preventiva y correctiva de camionetas 4x4, volquetes y maquinaria pesada."
      equipmentType="vehiculo"
      defaultEquipmentName="Camioneta Toyota Hilux 4x4"
      defaultEquipmentCode="VH-01"
      storageKey="vehiculos"
    />
  )
}
