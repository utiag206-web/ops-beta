'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { getPendingOperations, updateOperationStatus, removeOperationFromQueue, replaceTemporaryIdInQueue } from '@/lib/offline-sync'

// Registry of handlers for different entities
type SyncHandlerResult = boolean | { success: boolean, newId?: string };
const syncHandlers: Record<string, (action: string, payload: any) => Promise<SyncHandlerResult>> = {}

export function registerSyncHandler(entity: string, handler: (action: string, payload: any) => Promise<SyncHandlerResult>) {
  syncHandlers[entity] = handler
}

interface OfflineContextType {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  triggerSync: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  pendingCount: 0,
  isSyncing: false,
  triggerSync: async () => {}
})

export const useOffline = () => useContext(OfflineContext)

import { initializeSyncHandlers } from '@/lib/sync-handlers'

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    initializeSyncHandlers()
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered successfully, scope:', reg.scope)
            reg.onupdatefound = () => {
              const installingWorker = reg.installing
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New Service Worker version installed.')
                  }
                }
              }
            }
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err)
          })
      }

      if (document.readyState === 'complete') {
        registerSW()
      } else {
        window.addEventListener('load', registerSW)
        return () => window.removeEventListener('load', registerSW)
      }
    }
  }, [])

  const updatePendingCount = useCallback(async () => {
    const pending = await getPendingOperations()
    setPendingCount(pending.length)
  }, [])

  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return
    
    setIsSyncing(true)
    try {
      const pending = await getPendingOperations()
      
      for (const op of pending) {
        const handler = syncHandlers[op.entity]
        if (handler) {
          await updateOperationStatus(op.id, 'SYNCING')
          try {
            const result = await handler(op.action, op.payload)
            const success = typeof result === 'object' ? result.success : result;
            
            if (success) {
              if (typeof result === 'object' && result.newId) {
                await replaceTemporaryIdInQueue(op.payload.id, result.newId)
              }
              await removeOperationFromQueue(op.id)
            } else {
              await updateOperationStatus(op.id, 'FAILED', 'Handler returned false')
            }
          } catch (error: any) {
            await updateOperationStatus(op.id, 'FAILED', error.message)
          }
        }
      }
    } finally {
      await updatePendingCount()
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, updatePendingCount])

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine)
    updatePendingCount()

    const handleOnline = () => {
      setIsOnline(true)
      triggerSync()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check queue periodically
    const interval = setInterval(updatePendingCount, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [triggerSync, updatePendingCount])

  return (
    <OfflineContext.Provider value={{ isOnline, pendingCount, isSyncing, triggerSync }}>
      {children}
      <OfflineIndicator isOnline={isOnline} pendingCount={pendingCount} isSyncing={isSyncing} />
    </OfflineContext.Provider>
  )
}

function OfflineIndicator({ isOnline, pendingCount, isSyncing }: { isOnline: boolean, pendingCount: number, isSyncing: boolean }) {
  const [showSynced, setShowSynced] = useState(false)

  useEffect(() => {
    if (isOnline && pendingCount === 0 && !isSyncing) {
      setShowSynced(true)
      const t = setTimeout(() => setShowSynced(false), 3000)
      return () => clearTimeout(t)
    }
  }, [isOnline, pendingCount, isSyncing])

  if (isOnline && pendingCount === 0 && !isSyncing && !showSynced) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs animate-in slide-in-from-bottom-5 bg-white border border-slate-200 text-slate-700">
            {!isOnline && (
        <span className="flex items-center gap-2 text-amber-600">
          <WifiOff size={16} /> Sin conexión · Trabajando sin conexión
        </span>
      )}
      
      {isOnline && isSyncing && (
        <span className="flex items-center gap-2 text-blue-600">
          <RefreshCw size={16} className="animate-spin" /> Sincronizando cambios...
        </span>
      )}

      {isOnline && !isSyncing && pendingCount > 0 && (
        <span className="flex items-center gap-2 text-slate-500">
          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{pendingCount}</span>
          Pendientes
        </span>
      )}

      {isOnline && !isSyncing && pendingCount === 0 && showSynced && (
        <span className="flex items-center gap-2 text-emerald-600 animate-in fade-in">
          <Wifi size={16} /> âœ“ Todo sincronizado
        </span>
      )}
    </div>
  )
}



