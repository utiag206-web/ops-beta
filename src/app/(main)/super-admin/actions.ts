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
      fetchCount(supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'suspended')),
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

  const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
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
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single()
    
    if (roleData) {
      await supabase
        .from('user_roles')
        .insert([{
          user_id: authUserId,
          company_id: companyId,
          role_id: roleData.id
        }])
    }

    // 5-8. Inicialización Automática en Paralelo (Optimización PRE-DEPLOY)
    const movementDefaults = [
      { company_id: companyId, name: 'Ingreso Almacén', code: 'ING', effect: 'IN' },
      { company_id: companyId, name: 'Salida Consumo', code: 'SAL', effect: 'OUT' },
      { company_id: companyId, name: 'Transferencia', code: 'TRF', effect: 'BOTH' },
      { company_id: companyId, name: 'Ajuste de Stock', code: 'ADJUST', effect: 'IN' }
    ]

    const warehouseDefaults = [
      { company_id: companyId, name: 'Almacén General', code: 'GEN' },
      { company_id: companyId, name: 'Almacén Cocina', code: 'COC', area: 'COCINA' }
    ]

    const categoryDefaults = [
      { company_id: companyId, name: 'EPP', description: 'Equipos de Protección Personal' },
      { company_id: companyId, name: 'Herramientas', description: 'Herramientas y Equipos' },
      { company_id: companyId, name: 'Insumos', description: 'Insumos generales' },
      { company_id: companyId, name: 'Cocina', description: 'Insumos para cocina' }
    ]

    const unitDefaults = [
      { company_id: companyId, name: 'Unidad', abbreviation: 'UND' },
      { company_id: companyId, name: 'Paquete', abbreviation: 'PQT' },
      { company_id: companyId, name: 'Caja', abbreviation: 'CJ' },
      { company_id: companyId, name: 'Kilogramo', abbreviation: 'KG' }
    ]

    const somaDefaults = [
      { company_id: companyId, topic: 'Inducción de Seguridad', description: 'Capacitación inicial' },
      { company_id: companyId, topic: 'Primeros Auxilios', description: 'Atención de emergencias' }
    ]

    await Promise.all([
      supabase.from('movement_types').insert(movementDefaults),
      supabase.from('warehouses').insert(warehouseDefaults),
      supabase.from('categories').insert(categoryDefaults),
      supabase.from('units').insert(unitDefaults),
      supabase.from('soma_talks').insert(somaDefaults).catch(() => null) // Silent catch for optional SOMA
    ])

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
