'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getCampRooms() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) return []

  const supabase = await createAdminClient()

  console.log("--- AUDIT: CAMP FETCH INICIO ---")
  console.log("QUERY ALIASED: supabase.from('camp_rooms').select('*, worker:workers!fk_camp_rooms_worker(...)')")

  let query = supabase
    .from('camp_rooms')
    .select(`*, worker:workers(name)`)
    .eq('company_id', extendedUser.company_id)
    .order('module', { ascending: true })

  if (extendedUser.role_id === 'trabajador') {
    query = query.eq('worker_id', extendedUser.worker_id)
  }

  const { data, error } = await query

  console.log("FETCH RESULT CAMP:", data, error)
  console.log("--- AUDIT: CAMP FETCH FIN ---")

  if (error) {
    console.error('[CAMP] Error fetching camp rooms:', JSON.stringify(error))
    return []
  }

  console.log(`[CAMP] Fetched ${data?.length ?? 0} rooms for company ${extendedUser.company_id}`)
  return data || []
}

export async function assignCampRoom(payload: {
  module: string
  room_number: string
  bed_number: string
  worker_id: string | null
}) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser || extendedUser.role_id === 'trabajador') {
      return { success: false, error: 'No autorizado' }
    }

    const supabase = await createAdminClient()

    const insertPayload = {
      module: payload.module,
      room_number: payload.room_number,
      bed_number: payload.bed_number,
      worker_id: payload.worker_id || null,
      company_id: extendedUser.company_id,
      status: payload.worker_id ? 'Ocupada' : 'Disponible'
    }

    console.log('[CAMP] Inserting:', JSON.stringify(insertPayload))

    const { data, error } = await supabase
      .from('camp_rooms')
      .insert(insertPayload)
      .select()

    console.log('[CAMP] Insert result:', JSON.stringify(data))
    if (error) {
      console.error('[CAMP] Insert error:', JSON.stringify(error))
      return { success: false, error: `${error.message} (code: ${error.code})` }
    }

    revalidatePath('/camp')
    revalidatePath('/dashboard')
    return { success: true, error: null }
  } catch (e: any) {
    console.error('[CAMP] Unexpected error:', e.message)
    return { success: false, error: e.message }
  }
}

export async function updateRoomAssignment(id: string, payload: {
  worker_id: string | null
  module?: string
  room_number?: string
  bed_number?: string
}) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser || extendedUser.role_id === 'trabajador') {
      return { success: false, error: 'No autorizado' }
    }

    const supabase = await createAdminClient()
    const updateData: any = {
      worker_id: payload.worker_id,
      status: payload.worker_id ? 'Ocupada' : 'Disponible'
    }

    if (payload.module) updateData.module = payload.module
    if (payload.room_number) updateData.room_number = payload.room_number
    if (payload.bed_number) updateData.bed_number = payload.bed_number

    const { error } = await supabase
      .from('camp_rooms')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)

    if (error) {
      console.error('[CAMP] Update error:', JSON.stringify(error))
      return { success: false, error: `${error.message} (code: ${error.code})` }
    }

    revalidatePath('/camp')
    revalidatePath('/dashboard')
    return { success: true, error: null }
  } catch (e: any) {
    console.error('[CAMP] Unexpected error:', e.message)
    return { success: false, error: e.message }
  }
}

export async function deleteCampRoom(id: string) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser || extendedUser.role_id === 'trabajador') {
      return { success: false, error: 'No autorizado' }
    }

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('camp_rooms')
      .delete()
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)

    if (error) {
      console.error('[CAMP] Delete error:', JSON.stringify(error))
      return { success: false, error: `${error.message} (code: ${error.code})` }
    }

    revalidatePath('/camp')
    revalidatePath('/dashboard')
    return { success: true, error: null }
  } catch (e: any) {
    console.error('[CAMP] Unexpected error:', e.message)
    return { success: false, error: e.message }
  }
}
