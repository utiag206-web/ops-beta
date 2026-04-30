export const dynamic = 'force-dynamic'

import { getWorkCycles } from './actions'
import { getWorkers } from '../workers/actions'
import { getUserSession } from '@/lib/auth'
import TareoClient from './tareo-client'

export default async function TareoPage() {
  const [initialCycles, workers, { extendedUser }] = await Promise.all([
    getWorkCycles(),
    getWorkers(),
    getUserSession()
  ])

  return (
    <TareoClient 
      initialCycles={initialCycles} 
      workers={workers} 
      userRole={extendedUser?.role_id || 'worker'} 
    />
  )
}
