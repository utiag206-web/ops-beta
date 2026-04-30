'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getHsecStops() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return []

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('soma_hsec_stop')
    .select(`
      *,
      observer:users!observer_id(name)
    `)
    .eq('company_id', extendedUser.company_id)
    .order('created_at', { ascending: false })

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
  if (!extendedUser?.company_id) return { error: 'No autorizado' }

  const supabase = await createAdminClient()

  console.log('CREATING_HSEC_STOP_PAYLOAD:', payload)
  const { data, error } = await supabase
    .from('soma_hsec_stop')
    .insert([{
      ...payload,
      company_id: extendedUser.company_id,
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
    if (!extendedUser?.company_id) return { error: 'No autorizado' }
  
    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('soma_hsec_stop')
      .update({ 
        status: 'cerrada', 
        closed_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)
  
    if (error) return { error: error.message }
  
    revalidatePath('/soma/hsec')
    return { success: true }
}

export async function getSomaStats() {
    const { extendedUser } = await getUserSession()
    if (!extendedUser?.company_id) return null

    const supabase = await createAdminClient()
    
    // Fetch count of open stops
    const { count: openStops } = await supabase
        .from('soma_hsec_stop')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', extendedUser.company_id)
        .eq('status', 'abierta')

    // Fetch alerts
    const { data: alerts } = await supabase
        .from('soma_alerts')
        .select('*')
        .eq('company_id', extendedUser.company_id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)

    return {
        openStops: openStops || 0,
        alerts: alerts || []
    }
}
