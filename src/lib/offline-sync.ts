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

export interface OfflineAuthSession {
  key: 'current_session'
  user_id: string
  email: string
  role_id: string
  company_id: string | null
  active_company_id?: string | null
  company_name?: string
  company_slug?: string
  company_industry?: string
  is_impersonating?: boolean
  permissions: string[]
  operating_profile?: any
  worker_id?: string | null
  last_validated_online: string
  offline_expires_at: string
  schema_version: number
}

export interface CachedPlantBatch {
  id: string
  company_id: string
  batch_code: string
  truck_plate: string
  stage: string
  created_at: string
  updated_at?: string
  [key: string]: any
}

export interface CachedPlantSample {
  id: string
  batch_id: string
  sample_code?: string
  created_at: string
  [key: string]: any
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
  auth_session: {
    key: string
    value: OfflineAuthSession
  }
  plant_batches_cache: {
    key: string
    value: CachedPlantBatch
    indexes: {
      'by-company': string
    }
  }
  plant_samples_cache: {
    key: string
    value: CachedPlantSample
    indexes: {
      'by-batch': string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<InthalyDB>> | null = null

export function getDB() {
  if (typeof window === 'undefined') return null
  if (!dbPromise) {
    dbPromise = openDB<InthalyDB>('inthaly-ops-offline', 2, {
      upgrade(db, oldVersion) {
        // v1 store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' })
          store.createIndex('by-status', 'sync_status')
          store.createIndex('by-entity', 'entity')
        }
        // v2 stores for session & read cache
        if (!db.objectStoreNames.contains('auth_session')) {
          db.createObjectStore('auth_session', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('plant_batches_cache')) {
          const batchStore = db.createObjectStore('plant_batches_cache', { keyPath: 'id' })
          batchStore.createIndex('by-company', 'company_id')
        }
        if (!db.objectStoreNames.contains('plant_samples_cache')) {
          const sampleStore = db.createObjectStore('plant_samples_cache', { keyPath: 'id' })
          sampleStore.createIndex('by-batch', 'batch_id')
        }
      },
    })
  }
  return dbPromise
}

// ==========================================
// 1. SYNC QUEUE OPERATIONS
// ==========================================

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

// ==========================================
// 2. OFFLINE AUTH SESSION (TTL: 7 DAYS)
// ==========================================

const OFFLINE_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export async function saveOfflineSession(data: Omit<OfflineAuthSession, 'key' | 'last_validated_online' | 'offline_expires_at' | 'schema_version'>) {
  const db = await getDB()
  if (!db) return

  const now = new Date()
  const expiresAt = new Date(now.getTime() + OFFLINE_SESSION_TTL_MS)

  const sessionRecord: OfflineAuthSession = {
    ...data,
    key: 'current_session',
    last_validated_online: now.toISOString(),
    offline_expires_at: expiresAt.toISOString(),
    schema_version: 1
  }

  await db.put('auth_session', sessionRecord)
  return sessionRecord
}

export async function getOfflineSession(): Promise<OfflineAuthSession | null> {
  const db = await getDB()
  if (!db) return null
  const session = await db.get('auth_session', 'current_session')
  return session || null
}

export async function clearOfflineSession(): Promise<void> {
  const db = await getDB()
  if (!db) return
  await db.delete('auth_session', 'current_session')
}

export function isOfflineSessionValid(session: OfflineAuthSession | null): boolean {
  if (!session) return false
  if (!session.user_id || !session.role_id) return false
  
  const expiry = new Date(session.offline_expires_at).getTime()
  const now = Date.now()
  return now < expiry
}

// ==========================================
// 3. READ CACHE: PLANTA Y MINERAL
// ==========================================

export async function saveBatchesToCache(batches: CachedPlantBatch[], companyId: string): Promise<void> {
  const db = await getDB()
  if (!db || !batches || batches.length === 0) return

  const tx = db.transaction('plant_batches_cache', 'readwrite')
  for (const b of batches) {
    if (b && b.id && !b.id.startsWith('temp-')) {
      await tx.store.put({ ...b, company_id: companyId })
    }
  }
  await tx.done
}

export async function getCachedBatches(companyId: string): Promise<CachedPlantBatch[]> {
  const db = await getDB()
  if (!db) return []
  return db.getAllFromIndex('plant_batches_cache', 'by-company', companyId)
}

export async function updateBatchInCache(batchId: string, updates: Partial<CachedPlantBatch>): Promise<void> {
  const db = await getDB()
  if (!db) return
  const existing = await db.get('plant_batches_cache', batchId)
  if (existing) {
    await db.put('plant_batches_cache', { ...existing, ...updates })
  }
}

export async function saveSamplesToCache(samples: CachedPlantSample[], batchId: string): Promise<void> {
  const db = await getDB()
  if (!db || !samples || samples.length === 0) return

  const tx = db.transaction('plant_samples_cache', 'readwrite')
  for (const s of samples) {
    if (s && s.id && !s.id.startsWith('temp-')) {
      await tx.store.put({ ...s, batch_id: batchId })
    }
  }
  await tx.done
}

export async function getCachedSamples(batchId: string): Promise<CachedPlantSample[]> {
  const db = await getDB()
  if (!db) return []
  return db.getAllFromIndex('plant_samples_cache', 'by-batch', batchId)
}
