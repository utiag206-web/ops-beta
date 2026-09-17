'use server'

import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

export interface ForgotPasswordState {
  error?: string
  success?: boolean
  message?: string
}

export async function sendPasswordResetEmail(
  prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email || !email.includes('@')) {
    return { error: 'Por favor ingrese un correo electrónico corporativo válido.' }
  }

  try {
    const supabase = await createClient()
    const siteUrl = await getSiteUrl()
    const redirectTo = `${siteUrl}/auth/callback?next=/reset-password`

    console.log(`[AUTH_RESET] Solicitando restablecimiento para: ${email} con redirectTo: ${redirectTo}`)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      console.error('[AUTH_RESET] Error de Supabase al enviar correo de recuperación:', error.message)
      // Si es un error de rate limit, notificar adecuadamente
      if (error.status === 429 || error.message.toLowerCase().includes('rate')) {
        return { error: 'Se han realizado demasiados intentos recientes. Por favor espera unos minutos antes de intentar de nuevo.' }
      }
    }

    // Por seguridad (anti-enumeration), siempre respondemos éxito genérico si el correo es sintácticamente válido
    return {
      success: true,
      message: 'Si el correo ingresado está registrado en la plataforma, recibirás en breve un enlace para restablecer tu contraseña.',
    }
  } catch (err: any) {
    console.error('[AUTH_RESET] Excepción inesperada:', err)
    return {
      error: 'Ocurrió un error inesperado al procesar la solicitud. Por favor intenta más tarde.',
    }
  }
}
