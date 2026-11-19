import { cookies } from 'next/headers'
import crypto from 'node:crypto'
import type { AdminUser, AdminSession } from '@/types/admin-auth.types'

export const ADMIN_SESSION_COOKIE_NAME = 'inthaly_global_session'
const SESSION_DURATION_SECONDS = 7 * 24 * 3600 // 7 días

const SESSION_SECRET =
  process.env.GLOBAL_ADMIN_SESSION_SECRET || 'inthaly-global-secret-key-sovereign-admin-2026'

/**
 * Firma criptográfica del token de sesión (HMAC-SHA256)
 */
function signSessionPayload(payloadStr: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET)
  hmac.update(payloadStr)
  return hmac.digest('base64url')
}

/**
 * Serializa y firma la sesión en un token seguro
 */
export function serializeSession(session: AdminSession): string {
  const payloadStr = Buffer.from(JSON.stringify(session)).toString('base64url')
  const signature = signSessionPayload(payloadStr)
  return `${payloadStr}.${signature}`
}

/**
 * Deserializa y verifica en tiempo constante el token de sesión
 */
export function deserializeSession(token: string): AdminSession | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [payloadStr, receivedSignature] = parts
    const expectedSignature = signSessionPayload(payloadStr)

    const receivedBuf = Buffer.from(receivedSignature)
    const expectedBuf = Buffer.from(expectedSignature)

    if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
      return null
    }

    const jsonStr = Buffer.from(payloadStr, 'base64url').toString('utf-8')
    const session = JSON.parse(jsonStr) as AdminSession

    // Verificar expiración
    if (Date.now() > session.expiresAt) {
      return null
    }

    return session
  } catch {
    return null
  }
}

/**
 * Obtiene la sesión administrativa actual desde las cookies seguras
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)

    if (!sessionCookie || !sessionCookie.value) {
      return null
    }

    return deserializeSession(sessionCookie.value)
  } catch {
    return null
  }
}

/**
 * Crea y persiste una nueva sesión administrativa soberana
 */
export async function createAdminSession(user: AdminUser): Promise<AdminSession> {
  const now = Date.now()
  const expiresAt = now + SESSION_DURATION_SECONDS * 1000

  const sessionToken = crypto.randomBytes(32).toString('hex')

  const session: AdminSession = {
    user,
    token: sessionToken,
    createdAt: now,
    expiresAt
  }

  const serialized = serializeSession(session)

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, serialized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS
  })

  return session
}

/**
 * Destruye la sesión administrativa actual (Cierre de Sesión Seguro)
 */
export async function destroyAdminSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_SESSION_COOKIE_NAME)
  } catch {
    // ignore
  }
}
