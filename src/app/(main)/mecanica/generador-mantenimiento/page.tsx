import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getUserSession } from '@/lib/auth'
import { getMaintenanceRecords } from '@/app/(main)/mecanica/actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mantenimiento de Generador | Mecánica Inthaly OPS',
  description: 'Seguimiento de estado y mantenimiento del generador eléctrico.',
}

export default async function GeneradorMantenimientoPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const { data: initialItems } = await getMaintenanceRecords('generador')

  return (
    <MaintenanceView
      title="Seguimiento y Mantenimiento del Generador Eléctrico"
      subtitle="Control de horómetro, cambio de filtros, aceite y estado del grupo electrógeno."
      equipmentType="generador"
      defaultEquipmentName="Grupo Electrógeno"
      defaultEquipmentCode="GEN-01"
      storageKey="generador_mant"
      companyId={companyId}
      initialItems={initialItems || []}
      persistToServer={true}
    />
  )
}
