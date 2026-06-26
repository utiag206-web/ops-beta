'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Acciones exclusivas para el SUPER_ADMIN
 */

export async function getAllCompanies() {
 try {
 const { extendedUser } = await getUserSession()
 const role = extendedUser?.role_id?.toLowerCase()
 if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

 const supabase = await createAdminClient()
 const { data, error } = await supabase.from('companies').select('*').order('name')
 
 if (error) {
 console.error('[SUPER_ADMIN] Error fetching companies:', error)
 return []
 }
 return data || []
 } catch (error: any) {
 if (error.digest?.startsWith('NEXT_REDIRECT')) throw error
 console.error('[SUPER_ADMIN] Unexpected Error in getAllCompanies:', error)
 return []
 }
}

export async function getAllUsers() {
 try {
 const { extendedUser } = await getUserSession()
 const role = extendedUser?.role_id?.toLowerCase()
 if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

 const supabase = await createAdminClient()
 // Intentamos con el join, si falla caemos a select('*')
 const { data, error } = await supabase
 .from('users')
 .select('*, companies(name)')
 .order('created_at', { ascending: false })
 
 if (error) {
 console.warn('[SUPER_ADMIN] Join query failed, falling back to simple select:', error.message)
 const { data: simpleData, error: simpleError } = await supabase
 .from('users')
 .select('*')
 .order('created_at', { ascending: false })
 
 if (simpleError) throw simpleError
 return simpleData || []
 }
 return data || []
 } catch (error: any) {
 if (error.digest?.startsWith('NEXT_REDIRECT')) throw error
 console.error('[SUPER_ADMIN] Unexpected Error in getAllUsers:', error)
 return []
 }
}

export async function getSystemStats() {
 try {
 const { extendedUser } = await getUserSession()
 const role = extendedUser?.role_id?.toLowerCase()
 if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

 const supabase = await createAdminClient()
 
 const fetchCount = async (query: any) => {
 try {
 const { count, error } = await query
 if (error) throw error
 return count || 0
 } catch (e) {
 console.warn("[STATS_WARN] Failed query:", e)
 return 0
 }
 }

 const [
 totalCompanies,
 realCompanies,
 testCompanies,
 activeCompanies,
 suspendedCompanies,
 totalUsers
 ] = await Promise.all([
 fetchCount(supabase.from('companies').select('*', { count: 'exact', head: true })),
 fetchCount(supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_test', false)),
 fetchCount(supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_test', true)),
 fetchCount(supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'active')),
 fetchCount(supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'inactive')),
 fetchCount(supabase.from('users').select('*', { count: 'exact', head: true }))
 ])

 return {
 totalCompanies,
 realCompanies,
 testCompanies,
 activeCompanies,
 suspendedCompanies,
 totalUsers
 }
 } catch (error: any) {
 if (error.digest?.startsWith('NEXT_REDIRECT')) throw error
 console.error('[SUPER_ADMIN] Error in getSystemStats:', error)
 return {
 totalCompanies: 0,
 activeCompanies: 0,
 suspendedCompanies: 0,
 totalUsers: 0
 }
 }
}

export async function toggleCompanyStatus(companyId: string, currentStatus: string) {
 const { extendedUser } = await getUserSession()
 const role = extendedUser?.role_id?.toLowerCase()
 if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

 const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
 const supabase = await createAdminClient()
 
 const { error } = await supabase
 .from('companies')
 .update({ status: newStatus })
 .eq('id', companyId)

 if (error) return { error: error.message }
 
 revalidatePath('/super-admin')
 return { success: true }
}

