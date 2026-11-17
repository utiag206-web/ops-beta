/**
 * Servicio Central de Identidad y Autenticación: Inthaly ID — INTHALY
 * 
 * Saneamiento de Seguridad y Arquitectura Soberana (Fase 3 - Saneamiento Controlado).
 * Implementa:
 * - Scrypt y comparación en tiempo constante (node:crypto).
 * - Protección contra Open Redirects (coincidencia canónica exacta).
 * - PKCE RFC 7636 (S256) para clientes públicos OIDC.
 * - Almacenamiento ciego de tokens mediante hash SHA-256.
 * - Deshabilitación segura de tickets delegados hasta persistencia atómica.
 * - Erradicación de métricas simuladas.
 * - Aislamiento estricto de semillas (prohibido en producción).
 */

import type {
  InthalyIdentity,
  InthalySession,
  InthalySecurityEvent,
  SecurityEventType,
  OidcClient,
  OidcAuthorizationCode,
  ConnectedApp,
  EcosystemStats
} from '@/types/inthaly-id.types'
import type { ActionResponse } from '@/types/common.types'
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashSha256,
  signJwt,
  verifyPkce
} from './inthaly-id.crypto'

// Clave secreta interna para firma de tokens JWT
const INTHALY_ID_JWT_SECRET = process.env.INTHALY_ID_JWT_SECRET || 'inthaly-id-core-secret-key-2026-sovereignty'

// ==============================================================================
// ALMACÉN TRANSITORIO LOCAL (EN MEMORIA PARA DESARROLLO/TEST)
// ==============================================================================
interface PasswordResetEntry {
  identityId: string
  expiresAt: number
  used: boolean
}

interface IdMemoryStorage {
  identities: Map<string, InthalyIdentity> // ID -> Identidad
  identitiesByEmail: Map<string, string>   // Email en minúsculas -> ID
  sessions: Map<string, InthalySession>    // Token de sesión -> Sesión
  securityEvents: InthalySecurityEvent[]
  oidcClients: Map<string, OidcClient>     // ClientID -> Cliente
  authCodes: Map<string, OidcAuthorizationCode> // Código -> AuthCode
  connectedApps: Map<string, ConnectedApp[]> // IdentityID -> Aplicaciones
  passwordResetTokens: Map<string, PasswordResetEntry> // SHA-256(token) -> Entry
}

const idStore: IdMemoryStorage = {
  identities: new Map(),
  identitiesByEmail: new Map(),
  sessions: new Map(),
  securityEvents: [],
  oidcClients: new Map(),
  authCodes: new Map(),
  connectedApps: new Map(),
  passwordResetTokens: new Map()
}

/**
 * Registro de Clientes OIDC del Ecosistema
 */
