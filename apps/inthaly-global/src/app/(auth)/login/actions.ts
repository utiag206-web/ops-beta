'use server'

import { redirect } from 'next/navigation'
import { authenticateAdmin } from '@/lib/auth/admin-auth.service'
import { createAdminSession, destroyAdminSession } from '@/lib/auth/admin-session'

export interface LoginActionState {
  error?: string
  success?: boolean
}

/**
 * Server Action para inicio de sesión administrativo directo
 */
export async function loginAdminAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get('email')?.toString() || ''
  const password = formData.get('password')?.toString() || ''

  if (!email || !password) {
    return { error: 'Por favor ingresa tu correo y contraseña maestra' }
  }

  const authResult = await authenticateAdmin(email, password)

  if (!authResult.success || !authResult.user) {
    return { error: authResult.error || 'Credenciales administrativas inválidas' }
  }

  // Crear la sesión en la cookie inthaly_global_session
  await createAdminSession(authResult.user)

  // Redirigir al dashboard panorámico
  redirect('/overview')
}

/**
 * Server Action para cierre de sesión administrativo
 */
export async function logoutAdminAction(): Promise<void> {
  await destroyAdminSession()
  redirect('/login')
}
