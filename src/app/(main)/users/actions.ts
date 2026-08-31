'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'

// Administrative client for user creation (bypasses regular Auth restrictions)
let supabaseAdminInstance: any = null
function getSupabaseAdmin() {
 if (!supabaseAdminInstance) {
 supabaseAdminInstance = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 )
 }
 return supabaseAdminInstance
}

export async function getUsers() {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 const supabase = await createAdminClient()
 console.log(`[USERS_DEBUG] getUsers. Company: ${companyId}, Role: ${extendedUser.role_id}`)

 // 1. Obtener IDs de usuarios vinculados a esta empresa vía user_roles de forma explícita
 const { data: userRoles, error: rbacError } = await supabase
 .from('user_roles')
 .select('user_id')
 .eq('company_id', companyId)

 if (rbacError) {
 console.warn('[USERS_WARN] Error fetching user roles:', rbacError.message)
 }

 const mappedUserIds = (userRoles || []).map((ur: any) => ur.user_id).filter(Boolean)

 // 2. Obtener usuarios que pertenecen nativamente o están vinculados vía RBAC explícito
 let query = supabase
 .from('users')
 .select('*, workers(name, position)')

 if (mappedUserIds.length > 0) {
 query = query.or(`company_id.eq.${companyId},id.in.(${mappedUserIds.join(',')})`)
 } else {
 query = query.eq('company_id', companyId)
 }

 const { data: users, error } = await query.order('created_at', { ascending: false })

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
 ).eq('status', 'active').order('name', { ascending: true })

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
 const supabaseAdmin = getSupabaseAdmin()
 
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
 
 const existingUser = listData.users.find((u: any) => u.email === email)
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

 let finalWorkerId = (workerId && workerId !== 'none') ? workerId : null

 if (roleId === 'trabajador' && !finalWorkerId) {
 const nameParts = name.trim().split(' ')
 const firstName = nameParts[0]
 const lastName = nameParts.slice(1).join(' ') || 'Trabajador'
 const tempDni = String(Math.floor(10000000 + Math.random() * 90000000))

 const { data: newWorker, error: wError } = await supabaseAdmin
 .from('workers')
 .insert({
 company_id: companyId,
 name: firstName,
 last_name: lastName,
 dni: tempDni,
 cod: `W-${tempDni.substring(4)}`,
 position: 'Trabajador',
 email: email,
 status: 'active'
 })
 .select()
 .single()

 if (!wError && newWorker) {
 finalWorkerId = newWorker.id
 } else {
 console.error('[CREATE_USER_WORKER_AUTO] Error auto-creating worker profile:', wError)
 }
 }

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
 worker_id: finalWorkerId,
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
 const supabaseAdmin = getSupabaseAdmin()
 if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
 return { success: false, error: 'Permiso denegado.' }
 }

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

 // Secure Multi-Tenant Link Validation
 const { data: userLink } = await supabaseAdmin
 .from('users')
 .select('id, company_id')
 .eq('id', userId)
 .maybeSingle()

 if (!userLink) {
 return { success: false, error: 'Usuario no encontrado.' }
 }

 const { data: rbacLink } = await supabaseAdmin
 .from('user_roles')
 .select('id')
 .eq('user_id', userId)
 .eq('company_id', companyId)
 .maybeSingle()

 const isLinked = userLink.company_id === companyId || !!rbacLink

 if (!isLinked) {
 return { success: false, error: 'No autorizado para modificar este usuario.' }
 }

 const { error } = await supabaseAdmin
 .from('users')
 .update({ status })
 .eq('id', userId)

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
 const supabaseAdmin = getSupabaseAdmin()
 if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
 return { success: false, error: 'Permiso denegado.' }
 }

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

 // Secure Multi-Tenant Link Validation
 const { data: userLink } = await supabaseAdmin
 .from('users')
 .select('id, company_id')
 .eq('id', userId)
 .maybeSingle()

 if (!userLink) {
 return { success: false, error: 'Usuario no encontrado.' }
 }

 const { data: rbacLink } = await supabaseAdmin
 .from('user_roles')
 .select('id')
 .eq('user_id', userId)
 .eq('company_id', companyId)
 .maybeSingle()

 const isLinked = userLink.company_id === companyId || !!rbacLink

 if (!isLinked) {
 return { success: false, error: 'No autorizado para modificar este usuario.' }
 }

  // 0. Asegurar que los roles estándar existan en public.roles para evitar violación de Foreign Key
  try {
    await supabaseAdmin.from('roles').upsert([
      { id: 'admin', name: 'Administrador' },
      { id: 'gerente', name: 'Gerente' },
      { id: 'jefe_area', name: 'Jefe de Área' },
      { id: 'almacen', name: 'Logística' },
      { id: 'operaciones', name: 'Mina' },
      { id: 'supervisor', name: 'Líder de Cuadrilla' },
      { id: 'mecanica', name: 'Mecánica' },
      { id: 'soma', name: 'Seguridad SOMA' },
      { id: 'administracion', name: 'Administración' },
      { id: 'trabajador', name: 'Trabajador' },
      { id: 'super_admin', name: 'Super Administrador' }
    ], { onConflict: 'id' })
  } catch (rErr) {
    console.warn('[ROLES_SYNC_WARN]:', rErr)
  }

  // 1. Actualizar tabla 'users'
  const { error: userError } = await supabaseAdmin
  .from('users')
  .update({ role_id })
  .eq('id', userId)

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
 const supabaseAdmin = getSupabaseAdmin()
 if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
 return { success: false, error: 'Permiso denegado.' }
 }

 // Secure Multi-Tenant Link Validation
 const { data: userLink } = await supabaseAdmin
 .from('users')
 .select('id, company_id')
 .eq('id', userId)
 .maybeSingle()

 if (!userLink) {
 return { success: false, error: 'Usuario no encontrado.' }
 }

 const { data: rbacLink } = await supabaseAdmin
 .from('user_roles')
 .select('id')
 .eq('user_id', userId)
 .eq('company_id', companyId)
 .maybeSingle()

 const isLinked = userLink.company_id === companyId || !!rbacLink

 if (!isLinked) {
 return { success: false, error: 'No autorizado para modificar este usuario.' }
 }

 const { error } = await supabaseAdmin
 .from('users')
 .update({ area })
 .eq('id', userId)

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
 const supabaseAdmin = getSupabaseAdmin()
 
 if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
 return { success: false, error: 'No tienes permisos para eliminar usuarios.' }
 }

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

