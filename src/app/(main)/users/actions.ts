'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'

// Removed static supabaseAdmin initialization to use dynamic createAdminClient instead

export async function getUsers() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  const supabase = await createAdminClient()
  console.log(`[USERS_DEBUG] getUsers. Company: ${companyId}, Role: ${extendedUser.role_id}`)

  const { data: users, error } = await applyIsolation(
    supabase.from('users').select('*, workers(name, position)'),
    companyId,
    extendedUser.role_id
  ).order('created_at', { ascending: false })

  if (error) {
    console.error('[USERS_CRITICAL] Error fetching users:', error)
    return []
  }

  console.log(`[USERS_DEBUG] getUsers success. Found ${users?.length || 0} users.`)

  return users || []
}

export async function getAvailableWorkers() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  const supabase = await createAdminClient()
  
  const { data: workers, error } = await applyIsolation(
    supabase.from('workers').select('id, name, dni, position'),
    companyId,
    extendedUser.role_id
  ).order('name', { ascending: true })

  if (error) {
    console.error('Error fetching available workers:', error)
    return []
  }

  return workers || []
}

export async function createUser(prevState: any, formData: FormData) {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    
    if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
      return { success: false, error: 'No tienes permisos para crear usuarios.' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const roleId = formData.get('role_id') as string
    const area = formData.get('area') as string
    const workerId = formData.get('worker_id') as string | null

    if (!email || !password || !name || !roleId || !area) {
      return { success: false, error: 'Todos los campos son obligatorios.' }
    }

    const supabaseAdmin = await createAdminClient()

    // 0. Verificar si el trabajador ya está vinculado
    if (workerId && workerId !== 'none') {
      const { data: existingLink } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('worker_id', workerId)
        .match(companyId ? { company_id: companyId } : {})
        .maybeSingle()

      if (existingLink) {
        return { success: false, error: `Este trabajador ya está vinculado al usuario ${existingLink.name} (${existingLink.email}).` }
      }
    }

    // 1. Create or Find user in Supabase Auth
    let authUserId: string | undefined

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        // If user exists, find their ID
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        if (listError) throw listError
        
        const existingUser = listData.users.find(u => u.email === email)
        if (!existingUser) return { success: false, error: 'Usuario registrado en Auth pero no encontrado.' }
        
        authUserId = existingUser.id
      } else {
        console.error('Auth Error:', authError)
        return { success: false, error: `Error en Auth: ${authError.message}` }
      }
    } else {
      authUserId = authData.user.id
    }

    if (!authUserId) return { success: false, error: 'No se pudo obtener el ID del usuario.' }

    // 2. Link/Upsert to our public.users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authUserId,
        company_id: companyId,
        name,
        email,
        role_id: roleId,
        area,
        worker_id: (workerId && workerId !== 'none') ? workerId : null,
        status: 'active'
      }, { onConflict: 'id' })

    if (dbError) {
      console.error('DB Error:', dbError)
      // Only delete if we just created it
      if (!authError) await supabaseAdmin.auth.admin.deleteUser(authUserId)
      return { success: false, error: 'Error al vincular el usuario en la base de datos.' }
    }

    // 3. Sync with user_roles table (Atomic RBAC)
    const { error: rbacError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authUserId,
        company_id: companyId,
        role_id: roleId
      }, { onConflict: 'user_id, company_id' })

    if (rbacError) console.error('RBAC Sync Error:', rbacError)

    revalidatePath('/users')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error Inesperado en createUser:', error)
    return { success: false, error: 'Error inesperado durante la creación.' }
  }
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive') {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
      return { success: false, error: 'Permiso denegado.' }
    }

    const supabaseAdmin = await createAdminClient()
    // PROTECCIÓN: No se puede desactivar al último administrador de la empresa
    if (status === 'inactive') {
      const { data: adminCount } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'active')
        .in('role_id', ['admin', 'gerente'])

      if ((adminCount?.length || 0) <= 1) {
        const { data: targetUser } = await supabaseAdmin.from('users').select('role_id').eq('id', userId).single()
        if (targetUser && ['admin', 'gerente'].includes(targetUser.role_id)) {
          return { success: false, error: 'No se puede desactivar al único administrador activo de la empresa.' }
        }
      }
    }

    const { error } = await applyIsolation(
      supabaseAdmin.from('users').update({ status }),
      companyId,
      extendedUser.role_id
    ).eq('id', userId)

    if (error) {
      console.error('Update Status Error:', error)
      return { success: false, error: 'Error al actualizar el estado.' }
    }

    revalidatePath('/users')
    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function updateUserRole(userId: string, role_id: string) {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
      return { success: false, error: 'Permiso denegado.' }
    }

    const supabaseAdmin = await createAdminClient()
    // PROTECCIÓN: No se puede quitar el rol de administrador si es el último
    if (!['admin', 'gerente'].includes(role_id)) {
      const { data: adminCount } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'active')
        .in('role_id', ['admin', 'gerente'])

      if ((adminCount?.length || 0) <= 1) {
        const { data: targetUser } = await supabaseAdmin.from('users').select('role_id').eq('id', userId).single()
        if (targetUser && ['admin', 'gerente'].includes(targetUser.role_id)) {
          return { success: false, error: 'No se puede degradar al único administrador de la empresa.' }
        }
      }
    }

    // 1. Actualizar tabla 'users'
    const { error: userError } = await applyIsolation(
      supabaseAdmin.from('users').update({ role_id }),
      companyId,
      extendedUser.role_id
    ).eq('id', userId)

    if (userError) {
      console.error('User Role Update Error:', userError)
      return { success: false, error: 'Error al actualizar el rol.' }
    }

    // 2. Sincronizar con tabla 'user_roles'
    const { error: rbacError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        company_id: companyId,
        role_id: role_id
      }, { onConflict: 'user_id, company_id' })

    if (rbacError) console.error('RBAC Sync Error:', rbacError)

    revalidatePath('/users')
    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected Update Error:', error)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function updateUserArea(userId: string, area: string) {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
      return { success: false, error: 'Permiso denegado.' }
    }

    const supabaseAdmin = await createAdminClient()
    const { error } = await applyIsolation(
      supabaseAdmin.from('users').update({ area }),
      companyId,
      extendedUser.role_id
    ).eq('id', userId)

    if (error) {
      console.error('User Area Update Error:', error)
      return { success: false, error: 'Error al actualizar el área.' }
    }

    revalidatePath('/users')
    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected Area Update Error:', error)
    return { success: false, error: 'Error inesperado.' }
  }
}
export async function deleteUser(userId: string) {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    
    if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
      return { success: false, error: 'No tienes permisos para eliminar usuarios.' }
    }

    const supabaseAdmin = await createAdminClient()

    // PROTECCIÓN: No se puede eliminar al último administrador
    const { data: adminCount } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .in('role_id', ['admin', 'gerente'])

    if ((adminCount?.length || 0) <= 1) {
      const { data: targetUser } = await supabaseAdmin.from('users').select('role_id').eq('id', userId).single()
      if (targetUser && ['admin', 'gerente'].includes(targetUser.role_id)) {
        return { success: false, error: 'No se puede eliminar al único administrador de la empresa.' }
      }
    }

    // 1. Eliminar de user_roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)

    // 2. Eliminar de Auth (Supabase Admin)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
      console.error('Delete Auth Error:', authError)
      // Si falla Auth, intentamos borrar de DB igual por si quedó huérfano
    }

    // 3. Eliminar de tabla users
    const { error: dbError } = await applyIsolation(
      supabaseAdmin.from('users').delete(),
      companyId,
      extendedUser.role_id
    ).eq('id', userId)

    if (dbError) {
      console.error('Delete DB Error:', dbError)
      return { success: false, error: 'Error al eliminar de la base de datos.' }
    }

    revalidatePath('/users')
    return { success: true }
  } catch (error: any) {
    console.error('Unexpected Delete Error:', error)
    return { success: false, error: error.message }
  }
}
