'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ActivateState {
  error?: string
  success?: boolean
  message?: string
  isUsedOrExpired?: boolean
}

export async function activateAndSetPassword(
  prevState: ActivateState,
  formData: FormData
): Promise<ActivateState> {
  const token = (formData.get('token') as string)?.trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!token) {
    return {
      error: 'El código de activación no es válido o ha expirado.',
      isUsedOrExpired: true
    }
  }

  if (!password || !confirmPassword) {
    return { error: 'Por favor completa todos los campos requeridos.' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden. Por favor verifícalas.' }
  }

  try {
    const supabase = await createClient()

    // 1. Validar y consumir el OTP de un solo uso en Supabase Auth
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      type: 'recovery',
      token_hash: token,
    })

    if (otpError || !otpData?.user) {
      console.error('[ACTIVAR_ACTION] Error al verificar OTP de primer acceso:', otpError?.message)
      return {
        error: 'El enlace de activación es inválido o ya ha sido utilizado. Si ya estableciste tu contraseña, puedes iniciar sesión directamente.',
        isUsedOrExpired: true,
      }
    }

    const user = otpData.user

    // 2. Establecer la contraseña definitiva elegida por el usuario
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      console.error('[ACTIVAR_ACTION] Error al actualizar contraseña:', updateError.message)
      return { error: `No se pudo guardar la contraseña: ${updateError.message}` }
    }

    // 3. Activar el estado del usuario en la tabla public.users
    try {
      const supabaseAdmin = await createAdminClient()
      await supabaseAdmin
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id)
    } catch (activateErr: any) {
      console.warn('[ACTIVAR_ACTION] No se pudo actualizar estado en users:', activateErr?.message)
    }

    revalidatePath('/', 'layout')

    return {
      success: true,
      message: 'Tu contraseña ha sido guardada exitosamente. Tu cuenta corporativa está activa y lista para usar.',
    }
  } catch (err: any) {
    console.error('[ACTIVAR_ACTION] Excepción inesperada:', err)
    return { error: 'Ocurrió un error inesperado al procesar la activación.' }
  }
}
