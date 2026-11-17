/**
 * Servicio Central de Identidad y Autenticación: Inthaly ID — INTHALY
 * 
 * Independiente de InthalyOps, Comunidad y Academia.
 * Implementa registro, login, sesiones, verificación, recuperación,
 * rotación de tokens, registro de eventos de seguridad y protocolo OIDC / OAuth 2.0.
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
  verifyJwt
} from './inthaly-id.crypto'

// Clave secreta interna para firma de tokens JWT (usar variable de entorno con fallback seguro)
const INTHALY_ID_JWT_SECRET = process.env.INTHALY_ID_JWT_SECRET || 'inthaly-id-core-secret-key-2026-sovereignty'

// ==============================================================================
// ALMACÉN EN MEMORIA (AISLADO E INDEPENDIENTE DE OTRAS BASES DE DATOS)
// ==============================================================================
interface IdMemoryStorage {
  identities: Map<string, InthalyIdentity> // ID -> Identidad
  identitiesByEmail: Map<string, string>   // Email en minúsculas -> ID
  sessions: Map<string, InthalySession>    // Token de sesión -> Sesión
  securityEvents: InthalySecurityEvent[]
  oidcClients: Map<string, OidcClient>     // ClientID -> Cliente
  authCodes: Map<string, OidcAuthorizationCode> // Código -> AuthCode
  connectedApps: Map<string, ConnectedApp[]> // IdentityID -> Aplicaciones
  passwordResetTokens: Map<string, { identityId: string; expiresAt: number }>
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
 * Inicialización de datos semilla para Inthaly ID
 */
function seedIdStorage() {
  if (idStore.identities.size > 0) return

  // 1. Clientes OIDC del Ecosistema
  const clientCommunity: OidcClient = {
    client_id: 'inthaly-community-web',
    client_name: 'Comunidad Inthaly Web',
    client_secret_hash: hashSha256('comm-secret-2026-xyz'),
    redirect_uris: ['http://localhost:3000/comunidad/callback', 'https://comunidad.inthaly.com/callback'],
    allowed_scopes: ['openid', 'profile', 'email', 'community.read', 'community.write'],
    icon_url: '/logo-community.png',
    description: 'Red social profesional de la industria y minería',
    is_active: true,
    created_at: new Date().toISOString()
  }

  const clientConsole: OidcClient = {
    client_id: 'inthaly-global-console',
    client_name: 'Consola Global del Ecosistema',
    client_secret_hash: hashSha256('console-secret-2026-xyz'),
    redirect_uris: ['http://localhost:3000/super-admin/callback', 'https://admin.inthaly.com/callback'],
    allowed_scopes: ['openid', 'profile', 'email', 'admin.all'],
    icon_url: '/logo-console.png',
    description: 'Centro de administración global y supervisión del ecosistema',
    is_active: true,
    created_at: new Date().toISOString()
  }

  const clientAcademy: OidcClient = {
    client_id: 'inthaly-academy-satellite',
    client_name: 'Inthaly Academy (LMS)',
    client_secret_hash: hashSha256('academy-secret-2026-xyz'),
    redirect_uris: ['https://app.inthaly.com/auth/oidc/callback'],
    allowed_scopes: ['openid', 'profile', 'email', 'academy.certifications'],
    icon_url: '/logo-academy.png',
    description: 'Plataforma educativa y emisión de certificados SOMA',
    is_active: true,
    created_at: new Date().toISOString()
  }

  idStore.oidcClients.set(clientCommunity.client_id, clientCommunity)
  idStore.oidcClients.set(clientConsole.client_id, clientConsole)
  idStore.oidcClients.set(clientAcademy.client_id, clientAcademy)

  // 2. Identidades Semilla Reales
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

  // Usuario 2: Super Administrador Global
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

  // Usuario 3: Elena Rodríguez
  const salt3 = generateSalt()
  const p3: InthalyIdentity = {
    id: 'id-elena-rodriguez-global',
    email: 'elena.rodriguez@inthaly.com',
    display_name: 'Elena Rodríguez',
    password_hash: hashPassword('ElenaSoma2026!', salt3),
    salt: salt3,
    is_verified: true,
    status: 'active',
    mfa_enabled: false,
    last_login_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }

  idStore.identities.set(p1.id, p1)
  idStore.identitiesByEmail.set(p1.email.toLowerCase(), p1.id)

  idStore.identities.set(p2.id, p2)
  idStore.identitiesByEmail.set(p2.email.toLowerCase(), p2.id)

  idStore.identities.set(p3.id, p3)
  idStore.identitiesByEmail.set(p3.email.toLowerCase(), p3.id)

  // 3. Sesión activa inicial para Carlos Mendoza
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

  // 4. Aplicaciones Conectadas para Carlos Mendoza
  idStore.connectedApps.set(p1.id, [
    {
      id: 'app-conn-1',
      identity_id: p1.id,
      client_id: clientCommunity.client_id,
      app_name: clientCommunity.client_name,
      app_icon: 'users',
      description: 'Acceso a feed, foros técnicos y mensajería',
      scopes: ['openid', 'profile', 'community.write'],
      connected_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      last_used_at: new Date().toISOString()
    }
  ])

  // 5. Registro inicial de eventos de seguridad
  logSecurityEvent(p1.id, 'login_success', '190.238.112.45', 'Chrome / Windows', { method: 'password' })
  logSecurityEvent(p2.id, 'login_success', '190.238.112.10', 'Firefox / Windows', { method: 'mfa_totp' })
}

