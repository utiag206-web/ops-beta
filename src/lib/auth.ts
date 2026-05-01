import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPermissionsByRole, hasPermission } from './permissions'

export const getUserSession = cache(async () => {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn("[AUTH] No active session or auth error:", authError?.message)
      if (authError) console.error("[AUTH_DEBUG] Full error:", authError)
      redirect('/login')
    }

    console.log("[AUTH_DEBUG] User authenticated:", user.email)

    // [STRICT_RBAC_V2] Solo usamos la tabla 'users' y el campo 'role_id'
    
    
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role_id, area, company_id, worker_id')
        .eq('id', user.id)
        .single()

    if (userError) {
      console.error("[AUTH_DEBUG] Error fetching userData:", userError.message)
    }

    // El rbacRole DEBE venir de userData.role_id obligatoriamente
    const rbacRole: string | null = userData?.role_id || null

    if (!rbacRole && userData) {
      console.error("[AUTH_DENIED] No role_id found for user:", userData.email)
      throw new Error(`Acceso denegado: El usuario '${userData.email}' no tiene un rol asignado.`)
    }

    // Fetch company data if company_id is present
    let companyData = null
    if (userData?.company_id) {
      const { data, error: compError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', userData.company_id)
        .single()
      
      if (compError) console.error("[AUTH_DEBUG] Error fetching companyData:", compError.message)
      companyData = data
    }

    const finalExtendedUser = {
      ...userData,
      companies: companyData,
      role_id: rbacRole,
      area: userData?.area || null,
      permissions: rbacRole ? getPermissionsByRole(rbacRole, userData?.area) : []
    }

    return {
      user,
      extendedUser: finalExtendedUser as any,
    }
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) throw error
    console.error("[CRITICAL_AUTH_ERROR]:", error)
    throw error
  }
})

export async function requirePermission(moduleName: string) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser || !hasPermission(extendedUser.role_id as string, moduleName, extendedUser.area)) {
    throw new Error(`Acceso Denegado: No tienes permiso para ejecutar acciones en '${moduleName}'`)
  }
  return extendedUser
}
