import { cache } from 'react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPermissionsByRole, hasPermission } from './permissions'
import { fetchCompanyOperatingProfile, normalizeIndustryCode } from '@/lib/operating-profiles'
import { primeCompanyTimezone } from '@/lib/date-utils'
import { cookies } from 'next/headers'
import { resolvePermissions, serializeToLegacyArray } from '@/lib/rbac/engine'
import type { UserPermissionOverride } from '@/lib/rbac/types'

interface CachedExtendedUser {
  user: any
  data: any
  timestamp: number
}
const SESSION_CACHE_TTL = 45 * 1000 // 45 segundos de memoria en servidor para navegaciones instantaneas
const AUTH_TOKEN_TTL = 45 * 1000 // 45 segundos de deduplicación segura alineada con SESSION_CACHE_TTL
const sessionMemoryCache: Map<string, CachedExtendedUser> =
  (globalThis as any).__inthaly_session_cache ?? ((globalThis as any).__inthaly_session_cache = new Map())
const tokenUserCache: Map<string, { user: any; timestamp: number }> =
  (globalThis as any).__inthaly_token_user_cache ?? ((globalThis as any).__inthaly_token_user_cache = new Map())

const isUuid = (val: any): boolean => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(val)))

export function clearUserSessionCache(userId?: string) {
  tokenUserCache.clear()
  if ((globalThis as any).__inthaly_mw_token_cache) {
    ;(globalThis as any).__inthaly_mw_token_cache.clear()
  }
  ;(globalThis as any).__inthaly_recent_login_user = null
  if (userId) {
    for (const key of sessionMemoryCache.keys()) {
      if (key.startsWith(userId)) sessionMemoryCache.delete(key)
    }
  } else {
    sessionMemoryCache.clear()
  }
}

export function primeUserSessionCache(user: any, extendedUser: any, activeCompanyId?: string | null) {
  if (!user?.id || !extendedUser) return
  const cacheKey = `${user.id}:${activeCompanyId || 'none'}`
  sessionMemoryCache.set(cacheKey, { user, data: extendedUser, timestamp: Date.now() })
}

export function primeRecentLoginUser(user: any) {
  if (!user?.id) return
  ;(globalThis as any).__inthaly_recent_login_user = { user, timestamp: Date.now() }
}

