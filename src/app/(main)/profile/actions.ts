'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: { name: string, email: string }) {
  try {
    const supabase = await createClient()
    const { user, extendedUser } = await getUserSession()

    if (!user || !extendedUser) return { success: false, error: 'No autorizado' }

    // 1. Update Auth Email (this might require verification)
    if (formData.email !== user.email) {
      const adminSupabase = await createAdminClient()
      const { data: existingEmail } = await adminSupabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .neq('id', user.id)
        .maybeSingle()

      if (existingEmail) {
        return { 
          success: false, 
          error: 'El correo electrónico ingresado ya está registrado por otro usuario en la plataforma. Cambio denegado.' 
        }
      }

      const { error: authError } = await supabase.auth.updateUser({ email: formData.email })
      if (authError) return { success: false, error: authError.message }
    }

    // 2. Update public.users record
    const adminSupabase = await createAdminClient()
    let query = adminSupabase
      .from('users')
      .update({ name: formData.name, email: formData.email })
      .eq('id', extendedUser.id)

    if (extendedUser.role_id !== 'super_admin') {
      const companyId = await getStrictCompanyId()
      query = query.eq('company_id', companyId)
    } else {
      query = query.is('company_id', null)
    }

    const { error: dbError } = await query

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
