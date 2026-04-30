'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserSession } from '@/lib/auth'

export async function getIncidencias(filters?: { status?: string }) {
  const supabase = await createAdminClient()
  const { extendedUser } = await getUserSession()
  
  if (!extendedUser?.company_id) return { error: 'Acceso denegado.' }

  let query = supabase
    .from('incidencias')
    .select('*')
    .eq('company_id', extendedUser.company_id)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('SERVER_GET_INCIDENCIAS_ERROR:', JSON.stringify(error, null, 2))
    console.log('REPORTE_TÉCNICO_RLS:', error.code, error.message)
    return { error: `Database Error: ${error.message} (${error.code})` }
  }

  // MANUAL JOIN for reporter name
  const reporterIds = [...new Set(data.map(inc => inc.reported_by).filter(Boolean))]
  if (reporterIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, name').in('id', reporterIds)
    const enrichedData = data.map(inc => ({
      ...inc,
      reporter: users?.find(u => u.id === inc.reported_by)
    }))
    return { data: enrichedData }
  }

  return { data }
}

export async function createIncidencia(payload: {
  area_location: string
  description: string
  severity: string
  event_date?: string
  incident_category?: string
  corrective_actions?: string
  photo_urls?: string[]
}) {
  const supabase = await createAdminClient()
  const { extendedUser } = await getUserSession()

  if (!extendedUser?.id || !extendedUser?.company_id) {
    return { error: 'Sesión inválida.' }
  }

  const { data, error } = await supabase
    .from('incidencias')
    .insert([{
      area_location: payload.area_location,
      description: payload.description,
      severity: payload.severity,
      event_date: payload.event_date || new Date().toISOString().split('T')[0],
      incident_category: payload.incident_category,
      corrective_actions: payload.corrective_actions,
      photo_urls: payload.photo_urls || [],
      company_id: extendedUser.company_id,
      reported_by: extendedUser.id,
      status: 'abierta'
    }])
    .select()

  if (error) {
    console.error('CREATE_INCIDENCIA_ERROR:', error)
    return { error: `Error Supabase: ${error.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/incidencias')
  return { success: true, data }
}
