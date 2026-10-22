import { FuelView } from '@/components/mecanica/fuel-view'
import { getUserSession } from '@/lib/auth'
import { getFuelRecords } from '@/app/(main)/mecanica/actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Combustible de Generador | Mecánica Inthaly OPS',
  description: 'Control de consumo de combustible del generador eléctrico.',
}

export default async function GeneradorCombustiblePage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const { data: initialRecords } = await getFuelRecords('generador')

  return (
    <FuelView
      title="Control de Combustible del Generador Eléctrico"
      subtitle="Registro de diésel cargado, horas de operación y consumo promedio (gal/hr)."
      defaultEquipmentName="Grupo Electrógeno"
      defaultEquipmentCode="GEN-01"
      equipmentType="generador"
      storageKey="generador"
      companyId={companyId}
      initialRecords={initialRecords || []}
      persistToServer={true}
    />
  )
}