export async function createCompany(payload: {
 name: string
 adminEmail: string
 adminName: string
 adminPassword?: string
 is_test?: boolean
}) {
 const { extendedUser } = await getUserSession()
 const role = extendedUser?.role_id?.toLowerCase()
 if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

 const supabase = await createAdminClient()
 
 try {
 // 1. Crear la Empresa
 const { data: company, error: companyError } = await supabase
 .from('companies')
 .insert([{ 
 name: payload.name, 
 status: 'active',
 is_test: payload.is_test || false
 }])
 .select()
 .single()

 if (companyError) throw new Error(`Error al crear empresa: ${companyError.message}`)
 const companyId = company.id

 // 2. Crear Usuario Administrador
 // Si no viene password, generamos uno temporal
 const password = payload.adminPassword || Math.random().toString(36).slice(-10)
 
 const { data: authData, error: authError } = await supabase.auth.admin.createUser({
 email: payload.adminEmail,
 password: password,
 email_confirm: true,
 user_metadata: { name: payload.adminName }
 })

 if (authError) {
 // Si el usuario ya existe, podríamos intentar vincularlo, pero por ahora fallamos
 throw new Error(`Error al crear usuario auth: ${authError.message}`)
 }

 const authUserId = authData.user.id

 // 3. Vincular usuario en tabla 'users'
 const { error: userError } = await supabase
 .from('users')
 .insert([{
 id: authUserId,
 company_id: companyId,
 name: payload.adminName,
 email: payload.adminEmail,
 role_id: 'admin', // Legacy string-based role
 status: 'active',
 area: 'Administración'
 }])

 if (userError) throw new Error(`Error al crear registro de usuario: ${userError.message}`)

 // 4. Sincronizar user_roles (Formal RBAC)
 // Buscamos el ID del rol 'admin' en la tabla roles
 let roleId: string | null = null
 const { data: roleData } = await supabase
 .from('roles')
 .select('id')
 .eq('name', 'admin')
 .maybeSingle()
 
 if (!roleData) {
 console.warn(`[BOOTSTRAP] Rol 'admin' no encontrado. Intentando crear rol maestro...`)
 const { data: newRole, error: newRoleError } = await supabase
 .from('roles')
 .insert([{ name: 'admin', description: 'Administrador de Empresa' }])
 .select()
 .single()
 
 if (newRoleError) {
 console.error(`[BOOTSTRAP_CRITICAL] No se pudo crear el rol 'admin':`, newRoleError.message)
 } else {
 roleId = newRole.id
 }
 } else {
 roleId = roleData.id
 }

 if (roleId) {
 const { error: rbacError } = await supabase
 .from('user_roles')
 .insert([{
 user_id: authUserId,
 company_id: companyId,
 role_id: roleId
 }])
 
 if (rbacError) {
 console.error(`[BOOTSTRAP_CRITICAL] Error al vincular rol administrativo:`, rbacError.message)
 }
 }

 // 5-8. Inicialización Automática (Uso de Utility Centralizada)
 const { bootstrapCompany } = await import('@/lib/bootstrap')
 const { success: bootSuccess, error: bootError } = await bootstrapCompany(companyId)
 
 if (!bootSuccess) {
 console.warn(`[BOOTSTRAP_WARN] La inicialización parcial falló: ${bootError}`)
 }

 return { success: true, data: company, password } // Devolvemos el password por si fue generado
 } catch (error: any) {
 if (error.digest?.startsWith('NEXT_REDIRECT')) throw error
 console.error('[SUPER_ADMIN] createCompany failed:', error.message)
 return { error: error.message }
 }
}
export async function impersonateCompany(companyId: string) {
 const { extendedUser } = await getUserSession()
 const role = extendedUser?.role_id?.toLowerCase()
 if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

 const { cookies } = await import('next/headers')
 const cookieStore = await cookies()
 
 cookieStore.set('active_company_id', companyId, {
 path: '/',
 httpOnly: true,
 secure: process.env.NODE_ENV === 'production',
 sameSite: 'lax',
 maxAge: 60 * 60 * 2 // 2 horas
 })

 revalidatePath('/', 'layout')
 return { success: true }
}

export async function stopImpersonation() {
 const { cookies } = await import('next/headers')
 const cookieStore = await cookies()
 
 cookieStore.delete('active_company_id')
 
 revalidatePath('/', 'layout')
 return { success: true }
}

