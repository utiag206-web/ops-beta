'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getMultiCompanySettings } from './settings/multiempresa/actions'
import { getSiteUrl } from '@/lib/site-url'

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
 
  const sortSuperAdminFirst = (list: any[]) => {
    return (list || []).sort((a: any, b: any) => {
      const aIsSuper = a.role_id?.toLowerCase() === 'super_admin' || a.role_id?.toLowerCase() === 'superadmin'
      const bIsSuper = b.role_id?.toLowerCase() === 'super_admin' || b.role_id?.toLowerCase() === 'superadmin'
      if (aIsSuper && !bIsSuper) return -1
      if (bIsSuper && !aIsSuper) return 1
      return 0
    })
  }

  if (error) {
    console.warn('[SUPER_ADMIN] Join query failed, falling back to simple select:', error.message)
    const { data: simpleData, error: simpleError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (simpleError) throw simpleError
    return sortSuperAdminFirst(simpleData || [])
  }
  return sortSuperAdminFirst(data || [])
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
    
    const { data: allCompanies, error: compErr } = await supabase
      .from('companies')
      .select('id, status, is_test, working_hours')

    if (compErr) throw compErr

    let totalCompanies = (allCompanies || []).length
    let realCompanies = 0
    let testCompanies = 0
    let activeCompanies = 0
    let suspendedCompanies = 0
    let pendingCompanies = 0

    for (const c of (allCompanies || [])) {
      if (c.is_test) testCompanies++
      else realCompanies++

      if (c.status === 'active') {
        activeCompanies++
      } else {
        let parsed = {}
        try {
          parsed = JSON.parse(c.working_hours || '{}')
        } catch (_) {}

        const isPending = ((parsed as any)?.demo_request || (parsed as any)?.registration_request) && (parsed as any)?.approval_status !== 'rejected'
        if (isPending) {
          pendingCompanies++
        } else {
          suspendedCompanies++
        }
      }
    }

    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    return {
      totalCompanies,
      realCompanies,
      testCompanies,
      activeCompanies,
      suspendedCompanies,
      pendingCompanies,
      totalUsers: totalUsers || 0
    }
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) throw error
    console.error('[SUPER_ADMIN] Error in getSystemStats:', error)
    return {
      totalCompanies: 0,
      realCompanies: 0,
      testCompanies: 0,
      activeCompanies: 0,
      suspendedCompanies: 0,
      pendingCompanies: 0,
      totalUsers: 0
    }
  }
}

export async function toggleCompanyStatus(companyId: string, currentStatus: string) {
  const { extendedUser } = await getUserSession()
  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

  const { settings } = await getMultiCompanySettings()
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

  // Validar reglas del ciclo de vida configuradas por el Super Admin
  if (newStatus === 'inactive' && !settings.allowSuspension) {
    return { error: 'La suspensión administrativa de empresas está deshabilitada en la Configuración Global.' }
  }
  if (newStatus === 'active' && !settings.allowReactivation) {
    return { error: 'La reactivación de empresas está deshabilitada en la Configuración Global.' }
  }

  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('companies')
    .update({ status: newStatus })
    .eq('id', companyId)

  if (error) return { error: error.message }
  
  revalidatePath('/super-admin')
  revalidatePath('/super-admin/settings/multiempresa')
  return { success: true }
}

