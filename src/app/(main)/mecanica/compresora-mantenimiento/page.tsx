import { Suspense } from 'react'
import { MaintenanceView } from '@/components/mecanica/maintenance-view'
import { getUserSession } from '@/lib/auth'
import { getMaintenanceRecords, getMaintenanceCounts } from '@/app/(main)/mecanica/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Fuel } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mantenimiento de Compresora | Mecánica Inthaly OPS',
  description: 'Seguimiento de estado y mantenimiento de la compresora de aire.',
}

export default async function CompresoraMantenimientoPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const companyId = extendedUser.active_company_id || extendedUser.company_id
  const [res, counts] = await Promise.all([
    getMaintenanceRecords('compresora'),
    getMaintenanceCounts()
  ])
  const initialItems = res.success && res.data ? res.data : []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/mecanica/compresora-combustible"
          prefetch={false}
          className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Fuel size={15} />
          <span>Ir a Control de Combustible (Compresora)</span>
        </Link>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold">Cargando compresora...</div>}>
        <MaintenanceView
          title="Seguimiento y Mantenimiento de la Compresora"
          subtitle="Presión PSI, cambio de aceite de tornillo, filtros de aire y estado de correas."
          equipmentType="compresora"
          defaultEquipmentName=""
          defaultEquipmentCode=""
          storageKey="compresora_mant"
          companyId={companyId}
          initialItems={initialItems}
          categoryCounts={counts}
          persistToServer={true}
        />
      </Suspense>
    </div>
  )
}
