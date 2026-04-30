export const dynamic = 'force-dynamic'

import { getWorkerDocuments } from './actions'
import { getWorkers } from '../workers/actions'
import { getUserSession } from '@/lib/auth'
import DocumentsClient from './documents-client'

export default async function DocumentsPage() {
  const [initialDocuments, workers, { extendedUser }] = await Promise.all([
    getWorkerDocuments(),
    getWorkers(),
    getUserSession()
  ])

  const userRole = extendedUser?.role_id || 'trabajador'

  return (
    <DocumentsClient 
      initialDocuments={initialDocuments} 
      workers={workers} 
      userRole={userRole} 
    />
  )
}
