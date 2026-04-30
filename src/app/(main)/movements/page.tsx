import { getMovements } from './actions'
import { getWorkers } from '../workers/actions'
import { getUserSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'
import MovementsClient from './movements-client'

export const dynamic = 'force-dynamic'

export default async function MovementsPage() {
  const [initialMovements, workers, { extendedUser }] = await Promise.all([
    getMovements(),
    getWorkers(),
    getUserSession()
  ])

  return (
    <MovementsClient 
      initialMovements={initialMovements} 
      workers={workers} 
      userRole={extendedUser?.role_id || 'worker'} 
    />
  )
}
