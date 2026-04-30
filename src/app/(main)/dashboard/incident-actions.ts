'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserSession } from '@/lib/auth'

export async function createIncident(payload: {
  area_location: string
  description: string
  severity: string
  type?: string
  event_date?: string
}) {
  const supabase = await createClient()
  const { extendedUser } = await getUserSession()

  if (!extendedUser?.id || !extendedUser?.company_id) {
    return { error: 'Sesión inválida o sin empresa vinculada.' }
  }

  const { data, error } = await supabase
    .from('incidencias')
    .insert([{
      company_id: extendedUser.company_id,
      reported_by: extendedUser.id,
      area_location: payload.area_location || payload.type || 'General',
      description: payload.description,
      severity: payload.severity || 'Media',
      event_date: payload.event_date || new Date().toISOString().split('T')[0],
      status: 'abierta'
    }])
    .select()

  if (error) {
    console.error('CREATE_INCIDENT_ERROR:', error)
    return { error: `Error Supabase: ${error.message}` }
  }

  console.log('CREATE_INCIDENT_SUCCESS: Row inserted:', data[0]?.id)

  revalidatePath('/dashboard')
  revalidatePath('/incidencias')
  return { success: true, data }
}
