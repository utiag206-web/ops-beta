export const dynamic = 'force-dynamic'

import { getPPEDeliveries } from './actions'
import { getWorkers } from '../workers/actions'
import { getUserSession } from '@/lib/auth'
import { PPEList } from '@/components/ppe/ppe-list'
import { AddPPEContainer } from '@/components/ppe/add-ppe-container' 
import { Shield } from 'lucide-react'

export default async function PPEPage() {
  const { extendedUser } = await getUserSession()
  const isWorker = extendedUser?.role_id === 'trabajador'

  const [deliveries, workers] = await Promise.all([
    getPPEDeliveries(),
    isWorker ? Promise.resolve([]) : getWorkers()
  ])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de EPP</h1>
          <p className="text-slate-500">Gestión de Equipos de Protección Personal entregados</p>
        </div>
        {!isWorker && <AddPPEContainer workers={workers} />}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Shield className="text-blue-600" size={20} />
              {isWorker ? 'Mi Historial de EPP' : 'Historial de Entregas Global'}
            </h2>
          </div>
          <PPEList deliveries={deliveries} isWorker={isWorker} />
        </div>
      </div>
    </div>
  )
}