function registerDefaultOidcClients() {
  if (idStore.oidcClients.size > 0) return

  // Cliente 1: Comunidad Inthaly Web (Cliente Público / SPA)
  // No posee client_secret en frontend; exige PKCE S256 obligatorio según RFC 7636
  const clientCommunity: OidcClient = {
    client_id: 'inthaly-community-web',
    client_name: 'Comunidad Inthaly Web',
    client_type: 'public',
    redirect_uris: [
      'http://localhost:3000/comunidad/callback',
      'https://comunidad.inthaly.com/callback'
    ],
    allowed_scopes: ['openid', 'profile', 'email', 'community.read', 'community.write'],
    require_pkce: true,
    icon_url: '/logo-community.png',
    description: 'Red social profesional de la industria y minería',
    is_active: true,
    created_at: new Date().toISOString()
  }

  // Cliente 2: Consola Global (Cliente Confidencial)
  const clientConsole: OidcClient = {
    client_id: 'inthaly-global-console',
    client_name: 'Consola Global del Ecosistema',
    client_type: 'confidential',
    client_secret_hash: hashSha256(process.env.CONSOLE_OIDC_SECRET || 'console-secret-server-only'),
    redirect_uris: [
      'http://localhost:3000/super-admin/callback',
      'https://admin.inthaly.com/callback'
    ],
    allowed_scopes: ['openid', 'profile', 'email', 'admin.all'],
    require_pkce: false,
    icon_url: '/logo-console.png',
    description: 'Centro de administración global y supervisión del ecosistema',
    is_active: true,
    created_at: new Date().toISOString()
  }

  // Cliente 3: Inthaly Academy (Cliente Confidencial Satélite)
  const clientAcademy: OidcClient = {
    client_id: 'inthaly-academy-satellite',
    client_name: 'Inthaly Academy (LMS)',
    client_type: 'confidential',
    client_secret_hash: hashSha256(process.env.ACADEMY_OIDC_SECRET || 'academy-secret-server-only'),
    redirect_uris: [
      'https://app.inthaly.com/auth/oidc/callback'
    ],
    allowed_scopes: ['openid', 'profile', 'email', 'academy.certifications'],
    require_pkce: false,
    icon_url: '/logo-academy.png',
    description: 'Plataforma educativa y emisión de certificados SOMA',
    is_active: true,
    created_at: new Date().toISOString()
  }

  idStore.oidcClients.set(clientCommunity.client_id, clientCommunity)
  idStore.oidcClients.set(clientConsole.client_id, clientConsole)
  idStore.oidcClients.set(clientAcademy.client_id, clientAcademy)
}

registerDefaultOidcClients()

/**
 * Inicialización controlada de identidades semilla para pruebas de desarrollo local / unit tests.
 * REGLA DE SEGURIDAD A2: Prohibido en producción. Si NODE_ENV === 'production', NO se ejecutan semillas.
 */
function seedIdStorageIfAllowed() {
  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction) {
    // En producción se rechaza cualquier semilla en código duro
    return
  }

  if (idStore.identities.size > 0) return

  // Usuario 1: Ing. Carlos Mendoza
  const salt1 = generateSalt()
  const p1: InthalyIdentity = {
    id: 'id-carlos-mendoza-global',
    email: 'carlos.mendoza@inthaly.com',
    display_name: 'Ing. Carlos Mendoza',
    password_hash: hashPassword('Inthaly2026!', salt1),
    salt: salt1,
    is_verified: true,
    status: 'active',
    mfa_enabled: false,
    last_login_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }

  // Usuario 2: Super Administrador
  const salt2 = generateSalt()
  const p2: InthalyIdentity = {
    id: 'id-super-admin-global',
    email: 'admin@inthaly.com',
    display_name: 'Super Admin Ecosistema',
    password_hash: hashPassword('SuperAdmin2026!', salt2),
    salt: salt2,
    is_verified: true,
    status: 'active',
    mfa_enabled: true,
    last_login_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }

  idStore.identities.set(p1.id, p1)
  idStore.identitiesByEmail.set(p1.email.toLowerCase(), p1.id)

  idStore.identities.set(p2.id, p2)
  idStore.identitiesByEmail.set(p2.email.toLowerCase(), p2.id)

  // Sesión inicial para Carlos Mendoza
  const sessionToken1 = generateSecureToken(32)
  const session1: InthalySession = {
    id: 'sess-1',
    identity_id: p1.id,
    session_token: sessionToken1,
    refresh_token_hash: hashSha256(generateSecureToken(32)),
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/133.0',
    ip_address: '190.238.112.45',
    device_name: 'Laptop Windows (Chrome)',
    is_revoked: false,
    expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString()
  }
  idStore.sessions.set(sessionToken1, session1)

  idStore.connectedApps.set(p1.id, [
    {
      id: 'app-conn-1',
      identity_id: p1.id,
      client_id: 'inthaly-community-web',
      app_name: 'Comunidad Inthaly Web',
      app_icon: 'users',
      description: 'Acceso a feed, foros técnicos y mensajería',
      scopes: ['openid', 'profile', 'community.write'],
      connected_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      last_used_at: new Date().toISOString()
    }
  ])
}

