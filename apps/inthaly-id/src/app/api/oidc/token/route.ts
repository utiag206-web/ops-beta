import { NextRequest, NextResponse } from 'next/server'
import * as inthalyIdService from '@/services/inthaly-id.service'

export const dynamic = 'force-dynamic'

/**
 * Token Endpoint OIDC / OAuth 2.0 (RFC 6749 / RFC 7636)
 * URL: /api/oidc/token
 * Método: POST
 */
export async function POST(request: NextRequest) {
  let grant_type = ''
  let code = ''
  let redirect_uri = ''
  let client_id = ''
  let client_secret: string | undefined = undefined
  let code_verifier: string | undefined = undefined

  // 1. Verificar encabezado Authorization: Basic para client credentials
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
      const colonIdx = credentials.indexOf(':')
      if (colonIdx !== -1) {
        client_id = credentials.substring(0, colonIdx)
        client_secret = credentials.substring(colonIdx + 1)
      }
    } catch {
      // Ignorar error de base64 malformado
    }
  }

  // 2. Extraer parámetros del cuerpo (soporta urlencoded y json)
  const contentType = request.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      const body = await request.json()
      grant_type = body.grant_type || grant_type
      code = body.code || code
      redirect_uri = body.redirect_uri || redirect_uri
      if (!client_id && body.client_id) client_id = body.client_id
      if (!client_secret && body.client_secret) client_secret = body.client_secret
      code_verifier = body.code_verifier || code_verifier
    } else {
      const formData = await request.formData()
      grant_type = formData.get('grant_type')?.toString() || grant_type
      code = formData.get('code')?.toString() || code
      redirect_uri = formData.get('redirect_uri')?.toString() || redirect_uri
      if (!client_id && formData.get('client_id')) client_id = formData.get('client_id')!.toString()
      if (!client_secret && formData.get('client_secret')) client_secret = formData.get('client_secret')!.toString()
      code_verifier = formData.get('code_verifier')?.toString() || code_verifier
    }
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Cuerpo de solicitud inválido o ilegible' },
      { status: 400, headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' } }
    )
  }

  // 3. Validar grant_type
  if (!grant_type || grant_type !== 'authorization_code') {
    return NextResponse.json(
      { error: 'unsupported_grant_type', error_description: 'Solo se soporta grant_type=authorization_code' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // 4. Validar parámetros requeridos
  if (!code || !redirect_uri || !client_id) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Los parámetros code, redirect_uri y client_id son obligatorios' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // 5. Intercambiar código mediante el servicio soberano de Inthaly ID
  const result = await inthalyIdService.exchangeOidcCode({
    code,
    client_id,
    redirect_uri,
    code_verifier,
    client_secret
  })

  if (!result.success || !result.data) {
    const isClientError = result.error?.includes('cliente') || result.error?.includes('Credenciales')
    return NextResponse.json(
      {
        error: isClientError ? 'invalid_client' : 'invalid_grant',
        error_description: result.error || 'Código de autorización inválido'
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  return NextResponse.json(
    {
      access_token: result.data.access_token,
      token_type: 'Bearer',
      expires_in: result.data.expires_in,
      id_token: result.data.id_token,
      scope: 'openid profile email'
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Content-Type': 'application/json; charset=utf-8'
      }
    }
  )
}
