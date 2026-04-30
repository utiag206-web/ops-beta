'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserSession } from '@/lib/auth'

export async function getAssets() {
  const supabase = await createClient()
  const { extendedUser } = await getUserSession()
  
  if (!extendedUser?.company_id) return { error: 'Acceso denegado.' }

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('company_id', extendedUser.company_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching assets:', error)
    return { error: error.message }
  }

  return { data }
}

export async function createAsset(payload: {
  code: string
  name: string
  type: string
  status: string
  location: string
}) {
  const supabase = await createClient()
  const { extendedUser } = await getUserSession()

  if (!extendedUser?.id || !extendedUser?.company_id) {
    return { error: 'Sesión inválida.' }
  }

  const { data, error } = await supabase
    .from('assets')
    .insert([{
      ...payload,
      company_id: extendedUser.company_id
    }])
    .select()

  if (error) {
    console.error('CREATE_ASSET_ERROR:', error)
    return { error: `Error Supabase: ${error.message}` }
  }

  revalidatePath('/assets')
  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function updateAsset(id: string, payload: any) {
  try {
    const supabase = await createClient()
    const { extendedUser } = await getUserSession()
    if (!extendedUser?.company_id) return { error: 'No autorizado' }

    const { data, error } = await supabase
      .from('assets')
      .update(payload)
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)
      .select()

    if (error) throw error

    revalidatePath('/assets')
    return { success: true, data }
  } catch (error: any) {
    console.error('UPDATE_ASSET_ERROR:', error)
    return { error: error.message }
  }
}

export async function deleteAsset(id: string) {
  try {
    const supabase = await createClient()
    const { extendedUser } = await getUserSession()
    if (!extendedUser?.company_id) return { error: 'No autorizado' }

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)

    if (error) throw error

    revalidatePath('/assets')
    return { success: true }
  } catch (error: any) {
    console.error('DELETE_ASSET_ERROR:', error)
    return { error: error.message }
  }
}