export async function createCompany(payload: {
  name: string
  taxId?: string
  industry?: string
  phone?: string
  contactPosition?: string
  estimatedWorkers?: string
  notes?: string
  adminEmail: string
  adminName: string
  adminPassword?: string
  is_test?: boolean
}) {
  const { extendedUser } = await getUserSession()
  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

  const { settings } = await getMultiCompanySettings()

  // 0. Validar si está permitida la creación de nuevas empresas
  if (!settings.allowNewCompanies) {
    throw new Error('La creación de nuevas empresas está temporalmente deshabilitada en la Configuración Global.')
  }

  const initialStatus = settings.defaultCompanyStatus === 'ACTIVA' ? 'active' : 'inactive'
  const initialTimezone = settings.defaultTimezone || 'America/Lima'

  const supabase = await createAdminClient()
  
  try {
    const contactName = payload.adminName?.trim() || 'Administrador'
    const contactPosition = payload.contactPosition?.trim() || 'Gerente de Operaciones'
    const estimatedWorkers = payload.estimatedWorkers?.trim() || '16 a 50 trabajadores'
    const industry = payload.industry?.trim() || 'Servicios Generales y Contratistas'
    const phone = payload.phone?.trim() || ''
    const taxId = payload.taxId?.trim() || null
    const notes = payload.notes?.trim() || ''

    const corporateMetadata = {
      contact_name: contactName,
      contact_position: contactPosition,
      estimated_workers: estimatedWorkers,
      notes: notes,
      registered_by: 'super_admin',
      registered_at: new Date().toISOString(),
      demo_request: {
        contact_name: contactName,
        contact_position: contactPosition,
        estimated_workers: estimatedWorkers,
        notes: notes,
        email: payload.adminEmail,
        phone: phone,
        tax_id: taxId
      }
    }

    // 1. Crear la Empresa con los 9 datos completos del estándar corporativo
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert([{ 
        name: payload.name.trim(), 
        tax_id: taxId,
        contact_email: payload.adminEmail.trim().toLowerCase(),
        phone: phone,
        industry: industry,
        status: initialStatus,
        timezone: initialTimezone,
        working_hours: JSON.stringify(corporateMetadata),
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

    let leadDetails: any = null
    if (company.working_hours) {
      try {
        const wh = JSON.parse(company.working_hours)
        const sub = wh.lead_details || wh.demo_request || wh.registration_request || {}

        // Prioridad consistente: si existe un Administrador en la tabla users, su identidad prevalece
        const contactName = mainAdmin?.name || sub.contact_name || wh.contact_name || wh.registered_by_name || 'No especificado'
        const contactPosition = sub.contact_position || wh.contact_position || (mainAdmin ? 'Administrador General' : 'Gerente de Operaciones')
        const email = mainAdmin?.email || company.contact_email || sub.email || wh.email || ''
        const phone = company.phone || sub.phone || wh.phone || ''
        const taxId = company.tax_id || sub.tax_id || wh.tax_id || ''
        const estimatedWorkers = sub.estimated_workers || wh.estimated_workers || '16 a 50 trabajadores'
        const notes = sub.notes || wh.notes || ''

        leadDetails = {
          ...sub,
          contact_name: contactName,
          contact_position: contactPosition,
          estimated_workers: estimatedWorkers,
          notes: notes,
          phone: phone,
          email: email,
          tax_id: taxId,
          request_type: wh.request_type || (wh.demo_request ? 'demo' : (wh.registration_request ? 'register' : 'direct')),
          approval_status: wh.approval_status || (company.status === 'active' ? 'approved' : null),
          approved_at: wh.approved_at || null,
          approved_by: wh.approved_by || null,
          rejection_reason: wh.rejection_reason || null,
        }
      } catch (_) {}
    }

    if (!leadDetails) {
      leadDetails = {
        contact_name: mainAdmin?.name || 'Administrador',
        contact_position: 'Administrador General',
        estimated_workers: '16 a 50 trabajadores',
        notes: '',
        phone: company.phone || '',
        email: company.contact_email || mainAdmin?.email || '',
        tax_id: company.tax_id || '',
        request_type: 'direct',
        approval_status: company.status === 'active' ? 'approved' : null,
      }
    }

    return {
      success: true,
      data: {
        company,
        leadDetails,
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

/**
 * Actualizar los 9 datos corporativos estándar de una empresa (Nueva o Antigua)
 */
export async function updateCompanyCorporateDetails(payload: {
  companyId: string
  name: string
  taxId: string
  contactEmail: string
  phone: string
  industry: string
  contactName: string
  contactPosition: string
  estimatedWorkers: string
  notes?: string
}) {
  try {
    const { extendedUser } = await getUserSession()
    const role = extendedUser?.role_id?.toLowerCase()
    if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

    const supabase = await createAdminClient()

    // 1. Obtener la empresa actual para preservar configuraciones en working_hours
    const { data: current, error: fetchErr } = await supabase
      .from('companies')
      .select('id, working_hours')
      .eq('id', payload.companyId)
      .single()

    if (fetchErr) return { success: false, error: fetchErr.message }

    let currentWh: any = {}
    try {
      currentWh = JSON.parse(current?.working_hours || '{}')
    } catch (_) {}

    // Actualizar metadatos corporativos preservando settings de RRHH / Asistencia
    const updatedWh = {
      ...currentWh,
      contact_name: payload.contactName?.trim() || '',
      contact_position: payload.contactPosition?.trim() || '',
      estimated_workers: payload.estimatedWorkers?.trim() || '',
      notes: payload.notes?.trim() || '',
      lead_details: {
        ...(currentWh.lead_details || {}),
        contact_name: payload.contactName?.trim() || '',
        contact_position: payload.contactPosition?.trim() || '',
        estimated_workers: payload.estimatedWorkers?.trim() || '',
        notes: payload.notes?.trim() || '',
        email: payload.contactEmail?.trim().toLowerCase() || '',
        phone: payload.phone?.trim() || '',
        tax_id: payload.taxId?.trim() || '',
        industry: payload.industry?.trim() || ''
      },
      demo_request: {
        ...(currentWh.demo_request || {}),
        contact_name: payload.contactName?.trim() || '',
        contact_position: payload.contactPosition?.trim() || '',
        estimated_workers: payload.estimatedWorkers?.trim() || '',
        notes: payload.notes?.trim() || '',
        email: payload.contactEmail?.trim().toLowerCase() || '',
        phone: payload.phone?.trim() || '',
        tax_id: payload.taxId?.trim() || ''
      }
    }

    // 2. Actualizar tabla companies
    const { error: updateErr } = await supabase
      .from('companies')
      .update({
        name: payload.name.trim(),
        tax_id: payload.taxId?.trim() || null,
        contact_email: payload.contactEmail?.trim().toLowerCase() || null,
        phone: payload.phone?.trim() || null,
        industry: payload.industry?.trim() || 'Servicios Generales y Contratistas',
        working_hours: JSON.stringify(updatedWh)
      })
      .eq('id', payload.companyId)

    if (updateErr) return { success: false, error: updateErr.message }

    // 3. Sincronizar el nombre del usuario administrador principal si existe
    try {
      const { data: mainAdmin } = await supabase
        .from('users')
        .select('id')
        .eq('company_id', payload.companyId)
        .in('role_id', ['admin', 'gerente'])
        .maybeSingle()

      if (mainAdmin && payload.contactName?.trim()) {
        await supabase
          .from('users')
          .update({ name: payload.contactName.trim() })
          .eq('id', mainAdmin.id)
      }
    } catch (_) {}

    revalidatePath('/super-admin')
    revalidatePath('/super-admin/settings')
    return { success: true }
  } catch (err: any) {
    console.error('[SUPER_ADMIN] Error in updateCompanyCorporateDetails:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Obtener solicitudes pendientes de demostración o registro empresarial
 */
export async function getPendingCompanyRequests() {
  try {
    const { extendedUser } = await getUserSession()
    const role = extendedUser?.role_id?.toLowerCase()
    if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('status', 'inactive')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[SUPER_ADMIN] Error fetching pending companies:', error)
      return []
    }

    const pendingList: any[] = []
    for (const c of (data || [])) {
      let parsed = {}
      try {
        parsed = JSON.parse(c.working_hours || '{}')
      } catch (_) {}

      const demo = (parsed as any)?.demo_request
      const reg = (parsed as any)?.registration_request
      const approvalStatus = (parsed as any)?.approval_status

      if ((demo || reg) && approvalStatus !== 'rejected') {
        pendingList.push({
          ...c,
          contact_name: demo?.contact_name || reg?.registered_by_name || 'No especificado',
          contact_position: demo?.contact_position || 'Directivo',
          estimated_workers: demo?.estimated_workers || '1-15',
          notes: demo?.notes || '',
          submitted_at: demo?.submitted_at || reg?.submitted_at || c.created_at,
          request_type: demo ? 'demo' : 'register',
        })
      }
    }

    return pendingList
  } catch (error: any) {
    console.error('[SUPER_ADMIN] Error in getPendingCompanyRequests:', error)
    return []
  }
}

/**
 * Aprobar solicitud de empresa (Demo o Registro)
 * Pasa de PENDING a ACTIVE, inicializa bootstrap, genera enlace seguro de acceso y audita inmutablemente
 */
export async function approveCompanyRequest(companyId: string) {
  try {
    const { extendedUser } = await getUserSession()
    const role = extendedUser?.role_id?.toLowerCase()
    if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

    const supabase = await createAdminClient()

    const { data: company, error: compErr } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (compErr || !company) {
      return { success: false, error: 'No se encontró la empresa solicitada.' }
    }

    // 1. Cambiar estado a active y actualizar metadata de aprobación
    let currentMetadata: any = {}
    try {
      currentMetadata = JSON.parse(company.working_hours || '{}')
    } catch (_) {}

    currentMetadata.approval_status = 'approved'
    currentMetadata.approved_at = new Date().toISOString()
    currentMetadata.approved_by = extendedUser.email

    const { error: updateErr } = await supabase
      .from('companies')
      .update({ 
        status: 'active',
        working_hours: JSON.stringify(currentMetadata)
      })
      .eq('id', companyId)

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }

    // 2. Activar usuarios vinculados
    await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('company_id', companyId)
      .eq('status', 'inactive')

    // 3. Obtener o aprovisionar usuario administrador y generar enlace seguro
    let actionLink: string | null = null
    const siteUrl = await getSiteUrl()
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('company_id', companyId)
      .maybeSingle()

    if (existingAdmin?.email) {
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: existingAdmin.email,
          options: {
            redirectTo: `${siteUrl}/reset-password`
          }
        })
        const hashedToken = linkData?.properties?.hashed_token
        actionLink = hashedToken
          ? `${siteUrl}/activar?t=${hashedToken}`
          : linkData?.properties?.action_link || null
      } catch (linkErr: any) {
        console.warn('[SUPER_ADMIN] generateLink warning:', linkErr?.message)
      }
    } else if (company.contact_email) {
      // Solicitud de demo directa que aún no tiene usuario auth
      try {
        let contactName = 'Administrador'
        try {
          const wh = JSON.parse(company.working_hours || '{}')
          contactName = wh.demo_request?.contact_name || contactName
        } catch (_) {}

        const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!' + Math.random().toString(36).slice(-4)
        const { data: authData } = await supabase.auth.admin.createUser({
          email: company.contact_email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { name: contactName }
        })

        if (authData?.user) {
          await supabase.from('users').insert({
            id: authData.user.id,
            name: contactName,
            email: company.contact_email,
            company_id: companyId,
            role_id: 'admin',
            role: 'admin',
            status: 'active',
            area: 'Dirección'
          })

          await supabase.from('user_roles').upsert({
            user_id: authData.user.id,
            company_id: companyId,
            role_id: 'admin'
          }, { onConflict: 'user_id, company_id' })

          const { data: linkData } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: company.contact_email,
            options: {
              redirectTo: `${siteUrl}/reset-password`
            }
          })
          const hashedToken = linkData?.properties?.hashed_token
          actionLink = hashedToken
            ? `${siteUrl}/activar?t=${hashedToken}`
            : linkData?.properties?.action_link || null
        }
      } catch (uErr: any) {
        console.warn('[SUPER_ADMIN] Error creating admin user for demo request:', uErr?.message)
      }
    }

    // 4. Bootstrap de datos base para la empresa
    try {
      const { bootstrapCompany } = await import('@/lib/bootstrap')
      await bootstrapCompany(companyId)
    } catch (bErr: any) {
      console.warn('[SUPER_ADMIN] Bootstrap warning:', bErr?.message)
    }

    // 5. Auditoría inmutable con snapshot de actor
    try {
      const { logAuditEvent } = await import('@/lib/audit')
      await logAuditEvent({
        companyId,
        userId: extendedUser.id,
        userName: extendedUser.name,
        action: 'COMPANY_REQUEST_APPROVED',
        title: `Empresa Aprobada: ${company.name}`,
        category: 'SUPER_ADMIN_APPROVAL',
        details: {
          company_id: companyId,
          company_name: company.name,
          contact_email: company.contact_email,
          tax_id: company.tax_id,
          approved_by_id: extendedUser.id,
          approved_by_email: extendedUser.email,
          has_action_link: !!actionLink,
        }
      })
    } catch (audErr: any) {
      console.warn('[SUPER_ADMIN] Audit log warning:', audErr?.message)
    }

    revalidatePath('/super-admin')
    return {
      success: true,
      companyName: company.name,
      actionLink,
    }
  } catch (error: any) {
    console.error('[SUPER_ADMIN] Error approving company request:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Rechazar solicitud de empresa
 */
export async function rejectCompanyRequest(companyId: string, reason?: string) {
  try {
    const { extendedUser } = await getUserSession()
    const role = extendedUser?.role_id?.toLowerCase()
    if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

    const supabase = await createAdminClient()

    const { data: company } = await supabase
      .from('companies')
      .select('id, name, contact_email, working_hours')
      .eq('id', companyId)
      .single()

    let currentMetadata: any = {}
    try {
      currentMetadata = JSON.parse(company?.working_hours || '{}')
    } catch (_) {}

    currentMetadata.approval_status = 'rejected'
    currentMetadata.rejected_at = new Date().toISOString()
    currentMetadata.rejection_reason = reason || 'Rechazada administrativamente'
    currentMetadata.rejected_by = extendedUser.email

    const { error: updateErr } = await supabase
      .from('companies')
      .update({ 
        status: 'inactive', // COMPATIBLE CON DB CHECK CONSTRAINT
        working_hours: JSON.stringify(currentMetadata)
      })
      .eq('id', companyId)

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }

    await supabase
      .from('users')
      .update({ status: 'inactive' })
      .eq('company_id', companyId)

    // Auditoría inmutable
    try {
      const { logAuditEvent } = await import('@/lib/audit')
      await logAuditEvent({
        companyId,
        userId: extendedUser.id,
        userName: extendedUser.name,
        action: 'COMPANY_REQUEST_REJECTED',
        title: `Empresa Rechazada: ${company?.name || companyId}`,
        category: 'SUPER_ADMIN_REJECTION',
        details: {
          company_id: companyId,
          company_name: company?.name,
          reason: reason || 'Rechazada administrativamente',
          rejected_by_id: extendedUser.id,
          rejected_by_email: extendedUser.email,
        }
      })
    } catch (audErr: any) {
      console.warn('[SUPER_ADMIN] Audit log rejection warning:', audErr?.message)
    }

    revalidatePath('/super-admin')
    return { success: true }
  } catch (error: any) {
    console.error('[SUPER_ADMIN] Error rejecting company request:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Genera o regenera un enlace seguro de primer acceso o invitación para una empresa/cliente.
 * Emite un token criptográfico de un solo uso en Supabase Auth y lo prepara para compartirlo.
 */
export async function generateClientAccessLink(companyId: string) {
  try {
    const { extendedUser } = await getUserSession()
    const role = extendedUser?.role_id?.toLowerCase()
    if (role !== 'super_admin' && role !== 'superadmin') throw new Error('Acceso Denegado')

    const supabase = await createAdminClient()

    const { data: company, error: compErr } = await supabase
      .from('companies')
      .select('id, name, contact_email, phone, working_hours, status')
      .eq('id', companyId)
      .single()

    if (compErr || !company) {
      return { success: false, error: 'Empresa no encontrada.' }
    }

    // Buscar el administrador de la empresa en public.users
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, email, name, role_id, status')
      .eq('company_id', companyId)
      .eq('role_id', 'admin')
      .maybeSingle()

    const targetEmail = adminUser?.email || company.contact_email
    if (!targetEmail) {
      return { success: false, error: 'La empresa no cuenta con un correo corporativo de contacto para generar el acceso.' }
    }

    // Extraer nombre de contacto y teléfono
    let targetName = adminUser?.name || 'Administrador'
    let rawPhone = company.phone || ''
    if (company.working_hours) {
      try {
        const wh = JSON.parse(company.working_hours)
        const lead = wh.lead_details || wh.demo_request || wh.registration_request
        if (!adminUser?.name && lead?.contact_name) targetName = lead.contact_name
        if (lead?.phone && !rawPhone) rawPhone = lead.phone
      } catch (_) {}
    }

    // Asegurar que el usuario existe en auth.users
    const { data: authUserList } = await supabase.auth.admin.listUsers()
    const existingAuthUser = authUserList?.users?.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase())

    if (!existingAuthUser) {
      const tempPass = Math.random().toString(36).slice(-8) + 'Aa1!' + Math.random().toString(36).slice(-4)
      const { data: newAuth, error: createAuthErr } = await supabase.auth.admin.createUser({
        email: targetEmail,
        password: tempPass,
        email_confirm: true,
        user_metadata: { name: targetName }
      })

      if (createAuthErr || !newAuth.user) {
        return { success: false, error: `Error al provisionar cuenta: ${createAuthErr?.message}` }
      }

      if (!adminUser) {
        await supabase.from('users').insert({
          id: newAuth.user.id,
          name: targetName,
          email: targetEmail,
          company_id: companyId,
          role_id: 'admin',
          role: 'admin',
          status: 'active',
          area: 'Dirección'
        })
        await supabase.from('user_roles').upsert({
          user_id: newAuth.user.id,
          company_id: companyId,
          role_id: 'admin'
        }, { onConflict: 'user_id, company_id' })
      }
    }

    const siteUrl = await getSiteUrl()
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: targetEmail,
      options: {
        redirectTo: `${siteUrl}/reset-password`
      }
    })

    const hashedToken = linkData?.properties?.hashed_token
    const actionLink = hashedToken
      ? `${siteUrl}/activar?t=${hashedToken}`
      : linkData?.properties?.action_link

    if (linkErr || !actionLink) {
      return { success: false, error: linkErr?.message || 'No se pudo generar el enlace seguro de Supabase Auth.' }
    }

    // Auditoría inmutable de seguridad
    try {
      const { logAuditEvent } = await import('@/lib/audit')
      await logAuditEvent({
        companyId,
        userId: extendedUser.id,
        userName: extendedUser.name,
        action: 'CLIENT_ACCESS_LINK_GENERATED',
        title: `Enlace de Primer Acceso Generado: ${company.name}`,
        category: 'SECURITY_ACCESS',
        details: {
          company_id: companyId,
          company_name: company.name,
          target_email: targetEmail,
          generated_by: extendedUser.email,
        }
      })
    } catch (_) {}

    return {
      success: true,
      actionLink,
      targetEmail,
      targetName,
      companyName: company.name,
      phone: rawPhone
    }
  } catch (err: any) {
    console.error('[SUPER_ADMIN] Error in generateClientAccessLink:', err)
    return { success: false, error: err.message }
  }
}

