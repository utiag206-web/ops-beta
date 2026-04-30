'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getAttendance(workerId?: string, date?: string) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return []

  const supabase = await createClient()
  let query = supabase
    .from('attendance')
    .select('*, worker:workers(name)')
    .eq('company_id', extendedUser.company_id)
    .order('date', { ascending: false })

  // [BLINDAJE_UUID]
  if (extendedUser.role_id === 'trabajador') {
    if (!extendedUser.worker_id) return []
    query = query.eq('worker_id', extendedUser.worker_id)
  } else if (workerId && workerId !== 'none') {
    query = query.eq('worker_id', workerId)
  }

  if (date && date !== 'undefined') {
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
  if (!extendedUser?.worker_id || !extendedUser?.company_id) {
    return { success: false, error: 'No autorizado como trabajador' }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toLocaleTimeString('en-GB') // HH:MM:SS

  const { data, error } = await supabase
    .from('attendance')
    .insert([{
      worker_id: extendedUser.worker_id,
      company_id: extendedUser.company_id,
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

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
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
