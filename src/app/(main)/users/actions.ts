'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'

// Administrative client for user creation (bypasses regular Auth restrictions)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getUsers() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return []

  const supabase = await createServerClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('*, workers(name, position)')
    .eq('company_id', extendedUser.company_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return users || []
}

export async function getAvailableWorkers() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return []

  const supabase = await createServerClient()
  
  // Fetch workers that are NOT yet linked to any user
  // This is a simple approach: get all workers and the UI can show them.
  // Ideally we'd filter workers who are NOT in the users table's worker_id column.
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, name, dni, position')
    .eq('company_id', extendedUser.company_id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching available workers:', error)
    return []
  }

  return workers || []
}

export async function createUser(prevState: any, formData: FormData) {
  try {
    const { extendedUser } = await getUserSession()
    
    if (!extendedUser?.company_id || extendedUser.role_id !== 'admin') {
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

    // 0. Verificar si el trabajador ya está vinculado
    if (workerId && workerId !== 'none') {
      const { data: existingLink } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('worker_id', workerId)
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
        company_id: extendedUser.company_id,
        name,
        email,
        role_id: roleId,
        area,
        worker_id: (workerId && workerId !== 'none') ? workerId : null,
        status: 'active'
      }, { onConflict: 'id' }) // We use 'id' as conflict target to update their company and role

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
        company_id: extendedUser.company_id,
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
    const { extendedUser } = await getUserSession()
    if (!extendedUser?.company_id || extendedUser.role_id !== 'admin') {
      return { success: false, error: 'Permiso denegado.' }
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ status })
      .eq('id', userId)
      .eq('company_id', extendedUser.company_id)

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
    const { extendedUser } = await getUserSession()
    if (!extendedUser?.company_id || extendedUser.role_id !== 'admin') {
      return { success: false, error: 'Permiso denegado.' }
    }

    // 1. Actualizar tabla 'users'
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ role_id })
      .eq('id', userId)
      .eq('company_id', extendedUser.company_id)

    if (userError) {
      console.error('User Role Update Error:', userError)
      return { success: false, error: 'Error al actualizar el rol.' }
    }

    // 2. Sincronizar con tabla 'user_roles'
    const { error: rbacError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        company_id: extendedUser.company_id,
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
    const { extendedUser } = await getUserSession()
    if (!extendedUser?.company_id || extendedUser.role_id !== 'admin') {
      return { success: false, error: 'Permiso denegado.' }
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ area })
      .eq('id', userId)
      .eq('company_id', extendedUser.company_id)

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
