import { FuelView } from '@/components/mecanica/fuel-view'
import { getUserSession } from '@/lib/auth'
import { getFuelRecords } from '@/app/(main)/mecanica/actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Combustible de Compresora | Mecánica Inthaly OPS',
  description: 'Control de combustible de la compresora.',
}

export default async function CompresoraCombustiblePage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const { data: initialRecords } = await getFuelRecords('compresora')

  return (
    <FuelView
      title="Control de Combustible de la Compresora"
      subtitle="Registro de diésel cargado, horas de operación de compresor y rendimiento."
      defaultEquipmentName="Compresora de Aire"
      defaultEquipmentCode="COMP-01"
      equipmentType="compresora"
      storageKey="compresora"
      companyId={companyId}
      initialRecords={initialRecords || []}
      persistToServer={true}
    />
  )
}
