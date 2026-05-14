'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'

export async function getAssets() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  
  if (!companyId) return { error: 'Acceso denegado.' }

  const supabase = await createAdminClient()

  const { data, error } = await applyIsolation(
    supabase.from('assets').select('*'),
    companyId,
    extendedUser.role_id
  )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching assets:', error)
    return { error: error.message }
  }

  return { data: data || [] }
}

export async function createAsset(payload: {
  code: string
  name: string
  type: string
  status: string
  location: string
  camp_name?: string
}) {
  const supabase = await createAdminClient()
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  if (!extendedUser?.id || !companyId) {
    return { error: 'Sesión inválida o sin contexto de empresa.' }
  }

  const { data, error } = await supabase
    .from('assets')
    .insert([{
      ...payload,
      company_id: companyId
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
    const companyId = await getStrictCompanyId()
    if (!companyId) return { error: 'No autorizado' }

    const { data, error } = await applyIsolation(
      supabase.from('assets').update(payload),
      companyId,
      extendedUser.role_id
    )
      .eq('id', id)
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
    const companyId = await getStrictCompanyId()
    if (!companyId) return { error: 'No autorizado' }

    const { error } = await applyIsolation(
      supabase.from('assets').delete(),
      companyId,
      extendedUser.role_id
    ).eq('id', id)

    if (error) throw error

    revalidatePath('/assets')
    return { success: true }
  } catch (error: any) {
    console.error('DELETE_ASSET_ERROR:', error)
    return { error: error.message }
  }
}
