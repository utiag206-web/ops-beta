'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getHsecStops() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  const supabase = await createAdminClient()
  const { data, error } = await applyIsolation(
    supabase.from('soma_hsec_stop').select(`
      *,
      observer:users!observer_id(name)
    `),
    companyId,
    extendedUser.role_id
  ).order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching HSEC stops:', error)
    return []
  }
  return data || []
}

export async function createHsecStop(payload: {
  type: 'acto_inseguro' | 'condicion_insegura'
  category: string
  area_location: string
  description: string
  photo_url?: string
}) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  if (!companyId) return { error: 'No autorizado o sin contexto de empresa' }

  const supabase = await createAdminClient()

  console.log('CREATING_HSEC_STOP_PAYLOAD:', payload)
  const { data, error } = await supabase
    .from('soma_hsec_stop')
    .insert([{
      ...payload,
      company_id: companyId,
      observer_id: extendedUser.id,
      status: 'abierta'
    }])
    .select()

  if (error) {
    console.error('CREATE_HSEC_STOP_ERROR:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/soma/hsec')
  return { success: true, data }
}

export async function closeHsecStop(id: string) {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    if (!companyId) return { error: 'No autorizado' }
  
    const supabase = await createAdminClient()
    const { error } = await applyIsolation(
      supabase.from('soma_hsec_stop').update({ 
        status: 'cerrada', 
        closed_at: new Date().toISOString() 
      }),
      companyId,
      extendedUser.role_id
    ).eq('id', id)
  
    if (error) return { error: error.message }
  
    revalidatePath('/soma/hsec')
    return { success: true }
}

export async function getSomaStats() {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    if (!companyId) return null

    const supabase = await createAdminClient()
    
    // Fetch count of open stops
    const { count: openStops } = await applyIsolation(
        supabase.from('soma_hsec_stop').select('id', { count: 'exact', head: true }),
        companyId,
        extendedUser.role_id
    )
        .eq('status', 'abierta')

    // Fetch alerts
    const { data: alerts } = await applyIsolation(
        supabase.from('soma_alerts').select('*'),
        companyId,
        extendedUser.role_id
    )
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)

    return {
        openStops: openStops || 0,
        alerts: alerts || []
    }
}

export async function updateHsecStop(id: string, payload: {
  type: 'acto_inseguro' | 'condicion_insegura'
  category: string
  area_location: string
  description: string
  status: 'abierta' | 'cerrada'
}) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  if (!companyId) return { error: 'No autorizado o sin contexto de empresa' }

  const supabase = await createAdminClient()
  const updateData: any = {
    type: payload.type,
    category: payload.category,
    area_location: payload.area_location,
    description: payload.description,
    status: payload.status
  }
  if (payload.status === 'cerrada') {
    updateData.closed_at = new Date().toISOString()
  } else {
    updateData.closed_at = null
  }

  const { error } = await applyIsolation(
    supabase.from('soma_hsec_stop').update(updateData),
    companyId,
    extendedUser.role_id
  ).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/soma/hsec')
  return { success: true }
}

export async function deleteHsecStop(id: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  if (!companyId) return { error: 'No autorizado' }

  const supabase = await createAdminClient()
  const { error } = await applyIsolation(
    supabase.from('soma_hsec_stop').delete(),
    companyId,
    extendedUser.role_id
  ).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/soma/hsec')
  return { success: true }
}
