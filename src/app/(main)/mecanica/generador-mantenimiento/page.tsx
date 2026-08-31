import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mantenimiento de Generador | Mecánica Inthaly OPS',
  description: 'Seguimiento de estado y mantenimiento del generador eléctrico.',
}

export default async function GeneradorMantenimientoPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  return (
    <MaintenanceView
      title="Seguimiento y Mantenimiento del Generador Eléctrico"
      subtitle="Control de horómetro, cambio de filtros, aceite y estado del alternador."
      equipmentType="generador"
      defaultEquipmentName="Grupo Electrógeno Cummins 150 kVA"
      defaultEquipmentCode="GEN-01"
      storageKey="generador_mant"
    />
  )
}
