'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: { name: string, email: string }) {
  try {
    const supabase = await createClient()
    const { user, extendedUser } = await getUserSession()

    if (!user || !extendedUser) return { success: false, error: 'No autorizado' }

    // 1. Validar unicidad de email antes de proceder
    if (formData.email !== user.email) {
      const adminSupabase = await createAdminClient()
      const { data: existingUser } = await adminSupabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .neq('id', extendedUser.id) // Buscar otro usuario con ese email
        .maybeSingle()

      if (existingUser) {
        return { success: false, error: 'email already in use' }
      }

      // Update Auth Email (this might require verification)
      const { error: authError } = await supabase.auth.updateUser({ email: formData.email })
      if (authError) return { success: false, error: authError.message }
    }

    // 2. Update public.users record
    const adminSupabase = await createAdminClient()
    const { error: dbError } = await adminSupabase
      .from('users')
      .update({ name: formData.name, email: formData.email })
      .eq('id', extendedUser.id)

    if (dbError) return { success: false, error: dbError.message }

    revalidatePath('/profile')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updatePassword(password: string) {
  try {
    const supabase = await createClient()
    const { user } = await getUserSession()

    if (!user) return { success: false, error: 'No autorizado' }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
