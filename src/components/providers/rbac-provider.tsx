'use client'

import React, { createContext, useContext, useMemo } from 'react'

interface RbacContextType {
  role_id: string | undefined;
  permissions: string[];
  isAdmin: boolean;
  user: any;
  hasAccess: (module: string) => boolean;
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
    
    return {
      role_id: currentRoleId,
      permissions: currentPermissions,
      isAdmin,
      user,
      hasAccess: (module: string) => {
        if (!module || module === 'dashboard' || module === 'profile') return true
        if (!currentRoleId) return false
        return isAdmin || currentPermissions.includes(module)
      }
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
