'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function register(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const companyName = formData.get('companyName') as string

  if (!name || !email || !password || !companyName) {
    return { error: 'Todos los campos son obligatorios.' }
  }

  const supabase = await createClient()
  const supabaseAdmin = await createAdminClient()

  console.log(`[AUTH] Iniciando registro para: ${email} con empresa: ${companyName}`)

  // 1. Registrar usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      },
    },
  })

  if (authError) {
    console.error(`[AUTH_ERROR] Error en signUp: ${authError.message}`)
    if (authError.message.includes('already registered')) {
        return { error: 'Este correo ya está registrado. Intenta iniciar sesión.' }
    }
    return { error: `Error de registro: ${authError.message}` }
  }

  const authUserId = authData.user?.id
  if (!authUserId) {
    return { error: 'No se pudo crear el usuario en el sistema de autenticación.' }
  }

  try {
    // 2. Crear la Empresa
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
      })
      .select('id')
      .single()

    if (companyError) {
      console.error(`[DB_ERROR] Error al crear empresa: ${companyError.message}`)
      // Podríamos intentar borrar el usuario de auth aquí si quisiéramos ser estrictos
      return { error: 'Error al configurar la empresa en la base de datos.' }
    }

    const companyId = companyData.id

    // 3. Crear el registro en public.users como ADMIN de esa empresa
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

    if (userError) {
      console.error(`[DB_ERROR] Error al vincular usuario: ${userError.message}`)
      return { error: 'Error al vincular tu perfil de usuario.' }
    }

    // 4. Sincronizar RBAC (si existe la tabla user_roles)
    const { error: rbacError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUserId,
        company_id: companyId,
        role_id: 'admin'
      })
    
    if (rbacError) {
        console.warn(`[RBAC_WARN] No se pudo sincronizar user_roles: ${rbacError.message}`)
        // No bloqueamos el flujo por esto si ya se creó en la tabla 'users'
    }

    console.log(`[AUTH_SUCCESS] Registro completo para: ${email}`)
    
  } catch (err: any) {
    console.error(`[FATAL_ERROR] Error inesperado en registro: ${err.message}`)
    return { error: 'Ocurrió un error inesperado al configurar tu cuenta.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
