import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from '@/services/inthaly-id.crypto'
import { INTHALY_ID_JWT_SECRET, getIdentityById } from '@/services/inthaly-id.service'

export const dynamic = 'force-dynamic'

/**
 * UserInfo Endpoint OIDC (OpenID Connect Core 1.0 Section 5.3)
 * URL: /api/oidc/userinfo
 * Métodos: GET, POST
 */
async function handleUserInfo(request: NextRequest) {
  // 1. Extraer Bearer Token del encabezado Authorization
  const authHeader = request.headers.get('authorization')
  let token = ''

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim()
  }

  if (!token) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Encabezado de autorización Bearer ausente o inválido' },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer error="invalid_token", error_description="Missing token"',
          'Cache-Control': 'no-store'
        }
      }
    )
  }

  // 2. Verificar criptográficamente el JWT
  const verification = verifyJwt<{ sub: string; email?: string; name?: string; scope?: string }>(
    token,
    INTHALY_ID_JWT_SECRET
  )

  if (!verification.valid || !verification.payload) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: verification.error || 'Token expirado o firma inválida' },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': `Bearer error="invalid_token", error_description="${verification.error || 'Invalid token'}"`,
          'Cache-Control': 'no-store'
        }
      }
    )
  }

  const identityId = verification.payload.sub
  const identity = await getIdentityById(identityId)

  if (!identity) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Identidad asociada al token no encontrada' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer error="invalid_token"' } }
    )
  }

  const isSuperAdmin = identity.id === 'id-super-admin-global' || identity.email === 'admin@inthaly.com'

  const claims = {
    sub: identity.id,
    email: identity.email,
    email_verified: identity.is_verified,
    name: identity.display_name,
    preferred_username: identity.email.split('@')[0],
    roles: isSuperAdmin ? ['super_admin'] : ['user'],
    is_super_admin: isSuperAdmin,
    updated_at: identity.updated_at
  }

  return NextResponse.json(claims, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}

export async function GET(request: NextRequest) {
  return handleUserInfo(request)
}

export async function POST(request: NextRequest) {
  return handleUserInfo(request)
}
