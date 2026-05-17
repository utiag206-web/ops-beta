import { cache } from 'react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPermissionsByRole, hasPermission } from './permissions'
import { cookies } from 'next/headers'

export const getUserSession = cache(async function getUserSession() {
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
        .select('*, companies(id, name, logo_url), workers(id, status)')
        .eq('id', user.id)
        .maybeSingle()

    if (userError || !userData) {
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
    
    const finalCompanyId = isSuperAdmin ? (activeCompanyId || null) : userData.company_id
    const impersonating = !!(isSuperAdmin && activeCompanyId)
    
    // FETCH TENANT MEMBERSHIP
    let tenantRole = rbacRole
    let tenantArea = (userData as any)?.area || null
    
    if (finalCompanyId) {
      const { data: membership } = await adminSupabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user.id)
        .eq('company_id', finalCompanyId)
        .maybeSingle()
        
      if (membership) {
        tenantRole = membership.role_id || tenantRole
        // Area is currently in users table, but conceptually belongs to membership.
        // We'll keep it as is for now unless there's a specific company_members table.
      }
    }
    
    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)

    // Company Data Fetching (Only if impersonating, otherwise use joined data)
    let companyData = userData.companies
    if (impersonating && finalCompanyId && isUuid(finalCompanyId) && finalCompanyId !== userData.company_id) {
      const { data: comp } = await adminSupabase
        .from('companies')
        .select('id, name, logo_url')
        .eq('id', finalCompanyId)
        .single()
      companyData = comp
    }

    const extendedUser = {
      id: user.id,
      email: userData.email || user.email || '',
      name: userData.name || 'Usuario',
      role_id: tenantRole,
      area: tenantArea,
      company_id: finalCompanyId, // SWAP: Use active/final ID
      native_company_id: (userData as any)?.company_id || null, // Reference to original
      worker_id: (userData as any)?.worker_id || null,
      worker_status: (userData as any)?.workers?.status || null,
      permissions: getPermissionsByRole(rbacRole, (userData as any)?.area),
      active_company_id: finalCompanyId,
      companies: companyData,
      company_name: (Array.isArray(companyData) ? companyData[0] : companyData)?.name || 'Empresa',
      company_logo: (Array.isArray(companyData) ? companyData[0] : companyData)?.logo_url || null,
      is_impersonating: impersonating,
      display_name: '',
      display_email: '',
      is_view_only: false
    }

    // Identity Masking for Super Admin (Display Only)
    if (impersonating) {
      const safeName = companyData?.name || 'Sistema'
      extendedUser.display_name = `Admin Sistema`
      extendedUser.display_email = 'auditoria@sistema.local'
    } else {
      extendedUser.display_name = extendedUser.name
      extendedUser.display_email = extendedUser.email
    }

    return { user, extendedUser }

  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) throw error
    return { user: null, extendedUser: null }
  }
})

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