export const getUserSession = cache(async function getUserSession() {
 try {
 const cookieStore = await cookies()
 const activeCompanyId = cookieStore.get('active_company_id')?.value
 const now = Date.now()

 // Check if we have an active auth token cookie we recently validated
 const authCookie = cookieStore.getAll().find(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
 const tokenKey = authCookie?.value ? authCookie.value.slice(-64) : null

 let user: any = null
 if (tokenKey) {
   const cachedTokenUser = tokenUserCache.get(tokenKey)
   if (cachedTokenUser && (now - cachedTokenUser.timestamp) < AUTH_TOKEN_TTL) {
     user = cachedTokenUser.user
   }
 }

 if (!user && tokenKey) {
   const recentLogin = (globalThis as any).__inthaly_recent_login_user
   if (recentLogin && (now - recentLogin.timestamp) < 10000) {
     user = recentLogin.user
     ;(globalThis as any).__inthaly_recent_login_user = null
     tokenUserCache.set(tokenKey, { user, timestamp: now })
   }
 }

 if (!user) {
   const supabase = await createClient()
   const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser()
   if (authError || !fetchedUser) {
     redirect('/login')
   }
   user = fetchedUser
   if (tokenKey) {
     tokenUserCache.set(tokenKey, { user, timestamp: now })
   }
 }

 const cacheKey = `${user.id}:${activeCompanyId || 'none'}`
 const cached = sessionMemoryCache.get(cacheKey)
 if (cached && (now - cached.timestamp) < SESSION_CACHE_TTL) {
   return { user, extendedUser: cached.data }
 }

  const adminSupabase = await createAdminClient()
  const initialUserDataRes = await adminSupabase
    .from('users')
    .select('id, email, name, role_id, role, area, company_id, worker_id, status, companies(id, name, logo_url, status, industry, timezone)')
    .eq('id', user.id)
    .maybeSingle()
  let userData: any = initialUserDataRes.data
  let userError: any = initialUserDataRes.error

  if (userError || !userData) {
    if (userError) {
      console.error(`[AUTH_SESSION_ERROR] adminSupabase failed for user ${user.id} (${user.email}): ${userError.message}`)
    } else {
      console.warn(`[AUTH_SESSION_WARN] User record not found in public.users for auth user ${user.id} (${user.email})`)
    }

    // Defensive fallback 1: Try querying users flat without embedded companies join
    if (userError) {
      try {
        const { data: flatUser, error: flatError } = await adminSupabase
          .from('users')
          .select('id, email, name, role_id, role, area, company_id, worker_id, status')
          .eq('id', user.id)
          .maybeSingle()
        if (flatUser && !flatError) {
          let companyObj: any = null
          if (flatUser.company_id && isUuid(flatUser.company_id)) {
            const { data: comp } = await adminSupabase
              .from('companies')
              .select('id, name, logo_url, status, industry, timezone')
              .eq('id', flatUser.company_id)
              .maybeSingle()
            companyObj = comp
          }
          userData = { ...flatUser, companies: companyObj }
          userError = null
          console.log(`[AUTH_SESSION] Recovered user profile via decoupled query for ${user.id}`)
        }
      } catch (decoupleErr: any) {
        console.error('[AUTH_SESSION_ERROR] Decoupled query failed:', decoupleErr?.message)
      }
    }

    // Defensive fallback 2: Try using the authenticated user's own client
    if (userError || !userData) {
      try {
        const userSupabase = await createClient()
        const { data: userFallbackData, error: fallbackError } = await userSupabase
          .from('users')
          .select('id, email, name, role_id, role, area, company_id, worker_id, status')
          .eq('id', user.id)
          .maybeSingle()
        if (userFallbackData && !fallbackError) {
          console.log(`[AUTH_SESSION] Fallback to authenticated client succeeded for user ${user.id}`)
          userData = userFallbackData
          userError = null
        }
      } catch (fbErr: any) {
        console.error('[AUTH_SESSION_ERROR] Fallback query failed:', fbErr?.message)
      }
    }

    // Defensive fallback 3: Synthesize from authenticated user metadata if DB record is temporarily unavailable
    if (userError || !userData) {
      const meta = user.user_metadata || {}
      if (meta.company_id || meta.role_id || meta.name) {
        console.warn(`[AUTH_SESSION_FALLBACK] Synthesizing session from user_metadata for ${user.email}`)
        userData = {
          id: user.id,
          email: user.email,
          name: meta.name || user.email?.split('@')[0] || 'Usuario',
          role_id: meta.role_id || meta.role || 'admin',
          role: meta.role || meta.role_id || 'admin',
          area: meta.area || 'Administración',
          company_id: meta.company_id || null,
          worker_id: meta.worker_id || null,
          status: 'active',
          companies: meta.company_name ? { id: meta.company_id, name: meta.company_name, status: 'active', timezone: 'America/Lima' } : null
        }
        userError = null
      }
    }
  }

  if (userError || !userData) {
    return { user, extendedUser: null as any }
  }

  // Natively registered role and helper flags
  const rawRoleId = String(userData?.role_id || userData?.role || '').toLowerCase()
  const isSuperAdminUser = rawRoleId === 'super_admin' || rawRoleId === 'superadmin'
  
  // Determine active company context
  const finalCompanyId = isSuperAdminUser ? (activeCompanyId || null) : userData.company_id
  const impersonating = !!(isSuperAdminUser && activeCompanyId)

   // Dynamic Parallel Context Resolution (Role, Worker, Company, Permissions, Operating Profile)
   const rolePromise = (finalCompanyId && isUuid(finalCompanyId))
     ? adminSupabase.from('user_roles').select('role_id').eq('user_id', user.id).eq('company_id', finalCompanyId).maybeSingle()
     : Promise.resolve({ data: null })

   const workerPromise = (userData.worker_id && isUuid(userData.worker_id))
     ? (finalCompanyId && isUuid(finalCompanyId)
         ? adminSupabase.from('workers').select('id, status').eq('company_id', finalCompanyId).eq('id', userData.worker_id).maybeSingle()
         : adminSupabase.from('workers').select('id, status').eq('id', userData.worker_id).maybeSingle())
     : Promise.resolve({ data: null })

   const companyPromise = (impersonating && finalCompanyId && isUuid(finalCompanyId) && finalCompanyId !== userData.company_id)
     ? adminSupabase.from('companies').select('id, name, logo_url, status, industry, timezone').eq('id', finalCompanyId).maybeSingle()
     : Promise.resolve({ data: userData.companies })

   // RBAC Granular V1: overrides individuales del usuario por empresa
   const permissionsOverridePromise = (finalCompanyId && isUuid(finalCompanyId))
     ? adminSupabase
         .from('user_permissions')
         .select('user_id, company_id, module, action, granted')
         .eq('user_id', user.id)
         .eq('company_id', finalCompanyId)
     : Promise.resolve({ data: [] as any[] })

   const nativeCompanyObj = Array.isArray(userData.companies) ? userData.companies[0] : userData.companies
   const operatingProfilePromise = (finalCompanyId && isUuid(finalCompanyId))
     ? fetchCompanyOperatingProfile(finalCompanyId, adminSupabase, nativeCompanyObj?.industry || null)
     : Promise.resolve(null)

   const [activeRoleData, workerData, companyRes, permissionsOverrideRes, operatingProfile] = await Promise.all([
     rolePromise,
     workerPromise,
     companyPromise,
     permissionsOverridePromise,
     operatingProfilePromise
   ])

   const companyData: any = companyRes?.data || userData.companies
   const companyObj: any = Array.isArray(companyData) ? companyData[0] : companyData

   if (finalCompanyId && companyObj?.timezone) {
     primeCompanyTimezone(finalCompanyId, companyObj.timezone)
   }

  let rbacRole: string = 'trabajador'
  if (activeRoleData?.data?.role_id) {
    rbacRole = activeRoleData.data.role_id.toLowerCase()
  } else {
    rbacRole = isSuperAdminUser ? 'super_admin' : (rawRoleId || 'trabajador')
  }

  let activeWorkerId: string | null = workerData?.data?.id || null
  let activeWorkerStatus: string | null = workerData?.data?.status || null

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

  const companySlug = companyObj?.slug || (companyObj?.name ? slugify(companyObj.name) : 'empresa')

  // Proteger acceso a rutas autenticadas: Empresas o usuarios pendientes/inactivos no pueden operar
  if (!isSuperAdminUser) {
    const activeCompanyStatus = (companyObj?.status || '').toLowerCase()
    const activeUserStatus = (userData?.status || '').toLowerCase()

    if (activeCompanyStatus === 'pending' || activeUserStatus === 'pending') {
      redirect('/login?error=pending')
    }
    if (
      activeCompanyStatus === 'inactive' ||
      activeCompanyStatus === 'rejected' ||
      activeUserStatus === 'inactive' ||
      activeUserStatus === 'rejected'
    ) {
      redirect('/login?error=inactive')
    }
  }

  // RBAC Granular V1: resolver y serializar permisos planos (100% compatibles con RSC)
 const resolvedRbac = resolvePermissions(
   rbacRole,
   (userData as any)?.area,
   ((permissionsOverrideRes as any)?.data || []) as UserPermissionOverride[]
 )
 const serializedPerms = serializeToLegacyArray(resolvedRbac)

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
 permissions: serializedPerms,
 active_company_id: finalCompanyId,
 companies: companyData,
 company_name: companyObj?.name || 'Empresa',
 company_logo: companyObj?.logo_url || null,
 company_slug: companySlug,
 company_industry: operatingProfile?.industry_key || companyObj?.industry || null,
 operating_profile: operatingProfile,
 is_impersonating: impersonating,
 display_name: '',
 display_email: '',
 is_view_only: false,
 permission_overrides: ((permissionsOverrideRes as any)?.data || []) as UserPermissionOverride[],
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

 sessionMemoryCache.set(cacheKey, { user, data: extendedUser, timestamp: now })
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