seedIdStorageIfAllowed()

// ==============================================================================
// 1. REGISTRO Y AUTENTICACIÓN CENTRAL
// ==============================================================================

/**
 * Registra una nueva identidad en Inthaly ID
 */
export async function registerIdentity(params: {
  email: string
  password: string
  display_name: string
  ip_address?: string
  user_agent?: string
}): Promise<ActionResponse<{ identity: InthalyIdentity }>> {
  const emailNorm = params.email.trim().toLowerCase()

  if (idStore.identitiesByEmail.has(emailNorm)) {
    return { success: false, error: 'Ya existe una cuenta con este correo electrónico' }
  }

  if (params.password.length < 8) {
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  const salt = generateSalt()
  const password_hash = hashPassword(params.password, salt)
  
  // Token de verificación con almacenamiento ciego (hash SHA-256)
  const rawVerificationToken = generateSecureToken(32)
  const verification_token_hash = hashSha256(rawVerificationToken)
  const verification_token_expires_at = Date.now() + 24 * 3600 * 1000 // 24 horas

  const identity: InthalyIdentity = {
    id: `id-${generateSecureToken(8)}`,
    email: emailNorm,
    display_name: params.display_name.trim(),
    password_hash,
    salt,
    is_verified: false,
    verification_token: null, // No exponer el token en claro en el objeto
    verification_token_hash,
    verification_token_expires_at,
    status: 'active',
    mfa_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  idStore.identities.set(identity.id, identity)
  idStore.identitiesByEmail.set(emailNorm, identity.id)

  logSecurityEvent(
    identity.id,
    'register',
    params.ip_address || '127.0.0.1',
    params.user_agent || 'Unknown',
    { email: emailNorm }
  )

  // En un entorno de producción con proveedor de correo configurado (Resend/SendGrid/SES),
  // aquí se despacharía el correo con rawVerificationToken. No se retorna en la respuesta HTTP.

  return {
    success: true,
    data: { identity }
  }
}

/**
 * Autentica credenciales y crea una nueva sesión activa
 */
export async function authenticateIdentity(params: {
  email: string
  password: string
  ip_address?: string
  user_agent?: string
}): Promise<ActionResponse<{ identity: InthalyIdentity; session: InthalySession; jwt: string }>> {
  // REGLA A2: Si en producción la persistencia real no está disponible, rechazar el acceso
  if (process.env.NODE_ENV === 'production' && !process.env.INTHALY_ID_DATABASE_URL) {
    return { 
      success: false, 
      error: 'Servicio de identidad temporalmente no disponible por mantenimiento de persistencia segura.' 
    }
  }

  const emailNorm = params.email.trim().toLowerCase()
  const identityId = idStore.identitiesByEmail.get(emailNorm)

  if (!identityId) {
    return { success: false, error: 'Credenciales inválidas' }
  }

  const identity = idStore.identities.get(identityId)
  if (!identity) {
    return { success: false, error: 'Credenciales inválidas' }
  }

  if (identity.status === 'suspended') {
    return { success: false, error: 'Esta cuenta se encuentra suspendida por seguridad. Contacta a soporte.' }
  }

  const isValidPassword = verifyPassword(params.password, identity.password_hash, identity.salt)
  if (!isValidPassword) {
    logSecurityEvent(
      identity.id,
      'login_failed',
      params.ip_address || '127.0.0.1',
      params.user_agent || 'Unknown',
      { reason: 'incorrect_password' }
    )
    return { success: false, error: 'Credenciales inválidas' }
  }

  // Generar sesión segura
  const sessionToken = generateSecureToken(32)
  const refreshToken = generateSecureToken(32)
  
  const userAgentStr = params.user_agent || 'Navegador Web'
  let deviceName = 'Dispositivo Web'
  if (userAgentStr.includes('Windows')) deviceName = 'PC con Windows'
  else if (userAgentStr.includes('Macintosh')) deviceName = 'Apple Mac'
  else if (userAgentStr.includes('Android')) deviceName = 'Teléfono Android'
  else if (userAgentStr.includes('iPhone')) deviceName = 'iPhone'

  const session: InthalySession = {
    id: `sess-${Date.now()}-${generateSecureToken(4)}`,
    identity_id: identity.id,
    session_token: sessionToken,
    refresh_token_hash: hashSha256(refreshToken),
    user_agent: userAgentStr,
    ip_address: params.ip_address || '127.0.0.1',
    device_name: deviceName,
    is_revoked: false,
    expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString()
  }

  idStore.sessions.set(sessionToken, session)

  identity.last_login_at = new Date().toISOString()
  idStore.identities.set(identity.id, identity)

  // Emitir JWT firmado
  const jwt = signJwt({
    sub: identity.id,
    email: identity.email,
    name: identity.display_name,
    sessionId: session.id,
    is_verified: identity.is_verified
  }, INTHALY_ID_JWT_SECRET, 3600 * 24)

  logSecurityEvent(
    identity.id,
    'login_success',
    params.ip_address || '127.0.0.1',
    params.user_agent || 'Unknown',
    { session_id: session.id }
  )

  return {
    success: true,
    data: { identity, session, jwt }
  }
}

/**
 * Valida la validez de una sesión activa
 */
export async function validateSession(sessionToken: string): Promise<InthalyIdentity | null> {
  const session = idStore.sessions.get(sessionToken)
  if (!session || session.is_revoked) return null

  if (new Date(session.expires_at).getTime() < Date.now()) {
    session.is_revoked = true
    return null
  }

  session.last_active_at = new Date().toISOString()
  const identity = idStore.identities.get(session.identity_id)
  return identity || null
}

/**
 * Revoca una sesión individual
 */
export async function revokeSession(sessionId: string, identityId: string): Promise<ActionResponse<boolean>> {
  for (const [token, session] of idStore.sessions.entries()) {
    if (session.id === sessionId && session.identity_id === identityId) {
      session.is_revoked = true
      idStore.sessions.delete(token)
      logSecurityEvent(identityId, 'session_revoked', '127.0.0.1', 'Local', { sessionId })
      return { success: true, data: true }
    }
  }
  return { success: false, error: 'Sesión no encontrada' }
}

/**
 * Revoca todas las sesiones activas de una identidad
 */
export async function revokeAllSessions(identityId: string): Promise<ActionResponse<boolean>> {
  let count = 0
  for (const [token, session] of idStore.sessions.entries()) {
    if (session.identity_id === identityId) {
      session.is_revoked = true
      idStore.sessions.delete(token)
      count++
    }
  }
  logSecurityEvent(identityId, 'session_revoked_all', '127.0.0.1', 'Local', { count })
  return { success: true, data: true }
}

/**
 * Obtiene las sesiones activas de un usuario
 */
export async function getActiveSessions(identityId: string): Promise<InthalySession[]> {
  const list: InthalySession[] = []
  const now = Date.now()

  for (const session of idStore.sessions.values()) {
    if (session.identity_id === identityId && !session.is_revoked) {
      if (new Date(session.expires_at).getTime() > now) {
        list.push(session)
      }
    }
  }

  return list.sort((a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime())
}

// ==============================================================================
// 2. RECUPERACIÓN Y CAMBIO DE CONTRASEÑA (SANEADO - REGLA A1)
// ==============================================================================

/**
 * Solicita restablecimiento de contraseña.
 * REGLA A1: Nunca retorna el token al cliente ni revela si el correo existe.
 * Almacena el hash SHA-256 del token con expiración de 1 hora.
 */
export async function requestPasswordReset(email: string): Promise<ActionResponse<{ message: string }>> {
  const emailNorm = email.trim().toLowerCase()
  const identityId = idStore.identitiesByEmail.get(emailNorm)

  if (identityId) {
    const rawToken = generateSecureToken(32)
    const tokenHash = hashSha256(rawToken)
    const expiresAt = Date.now() + 3600 * 1000 // 1 hora de validez

    idStore.passwordResetTokens.set(tokenHash, { 
      identityId, 
      expiresAt,
      used: false 
    })

    logSecurityEvent(identityId, 'password_reset_request', '127.0.0.1', 'Web', { email: emailNorm })

    // Si existiera proveedor de correo transaccional configurado en el servidor:
    // await sendPasswordResetEmail(emailNorm, rawToken)
  }

  // Respuesta homogénea constante para prevenir enumeración de cuentas y Account Takeover
  return { 
    success: true, 
    data: { 
      message: 'Si la dirección de correo ingresada se encuentra registrada, recibirás instrucciones para restablecer tu contraseña.' 
    } 
  }
}

/**
 * Ejecuta el cambio de contraseña utilizando el token de recuperación recibido por correo.
 * Valida el hash SHA-256 del token, consumo de un solo uso y expiración.
 */
export async function resetPasswordWithToken(rawToken: string, newPassword: string): Promise<ActionResponse<boolean>> {
  if (!rawToken || rawToken.trim().length === 0) {
    return { success: false, error: 'Token de recuperación inválido o ausente.' }
  }

  const tokenHash = hashSha256(rawToken.trim())
  const entry = idStore.passwordResetTokens.get(tokenHash)

  if (!entry || entry.used || entry.expiresAt < Date.now()) {
    return { success: false, error: 'El enlace de recuperación es inválido, ya fue utilizado o ha expirado.' }
  }

  if (newPassword.length < 8) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' }
  }

  const identity = idStore.identities.get(entry.identityId)
  if (!identity) {
    return { success: false, error: 'Identidad no encontrada' }
  }

  const newSalt = generateSalt()
  identity.password_hash = hashPassword(newPassword, newSalt)
  identity.salt = newSalt
  identity.updated_at = new Date().toISOString()
  idStore.identities.set(identity.id, identity)

  // Invalida inmediatamente el token (consumo atómico de un solo uso)
  entry.used = true
  idStore.passwordResetTokens.delete(tokenHash)

  // Revoca todas las sesiones previas por seguridad tras cambio de clave
  await revokeAllSessions(identity.id)

  logSecurityEvent(identity.id, 'password_reset_success', '127.0.0.1', 'Web', {})

  return { success: true, data: true }
}

/**
 * Cambia la contraseña desde la sesión activa (Centro Personal de Identidad)
 */
export async function changePassword(
  identityId: string, 
  currentPassword: string, 
  newPassword: string
): Promise<ActionResponse<boolean>> {
  const identity = idStore.identities.get(identityId)
  if (!identity) return { success: false, error: 'Identidad no encontrada' }

  const isValidCurrent = verifyPassword(currentPassword, identity.password_hash, identity.salt)
  if (!isValidCurrent) {
    return { success: false, error: 'La contraseña actual no es correcta.' }
  }

  if (newPassword.length < 8) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' }
  }

  const newSalt = generateSalt()
  identity.password_hash = hashPassword(newPassword, newSalt)
  identity.salt = newSalt
  identity.updated_at = new Date().toISOString()
  idStore.identities.set(identity.id, identity)

  logSecurityEvent(identityId, 'password_changed', '127.0.0.1', 'Web', {})

  return { success: true, data: true }
}

/**
 * Valida y consume el token de verificación de correo electrónico
 */
export async function verifyEmailWithToken(rawToken: string): Promise<ActionResponse<boolean>> {
  if (!rawToken || rawToken.trim().length === 0) {
    return { success: false, error: 'Token de verificación ausente o inválido.' }
  }

  const tokenHash = hashSha256(rawToken.trim())

  for (const identity of idStore.identities.values()) {
    if (identity.verification_token_hash === tokenHash) {
      if (identity.verification_token_expires_at && identity.verification_token_expires_at < Date.now()) {
        return { success: false, error: 'El enlace de verificación ha expirado. Solicita uno nuevo.' }
      }

      identity.is_verified = true
      identity.verification_token_hash = null
      identity.verification_token_expires_at = null
      identity.updated_at = new Date().toISOString()
      idStore.identities.set(identity.id, identity)

      logSecurityEvent(identity.id, 'email_verified', '127.0.0.1', 'Web', {})
      return { success: true, data: true }
    }
  }

  return { success: false, error: 'El enlace de verificación no es válido.' }
}

// ==============================================================================
// 3. PROTOCOLO OIDC / OAUTH 2.0 (SANEADO - REGLAS A3 & A5)
// ==============================================================================

/**
 * Valida un cliente OIDC y genera un código de autorización temporal.
 * REGLA A3: Coincidencia canónica EXACTA de redirect_uri (prohibido startsWith).
 * REGLA A5: PKCE S256 obligatorio para clientes públicos.
 */
export async function authorizeOidcCode(params: {
  client_id: string
  redirect_uri: string
  identity_id: string
  scope: string
  code_challenge?: string
  code_challenge_method?: 'S256' | 'plain'
  state?: string
  nonce?: string
}): Promise<ActionResponse<{ code: string; redirect_uri: string; state?: string }>> {
  const client = idStore.oidcClients.get(params.client_id)
  if (!client || !client.is_active) {
    return { success: false, error: 'Cliente OIDC no autorizado o inactivo' }
  }

  // REGLA A3: Validación estricta y canónica de igualdad exacta (Prevenir Open Redirectors)
  const isUriAllowed = client.redirect_uris.includes(params.redirect_uri)
  if (!isUriAllowed) {
    logSecurityEvent(
      params.identity_id,
      'open_redirect_blocked',
      '127.0.0.1',
      'OIDC Gateway',
      { attempted_uri: params.redirect_uri, client_id: params.client_id }
    )
    return { 
      success: false, 
      error: 'La URL de redirección no está autorizada. Debe coincidir exactamente con una URI registrada.' 
    }
  }

  // REGLA A5: PKCE obligatorio para clientes públicos (SPA / Navegador)
  if (client.require_pkce) {
    if (!params.code_challenge) {
      return { 
        success: false, 
        error: 'El parámetro code_challenge (PKCE RFC 7636) es obligatorio para clientes públicos.' 
      }
    }
    if (params.code_challenge_method && params.code_challenge_method !== 'S256') {
      return { 
        success: false, 
        error: 'Únicamente se permite el método S256 para PKCE por directriz de seguridad OWASP.' 
      }
    }
  }

  const code = `code-${generateSecureToken(32)}`
  const authCode: OidcAuthorizationCode = {
    code,
    client_id: params.client_id,
    identity_id: params.identity_id,
    redirect_uri: params.redirect_uri,
    scope: params.scope,
    code_challenge: params.code_challenge,
    code_challenge_method: params.code_challenge_method || 'S256',
    nonce: params.nonce,
    state: params.state,
    expires_at: Date.now() + 300 * 1000 // 5 minutos de vida máxima
  }

  idStore.authCodes.set(code, authCode)

  // Registrar la aplicación conectada para el usuario
  let userApps = idStore.connectedApps.get(params.identity_id) || []
  if (!userApps.some(a => a.client_id === client.client_id)) {
    userApps.push({
      id: `app-${Date.now()}`,
      identity_id: params.identity_id,
      client_id: client.client_id,
      app_name: client.client_name,
      app_icon: client.icon_url,
      description: client.description,
      scopes: params.scope.split(' '),
      connected_at: new Date().toISOString(),
      last_used_at: new Date().toISOString()
    })
    idStore.connectedApps.set(params.identity_id, userApps)
  }

  logSecurityEvent(params.identity_id, 'app_authorized', '127.0.0.1', 'OIDC Gateway', { client_id: client.client_id })

  return {
    success: true,
    data: { 
      code, 
      redirect_uri: params.redirect_uri,
      state: params.state 
    }
  }
}

/**
 * Intercambia un código de autorización OIDC por tokens de acceso e identidad.
 * REGLA A5: Valida PKCE S256 para clientes públicos. Clientes públicos no requieren ni deben poseer secreto.
 */
export async function exchangeOidcCode(params: {
  code: string
  client_id: string
  redirect_uri: string
  code_verifier?: string
  client_secret?: string
}): Promise<ActionResponse<{ id_token: string; access_token: string; expires_in: number; identity: InthalyIdentity }>> {
  const authCode = idStore.authCodes.get(params.code)
  if (!authCode || authCode.expires_at < Date.now()) {
    return { success: false, error: 'Código de autorización inválido o expirado' }
  }

  // Verificar que el client_id coincida
  if (authCode.client_id !== params.client_id) {
    return { success: false, error: 'El código de autorización no pertenece al cliente solicitante' }
  }

  // Verificar redirect_uri idéntica a la autorizada en el paso 1
  if (authCode.redirect_uri !== params.redirect_uri) {
    return { success: false, error: 'La redirect_uri no coincide con la autorizada previamente' }
  }

  const client = idStore.oidcClients.get(params.client_id)
  if (!client || !client.is_active) {
    return { success: false, error: 'Cliente OIDC no válido' }
  }

  // Validación de credenciales de cliente según su tipo
  if (client.client_type === 'public') {
    // Clientes públicos: Verificación PKCE estricta
    if (!authCode.code_challenge) {
      return { success: false, error: 'Código emitido sin PKCE no es válido para clientes públicos' }
    }
    if (!params.code_verifier) {
      return { success: false, error: 'El parámetro code_verifier es obligatorio para intercambiar el código' }
    }
    const isPkceValid = verifyPkce(
      params.code_verifier, 
      authCode.code_challenge, 
      authCode.code_challenge_method || 'S256'
    )
    if (!isPkceValid) {
      return { success: false, error: 'Verificación PKCE fallida. code_verifier incorrecto.' }
    }
  } else {
    // Clientes confidenciales: Verificación obligatoria de client_secret
    if (!params.client_secret || !client.client_secret_hash) {
      return { success: false, error: 'client_secret requerido para clientes confidenciales' }
    }
    if (client.client_secret_hash !== hashSha256(params.client_secret)) {
      return { success: false, error: 'Credenciales del cliente inválidas' }
    }
  }

  const identity = idStore.identities.get(authCode.identity_id)
  if (!identity) {
    return { success: false, error: 'Identidad asociada no encontrada' }
  }

  // Invalida inmediatamente el código (un solo uso estricto contra replay attacks)
  idStore.authCodes.delete(params.code)

  // Emite tokens OIDC con nonce si fue provisto
  const id_token = signJwt({
    iss: 'https://auth.inthaly.com',
    sub: identity.id,
    aud: client.client_id,
    email: identity.email,
    name: identity.display_name,
    email_verified: identity.is_verified,
    nonce: authCode.nonce
  }, INTHALY_ID_JWT_SECRET, 3600)

  const access_token = signJwt({
    iss: 'https://auth.inthaly.com',
    sub: identity.id,
    aud: client.client_id,
    scope: authCode.scope
  }, INTHALY_ID_JWT_SECRET, 7200)

  return {
    success: true,
    data: {
      id_token,
      access_token,
      expires_in: 3600,
      identity
    }
  }
}

// ==============================================================================
// 4. APLICACIONES CONECTADAS Y AUDITORÍA PERSONAL
// ==============================================================================

export async function getConnectedApps(identityId: string): Promise<ConnectedApp[]> {
  return idStore.connectedApps.get(identityId) || []
}

export async function revokeConnectedApp(identityId: string, clientId: string): Promise<ActionResponse<boolean>> {
  const list = idStore.connectedApps.get(identityId) || []
  const filtered = list.filter(a => a.client_id !== clientId)
  idStore.connectedApps.set(identityId, filtered)
  logSecurityEvent(identityId, 'app_revoked', '127.0.0.1', 'Web', { clientId })
  return { success: true, data: true }
}

export async function getSecurityEvents(identityId: string, limit = 20): Promise<InthalySecurityEvent[]> {
  return idStore.securityEvents
    .filter(e => e.identity_id === identityId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}

function logSecurityEvent(
  identityId: string, 
  eventType: SecurityEventType, 
  ip: string, 
  userAgent: string, 
  metadata: Record<string, unknown> = {}
) {
  const event: InthalySecurityEvent = {
    id: `sec-${Date.now()}-${generateSecureToken(4)}`,
    identity_id: identityId,
    event_type: eventType,
    ip_address: ip,
    user_agent: userAgent,
    metadata,
    created_at: new Date().toISOString()
  }
  idStore.securityEvents.unshift(event)
}

// ==============================================================================
// 5. CONSOLA GLOBAL DEL ECOSISTEMA (ADMINISTRACIÓN SANEADA - REGLAS A6 & A7)
// ==============================================================================

/**
 * Obtiene todas las identidades registradas (para supervisión de Super Admin)
 */
export async function getAllIdentitiesAdmin(): Promise<InthalyIdentity[]> {
  return Array.from(idStore.identities.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

/**
 * Obtiene métricas reales del ecosistema.
 * REGLA A7: Cero valores ficticios cableados en código.
 */
export async function getEcosystemStats(): Promise<EcosystemStats> {
  const totalIdentities = idStore.identities.size
  let verifiedIdentities = 0
  for (const id of idStore.identities.values()) {
    if (id.is_verified) verifiedIdentities++
  }

  let activeSessions = 0
  const now = Date.now()
  for (const s of idStore.sessions.values()) {
    if (!s.is_revoked && new Date(s.expires_at).getTime() > now) {
      activeSessions++
    }
  }

  return {
    totalIdentities,
    verifiedIdentities,
    activeSessions,
    totalSecurityEvents: idStore.securityEvents.length,
    connectedAppsCount: idStore.oidcClients.size,
    communityUsersCount: 0, // Se calcula dinámicamente en super-admin/actions.ts mediante Supabase
    inthalyOpsCompaniesCount: 0, // Se calcula dinámicamente en super-admin/actions.ts mediante Supabase
    academySyncStatus: 'prepared_contract',
    communityStatus: 'active',
    inthalyOpsStatus: 'active',
    academyStatus: 'prepared_contract',
    identityPersistenceStatus: 'in_memory_transitional'
  }
}

/**
 * Genera un ticket de acceso administrativo delegado.
 * REGLA A6: Deshabilitado temporalmente hasta contar con consumo atómico y persistente en base de datos.
 */
export async function generateDelegatedAdminTicket(params: {
  superAdminId: string
  targetProduct: 'comunidad' | 'academia' | 'inthalyops'
  reason: string
}): Promise<ActionResponse<{ ticketUrl: string; token: string }>> {
  logSecurityEvent(
    params.superAdminId,
    'delegated_ticket_rejected',
    '127.0.0.1',
    'Global Console',
    { 
      targetProduct: params.targetProduct, 
      reason: params.reason,
      status: 'disabled_by_security_policy'
    }
  )

  // REGLA A6: Deshabilitado de forma segura y explícita
  return {
    success: false,
    error: 'El acceso administrativo delegado se encuentra temporalmente deshabilitado por política de seguridad (ADR-ID-004) hasta implementar la persistencia atómica de tickets de un solo uso en la base de datos independiente de Inthaly ID.'
  }
}
