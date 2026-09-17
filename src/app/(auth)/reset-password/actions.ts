'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ResetPasswordState {
  error?: string
  success?: boolean
  message?: string
}

export async function updatePassword(
  prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Por favor complete todos los campos.' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden. Por favor verifíquelas.' }
  }

  try {
    const supabase = await createClient()

    // 1. Verificar si hay un usuario autenticado vía la sesión del callback
    const { data: { user }, error: userErr } = await supabase.auth.getUser()

    if (userErr || !user) {
      console.warn('[AUTH_RESET] No user session found during updatePassword:', userErr?.message)
      return {
        error: 'Tu sesión de seguridad ha expirado o el enlace ya fue utilizado. Solicita un nuevo enlace de acceso.',
      }
    }

    // 2. Actualizar la contraseña en Supabase Auth
    const { error: updateErr } = await supabase.auth.updateUser({
      password,
    })

    if (updateErr) {
      console.error('[AUTH_RESET] Error updating password in Supabase Auth:', updateErr.message)
      return { error: `No se pudo actualizar la contraseña: ${updateErr.message}` }
    }

    // 3. Si el usuario estaba marcado como inactive en public.users (primer acceso), activarlo
    try {
      const supabaseAdmin = await createAdminClient()
      await supabaseAdmin
        .from('users')
        .update({ status: 'active' })
        .eq('id', user.id)
        .eq('status', 'inactive')
    } catch (activateErr: any) {
      console.warn('[AUTH_RESET] Could not verify user status update:', activateErr?.message)
    }

    revalidatePath('/', 'layout')

    return {
      success: true,
      message: 'Tu contraseña ha sido guardada exitosamente. Ahora puedes ingresar a la plataforma.',
    }
  } catch (err: any) {
    console.error('[AUTH_RESET] Unexpected exception in updatePassword:', err)
    return { error: 'Ocurrió un error inesperado al actualizar tu contraseña.' }
  }
}
