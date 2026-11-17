/**
 * Motor Criptográfico Propio: Inthaly ID
 * Implementación basada en primitivas estándar de Node.js (node:crypto).
 * Cumple con OWASP: Scrypt (memory-hard), Salts Criptográficos y Comparación en Tiempo Constante.
 */

import crypto from 'node:crypto'

// Configuración recomendada de Scrypt por OWASP
const SCRYPT_CONFIG = {
  N: 16384, // Factor de costo de CPU / memoria
  r: 8,     // Tamaño de bloque
  p: 1,     // Factor de paralelización
  keyLen: 64 // Longitud de la clave derivada en bytes
}

/**
 * Genera un salt criptográfico aleatorio en formato hexadecimal.
 */
export function generateSalt(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

/**
 * Deriva el hash de una contraseña utilizando Scrypt con el salt provisto.
 */
export function hashPassword(password: string, salt: string): string {
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_CONFIG.keyLen, {
    N: SCRYPT_CONFIG.N,
    r: SCRYPT_CONFIG.r,
    p: SCRYPT_CONFIG.p
  })
  return derivedKey.toString('hex')
}

/**
 * Verifica una contraseña contra su hash y salt utilizando comparación en tiempo constante
 * para prevenir ataques de temporización (Timing Attacks).
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const candidateHash = hashPassword(password, salt)
    const hashBuffer = Buffer.from(hash, 'hex')
    const candidateBuffer = Buffer.from(candidateHash, 'hex')

    if (hashBuffer.length !== candidateBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(hashBuffer, candidateBuffer)
  } catch {
    return false
  }
}

/**
 * Genera un token aleatorio seguro (para sesiones, códigos OIDC y verificación de correo).
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

/**
 * Calcula el hash SHA-256 de un valor (para almacenamiento ciego de tokens y refresh tokens).
 */
export function hashSha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Utilidades Base64URL según RFC 7515 / RFC 7519
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf-8')
}

/**
 * Genera y firma un JWT de Inthaly ID (HMAC-SHA256) sin dependencias externas.
 */
export function signJwt(payload: Record<string, unknown>, secret: string, expiresInSeconds = 3600): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
    iss: 'https://auth.inthaly.com'
  }

  const now = Math.floor(Date.now() / 1000)
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))

  const signatureData = `${encodedHeader}.${encodedPayload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureData)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${signatureData}.${signature}`
}

/**
 * Verifica la firma y expiración de un JWT de Inthaly ID.
 */
export function verifyJwt<T = Record<string, unknown>>(token: string, secret: string): { valid: boolean; payload?: T; error?: string } {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Token malformado' }
    }

    const [encodedHeader, encodedPayload, receivedSignature] = parts
    const signatureData = `${encodedHeader}.${encodedPayload}`

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureData)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    // Verificación en tiempo constante de la firma
    const expectedBuf = Buffer.from(expectedSignature)
    const receivedBuf = Buffer.from(receivedSignature)

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      return { valid: false, error: 'Firma inválida' }
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as T & { exp?: number }
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expirado' }
    }

    return { valid: true, payload }
  } catch (err: any) {
    return { valid: false, error: err.message || 'Error validando token' }
  }
}
