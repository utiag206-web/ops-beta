import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getUserSession } from '@/lib/auth'
import { getMaintenanceRecords } from '@/app/(main)/mecanica/actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mantenimiento de Compresora | Mecánica Inthaly OPS',
  description: 'Seguimiento de estado y mantenimiento de la compresora de aire.',
}

export default async function CompresoraMantenimientoPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const { data: initialItems } = await getMaintenanceRecords('compresora')

  return (
    <MaintenanceView
      title="Seguimiento y Mantenimiento de la Compresora"
      subtitle="Presión PSI, cambio de aceite de tornillo, filtros de aire y estado de correas."
      equipmentType="compresora"
      defaultEquipmentName="Compresora de Aire"
      defaultEquipmentCode="COMP-01"
      storageKey="compresora_mant"
      companyId={companyId}
      initialItems={initialItems || []}
      persistToServer={true}
    />
  )
}
