'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { deserializeFromArray, can as engineCan, canModule as engineCanModule } from '@/lib/rbac/engine'
import type { Module, Action, ResolvedPermissions } from '@/lib/rbac/types'

interface RbacContextType {
 role_id: string | undefined;
 permissions: string[];
 isAdmin: boolean;
 user: any;
 isImpersonating: boolean;
 hasAccess: (module: string) => boolean;
 // RBAC Granular V1: can() para verificar acciones específicas
 can: (module: Module, action: Action) => boolean;
 // ResolvedPermissions para consultas avanzadas (opcional)
 resolved: ResolvedPermissions | null;
}

const RbacContext = createContext<RbacContextType | undefined>(undefined)

export function RbacProvider({ 
 children, 
 role_id, 
 permissions,
 user
}: { 
 children: React.ReactNode; 
 role_id?: string; 
 permissions?: string[] 
 user?: any
}) {
 const value = useMemo(() => {
 const currentRoleId = role_id
 const currentPermissions = permissions || []
 const isAdmin = currentPermissions.includes('*') || currentRoleId === 'admin'
 
 // Reconstruir ResolvedPermissions desde el array serializado en sesión
 const resolved = currentPermissions.length > 0
   ? deserializeFromArray(currentPermissions)
   : null

 return {
 role_id: currentRoleId,
 permissions: currentPermissions,
 isAdmin,
 user,
 isImpersonating: !!user?.is_impersonating,
 
 // hasAccess: compatibilidad con el sistema actual (por módulo)
 hasAccess: (module: string) => {
 if (!module || module === 'dashboard' || module === 'profile') return true
 if (!currentRoleId) return false
 return isAdmin || currentPermissions.includes(module)
 },
 
 // can(): granular — verifica si el usuario puede realizar una acción en un módulo
 can: (module: Module, action: Action): boolean => {
   if (!currentRoleId) return false
   if (isAdmin) return true
   if (!resolved) return false
   return engineCan(resolved, module, action)
 },

 resolved,
 }
 }, [role_id, permissions, user])

 return (
 <RbacContext.Provider value={value}>
 {children}
 </RbacContext.Provider>
 )
}

export function useRbac() {
 const context = useContext(RbacContext)
 if (context === undefined) {
 throw new Error('useRbac must be used within an RbacProvider')
 }
 return context
}

export const useUserRole = useRbac

// Re-export tipos para uso cómodo en componentes
export type { Module, Action }