export async function deleteCompany(companyId: string) {
 const { extendedUser } = await getUserSession()
 const role = extendedUser?.role_id?.toLowerCase()
 if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

 const supabase = await createAdminClient()

 // 1. Verificar si es una empresa de prueba y obtener datos básicos
 const { data: company, error: fetchError } = await supabase
 .from('companies')
 .select('is_test, name')
 .eq('id', companyId)
 .single()

 if (fetchError || !company) throw new Error('Empresa no encontrada')
 
 if (!company.is_test) {
 throw new Error('Solo se pueden eliminar empresas marcadas como "Prueba"')
 }

 // Protección de Infraestructura: Impedir borrar la empresa principal del Super Admin
 if (companyId === extendedUser.company_id) {
 throw new Error('Operación abortada: No se puede eliminar la empresa de infraestructura del sistema.')
 }

 console.log(`[CLEANUP_ENGINE] 🚀 Iniciando Schema-Aware Cleanup para: ${company.name} (${companyId})`)

 /**
 * SCHEMA-AWARE DELETER
 * Audita dinámicamente la tabla y aplica la estrategia de eliminación correcta.
 */
 const cleanTable = async (table: string, options: { 
 via?: { parent: string, link: string }, 
 fallbackWorkerId?: boolean 
 } = {}) => {
 try {
 // 1. Auditoría: ¿Tiene company_id directo?
 const { error: probeError } = await supabase.from(table).select('company_id').limit(0)
 
 if (!probeError) {
 // ESTRATEGIA A: Direct Tenant Deletion
 const { error } = await supabase.from(table).delete().eq('company_id', companyId)
 if (error) throw error
 return { strategy: 'DIRECT', table }
 }

 // 2. Auditoría: ¿Relación definida manualmente?
 if (options.via) {
 const { data: parents } = await supabase.from(options.via.parent).select('id').eq('company_id', companyId)
 if (parents && parents.length > 0) {
 const parentIds = parents.map((p: any) => p.id)
 const { error } = await supabase.from(table).delete().in(options.via.link, parentIds)
 if (error) throw error
 return { strategy: 'RELATIONAL', table, parent: options.via.parent }
 }
 return { strategy: 'SKIPPED_NO_PARENTS', table }
 }

 // 3. Auditoría: ¿Relación vía worker_id? (Fallback dinámico)
 if (options.fallbackWorkerId) {
 const { error: workerProbe } = await supabase.from(table).select('worker_id').limit(0)
 if (!workerProbe) {
 const { data: workers } = await supabase.from('workers').select('id').eq('company_id', companyId)
 if (workers && workers.length > 0) {
 const workerIds = workers.map((w: any) => w.id)
 const { error } = await supabase.from(table).delete().in('worker_id', workerIds)
 if (error) throw error
 return { strategy: 'WORKER_RELATION', table }
 }
 }
 }

 // console.log(`[CLEANUP_ENGINE] Ignorada: ${table} (No es tenant-aware)`)
 return { strategy: 'IGNORED', table }

 } catch (err: any) {
 if (err.code === '42P01') return { strategy: 'MISSING_TABLE', table } // Tabla no existe
 console.error(`[CLEANUP_ENGINE] ❌ Fallo en ${table}:`, err.message)
 throw new Error(`Fallo en limpieza de ${table}: ${err.message}`)
 }
 }

 try {
 // 2. Identificar usuarios de la empresa para limpieza de Auth
 const { data: companyUsers } = await supabase
 .from('users')
 .select('id')
 .eq('company_id', companyId)

 /**
 * NIVEL 1: Hojas y Relacionales (Dependen de otros que borraremos en Nivel 2)
 */
 const level1 = [
 'inventory_stock',
 'inventory_movements',
 'soma_training_participants',
 'soma_talk_participants',
 'tareo_records',
 'attendance_logs',
 'worker_bonuses',
 'worker_documents',
 'worker_children',
 'worker_financial',
 'worker_personal',
 'user_roles',
 'soma_alerts',
 'ppe_deliveries',
 'transport_payments',
 'camp_rooms',
 'tareo_monthly_notes'
 ]

 for (const t of level1) await cleanTable(t, { fallbackWorkerId: true })
 
 // Casos Relacionales Especiales (Items sin company_id)
 await cleanTable('purchase_order_items', { via: { parent: 'purchase_orders', link: 'po_id' } })

 /**
 * NIVEL 2: Entidades Intermedias
 */
 const level2 = [
 'purchase_orders',
 'soma_trainings',
 'soma_talks',
 'soma_hsec_stop',
 'soma_inspecciones',
 'soma_inspections',
 'soma_findings',
 'soma_checklists',
 'work_cycles',
 'tareo_config',
 'requirements',
 'incidencias',
 'attendance',
 'assets',
 'petty_cash_transactions',
 'warehouses',
 'movement_types',
 'products',
 'suppliers',
 'categories',
 'units',
 'documents',
 'bonuses'
 ]

 for (const t of level2) await cleanTable(t)

 /**
 * NIVEL 3: Maestros de Usuarios y Trabajadores
 */
 await cleanTable('workers')
 await cleanTable('users')

 /**
 * NIVEL 4: Supabase Auth
 */
 if (companyUsers && companyUsers.length > 0) {
 console.log(`[CLEANUP_ENGINE] Limpiando ${companyUsers.length} identidades de Auth...`)
 for (const u of companyUsers) {
 try {
 await supabase.auth.admin.deleteUser(u.id)
 } catch (e) {
 // Ignorar si ya no existe en auth
 }
 }
 }

 /**
 * NIVEL FINAL: El Tenant (Empresa)
 */
 const { error: finalError } = await supabase
 .from('companies')
 .delete()
 .eq('id', companyId)

 if (finalError) {
 throw new Error(`Error estructural al eliminar registro de empresa: ${finalError.message}`)
 }

 console.log(`[CLEANUP_ENGINE] ✅ Eliminación exitosa de ${company.name}`)
 
 revalidatePath('/super-admin')
 return { success: true }

 } catch (error: any) {
 console.error('[CLEANUP_ENGINE] ❌ ERROR ESTRUCTURAL:', error.message)
 throw new Error(`El motor de limpieza falló: ${error.message}`)
 }
}

