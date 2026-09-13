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

  // 1. Registrar usuario usando el cliente Admin
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
    // 2. Crear la Empresa con status 'inactive' en PostgreSQL (compatible con companies_status_check)
    const registrationDetails = {
      request_type: 'register',
      approval_status: 'pending',
      registration_request: {
        registered_by_name: name,
        registered_by_email: email,
        company_name: companyName,
        submitted_at: new Date().toISOString(),
      },
    }

    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert([{
        name: companyName,
        contact_email: email,
        address: 'Registro Web Corporativo',
        phone: '999999999',
        industry: 'Servicios',
        status: 'inactive', // COMPATIBLE CON DB CHECK CONSTRAINT
        timezone: 'America/Lima',
        working_hours: JSON.stringify(registrationDetails),
        is_test: false,
      }])
      .select('id')
      .single()

    if (companyError) {
      console.error(`[DB_ERROR] Error al crear empresa: ${companyError.message}`)
      return { error: 'Error al registrar la empresa en el sistema.' }
    }

    const companyId = companyData.id

    // 3. Crear el registro en public.users como ADMIN con status 'inactive' (compatible con users_status_check)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUserId,
        name: name,
        email: email,
        company_id: companyId,
        role_id: 'admin',
        role: 'admin',
        status: 'inactive', // COMPATIBLE CON DB CHECK CONSTRAINT
        area: 'Administración'
      })

    if (userError) {
      console.error(`[DB_ERROR] Error al vincular usuario: ${userError.message}`)
      return { error: 'Error al registrar tu perfil de usuario.' }
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

    // 5. Registrar evento en Auditoría Inmutable
    try {
      const { logAuditEvent } = await import('@/lib/audit')
      await logAuditEvent({
        companyId,
        userId: authUserId,
        userName: name, // Instantánea inmutable
        action: 'COMPANY_REGISTER_PENDING',
        title: `Solicitud de Registro Corporativo: ${companyName}`,
        category: 'COMPANY_REGISTRATION',
        details: {
          company_name: companyName,
          admin_email: email,
          admin_name: name,
        }
      })
    } catch (auditErr: any) {
      console.warn('[AUDIT_WARN] Error registrando auditoría de registro:', auditErr?.message)
    }

    revalidatePath('/super-admin')
    
    // Retornamos estado pendiente de revisión SIN inicio de sesión operativo inmediato
    return {
      success: true,
      pendingApproval: true,
      email,
      companyName,
      message: 'Tu solicitud de registro ha sido recibida. El Super Administrador revisará y activará tu cuenta a la brevedad.'
    }

  } catch (err: any) {
    console.error(`[FATAL_ERROR] Error inesperado en registro: ${err.message}`)
    return { error: 'Ocurrió un error inesperado al configurar tu cuenta.' }
  }
}
