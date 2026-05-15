'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getMovements() {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()

  const supabase = await createAdminClient()

  let query = applyIsolation(
    supabase.from('worker_movements').select(`*, worker:workers(name)`),
    companyId,
    extendedUser.role_id
  ).order('created_at', { ascending: false })

  if (extendedUser.role_id === 'trabajador') {
    query = query.eq('worker_id', extendedUser.worker_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('[MOVEMENTS] Error fetching movements:', JSON.stringify(error))
    return []
  }

  return data || []
}

export async function registerMovement(payload: {
  worker_id: string
  type: 'subida' | 'bajada'
  date: string
  location?: string
  observations?: string
}) {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    
    const role = extendedUser.role_id?.toLowerCase()
    const isAuthorized = ['admin', 'gerente', 'operaciones', 'super_admin', 'superadmin'].includes(role)
    
    if (!isAuthorized) {
      return { success: false, error: 'No autorizado' }
    }

    const supabase = await createAdminClient()

    const movementData: any = {
      worker_id: payload.worker_id,
      company_id: companyId,
      status: payload.type === 'subida' ? 'En mina' : 'En descanso',
      location: payload.location || null,
      observations: payload.observations || null
    }

    if (payload.type === 'subida') {
      movementData.subida_date = payload.date
      movementData.bajada_date = null
    } else {
      movementData.bajada_date = payload.date
      movementData.subida_date = null
    }

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
    if (e.digest?.startsWith('NEXT_REDIRECT')) throw e
    console.error('[MOVEMENTS] Unexpected error:', e.message)
    return { success: false, error: e.message }
  }
}

export async function updateMovement(id: string, payload: {
  date: string
  type: 'subida' | 'bajada'
  location?: string
  observations?: string
  status?: string
}) {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    
    if (!['admin', 'gerente', 'operaciones', 'super_admin', 'superadmin'].includes(extendedUser.role_id)) {
      return { success: false, error: 'No autorizado' }
    }
 
    const supabase = await createAdminClient()
    
    const updateData: any = {
      location: payload.location,
      observations: payload.observations,
      status: payload.type === 'subida' ? 'En mina' : 'En descanso'
    }
 
    if (payload.type === 'subida') {
      updateData.subida_date = payload.date
      updateData.bajada_date = null
    } else {
      updateData.bajada_date = payload.date
      updateData.subida_date = null
    }
 
    const { error } = await applyIsolation(
      supabase.from('worker_movements').update(updateData),
      companyId,
      extendedUser.role_id
    ).eq('id', id)
 
    if (error) throw error
    revalidatePath('/movements')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('[MOVEMENTS_UPDATE] Error:', error.message)
    return { success: false, error: error.message }
  }
}

export async function deleteMovement(id: string) {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()

    if (!['admin', 'gerente', 'super_admin'].includes(extendedUser.role_id)) {
      throw new Error('No tienes permisos para eliminar registros.')
    }

    const supabase = await createAdminClient()
    const { error } = await applyIsolation(
      supabase.from('worker_movements').delete(),
      companyId,
      extendedUser.role_id
    ).eq('id', id)

    if (error) throw error
    revalidatePath('/movements')
    return { success: true }
  } catch (error: any) {
    console.error('[MOVEMENTS_DELETE] Error:', error.message)
    return { success: false, error: error.message }
  }
}
