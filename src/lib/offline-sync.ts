import { openDB, DBSchema, IDBPDatabase } from 'idb'

export interface SyncOperation {
  id: string
  entity: string
  action: string
  payload: any
  created_at: string
  sync_status: 'PENDING' | 'SYNCING' | 'FAILED'
  retry_count: number
  last_error?: string
  company_id: string
}

interface InthalyDB extends DBSchema {
  sync_queue: {
    key: string
    value: SyncOperation
    indexes: {
      'by-status': string
      'by-entity': string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<InthalyDB>> | null = null

export function getDB() {
  if (typeof window === 'undefined') return null
  if (!dbPromise) {
    dbPromise = openDB<InthalyDB>('inthaly-ops-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' })
          store.createIndex('by-status', 'sync_status')
          store.createIndex('by-entity', 'entity')
        }
      },
    })
  }
  return dbPromise
}

export async function addOperationToQueue(operation: Omit<SyncOperation, 'sync_status' | 'retry_count' | 'created_at'>) {
  const db = await getDB()
  if (!db) return

  const fullOperation: SyncOperation = {
    ...operation,
    sync_status: 'PENDING',
    retry_count: 0,
    created_at: new Date().toISOString()
  }

  await db.put('sync_queue', fullOperation)
  return fullOperation
}

export async function getPendingOperations() {
  const db = await getDB()
  if (!db) return []
  return db.getAllFromIndex('sync_queue', 'by-status', 'PENDING')
}

export async function updateOperationStatus(id: string, status: SyncOperation['sync_status'], error?: string) {
  const db = await getDB()
  if (!db) return

  const op = await db.get('sync_queue', id)
  if (op) {
    op.sync_status = status
    if (error) {
      op.last_error = error
      op.retry_count += 1
    }
    await db.put('sync_queue', op)
  }
}

export async function removeOperationFromQueue(id: string) {
  const db = await getDB()
  if (!db) return
  await db.delete('sync_queue', id)
}

export async function replaceTemporaryIdInQueue(tempId: string, realId: string) {
  const db = await getDB()
  if (!db) return
  
  const ops = await db.getAll('sync_queue')
  for (const op of ops) {
    let modified = false
    
    if (op.payload?.id === tempId) {
      op.payload.id = realId
      modified = true
    }
    
    if (op.payload?.updates?.id === tempId) {
      op.payload.updates.id = realId
      modified = true
    }
    
    if (op.payload?.batch_id === tempId) {
      op.payload.batch_id = realId
      modified = true
    }
    
    if (op.payload?.updates?.batch_id === tempId) {
      op.payload.updates.batch_id = realId
      modified = true
    }
    
    if (modified) {
      await db.put('sync_queue', op)
    }
  }
}