import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPermissionsByRole, hasPermission } from './permissions'

export const getUserSession = cache(async () => {
  try {
    const supabase = await createClient()
    
    // Debug cookies in Vercel
    if (process.env.NODE_ENV === 'production') {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const hasSession = cookieStore.getAll().some(c => c.name.includes('supabase-auth-token') || c.name.includes('sb-'))
      console.log("[AUTH_DEBUG] Has Supabase cookies:", hasSession)
    }
    
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    console.log("[AUTH_DEBUG] Supabase User:", user?.id, user?.email)
    if (user) {
      console.log("[AUTH_DEBUG] App Metadata:", user.app_metadata)
      console.log("[AUTH_DEBUG] User Metadata:", user.user_metadata)
    }

    if (authError || !user) {
      console.warn("[AUTH] No active session or auth error:", authError?.message)
      redirect('/login')
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role_id, area, company_id, worker_id')
        .eq('id', user.id)
        .single()

    console.log("[AUTH_DEBUG] DB User Data:", userData?.id, "Company:", userData?.company_id)

    if (userError || !userData) {
      console.error("[AUTH_DEBUG] Error fetching userData or user not found:", userError?.message)
      redirect('/login')
    }

    const rbacRole: string | null = userData?.role_id || null

    if (!rbacRole) {
      console.error("[AUTH_DENIED] No role_id found for user:", userData.email)
      throw new Error(`Acceso denegado: El usuario '${userData.email}' no tiene un rol asignado.`)
    }

    if (!userData.company_id) {
      console.error("[AUTH_DENIED] No company_id found for user:", userData.email)
      throw new Error(`Acceso denegado: El usuario '${userData.email}' no tiene una empresa asignada.`)
    }

    // Fetch company data
    const { data: companyData, error: compError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', userData.company_id)
      .single()
    
    if (compError) {
      console.error("[AUTH_DEBUG] Error fetching companyData:", compError.message)
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

export async function getStrictCompanyId(): Promise<string> {
  const { extendedUser } = await getUserSession()
  console.log("[STRICT_DEBUG] Company ID from session:", extendedUser?.company_id)
  if (!extendedUser?.company_id) {
    console.error("[STRICT_AUTH] missing company_id for session:", extendedUser?.email)
    throw new Error("Sesión inválida: No se encontró el ID de la empresa.")
  }
  return extendedUser.company_id
}

export async function requirePermission(moduleName: string) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser || !hasPermission(extendedUser.role_id as string, moduleName, extendedUser.area)) {
    throw new Error(`Acceso Denegado: No tienes permiso para ejecutar acciones en '${moduleName}'`)
  }
  return extendedUser
}
