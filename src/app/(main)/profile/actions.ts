'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: { name: string, email: string }) {
  try {
    const supabase = await createClient()
    const { user } = await getUserSession()

    if (!user) return { success: false, error: 'No autorizado' }

    // 1. Update Auth Email (this might require verification)
    if (formData.email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({ email: formData.email })
      if (authError) return { success: false, error: authError.message }
    }

    // 2. Update public.users record
    const { error: dbError } = await supabase
      .from('users')
      .update({ name: formData.name, email: formData.email })
      .eq('id', user.id)

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
