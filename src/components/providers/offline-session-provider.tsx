'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { 
  saveOfflineSession, 
  getOfflineSession, 
  clearOfflineSession, 
  isOfflineSessionValid, 
  OfflineAuthSession 
} from '@/lib/offline-sync'
import { ShieldAlert, RefreshCw, Wifi } from 'lucide-react'

interface OfflineSessionContextType {
  user: any | null
  isOffline: boolean
  isSessionValid: boolean
  isExpired: boolean
  revalidateOnlineSession: () => Promise<boolean>
}

const OfflineSessionContext = createContext<OfflineSessionContextType>({
  user: null,
  isOffline: false,
  isSessionValid: true,
  isExpired: false,
  revalidateOnlineSession: async () => true,
})

export const useOfflineSession = () => useContext(OfflineSessionContext)

export function OfflineSessionProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser?: any
}) {
  const [currentUser, setCurrentUser] = useState<any | null>(initialUser || null)
  const [isOffline, setIsOffline] = useState(false)
  const [isSessionValid, setIsSessionValid] = useState(true)
  const [isExpired, setIsExpired] = useState(false)

  // 1. Revalidate online session against server /api/auth/validate
  const revalidateOnlineSession = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return true

    try {
      const res = await fetch('/api/auth/validate')
      if (res.status === 403 || res.status === 401) {
        console.warn('[AUTH_REVALIDATE] Session was revoked or unauthenticated on server. Clearing local session.')
        await clearOfflineSession()
        window.location.href = '/login?error=revoked'
        return false
      }
      return res.ok
    } catch (e) {
      // Network hiccup during online check
      return true
    }
  }, [])

  // 2. Initialize and synchronize local session snapshot
  useEffect(() => {
    const handleConnectivity = () => {
      setIsOffline(!navigator.onLine)
      if (navigator.onLine) {
        revalidateOnlineSession()
      }
    }

    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleConnectivity)
    window.addEventListener('offline', handleConnectivity)

    // A. ONLINE: Save/update offline session snapshot from authenticated SSR user
    if (initialUser && navigator.onLine) {
      setCurrentUser(initialUser)
      setIsSessionValid(true)
      setIsExpired(false)

      const permissionsList = Array.isArray(initialUser.permissions)
        ? initialUser.permissions
        : (initialUser.resolved_permissions ? Object.keys(initialUser.resolved_permissions) : [])

      saveOfflineSession({
        user_id: initialUser.id,
        email: initialUser.email,
        role_id: initialUser.role_id,
        company_id: initialUser.company_id || null,
        active_company_id: initialUser.active_company_id || null,
        company_name: initialUser.companies?.name,
        company_slug: initialUser.companies?.slug,
        company_industry: initialUser.company_industry || initialUser.companies?.industry,
        is_impersonating: initialUser.is_impersonating || false,
        permissions: permissionsList,
        operating_profile: initialUser.operating_profile,
        worker_id: initialUser.worker_id || null,
      }).catch((err) => {
        console.warn('[OFFLINE_SESSION] Could not save offline snapshot:', err)
      })
    }

    // B. OFFLINE / FALLBACK: Recover session from IndexedDB if initialUser is missing or network is down
    if (!navigator.onLine || !initialUser) {
      getOfflineSession().then((cachedSession) => {
        if (cachedSession) {
          const valid = isOfflineSessionValid(cachedSession)
          if (valid) {
            console.log('[OFFLINE_SESSION] Recovered valid local session for:', cachedSession.email)
            setCurrentUser({
              id: cachedSession.user_id,
              email: cachedSession.email,
              role_id: cachedSession.role_id,
              company_id: cachedSession.company_id,
              active_company_id: cachedSession.active_company_id,
              companies: {
                id: cachedSession.company_id,
                name: cachedSession.company_name,
                slug: cachedSession.company_slug,
                industry: cachedSession.company_industry,
              },
              company_industry: cachedSession.company_industry,
              permissions: cachedSession.permissions,
              operating_profile: cachedSession.operating_profile,
              is_impersonating: cachedSession.is_impersonating,
              worker_id: cachedSession.worker_id,
            })
            setIsSessionValid(true)
            setIsExpired(false)
          } else {
            console.warn('[OFFLINE_SESSION] Local session expired or invalid.')
            setIsSessionValid(false)
            setIsExpired(true)
          }
        } else if (!initialUser) {
          setIsSessionValid(false)
        }
      })
    }

    return () => {
      window.removeEventListener('online', handleConnectivity)
      window.removeEventListener('offline', handleConnectivity)
    }
  }, [initialUser, revalidateOnlineSession])

  // If session is expired offline, block with clear security warning
  if (isExpired && isOffline) {
    return (
      <div id="offline-session-expired-modal" className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert size={30} />
          </div>
          <h2 className="text-xl font-bold text-white">Sesión Offline Caducada</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Por política de seguridad empresarial, tu sesión offline ha superado el tiempo máximo de validez (7 días). Conéctate a Internet para revalidar tus credenciales.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all"
          >
            <RefreshCw size={16} /> Reintentar Conexión
          </button>
        </div>
      </div>
    )
  }

  return (
    <OfflineSessionContext.Provider
      value={{
        user: currentUser,
        isOffline,
        isSessionValid,
        isExpired,
        revalidateOnlineSession,
      }}
    >
      {children}
    </OfflineSessionContext.Provider>
  )
}
