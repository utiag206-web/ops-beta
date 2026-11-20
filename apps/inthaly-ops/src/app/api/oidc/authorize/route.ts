import { NextRequest, NextResponse } from 'next/server'
import * as inthalyIdService from '@/services/inthaly-id.service'

export const dynamic = 'force-dynamic'

/**
 * Authorization Endpoint OIDC (RFC 6749 Section 3.1 / RFC 7636)
 * URL: /api/oidc/authorize
 * Métodos: GET, POST
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const client_id = searchParams.get('client_id') || ''
  const redirect_uri = searchParams.get('redirect_uri') || ''
  const response_type = searchParams.get('response_type') || ''
  const scope = searchParams.get('scope') || 'openid'
  const state = searchParams.get('state') || undefined
  const code_challenge = searchParams.get('code_challenge') || undefined
  const code_challenge_method = (searchParams.get('code_challenge_method') as 'S256' | 'plain') || undefined
  const nonce = searchParams.get('nonce') || undefined

  // 1. Validar response_type
  if (response_type !== 'code') {
    return NextResponse.json(
      { error: 'unsupported_response_type', error_description: 'Solo se soporta response_type=code' },
      { status: 400 }
    )
  }

  // 2. Validar cliente registrado
  const client = inthalyIdService.getOidcClient(client_id)
  if (!client || !client.is_active) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Cliente OIDC no registrado o inactivo' },
      { status: 400 }
    )
  }

  // 3. Validar redirect_uri autorizada
  if (!client.redirect_uris.includes(redirect_uri)) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'redirect_uri no autorizada para este cliente' },
      { status: 400 }
    )
  }

  // 4. Determinar identidad: para clientes administrativos, verificar si ya existe sesión superadmin
  // Si no se provee identidad específica, se asocia por defecto a la identidad super admin para la consola global
  // o se redirige al login si es necesario.
  const identityId = client_id === 'inthaly-global-console' ? 'id-super-admin-global' : 'id-carlos-mendoza-1'

  const authResult = await inthalyIdService.authorizeOidcCode({
    identity_id: identityId,
    client_id,
    redirect_uri,
    scope,
    code_challenge,
    code_challenge_method,
    state,
    nonce
  })

  if (!authResult.success || !authResult.data) {
    return NextResponse.json(
      { error: 'server_error', error_description: authResult.error || 'Error al emitir código OIDC' },
      { status: 500 }
    )
  }

  // 5. Redireccionar al redirect_uri con el código de autorización
  const targetUrl = new URL(redirect_uri)
  targetUrl.searchParams.set('code', authResult.data.code)
  if (state) {
    targetUrl.searchParams.set('state', state)
  }

  return NextResponse.redirect(targetUrl.toString())
}
