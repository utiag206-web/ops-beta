'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = await createClient()

  console.log(`[AUTH] Intentando login para: ${email}`)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error(`[AUTH_ERROR] Código: ${error.code}, Mensaje: ${error.message}`)
    if (error.message.toLowerCase().includes('password') || error.code === 'weak_password') {
      return { 
        error: 'Seguridad: Tu contraseña es muy débil o ha sido comprometida en otros sitios. Por favor, contacta al administrador.',
        code: error.code 
      }
    }
    return { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }
  }

  const authUser = data.user
  if (!authUser) return { error: 'No se pudo recuperar la información del usuario.' }

  console.log(`[AUTH_SUCCESS] Login exitoso para: ${email}`)
  
  // Direct DB Query to avoid getUserSession cookie race condition
  const { createAdminClient } = await import('@/lib/supabase/server')
  const adminSupabase = await createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('role_id')
    .eq('id', authUser.id)
    .maybeSingle()

  const role = userData?.role_id?.toLowerCase()
  console.log(`[AUTH] Rol detectado para redirect: ${role}`)

  revalidatePath('/', 'layout')

  if (role === 'super_admin' || role === 'superadmin') {
    redirect('/super-admin')
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
