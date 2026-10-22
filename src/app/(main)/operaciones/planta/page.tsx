import { PlantDashboard } from '@/components/planta/plant-dashboard'
import { getPlantBatches, getPlantSamples } from './actions'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Control de Planta y Trazabilidad de Mineral | Inthaly OPS',
  description: 'Módulo de monitoreo de recepción en balanza, canchas de acopio, triaje de calidad y molienda de mineral en planta.'
}

export default async function PlantaBeneficioPage() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) redirect('/login')

  const { data: initialBatches } = await getPlantBatches()

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <PlantDashboard 
        companyId={extendedUser.active_company_id || extendedUser.company_id} 
        initialBatches={initialBatches || []}
        persistToServer={true}
      />
    </div>
  )
}
