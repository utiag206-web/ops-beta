import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as any
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // 1. Verificación por Token Hash (Flujo de confirmación de email o magic link)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[AUTH_CALLBACK] Error al verificar OTP:', error.message)
  }

  // 2. Intercambio de código por sesión (Flujo PKCE / OAuth / Confirmation code)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[AUTH_CALLBACK] Error al intercambiar código:', error.message)
  }

  // 3. Si hubo algún error o enlace expirado, redirigir al login con mensaje amigable
  return NextResponse.redirect(`${origin}/login?message=El+enlace+de+verificaci%C3%B3n+es+inv%C3%A1lido+o+ha+expirado`)
}
