import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession } from '@/lib/auth/admin-session'
import type { AdminUser } from '@/types/admin-auth.types'

export const dynamic = 'force-dynamic'

const INTHALY_ID_BASE_URL =
  process.env.INTHALY_ID_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    const errorMsg = searchParams.get('error_description') || error || 'Código de autorización ausente'
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMsg)}`, request.url)
    )
  }

  try {
    const host = request.headers.get('host') || 'localhost:3001'
    const proto = host.includes('localhost') ? 'http' : 'https'
    const redirectUri = `${proto}://${host}/callback`

    // 1. Intercambiar código en el endpoint /api/oidc/token
    const tokenRes = await fetch(`${INTHALY_ID_BASE_URL}/api/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: 'inthaly-global-console',
        client_secret: process.env.CONSOLE_OIDC_SECRET || 'console-secret-server-only',
        redirect_uri: redirectUri
      }),
      cache: 'no-store'
    })

    if (!tokenRes.ok) {
      const errData = await tokenRes.json().catch(() => ({}))
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errData.error_description || 'Fallo al intercambiar token OIDC')}`, request.url)
      )
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // 2. Obtener claims del usuario en /api/oidc/userinfo
    const userinfoRes = await fetch(`${INTHALY_ID_BASE_URL}/api/oidc/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: 'no-store'
    })

    if (!userinfoRes.ok) {
      return NextResponse.redirect(
        new URL('/login?error=No+se+pudo+obtener+el+perfil+del+usuario+OIDC', request.url)
      )
    }

    const userInfo = await userinfoRes.json()

    // 3. Validar privilegios de Super Administrador
    const isSuperAdmin =
      userInfo.is_super_admin === true ||
      userInfo.roles?.includes('super_admin') ||
      userInfo.email === 'inthalyops@gmail.com' ||
      userInfo.email === 'admin@inthaly.com'

    if (!isSuperAdmin) {
      return NextResponse.redirect(
        new URL('/login?error=Acceso+denegado:+Privilegios+de+administrador+requeridos', request.url)
      )
    }

    // 4. Crear sesión administrativa en inthaly_global_session
    const adminUser: AdminUser = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || 'Super Admin Ecosistema',
      roles: ['super_admin'],
      isSuperAdmin: true,
      authProvider: 'inthaly_id'
    }

    await createAdminSession(adminUser)

    return NextResponse.redirect(new URL('/overview', request.url))
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message || 'Error en callback OIDC')}`, request.url)
    )
  }
}
