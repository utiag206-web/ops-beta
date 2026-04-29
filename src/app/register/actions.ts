'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function register(formData: FormData) {
  const name = formData.get('name') as string
  const companyName = formData.get('companyName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabaseAdmin = await createAdminClient()
  const supabase = await createClient()

  // 1. Registro en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
        return { error: 'Este correo ya está registrado. Intenta iniciar sesión.' }
    }
    return { error: `Error de registro: ${authError.message}` }
  }

  const authUserId = authData.user?.id
  if (!authUserId) return { error: 'Error al recuperar ID de usuario.' }

  try {
    // 2. Crear Empresa
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
      })
      .select('id')
      .single()

    if (companyError) throw companyError
    const companyId = companyData.id

    // 3. Crear Perfil de Usuario vinculado a Empresa y Rol Admin
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUserId,
        name: name,
        email: email,
        company_id: companyId,
        role_id: 'admin',
        status: 'active',
        area: 'Administración'
      })

    if (userError) throw userError

  } catch (err: any) {
    console.error(`[FATAL_ERROR] Error inesperado en registro: ${err.message}`)
    return { error: 'Ocurrió un error inesperado al configurar tu cuenta empresarial.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
