import { getWorkerDocuments } from './actions'
import { getWorkers } from '../workers/actions'
import { getUserSession, getActiveViewMode } from '@/lib/auth'
import DocumentsClient from './documents-client'

export const dynamic = 'force-dynamic'

export default async function DocumentsPage() {
 const viewMode = await getActiveViewMode()
 const { extendedUser } = await getUserSession()
 const userRole = extendedUser?.role_id?.toLowerCase() || 'trabajador'
 const isWorker = userRole === 'trabajador' || viewMode === 'WORKER'

 const [initialDocuments, workers] = await Promise.all([
 getWorkerDocuments(),
 isWorker ? Promise.resolve([]) : getWorkers('active')
 ])

 const effectiveRole = isWorker ? 'trabajador' : userRole

 return (
 <DocumentsClient 
 initialDocuments={initialDocuments} 
 workers={workers} 
 userRole={effectiveRole} 
 />
 )
}
