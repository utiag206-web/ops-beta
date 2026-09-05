'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface RealSecurityUser {
  id: string
  name: string
  email: string
  role: string
  isVerified: boolean
  verificationDate?: string
  lastSignIn?: string
  createdAt?: string
}

export interface RealAccessLog {
  id: string
  user: string
  role: string
  timestamp: string
  ip: string
  browser: string
  device: string
  status: 'success' | 'failed' | 'blocked'
  reason?: string
}

/**
 * Obtiene los usuarios reales de la plataforma junto con su estado de verificación de correo en Supabase Auth
 */
export async function getSecurityUsers(): Promise<RealSecurityUser[]> {
  try {
    const supabase = await createAdminClient()

    // 1. Obtener usuarios registrados en la base de datos
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, role_id, role, status, created_at')
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('[SECURITY_ACTIONS] Error al consultar tabla users:', dbError)
    }

    // 2. Obtener usuarios reales de Supabase Auth para verificar email_confirmed_at
    let authUsersMap: Record<string, any> = {}
    try {
      const { data: authUsersData, error: authListError } = await supabase.auth.admin.listUsers({
        perPage: 1000
      })
      if (!authListError && authUsersData?.users) {
        authUsersData.users.forEach((u: any) => {
          if (u.id) authUsersMap[u.id] = u
          if (u.email) authUsersMap[u.email.toLowerCase()] = u
        })
      }
    } catch (authErr) {
      console.warn('[SECURITY_ACTIONS] No se pudo listar auth.admin:', authErr)
    }

    if (!dbUsers || dbUsers.length === 0) {
      return []
    }

    return dbUsers.map((u: any) => {
      const authUser = authUsersMap[u.id] || authUsersMap[(u.email || '').toLowerCase()]
      const isVerified = !!authUser?.email_confirmed_at
      const rawRole = (u.role_id || u.role || 'trabajador').toLowerCase()
      
      let roleLabel = 'Colaborador'
      if (rawRole === 'super_admin' || rawRole === 'superadmin' || rawRole === 'super-admin') {
        roleLabel = 'Super Admin'
      } else if (rawRole.includes('gerente')) {
        roleLabel = 'Gerente General'
      } else if (rawRole === 'admin' || rawRole === 'administrador') {
        roleLabel = 'Administrador'
      } else if (rawRole.includes('soma')) {
        roleLabel = 'Supervisor SOMA'
      } else if (rawRole === 'supervisor') {
        roleLabel = 'Supervisor'
      } else if (rawRole === 'jefe_area' || rawRole === 'jefe-area') {
        roleLabel = 'Jefe de Área'
      } else if (rawRole.includes('mecanica')) {
        roleLabel = 'Jefe de Mecánica'
      } else if (rawRole.includes('operacion') || rawRole.includes('mina') || rawRole.includes('capataz')) {
        roleLabel = 'Jefe de Operaciones'
      }

      let verificationFormatted = '-'
      if (authUser?.email_confirmed_at) {
        const d = new Date(authUser.email_confirmed_at)
        verificationFormatted = `${d.toLocaleDateString('es-PE')} ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}`
      }

      let lastSignInFormatted = '-'
      if (authUser?.last_sign_in_at) {
        const d = new Date(authUser.last_sign_in_at)
        lastSignInFormatted = `${d.toLocaleDateString('es-PE')} ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}`
      }

      return {
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'Usuario',
        email: u.email || 'sin-correo@inthaly.com',
        role: roleLabel,
        isVerified,
        verificationDate: isVerified ? verificationFormatted : undefined,
        lastSignIn: lastSignInFormatted,
        createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString('es-PE') : '-'
      }
    }).sort((a: any, b: any) => {
      if (a.role === 'Super Admin' && b.role !== 'Super Admin') return -1
      if (b.role === 'Super Admin' && a.role !== 'Super Admin') return 1
      return 0
    })
  } catch (error) {
    console.error('[SECURITY_ACTIONS] Error crítico en getSecurityUsers:', error)
    return []
  }
}

/**
 * Reenvía el correo de verificación oficial al usuario mediante Supabase Auth
 */
export async function resendVerificationEmail(email: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`
      }
    })

    if (error) {
      console.warn('[SECURITY_ACTIONS] Error al reenviar enlace:', error.message)
      // Intentar método alternativo mediante admin generateLink (magiclink)
      const admin = await createAdminClient()
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: email.trim(),
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`
        }
      })
      if (linkErr) {
        return { success: false, error: linkErr.message }
      }
      return { success: true, message: `Enlace de verificación generado exitosamente para ${email}.` }
    }

    return { success: true, message: `Correo de verificación enviado exitosamente a ${email}.` }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al procesar la solicitud' }
  }
}
