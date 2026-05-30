import { getWorkCycles } from './actions'
import { getWorkersShort } from '../workers/actions'
import { getUserSession } from '@/lib/auth'
import TareoClient from './tareo-client'

export const dynamic = 'force-dynamic'

export default async function TareoPage() {
  const [initialCycles, workers, { extendedUser }] = await Promise.all([
    getWorkCycles(),
    getWorkersShort(),
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
