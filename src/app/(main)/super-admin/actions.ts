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
    
    let authUserId: string | null = null
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: payload.adminEmail,
      password: password,
      email_confirm: true,
      user_metadata: { name: payload.adminName }
    })

    if (authError) {
      if (authError.message.includes('already') || authError.message.includes('exists')) {
        // User already exists, fetch their ID
        const { data: listData } = await supabase.auth.admin.listUsers()
        const existing = listData.users.find(u => u.email === payload.adminEmail)
        if (existing) {
          authUserId = existing.id
        } else {
          throw new Error(`Error al vincular usuario existente: no encontrado.`)
        }
      } else {
        throw new Error(`Error al crear usuario auth: ${authError.message}`)
      }
    } else {
      authUserId = authData.user.id
    }

    if (!authUserId) throw new Error('No se pudo resolver el ID de usuario.')

    // 3. Vincular usuario en tabla 'users'
    const { error: userError } = await supabase
      .from('users')
      .upsert([{
        id: authUserId,
        company_id: companyId, // Default company
        name: payload.adminName,
        email: payload.adminEmail,
        role_id: 'admin',
        status: 'active',
        area: 'Administración'
      }], { onConflict: 'id' })

    if (userError) throw new Error(`Error al crear registro de usuario: ${userError.message}`)

    // Sincronizar user_roles directamente con el string para evitar problemas de foreign key nulos
    const { error: rbacError } = await supabase
      .from('user_roles')
      .upsert([{
        user_id: authUserId,
        company_id: companyId,
        role_id: 'admin'
      }], { onConflict: 'user_id, company_id' })
    
    if (rbacError) {
      console.error(`[BOOTSTRAP_CRITICAL] Error al vincular rol administrativo:`, rbacError.message)
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

export async function forensicIdentityAudit(email: string) {
  try {
    const supabase = await createAdminClient()
    
    // 1. Capa Auth
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const authRecord = authUsers?.users?.filter(u => u.email === email)

    // 2. Capa Public Users
    const { data: publicRecords } = await supabase
      .from('users')
      .select('*, companies(name)')
      .eq('email', email)

    // 3. Capa RBAC
    let rbacRecords: any[] = []
    if (publicRecords && publicRecords.length > 0) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*, companies(name)')
        .in('user_id', publicRecords.map(p => p.id))
      rbacRecords = roles || []
    }

    return {
      success: true,
      data: {
        auth: authRecord || [],
        public: publicRecords || [],
        rbac: rbacRecords
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function repairIdentity(targetId: string, correctName: string) {
  try {
    const supabase = await createAdminClient()
    
    // 1. Restaurar Nombre en Perfil
    const { error: profileError } = await supabase
      .from('users')
      .update({ name: correctName, role_id: 'super_admin' })
      .eq('id', targetId)

    if (profileError) throw profileError

    // 2. Asegurar Rol Global
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', targetId)
      .eq('role_id', 'super_admin')
      .maybeSingle()

    if (!existingRole) {
      await supabase.from('user_roles').insert({
        user_id: targetId,
        role_id: 'super_admin',
        company_id: null // Global
      })
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
