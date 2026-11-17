'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { inthalyIdService } from '@/services'
import type { InthalyIdentity, InthalySession, ConnectedApp, InthalySecurityEvent } from '@/types/inthaly-id.types'
import type { ActionResponse } from '@/types/common.types'

const SESSION_COOKIE_NAME = 'inthaly_id_session'

/**
 * Inicia sesión en Inthaly ID y establece la cookie de sesión segura
 */
export async function loginIdentityAction(params: {
  email: string
  password: string
  userAgent?: string
  ipAddress?: string
}): Promise<ActionResponse<{ identity: InthalyIdentity; redirectUrl?: string }>> {
  try {
    const res = await inthalyIdService.authenticateIdentity({
      email: params.email,
      password: params.password,
      user_agent: params.userAgent,
      ip_address: params.ipAddress
    })

    if (!res.success || !res.data) {
      return { success: false, error: res.error || 'Credenciales inválidas' }
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, res.data.session.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 // 7 días
    })

    return {
      success: true,
      data: {
        identity: res.data.identity
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el servidor de identidad' }
  }
}

/**
 * Registra una nueva identidad en Inthaly ID
 */
export async function registerIdentityAction(params: {
  email: string
  password: string
  displayName: string
  userAgent?: string
  ipAddress?: string
}): Promise<ActionResponse<{ identity: InthalyIdentity }>> {
  try {
    const regRes = await inthalyIdService.registerIdentity({
      email: params.email,
      password: params.password,
      display_name: params.displayName,
      user_agent: params.userAgent,
      ip_address: params.ipAddress
    })

    if (!regRes.success || !regRes.data) {
      return { success: false, error: regRes.error || 'Error registrando identidad' }
    }

    // Autenticar automáticamente tras registro
    const authRes = await inthalyIdService.authenticateIdentity({
      email: params.email,
      password: params.password,
      user_agent: params.userAgent,
      ip_address: params.ipAddress
    })

    if (authRes.success && authRes.data) {
      const cookieStore = await cookies()
      cookieStore.set(SESSION_COOKIE_NAME, authRes.data.session.session_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 3600
      })
    }

    return {
      success: true,
      data: { identity: regRes.data.identity }
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error en el registro' }
  }
}

/**
 * Cierra la sesión activa en Inthaly ID
 */
export async function logoutIdentityAction(): Promise<ActionResponse<boolean>> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (sessionToken) {
      const identity = await inthalyIdService.validateSession(sessionToken)
      if (identity) {
        // Encontrar sesión y revocar
        const sessions = await inthalyIdService.getActiveSessions(identity.id)
        const currentSess = sessions.find(s => s.session_token === sessionToken)
        if (currentSess) {
          await inthalyIdService.revokeSession(currentSess.id, identity.id)
        }
      }
      cookieStore.delete(SESSION_COOKIE_NAME)
    }

    return { success: true, data: true }
  } catch (err: any) {
    return { success: false, error: 'Error al cerrar sesión' }
  }
}

/**
 * Obtiene la identidad actualmente autenticada en Inthaly ID
 */
export async function getCurrentIdentityAction(): Promise<InthalyIdentity | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!sessionToken) return null

    return await inthalyIdService.validateSession(sessionToken)
  } catch {
    return null
  }
}

/**
 * Obtiene las sesiones activas de la identidad
 */
export async function getActiveSessionsAction(): Promise<InthalySession[]> {
  const current = await getCurrentIdentityAction()
  if (!current) return []
  return inthalyIdService.getActiveSessions(current.id)
}

/**
 * Revoca una sesión específica
 */
export async function revokeSessionAction(sessionId: string): Promise<ActionResponse<boolean>> {
  const current = await getCurrentIdentityAction()
  if (!current) return { success: false, error: 'No autorizado' }

  const res = await inthalyIdService.revokeSession(sessionId, current.id)
  revalidatePath('/id/cuenta')
  return res
}

/**
 * Cambia la contraseña desde el Centro de Identidad
 */
export async function changePasswordAction(currentPass: string, newPass: string): Promise<ActionResponse<boolean>> {
  const current = await getCurrentIdentityAction()
  if (!current) return { success: false, error: 'No autorizado' }

  return inthalyIdService.changePassword(current.id, currentPass, newPass)
}

/**
 * Obtiene las aplicaciones conectadas a la identidad
 */
export async function getConnectedAppsAction(): Promise<ConnectedApp[]> {
  const current = await getCurrentIdentityAction()
  if (!current) return []
  return inthalyIdService.getConnectedApps(current.id)
}

/**
 * Revoca el acceso a una aplicación conectada
 */
export async function revokeConnectedAppAction(clientId: string): Promise<ActionResponse<boolean>> {
  const current = await getCurrentIdentityAction()
  if (!current) return { success: false, error: 'No autorizado' }

  const res = await inthalyIdService.revokeConnectedApp(current.id, clientId)
  revalidatePath('/id/cuenta')
  return res
}

/**
 * Obtiene el historial de auditoría de seguridad del usuario
 */
export async function getSecurityEventsAction(): Promise<InthalySecurityEvent[]> {
  const current = await getCurrentIdentityAction()
  if (!current) return []
  return inthalyIdService.getSecurityEvents(current.id, 15)
}

/**
 * Solicita restablecimiento de contraseña
 */
export async function requestPasswordResetAction(email: string): Promise<ActionResponse<{ resetToken: string }>> {
  return inthalyIdService.requestPasswordReset(email)
}

/**
 * Restablece la contraseña con token
 */
export async function resetPasswordWithTokenAction(token: string, newPass: string): Promise<ActionResponse<boolean>> {
  return inthalyIdService.resetPasswordWithToken(token, newPass)
}

/**
 * Inicia el flujo de autorización OIDC desde una app cliente (ej. Comunidad)
 */
export async function authorizeOidcFlowAction(params: {
  clientId: string
  redirectUri: string
  scope: string
}): Promise<ActionResponse<{ redirectUrl: string }>> {
  const current = await getCurrentIdentityAction()
  if (!current) {
    // Si no está autenticado, redirigir a login de Inthaly ID preservando parámetros OIDC
    const loginUrl = `/id/login?client_id=${encodeURIComponent(params.clientId)}&redirect_uri=${encodeURIComponent(params.redirectUri)}&scope=${encodeURIComponent(params.scope)}`
    return { success: true, data: { redirectUrl: loginUrl } }
  }

  const authRes = await inthalyIdService.authorizeOidcCode({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    identity_id: current.id,
    scope: params.scope
  })

  if (!authRes.success || !authRes.data) {
    return { success: false, error: authRes.error || 'Error en autorización OIDC' }
  }

  const callbackUrl = `${params.redirectUri}?code=${authRes.data.code}&state=auth_ok`
  return { success: true, data: { redirectUrl: callbackUrl } }
}
