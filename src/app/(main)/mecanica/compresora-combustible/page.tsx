import { FuelView } from '@/components/mecanica/fuel-view'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Combustible de Compresora | Mecánica Inthaly OPS',
  description: 'Control de combustible de la compresora.',
}

export default async function CompresoraCombustiblePage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  return (
    <FuelView
      title="Control de Combustible de la Compresora"
      subtitle="Registro de diésel cargado, horas de operación de compresor y rendimiento."
      defaultEquipmentName="Compresor de Tornillo Sullair 375 CFM"
      defaultEquipmentCode="COMP-01"
      storageKey="compresora"
    />
  )
}
