/**
 * Test Suite: Endpoints OIDC Estándar y Sesión Soberana de INTHALY GLOBAL
 * RFC 8414 (Discovery), RFC 6749 (Token), RFC 7636 (PKCE), OIDC Core 1.0 (UserInfo)
 */

const { describe, test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

describe('Fase 2: Autenticación Administrativa e Integración OIDC Soberana', () => {
  const rootDir = path.resolve(__dirname, '../../')

  describe('1. Verificación Estructural de Endpoints OIDC Estándar', () => {
    test('Endpoint /.well-known/openid-configuration existe y cumple RFC 8414', () => {
      const filePath = path.join(rootDir, 'src/app/.well-known/openid-configuration/route.ts')
      assert.ok(fs.existsSync(filePath), 'El archivo discovery OIDC debe existir')
      const content = fs.readFileSync(filePath, 'utf8')

      assert.match(content, /export async function GET/)
      assert.match(content, /authorization_endpoint/)
      assert.match(content, /token_endpoint/)
      assert.match(content, /userinfo_endpoint/)
      assert.match(content, /jwks_uri/)
      assert.match(content, /id_token_signing_alg_values_supported/)
      assert.match(content, /HS256/)
      assert.match(content, /code_challenge_methods_supported/)
      assert.match(content, /S256/)
      assert.match(content, /admin\.all/)
    })

    test('Endpoint /api/oidc/token existe y soporta grant_type=authorization_code con PKCE y Secret', () => {
      const filePath = path.join(rootDir, 'src/app/api/oidc/token/route.ts')
      assert.ok(fs.existsSync(filePath), 'El archivo token OIDC debe existir')
      const content = fs.readFileSync(filePath, 'utf8')

      assert.match(content, /export async function POST/)
      assert.match(content, /authorization_code/)
      assert.match(content, /exchangeOidcCode/)
      assert.match(content, /code_verifier/)
      assert.match(content, /client_secret/)
      assert.match(content, /invalid_grant/)
      assert.match(content, /invalid_request/)
      assert.match(content, /invalid_client/)
    })

    test('Endpoint /api/oidc/userinfo existe y valida Bearer token con reclamos estándar', () => {
      const filePath = path.join(rootDir, 'src/app/api/oidc/userinfo/route.ts')
      assert.ok(fs.existsSync(filePath), 'El archivo userinfo OIDC debe existir')
      const content = fs.readFileSync(filePath, 'utf8')

      assert.match(content, /export async function GET/)
      assert.match(content, /export async function POST/)
      assert.match(content, /verifyJwt/)
      assert.match(content, /Bearer /)
      assert.match(content, /WWW-Authenticate/)
      assert.match(content, /is_super_admin/)
      assert.match(content, /preferred_username/)
    })

    test('Endpoint /api/oidc/authorize y /api/oidc/jwks existen', () => {
      const authPath = path.join(rootDir, 'src/app/api/oidc/authorize/route.ts')
      const jwksPath = path.join(rootDir, 'src/app/api/oidc/jwks/route.ts')
      assert.ok(fs.existsSync(authPath), 'El archivo authorize OIDC debe existir')
      assert.ok(fs.existsSync(jwksPath), 'El archivo jwks OIDC debe existir')

      const authContent = fs.readFileSync(authPath, 'utf8')
      assert.match(authContent, /authorizeOidcCode/)
      assert.match(authContent, /inthaly-global-console/)

      const jwksContent = fs.readFileSync(jwksPath, 'utf8')
      assert.match(jwksContent, /HS256/)
    })
  })

  describe('2. Verificación de la Capa de Sesión Administrativa de INTHALY GLOBAL', () => {
    test('admin-session.ts implementa cookie inthaly_global_session con HMAC-SHA256 y SameSite Lax', () => {
      const filePath = path.join(rootDir, 'apps/inthaly-global/src/lib/auth/admin-session.ts')
      assert.ok(fs.existsSync(filePath), 'admin-session.ts debe existir')
      const content = fs.readFileSync(filePath, 'utf8')

      assert.match(content, /inthaly_global_session/)
      assert.match(content, /httpOnly:\s*true/)
      assert.match(content, /sameSite:\s*'lax'/)
      assert.match(content, /createHmac\('sha256'/)
      assert.match(content, /timingSafeEqual/)
      assert.match(content, /createAdminSession/)
      assert.match(content, /getAdminSession/)
      assert.match(content, /destroyAdminSession/)
    })

    test('admin-auth.service.ts implementa autenticación Inthaly ID y puente de continuidad controlado', () => {
      const filePath = path.join(rootDir, 'apps/inthaly-global/src/lib/auth/admin-auth.service.ts')
      assert.ok(fs.existsSync(filePath), 'admin-auth.service.ts debe existir')
      const content = fs.readFileSync(filePath, 'utf8')

      assert.match(content, /authenticateAdmin/)
      assert.match(content, /ENABLE_LEGACY_ADMIN_FALLBACK/)
      assert.match(content, /logBridgeAudit/)
      assert.match(content, /ADMIN_SECURITY_AUDIT/)
      assert.match(content, /inthalyops@gmail\.com/)
      assert.match(content, /admin@inthaly\.com/)
      assert.match(content, /checkLegacyAdminCredentials/)
    })

    test('Formulario de login en INTHALY GLOBAL respeta credenciales del super admin y no fuerza cuentas demo', () => {
      const filePath = path.join(rootDir, 'apps/inthaly-global/src/app/(auth)/login/page.tsx')
      const content = fs.readFileSync(filePath, 'utf8')

      assert.match(content, /const \[email, setEmail\] = useState\(''\)/)
      assert.match(content, /const \[password, setPassword\] = useState\(''\)/)
      assert.doesNotMatch(content, /useState\('admin@inthaly\.com'\)/)
    })

    test('Dashboard layout implementa guardia soberana contra accesos no autorizados', () => {
      const filePath = path.join(rootDir, 'apps/inthaly-global/src/app/(dashboard)/layout.tsx')
      assert.ok(fs.existsSync(filePath), 'Dashboard layout debe existir')
      const content = fs.readFileSync(filePath, 'utf8')

      assert.match(content, /getAdminSession/)
      assert.match(content, /redirect\('\/login'\)/)
      assert.match(content, /isSuperAdmin/)
    })

    test('OIDC callback en INTHALY GLOBAL valida intercambio y permisos de superadmin', () => {
      const filePath = path.join(rootDir, 'apps/inthaly-global/src/app/callback/route.ts')
      assert.ok(fs.existsSync(filePath), 'callback/route.ts debe existir')
      const content = fs.readFileSync(filePath, 'utf8')

      assert.match(content, /\/api\/oidc\/token/)
      assert.match(content, /\/api\/oidc\/userinfo/)
      assert.match(content, /inthaly-global-console/)
      assert.match(content, /createAdminSession/)
      assert.match(content, /redirectUri/)
    })
  })

  describe('3. Pruebas Criptográficas y de Resistencia de Sesión', () => {
    const sessionSecret = 'test-secret-sovereign-2026'

    function signPayload(payloadStr) {
      return crypto.createHmac('sha256', sessionSecret).update(payloadStr).digest('base64url')
    }

    function verifySessionToken(token) {
      try {
        const parts = token.split('.')
        if (parts.length !== 2) return null
        const [payloadStr, receivedSig] = parts
        const expectedSig = signPayload(payloadStr)
        const recBuf = Buffer.from(receivedSig)
        const expBuf = Buffer.from(expectedSig)
        if (recBuf.length !== expBuf.length || !crypto.timingSafeEqual(recBuf, expBuf)) return null
        const decoded = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'))
        if (Date.now() > decoded.expiresAt) return null
        return decoded
      } catch {
        return null
      }
    }

    test('Sesión válida con token intacto es deserializada con éxito', () => {
      const session = {
        user: {
          id: 'id-super-admin-global',
          email: 'admin@inthaly.com',
          name: 'Super Admin Ecosistema',
          roles: ['super_admin'],
          isSuperAdmin: true,
          authProvider: 'inthaly_id'
        },
        token: 'sec-tok-12345',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600 * 1000
      }
      const payloadStr = Buffer.from(JSON.stringify(session)).toString('base64url')
      const sig = signPayload(payloadStr)
      const token = `${payloadStr}.${sig}`

      const verified = verifySessionToken(token)
      assert.ok(verified)
      assert.strictEqual(verified.user.email, 'admin@inthaly.com')
      assert.strictEqual(verified.user.isSuperAdmin, true)
    })

    test('Ataque de manipulación (Tampering) en el payload invalida la sesión de inmediato', () => {
      const session = {
        user: { email: 'admin@inthaly.com', isSuperAdmin: true },
        expiresAt: Date.now() + 3600 * 1000
      }
      const payloadStr = Buffer.from(JSON.stringify(session)).toString('base64url')
      const sig = signPayload(payloadStr)

      // Manipular el payload cambiando el usuario a otro
      const tamperedSession = {
        user: { email: 'attacker@inthaly.com', isSuperAdmin: true },
        expiresAt: Date.now() + 3600 * 1000
      }
      const tamperedPayloadStr = Buffer.from(JSON.stringify(tamperedSession)).toString('base64url')
      const tamperedToken = `${tamperedPayloadStr}.${sig}`

      const verified = verifySessionToken(tamperedToken)
      assert.strictEqual(verified, null, 'El token manipulado debe ser rechazado')
    })

    test('Sesión expirada es rechazada automáticamente', () => {
      const session = {
        user: { email: 'admin@inthaly.com', isSuperAdmin: true },
        expiresAt: Date.now() - 10000 // Expirado hace 10 segundos
      }
      const payloadStr = Buffer.from(JSON.stringify(session)).toString('base64url')
      const sig = signPayload(payloadStr)
      const expiredToken = `${payloadStr}.${sig}`

      const verified = verifySessionToken(expiredToken)
      assert.strictEqual(verified, null, 'La sesión expirada debe ser rechazada')
    })
  })
})
