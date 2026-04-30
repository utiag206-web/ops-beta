export const dynamic = 'force-dynamic'

import { getMovements } from './actions'
import { getWorkers } from '../workers/actions'
import { getUserSession } from '@/lib/auth'
import MovementsClient from './movements-client'

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
