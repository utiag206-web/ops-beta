import { getBonuses } from './actions'
import { getWorkersShort } from '../workers/actions'
import { getUserSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
import { BonusList } from '@/components/bonuses/bonus-list'
import { AddBonusContainer } from '@/components/bonuses/add-bonus-container'
import { Coins, LayoutGrid } from 'lucide-react'

export default async function BonusesPage() {
  const { extendedUser } = await getUserSession()
  const isWorker = extendedUser?.role_id === 'trabajador'

  const [bonuses, workers] = await Promise.all([
    getBonuses(),
    isWorker ? Promise.resolve([]) : getWorkersShort()
  ])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Bonos</h1>
          <p className="text-slate-500">Historial y registro de bonificaciones para el personal</p>
        </div>
        {!isWorker && <AddBonusContainer workers={workers} />}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Coins className="text-amber-500" size={20} />
            {isWorker ? 'Mi Historial de Bonificaciones' : 'Bonificaciones Registradas'}
          </h2>
        </div>
        <BonusList bonuses={bonuses} isAdmin={!isWorker} isWorker={isWorker} />
      </div>
    </div>
  )
}
