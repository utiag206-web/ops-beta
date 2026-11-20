import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Endpoint de Descubrimiento OIDC (OpenID Connect Discovery 1.0 - RFC 8414)
 * URL: /.well-known/openid-configuration
 * 
 * Permite a cualquier cliente del ecosistema (INTHALY GLOBAL, InthalyOps, Academia, Apps Móviles)
 * auto-descubrir las capacidades criptográficas y rutas de autenticación de Inthaly ID.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const baseUrl = `${proto}://${host}`

  const config = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oidc/authorize`,
    token_endpoint: `${baseUrl}/api/oidc/token`,
    userinfo_endpoint: `${baseUrl}/api/oidc/userinfo`,
    jwks_uri: `${baseUrl}/api/oidc/jwks`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    scopes_supported: [
      'openid',
      'profile',
      'email',
      'admin.all',
      'community.read',
      'community.write',
      'academy.certifications'
    ],
    token_endpoint_auth_methods_supported: [
      'client_secret_post',
      'client_secret_basic',
      'none'
    ],
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'email',
      'name',
      'email_verified',
      'preferred_username',
      'roles',
      'is_super_admin'
    ],
    code_challenge_methods_supported: ['S256']
  }

  return NextResponse.json(config, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
