'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function verifyAndActivateToken(token: string) {
  if (!token || typeof token !== 'string') {
    redirect('/login?message=Token+de+activaci%C3%B3n+no+proporcionado')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    type: 'recovery',
    token_hash: token.trim(),
  })

  if (error) {
    console.error('[ACTIVAR_ACTION] Error al verificar OTP de primer acceso:', error.message)
    redirect('/login?message=El+enlace+de+activaci%C3%B3n+es+inv%C3%A1lido+o+ha+expirado')
  }

  // Sesión establecida con éxito en cookies del servidor -> ir a establecer contraseña
  redirect('/reset-password')
}
