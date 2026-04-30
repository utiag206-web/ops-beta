export const dynamic = 'force-dynamic'

import { getCampRooms } from './actions'
import { getWorkers } from '../workers/actions'
import { getUserSession } from '@/lib/auth'
import CampClient from './camp-client'

export default async function CampPage() {
  const [initialRooms, workers, { extendedUser }] = await Promise.all([
    getCampRooms(),
    getWorkers(),
    getUserSession()
  ])

  return (
    <CampClient 
      initialRooms={initialRooms} 
      workers={workers} 
      userRole={extendedUser?.role_id || 'worker'} 
    />
  )
}
