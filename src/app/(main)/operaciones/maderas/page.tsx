import { getWoodRecords } from '../actions'
import { getWarehouses } from '@/app/(main)/inventory/actions'
import { getUserSession } from '@/lib/auth'
import MaderasClient from './maderas-client'

export const dynamic = 'force-dynamic'

export default async function MaderasPage() {
  const [initialRecords, { extendedUser }, warehousesData] = await Promise.all([
    getWoodRecords(),
    getUserSession(),
    getWarehouses()
  ])

  return (
    <MaderasClient 
      initialRecords={initialRecords} 
      userRole={extendedUser?.role_id || 'operaciones'} 
      warehouses={warehousesData.data || []}
    />
  )
}
