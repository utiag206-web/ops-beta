'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getMovements() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) return []

  const supabase = await createClient()

  console.log("--- AUDIT: MOVEMENTS FETCH INICIO ---")
  console.log("QUERY ALIASED: supabase.from('worker_movements').select('*, worker:workers!fk_worker_movements_worker(...)')")

  let query = supabase
    .from('worker_movements')
    .select(`*, worker:workers(name)`)
    .eq('company_id', extendedUser.company_id)
    .order('created_at', { ascending: false })

  if (extendedUser.role_id === 'trabajador') {
    query = query.eq('worker_id', extendedUser.worker_id)
  }

  const { data, error } = await query

  console.log("FETCH RESULT MOVEMENTS:", data, error)
  console.log("--- AUDIT: MOVEMENTS FETCH FIN ---")

  if (error) {
    console.error('[MOVEMENTS] Error fetching movements:', JSON.stringify(error))
    return []
  }

  console.log(`[MOVEMENTS] Fetched ${data?.length ?? 0} movements for company ${extendedUser.company_id}`)
  return data || []
}

export async function registerMovement(payload: {
  worker_id: string
  type: 'subida' | 'bajada'
  date: string
}) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser || extendedUser.role_id === 'trabajador') {
      return { success: false, error: 'No autorizado' }
    }

    const supabase = await createClient()

    const movementData: any = {
      worker_id: payload.worker_id,
      company_id: extendedUser.company_id,
      status: payload.type === 'subida' ? 'En mina' : 'En descanso'
    }

    if (payload.type === 'subida') {
      movementData.subida_date = payload.date
    } else {
      movementData.bajada_date = payload.date
    }

    console.log('[MOVEMENTS] Inserting:', JSON.stringify(movementData))

    const { data, error } = await supabase
      .from('worker_movements')
      .insert(movementData)
      .select()

    console.log('[MOVEMENTS] Insert result:', JSON.stringify(data))
    if (error) {
      console.error('[MOVEMENTS] Insert error:', JSON.stringify(error))
      return { success: false, error: `${error.message} (code: ${error.code})` }
    }

    revalidatePath('/movements')
    revalidatePath('/dashboard')
    return { success: true, error: null }
  } catch (e: any) {
    console.error('[MOVEMENTS] Unexpected error:', e.message)
    return { success: false, error: e.message }
  }
}
