import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Equipos de Mina | Mecánica Inthaly OPS',
  description: 'Mantenimiento y reparación de equipos de mina.',
}

export default async function EquiposMinaPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  return (
    <MaintenanceView
      title="Mantenimiento y Reparación de Equipos de Mina"
      subtitle="Control de Scoops, Dumpers, Winches de arrastre y Perforadoras neumáticas/hidráulicas."
      equipmentType="equipo_mina"
      defaultEquipmentName="Scooptram Wagner 1.5 yd"
      defaultEquipmentCode="SCP-01"
      storageKey="equipos_mina"
    />
  )
}