export async function updateUserProfile(userId: string, data: { name?: string, area?: string }) {
 try {
 const companyId = await getStrictCompanyId()
 const { extendedUser } = await getUserSession()
 const supabaseAdmin = getSupabaseAdmin()
 if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
 return { success: false, error: 'Permiso denegado.' }
 }

 // Secure Multi-Tenant Link Validation
 const { data: userLink } = await supabaseAdmin
 .from('users')
 .select('id, company_id')
 .eq('id', userId)
 .maybeSingle()

 if (!userLink) {
 return { success: false, error: 'Usuario no encontrado.' }
 }

 const { data: rbacLink } = await supabaseAdmin
 .from('user_roles')
 .select('id')
 .eq('user_id', userId)
 .eq('company_id', companyId)
 .maybeSingle()

 const isLinked = userLink.company_id === companyId || !!rbacLink

 if (!isLinked) {
 return { success: false, error: 'No autorizado para modificar este usuario.' }
 }

 const { error } = await supabaseAdmin
 .from('users')
 .update(data)
 .eq('id', userId)

 if (error) throw error

 revalidatePath('/users')
 return { success: true }
 } catch (error: any) {
 return { success: false, error: error.message }
 }
}

export async function updateUserEmail(userId: string, email: string) {
 try {
 const { extendedUser } = await getUserSession()
 const supabaseAdmin = getSupabaseAdmin()
 if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
 return { success: false, error: 'Permiso denegado.' }
 }

 // 0. Bloqueador estricto para evitar re-asignación a correos ya existentes en el sistema
 const { data: existingEmail } = await supabaseAdmin
 .from('users')
 .select('id, email')
 .eq('email', email)
 .neq('id', userId)
 .maybeSingle()

 if (existingEmail) {
 return { 
 success: false, 
 error: 'El correo electrónico ya está registrado por otro usuario en la plataforma. Cambio denegado por seguridad multiempresa.' 
 }
 }

 // 1. Update in Auth
 const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email })
 if (authError) throw authError

 // 2. Update in public.users
 const { error: dbError } = await supabaseAdmin.from('users').update({ email }).eq('id', userId)
 if (dbError) throw dbError

 revalidatePath('/users')
 return { success: true }
 } catch (error: any) {
 return { success: false, error: error.message }
 }
}

export async function updateUserPassword(userId: string, password: string) {
 try {
 const { extendedUser } = await getUserSession()
 const supabaseAdmin = getSupabaseAdmin()
 if (extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'super_admin') {
 return { success: false, error: 'Permiso denegado.' }
 }

 const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
 if (error) throw error

 return { success: true }
 } catch (error: any) {
 return { success: false, error: error.message }
 }
}