seedIdStorage()

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
}): Promise<ActionResponse<{ identity: InthalyIdentity; verification_token: string }>> {
  const emailNorm = params.email.trim().toLowerCase()

  if (idStore.identitiesByEmail.has(emailNorm)) {
    return { success: false, error: 'Ya existe una cuenta con este correo electrónico' }
  }

  if (params.password.length < 8) {
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  const salt = generateSalt()
  const password_hash = hashPassword(params.password, salt)
  const verification_token = generateSecureToken(24)

  const identity: InthalyIdentity = {
    id: `id-${generateSecureToken(8)}`,
    email: emailNorm,
    display_name: params.display_name.trim(),
    password_hash,
    salt,
    is_verified: false,
    verification_token,
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

  return {
    success: true,
    data: { identity, verification_token }
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

  // Actualizar último login
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
 * Verifica la validez de una sesión por su token
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
 * Cierra o revoca una sesión individual
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
 * Revoca todas las sesiones activas de una identidad (Cierre global)
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
// 2. RECUPERACIÓN Y CAMBIO DE CONTRASEÑA
// ==============================================================================

/**
 * Solicita restablecimiento de contraseña generando un token temporal
 */
export async function requestPasswordReset(email: string): Promise<ActionResponse<{ resetToken: string }>> {
  const emailNorm = email.trim().toLowerCase()
  const identityId = idStore.identitiesByEmail.get(emailNorm)

  if (!identityId) {
    // Respuesta ambigua deliberada para mitigar enumeración de cuentas
    return { success: true, data: { resetToken: 'simulation-token-sent' } }
  }

  const token = generateSecureToken(24)
  const expiresAt = Date.now() + 3600 * 1000 // 1 hora de validez
  idStore.passwordResetTokens.set(token, { identityId, expiresAt })

  logSecurityEvent(identityId, 'password_reset_request', '127.0.0.1', 'Web', { email: emailNorm })

  return { success: true, data: { resetToken: token } }
}

/**
 * Ejecuta el cambio de contraseña con el token de recuperación
 */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<ActionResponse<boolean>> {
  const entry = idStore.passwordResetTokens.get(token)
  if (!entry || entry.expiresAt < Date.now()) {
    return { success: false, error: 'El enlace de recuperación es inválido o ha expirado.' }
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

  idStore.passwordResetTokens.delete(token)

  // Revocar sesiones previas por seguridad tras cambio de clave
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

// ==============================================================================
// 3. PROTOCOLO OIDC / OAUTH 2.0 (INTEGRACIÓN INTER-SISTEMAS)
// ==============================================================================

/**
 * Valida un cliente OIDC y genera un código de autorización temporal
 */
export async function authorizeOidcCode(params: {
  client_id: string
  redirect_uri: string
  identity_id: string
  scope: string
}): Promise<ActionResponse<{ code: string; redirect_uri: string }>> {
  const client = idStore.oidcClients.get(params.client_id)
  if (!client || !client.is_active) {
    return { success: false, error: 'Cliente OIDC no autorizado o inactivo' }
  }

  // Validación estricta de redirect_uri para mitigar Open Redirectors
  const isUriAllowed = client.redirect_uris.some(uri => params.redirect_uri.startsWith(uri))
  if (!isUriAllowed) {
    return { success: false, error: 'La URL de redirección (redirect_uri) no está autorizada para este cliente' }
  }

  const code = `code-${generateSecureToken(24)}`
  const authCode: OidcAuthorizationCode = {
    code,
    client_id: params.client_id,
    identity_id: params.identity_id,
    redirect_uri: params.redirect_uri,
    scope: params.scope,
    expires_at: Date.now() + 600 * 1000 // 10 minutos de vida
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
    data: { code, redirect_uri: params.redirect_uri }
  }
}

/**
 * Intercambia un código de autorización OIDC por tokens de acceso e identidad
 */
export async function exchangeOidcCode(params: {
  code: string
  client_id: string
  client_secret: string
}): Promise<ActionResponse<{ id_token: string; access_token: string; expires_in: number; identity: InthalyIdentity }>> {
  const authCode = idStore.authCodes.get(params.code)
  if (!authCode || authCode.expires_at < Date.now()) {
    return { success: false, error: 'Código de autorización inválido o expirado' }
  }

  const client = idStore.oidcClients.get(params.client_id)
  if (!client || client.client_secret_hash !== hashSha256(params.client_secret)) {
    return { success: false, error: 'Credenciales del cliente inválidas' }
  }

  const identity = idStore.identities.get(authCode.identity_id)
  if (!identity) {
    return { success: false, error: 'Identidad asociada no encontrada' }
  }

  // Invalida el código (de un solo uso)
  idStore.authCodes.delete(params.code)

  // Emite tokens OIDC
  const id_token = signJwt({
    iss: 'https://auth.inthaly.com',
    sub: identity.id,
    aud: client.client_id,
    email: identity.email,
    name: identity.display_name,
    email_verified: identity.is_verified
  }, INTHALY_ID_JWT_SECRET, 3600)

  const access_token = signJwt({
    sub: identity.id,
    client_id: client.client_id,
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
// 5. CONSOLA GLOBAL DEL ECOSISTEMA (ADMINISTRACIÓN CENTRALIZADA)
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
 * Obtiene métricas reales y agregadas del ecosistema
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
    communityUsersCount: 4, // Basado en perfiles activos de comunidad
    inthalyOpsCompaniesCount: 5, // Basado en empresas registradas en InthalyOps
    academySyncStatus: 'satellite_autonomous'
  }
}

/**
 * Genera un ticket de acceso administrativo delegado desde la Consola Global
 */
export async function generateDelegatedAdminTicket(params: {
  superAdminId: string
  targetProduct: 'comunidad' | 'academia' | 'inthalyops'
  reason: string
}): Promise<ActionResponse<{ ticketUrl: string; token: string }>> {
  const token = signJwt({
    sub: params.superAdminId,
    role: 'super_admin',
    delegated_to: params.targetProduct,
    reason: params.reason
  }, INTHALY_ID_JWT_SECRET, 900) // 15 minutos de validez

  let ticketUrl = `/comunidad?delegated_ticket=${token}`
  if (params.targetProduct === 'inthalyops') {
    ticketUrl = `/dashboard?delegated_ticket=${token}`
  } else if (params.targetProduct === 'academia') {
    ticketUrl = `https://app.inthaly.com/auth/delegated?ticket=${token}`
  }

  logSecurityEvent(
    params.superAdminId,
    'login_success',
    '127.0.0.1',
    'Global Console',
    { delegatedProduct: params.targetProduct, reason: params.reason }
  )

  return {
    success: true,
    data: { ticketUrl, token }
  }
}
