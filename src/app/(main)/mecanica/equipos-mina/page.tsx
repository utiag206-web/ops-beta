import { Suspense } from 'react'
import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getMaintenanceRecords, getMaintenanceCounts } from '@/app/(main)/mecanica/actions'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Equipos de Mina | Mecánica Inthaly OPS',
  description: 'Mantenimiento y reparación de equipos pesados de interior mina y superficie.',
}

export default async function EquiposMinaPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const [res, counts] = await Promise.all([
    getMaintenanceRecords('equipo_mina'),
    getMaintenanceCounts()
  ])
  const initialItems = res.success && res.data ? res.data : []

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold">Cargando equipos de mina...</div>}>
      <MaintenanceView
        title="Mantenimiento y Reparación de Equipos de Mina"
        subtitle="Control preventivo, correctivo y órdenes de taller para Scooptrams, Dumpers, Winches y Perforadoras."
        equipmentType="equipo_mina"
        defaultEquipmentName=""
        defaultEquipmentCode=""
        storageKey="equipos_mina_mant"
        companyId={companyId}
        initialItems={initialItems}
        categoryCounts={counts}
        persistToServer={true}
      />
    </Suspense>
  )
}
