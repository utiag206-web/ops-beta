import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { inthalyIdService, communityService } from '@/services'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CommunityCallbackPage({
  searchParams
}: {
  searchParams: Promise<{ code?: string; state?: string }>
}) {
  const params = await searchParams
  const code = params.code
  const state = params.state

  if (!code) {
    redirect('/comunidad/login')
  }

  // 1. Validar state anti-CSRF y obtener code_verifier de PKCE desde la cookie HttpOnly
  const cookieStore = await cookies()
  const pkceCookie = cookieStore.get('inthaly_oidc_pkce')?.value

  let codeVerifier: string | undefined
  if (pkceCookie) {
    try {
      const parsed = JSON.parse(pkceCookie)
      if (parsed.state && state && parsed.state !== state) {
        redirect('/comunidad/login?error=invalid_state')
      }
      codeVerifier = parsed.codeVerifier
    } catch {
      // ignore
    }
  }

  // Eliminar cookie temporal de PKCE
  cookieStore.delete('inthaly_oidc_pkce')

  // 2. Intercambio de código por tokens OIDC utilizando PKCE (cliente público, sin secreto en frontend)
  const exchangeRes = await inthalyIdService.exchangeOidcCode({
    code,
    client_id: 'inthaly-community-web',
    redirect_uri: 'http://localhost:3000/comunidad/callback',
    code_verifier: codeVerifier
  })

  if (!exchangeRes.success || !exchangeRes.data) {
    redirect('/comunidad/login?error=exchange_failed')
  }

  const identity = exchangeRes.data.identity

  // 3. Verificar si ya existe perfil comunitario para esta identidad
  const supabase = await createAdminClient()
  const existingProfile = await communityService.getProfile(supabase, identity.id)

  if (!existingProfile) {
    // Si no tiene perfil comunitario, transferir al onboarding limpio (sin exponer UUIDs en URL)
    redirect('/comunidad/onboarding')
  }

  // Si ya tiene perfil, ingresar al muro técnico
  redirect('/comunidad')
}
