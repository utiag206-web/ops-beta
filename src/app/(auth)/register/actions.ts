'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function register(prevState: any, formData: FormData) {
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

  // 1. Registrar usuario usando el cliente Admin para saltar límites de rate-limit y confirmación
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  })

  if (authError) {
    console.error(`[AUTH_ERROR] Error en admin.createUser: ${authError.message}`)
    if (authError.message.includes('already registered') || authError.message.includes('exists')) {
        return { error: 'Este correo ya está registrado. Intenta iniciar sesión.' }
    }
    return { error: `Error de registro (Admin): ${authError.message}` }
  }

  const authUserId = authData.user?.id
  if (!authUserId) {
    return { error: 'No se pudo crear el usuario.' }
  }

  try {
    // 2. Crear la Empresa
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert([{
        name: companyName,
        contact_email: email,
        address: 'Av. Principal 123 (Por actualizar)',
        phone: '999999999',
        industry: 'Servicios',
        timezone: 'UTC-5'
      }])
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
        role: 'admin', // Consistency with observed schema
        status: 'active', // Changed from 'ACTIVO' to 'active'
        area: 'Administración'
      })

    if (userError) {
      console.error(`[DB_ERROR] Error al vincular usuario: ${userError.message}`)
      return { error: 'Error al vincular tu perfil de usuario.' }
    }

    // 4. Sincronizar RBAC (si existe la tabla user_roles)
    const { error: rbacError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ 
        user_id: authUserId,
        company_id: companyId,
        role_id: 'admin'
      }, { onConflict: 'user_id, company_id' })
    
    if (rbacError) {
        console.warn(`[RBAC_WARN] No se pudo sincronizar user_roles: ${rbacError.message}`)
    }

    console.log(`[AUTH_SUCCESS] Registro completo para: ${email}`)

    // 5. Bootstrap Company Data (Movement types, Warehouses, etc.)
    try {
      const { bootstrapCompany } = await import('@/lib/bootstrap')
      await bootstrapCompany(companyId)
      console.log(`[BOOTSTRAP_SUCCESS] Tenant ${companyId} initialized.`)
    } catch (bootstrapErr: any) {
      console.warn(`[BOOTSTRAP_WARN] No se pudo inicializar los datos base: ${bootstrapErr.message}`)
    }

    revalidatePath('/', 'layout')
    revalidatePath('/dashboard')
    
  } catch (err: any) {
    console.error(`[FATAL_ERROR] Error inesperado en registro: ${err.message}`)
    return { error: 'Ocurrió un error inesperado al configurar tu cuenta.' }
  }

  // 6. Iniciar sesión automáticamente
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (loginError) {
    console.warn(`[AUTH_WARN] Registro exitoso pero auto-login falló: ${loginError.message}`)
    redirect('/login?message=Registro exitoso. Por favor inicia sesión.')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
