import { getProductionRecords } from '../actions'
import { getWarehouses } from '@/app/(main)/inventory/actions'
import { getUserSession } from '@/lib/auth'
import ProduccionClient from './produccion-client'

export const dynamic = 'force-dynamic'

export default async function ProduccionPage() {
 const [initialRecords, { extendedUser }, warehousesData] = await Promise.all([
 getProductionRecords(),
 getUserSession(),
 getWarehouses()
 ])

 return (
 <ProduccionClient 
 initialRecords={initialRecords} 
 userRole={extendedUser?.role_id || 'operaciones'} 
 warehouses={warehousesData.data || []}
 />
 )
}
