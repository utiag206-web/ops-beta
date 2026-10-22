import { Suspense } from 'react'
import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getUserSession } from '@/lib/auth'
import { getMaintenanceRecords, getMaintenanceCounts } from '@/app/(main)/mecanica/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Fuel } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mantenimiento de Generador | Mecánica Inthaly OPS',
  description: 'Seguimiento de estado y mantenimiento del generador eléctrico.',
}

export default async function GeneradorMantenimientoPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const [res, counts] = await Promise.all([
    getMaintenanceRecords('generador'),
    getMaintenanceCounts()
  ])
  const initialItems = res.success && res.data ? res.data : []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/mecanica/generador-combustible"
          prefetch={false}
          className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Fuel size={15} />
          <span>Ir a Control de Combustible (Generador)</span>
        </Link>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold">Cargando generador eléctrico...</div>}>
        <MaintenanceView
          title="Seguimiento y Mantenimiento del Generador Eléctrico"
          subtitle="Control de horómetro, cambio de filtros, aceite y estado del grupo electrógeno."
          equipmentType="generador"
          defaultEquipmentName=""
          defaultEquipmentCode=""
          storageKey="generador_mant"
          companyId={companyId}
          initialItems={initialItems}
          categoryCounts={counts}
          persistToServer={true}
        />
      </Suspense>
    </div>
  )
}
