import { FuelView } from '@/components/mecanica/fuel-view'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Combustible de Generador | Mecánica Inthaly OPS',
  description: 'Control de consumo de combustible del generador eléctrico.',
}

export default async function GeneradorCombustiblePage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  return (
    <FuelView
      title="Control de Combustible del Generador Eléctrico"
      subtitle="Registro de diésel cargado, horas de operación y consumo promedio (gal/hr)."
      defaultEquipmentName="Grupo Electrógeno Cummins 150 kVA"
      defaultEquipmentCode="GEN-01"
      storageKey="generador"
    />
  )
}
