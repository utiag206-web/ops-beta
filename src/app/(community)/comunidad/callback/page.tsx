import { redirect } from 'next/navigation'
import { inthalyIdService, communityService } from '@/services'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CommunityCallbackPage({
  searchParams
}: {
  searchParams: Promise<{ code?: string; state?: string; delegated_ticket?: string }>
}) {
  const params = await searchParams
  const code = params.code

  if (!code) {
    redirect('/comunidad/login')
  }

  // Intercambio de código por identidad
  const exchangeRes = await inthalyIdService.exchangeOidcCode({
    code,
    client_id: 'inthaly-community-web',
    client_secret: 'comm-secret-2026-xyz'
  })

  if (!exchangeRes.success || !exchangeRes.data) {
    redirect('/comunidad/login?error=exchange_failed')
  }

  const identity = exchangeRes.data.identity

  // Verificar si ya existe perfil comunitario para esta identidad
  const supabase = await createAdminClient()
  const existingProfile = await communityService.getProfile(supabase, identity.id)

  if (!existingProfile) {
    // Si no tiene perfil comunitario todavía, iniciar incorporación (Onboarding)
    redirect(`/comunidad/onboarding?identity_id=${identity.id}&name=${encodeURIComponent(identity.display_name)}&email=${encodeURIComponent(identity.email)}`)
  }

  // Si ya tiene perfil, ingresar al muro técnico
  redirect('/comunidad')
}
