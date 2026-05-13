import { cache } from 'react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPermissionsByRole, hasPermission } from './permissions'
import { cookies } from 'next/headers'

export async function getUserSession() {
  try {
    const cookieStore = await cookies()
    const activeCompanyId = cookieStore.get('active_company_id')?.value
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/login')
    }

    const adminSupabase = await createAdminClient()
    const { data: userData, error: userError } = await adminSupabase
        .from('users')
        .select('*, companies(id, name), workers(id, status)')
        .eq('id', user.id)
        .maybeSingle()

    if (userError || !userData) {
      console.error(`[AUTH] 🚨 ORPHAN USER: Auth exists but profile missing for ${user.id}`)
      return { user, extendedUser: null }
    }

    // Role Resolution
    const rawRoleId = String(userData?.role_id || userData?.role || '').toLowerCase()
    let rbacRole: string = 'trabajador'

    if (rawRoleId === 'super_admin' || rawRoleId === 'superadmin') {
      rbacRole = 'super_admin'
    } else {
      rbacRole = rawRoleId || 'trabajador'
    }

    const isSuperAdmin = rbacRole === 'super_admin'
    
    // CRITICAL: Super Admin is GLOBAL by default. 
    // Only use a company context if explicitly impersonating via cookie.
    const finalCompanyId = isSuperAdmin ? (activeCompanyId || null) : userData.company_id
    const impersonating = !!(isSuperAdmin && activeCompanyId)
    
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)

    // Company Data Fetching (Only if impersonating, otherwise use joined data)
    let companyData = userData.companies
    if (impersonating && finalCompanyId && isUuid(finalCompanyId) && finalCompanyId !== userData.company_id) {
      const { data: comp } = await adminSupabase
        .from('companies')
        .select('id, name')
        .eq('id', finalCompanyId)
        .single()
      companyData = comp
    }

    const extendedUser = {
      id: user.id,
      email: userData.email || user.email || '',
      name: userData.name || 'Usuario',
      role_id: rbacRole,
      area: (userData as any)?.area || null,
      company_id: (userData as any)?.company_id || null,
      worker_id: (userData as any)?.worker_id || null,
      worker_status: (userData as any)?.workers?.status || null,
      permissions: getPermissionsByRole(rbacRole, (userData as any)?.area),
      active_company_id: finalCompanyId,
      companies: companyData,
      is_impersonating: impersonating,
      display_name: '',
      display_email: '',
      is_view_only: false
    }

    // Identity Masking for Super Admin (Display Only)
    if (impersonating) {
      const safeName = companyData?.name || 'Sistema'
      extendedUser.display_name = `Administrador (${safeName})`
      extendedUser.display_email = `soporte@${safeName.toLowerCase().replace(/\s+/g, '')}.com`
    } else {
      extendedUser.display_name = extendedUser.name
      extendedUser.display_email = extendedUser.email
    }

    return { user, extendedUser }

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) throw error
    console.error("[AUTH_CRITICAL_ERROR]:", error.message)
    throw error
  }
}

export async function getStrictCompanyId(): Promise<string> {
  const { extendedUser } = await getUserSession()
  const isSuperAdmin = extendedUser?.role_id === 'super_admin'
  
  if (isSuperAdmin && !extendedUser.is_impersonating) {
    throw new Error("El Super Admin debe impersonar una empresa para esta acción.")
  }

  const cid = extendedUser?.active_company_id || extendedUser?.company_id
  
  const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)

  if (!cid || !isUuid(String(cid))) {
    console.error(`[AUTH_STRICT] 🚨 Invalid Company ID: ${cid} for user ${extendedUser?.id}`)
    throw new Error("Contexto de empresa inválido o no encontrado. Por favor, re-inicia sesión.")
  }
  
  return String(cid)
}

export async function requirePermission(moduleName: string) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser || !hasPermission(extendedUser.role_id, moduleName, extendedUser.area)) {
    throw new Error(`Acceso Denegado a '${moduleName}'`)
  }
  return extendedUser
}

export function applyIsolation(query: any, companyId: string | null, role: string) {
  const normalizedRole = role?.toLowerCase()
  const isSuperAdmin = normalizedRole === 'super_admin' || normalizedRole === 'superadmin'
  
  const isUuid = (val: string | null) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)

  // 1. Si es Super Admin y no hay ID de empresa, permitir consulta global (ej. lista de empresas)
  if (isSuperAdmin && !companyId) {
    return query
  }

  // 2. Si NO es Super Admin y no hay ID de empresa válido, BLOQUEAR retornando nada
  if (!isUuid(companyId)) {
    console.error(`[ISOLATION_FAILURE] 🚨 Attempted query without valid company_id. Role: ${role}`)
    // Forzamos un filtro que siempre sea falso para evitar retornar datos
    return query.eq('id', '00000000-0000-0000-0000-000000000000') 
  }

  // 3. Aplicar filtro estricto
  return query.eq('company_id', companyId)
}
