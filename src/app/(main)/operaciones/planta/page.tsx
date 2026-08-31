import { PlantDashboard } from '@/components/planta/plant-dashboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Control de Planta y Trazabilidad de Mineral | Inthaly OPS',
  description: 'Módulo de monitoreo de recepción en balanza, canchas de acopio, triaje de calidad y molienda de mineral en planta.'
}

export default function PlantaBeneficioPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <PlantDashboard />
    </div>
  )
}
