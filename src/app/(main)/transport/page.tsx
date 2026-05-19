import { getTransportPayments } from './actions'
import { getWorkers } from '../workers/actions'

export const dynamic = 'force-dynamic'
import { TransportList } from '@/components/transport/transport-list'
import { AddTransportContainer } from '@/components/transport/add-transport-container'
import { Bus } from 'lucide-react'

export default async function TransportPage() {
  const [payments, workers] = await Promise.all([
    getTransportPayments(),
    getWorkers()
  ])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Pasajes</h1>
          <p className="text-slate-500">Seguimiento de pagos de transporte al personal</p>
        </div>
        <AddTransportContainer workers={workers} />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bus className="text-indigo-500" size={20} />
            Pagos de Transporte
          </h2>
        </div>
        <TransportList payments={payments} />
      </div>
    </div>
  )
}
