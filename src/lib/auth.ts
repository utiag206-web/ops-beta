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
 .select('*, companies(id, name, logo_url)')
 .eq('id', user.id)
 .maybeSingle()

 if (userError || !userData) {
 return { user, extendedUser: null as any }
 }

 // Natively registered role and helper flags
 const rawRoleId = String(userData?.role_id || userData?.role || '').toLowerCase()
 const isSuperAdminUser = rawRoleId === 'super_admin' || rawRoleId === 'superadmin'
 
 // Determine active company context
 const finalCompanyId = isSuperAdminUser ? (activeCompanyId || null) : userData.company_id
 const impersonating = !!(isSuperAdminUser && activeCompanyId)
 
 const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)

  // Dynamic Parallel Context Resolution (Role, Worker, Company)
  const rolePromise = (finalCompanyId && isUuid(finalCompanyId))
    ? adminSupabase.from('user_roles').select('role_id').eq('user_id', user.id).eq('company_id', finalCompanyId).maybeSingle()
    : Promise.resolve({ data: null })

  const workerPromise = (userData.worker_id && isUuid(userData.worker_id))
    ? (finalCompanyId && isUuid(finalCompanyId)
        ? adminSupabase.from('workers').select('id, status').eq('company_id', finalCompanyId).eq('id', userData.worker_id).maybeSingle()
        : adminSupabase.from('workers').select('id, status').eq('id', userData.worker_id).maybeSingle())
    : Promise.resolve({ data: null })

  const companyPromise = (impersonating && finalCompanyId && isUuid(finalCompanyId) && finalCompanyId !== userData.company_id)
    ? adminSupabase.from('companies').select('id, name, logo_url').eq('id', finalCompanyId).maybeSingle()
    : Promise.resolve({ data: userData.companies })

  const [activeRoleData, workerData, companyRes] = await Promise.all([rolePromise, workerPromise, companyPromise])

  let rbacRole: string = 'trabajador'
  if (activeRoleData?.data?.role_id) {
    rbacRole = activeRoleData.data.role_id.toLowerCase()
  } else {
    rbacRole = isSuperAdminUser ? 'super_admin' : (rawRoleId || 'trabajador')
  }

  let activeWorkerId: string | null = workerData?.data?.id || null
  let activeWorkerStatus: string | null = workerData?.data?.status || null
  let companyData = companyRes?.data || userData.companies

 // Helper function to slugify company name in JS as fallback
 const slugify = (text: string) => {
 return text
 .toString()
 .toLowerCase()
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .replace(/[^a-z0-9\s-]/g, '')
 .trim()
 .replace(/\s+/g, '-')
 .replace(/-+/g, '-');
 }

 const companyObj = Array.isArray(companyData) ? companyData[0] : companyData
 const companySlug = companyObj?.slug || (companyObj?.name ? slugify(companyObj.name) : 'empresa')

 const extendedUser = {
 id: user.id,
 email: userData.email || user.email || '',
 name: userData.name || 'Usuario',
 role_id: rbacRole, // Dynamic active role context
 area: (userData as any)?.area || null,
 company_id: finalCompanyId, // Dynamic active company context
 native_company_id: (userData as any)?.company_id || null, 
 worker_id: activeWorkerId, // Dynamic worker context
 worker_status: activeWorkerStatus, // Dynamic worker status
 permissions: getPermissionsByRole(rbacRole, (userData as any)?.area),
 active_company_id: finalCompanyId,
 companies: companyData,
 company_name: companyObj?.name || 'Empresa',
 company_logo: companyObj?.logo_url || null,
 company_slug: companySlug,
 is_impersonating: impersonating,
 display_name: '',
 display_email: '',
 is_view_only: false
 }

 // Identity Masking for Super Admin (Display Only)
 if (impersonating) {
 const safeName = companyData?.name || 'Sistema'
 extendedUser.display_name = `Administrador (${safeName})`
 extendedUser.display_email = extendedUser.email
 } else {
 extendedUser.display_name = extendedUser.name
 extendedUser.display_email = extendedUser.email
 }

 return { user, extendedUser: extendedUser as any }

 } catch (error: any) {
 if (error.digest?.startsWith('NEXT_REDIRECT')) throw error
 return { user: null, extendedUser: null as any }
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

export async function getActiveViewMode(): Promise<'OPERATIONAL' | 'WORKER'> {
 try {
 const { extendedUser } = await getUserSession()
 if (!extendedUser || !extendedUser.worker_id) return 'OPERATIONAL'
 
 const role = extendedUser.role_id?.toLowerCase()
 if (['admin', 'super_admin', 'superadmin'].includes(role)) return 'OPERATIONAL'
 
 const cookieStore = await cookies()
 return cookieStore.get('view_mode')?.value === 'WORKER' ? 'WORKER' : 'OPERATIONAL'
 } catch {
 return 'OPERATIONAL'
 }
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