export async function toggleTestStatus(companyId: string, isTest: boolean) {
 const { extendedUser } = await getUserSession()
 const role = extendedUser?.role_id?.toLowerCase()
 if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

 const supabase = await createAdminClient()
 
 const { error } = await supabase
 .from('companies')
 .update({ is_test: isTest })
 .eq('id', companyId)

 if (error) return { error: error.message }
 
 revalidatePath('/super-admin')
 return { success: true }
}

export async function getCompanyDetails(companyId: string) {
 try {
 const { extendedUser } = await getUserSession()
 const role = extendedUser?.role_id?.toLowerCase()
 if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

 const supabase = await createAdminClient()

 // 1. Obtener datos de la empresa
 const { data: company, error: companyError } = await supabase
 .from('companies')
 .select('*')
 .eq('id', companyId)
 .single()

 if (companyError || !company) {
 throw new Error(companyError?.message || 'Empresa no encontrada')
 }

 // 2. Obtener roles disponibles para mapear IDs a nombres amigables
 const { data: roles, error: rolesError } = await supabase
 .from('roles')
 .select('id, name, description')
 
 const rolesMap = new Map<string, { name: string; description: string }>()
 if (roles) {
 roles.forEach((r: any) => {
 rolesMap.set(r.id, { name: r.name, description: r.description || '' })
 })
 }

 // 3. Obtener registros de user_roles para esta empresa
 const { data: userRoles, error: userRolesError } = await supabase
 .from('user_roles')
 .select('user_id, role_id')
 .eq('company_id', companyId)

 const userRolesMap = new Map<string, string[]>()
 if (userRoles) {
 userRoles.forEach((ur: any) => {
 const roleInfo = rolesMap.get(ur.role_id)
 const roleName = roleInfo ? roleInfo.name : ur.role_id
 if (!userRolesMap.has(ur.user_id)) {
 userRolesMap.set(ur.user_id, [])
 }
 userRolesMap.get(ur.user_id)!.push(roleName)
 })
 }

 // 4. Obtener todos los usuarios asociados (nativos por company_id o asignados vía user_roles)
 const userIds = userRoles ? userRoles.map((ur: any) => ur.user_id).filter(Boolean) : []
 
 let query = supabase.from('users').select('*')
 if (userIds.length > 0) {
 query = query.or(`company_id.eq.${companyId},id.in.(${userIds.join(',')})`)
 } else {
 query = query.eq('company_id', companyId)
 }

 const { data: users, error: usersError } = await query.order('name', { ascending: true })
 if (usersError) {
 throw new Error(usersError.message)
 }

 // Mapear los roles reales a cada usuario
 const mappedUsers = (users || []).map((u: any) => {
 const dbRoles = userRolesMap.get(u.id) || []
 return {
 ...u,
 roles: dbRoles.length > 0 ? dbRoles : [u.role_id || 'user']
 }
 })

 // Identificar el administrador principal
 let mainAdmin = mappedUsers.find((u: any) => u.roles.includes('admin'))
 if (!mainAdmin) {
 mainAdmin = mappedUsers.find((u: any) => ['admin', 'gerente'].includes(u.role_id?.toLowerCase()))
 }
 if (!mainAdmin && mappedUsers.length > 0) {
 mainAdmin = mappedUsers[0]
 }

 // 5. Métricas de Soporte/Auditoría seguras con try-catch individual
 const getCountSafe = async (table: string) => {
 try {
 const { count, error } = await supabase
 .from(table)
 .select('id', { count: 'exact', head: true })
 .eq('company_id', companyId)
 
 if (error) {
 return 0
 }
 return count || 0
 } catch (err) {
 return 0
 }
 }

 const [workersCount, documentsCount, productsCount, purchaseOrdersCount] = await Promise.all([
 getCountSafe('workers'),
 getCountSafe('documents'),
 getCountSafe('products'),
 getCountSafe('purchase_orders')
 ])

 return {
 success: true,
 data: {
 company,
 users: mappedUsers,
 mainAdmin: mainAdmin || null,
 stats: {
 workers: workersCount,
 documents: documentsCount,
 products: productsCount,
 purchaseOrders: purchaseOrdersCount
 }
 }
 }
 } catch (error: any) {
 console.error('[SUPER_ADMIN] Error in getCompanyDetails:', error.message)
 return { success: false, error: error.message }
 }
}

