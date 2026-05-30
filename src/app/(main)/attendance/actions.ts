'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation, getActiveViewMode } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getAttendance(workerId?: string, date?: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  if (!extendedUser || !companyId) return []

  const supabase = await createAdminClient()
  let query = applyIsolation(
    supabase.from('attendance').select('*, worker:workers(name)'),
    companyId,
    extendedUser.role_id
  )
    .order('date', { ascending: false })

  // [BLINDAJE_UUID]
  const viewMode = await getActiveViewMode()
  if (viewMode === 'WORKER' || extendedUser.role_id === 'trabajador') {
    if (!extendedUser.worker_id) return []
    query = query.eq('worker_id', extendedUser.worker_id)
  } else if (workerId && workerId !== 'none') {
    query = query.eq('worker_id', workerId)
  }

  // OPTIMIZATION: Only fetch last 30 days for general view
  if (!date || date === 'undefined') {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    query = query.gte('date', thirtyDaysAgo.toISOString().split('T')[0])
  } else {
    query = query.eq('date', date)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching attendance:', error)
    return []
  }

  return data
}

export async function checkIn() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  if (!extendedUser?.worker_id || !companyId) {
    return { success: false, error: 'No autorizado como trabajador o sin contexto de empresa' }
  }

  const supabase = await createAdminClient()
  const today = new Date().toLocaleDateString('sv-SE')
  const now = new Date().toLocaleTimeString('en-GB') // HH:MM:SS

  const { data, error } = await supabase
    .from('attendance')
    .insert([{
      worker_id: extendedUser.worker_id,
      company_id: companyId,
      date: today,
      check_in: now
    }])
    .select()

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return { success: false, error: 'Ya realizaste el ingreso hoy' }
    }
    console.error('Error checking in:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/reports')
  revalidatePath('/dashboard')
  return { success: true, data: data[0] }
}

export async function checkOut() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.worker_id) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createAdminClient()
  const today = new Date().toLocaleDateString('sv-SE')
  const now = new Date().toLocaleTimeString('en-GB')

  const { error } = await supabase
    .from('attendance')
    .update({ check_out: now })
    .eq('worker_id', extendedUser.worker_id)
    .eq('date', today)
    .is('check_out', null)

  if (error) {
    console.error('Error checking out:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/reports')
  revalidatePath('/dashboard')
  return { success: true }
}
