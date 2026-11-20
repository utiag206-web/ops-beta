import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * JWKS Endpoint (RFC 7517)
 * URL: /api/oidc/jwks
 */
export async function GET() {
  // Para HMAC-SHA256 (claves simétricas), el JWKS estándar reporta las firmas admitidas
  return NextResponse.json({
    keys: [
      {
        kty: 'oct',
        use: 'sig',
        alg: 'HS256',
        kid: 'inthaly-id-core-key-1'
      }
    ]
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400',
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
