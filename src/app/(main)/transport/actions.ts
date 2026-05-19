'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getTransportPayments(workerId?: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  const supabase = await createAdminClient()
  let query = applyIsolation(
    supabase.from('transport_payments').select('*, worker:workers(name)'),
    companyId,
    extendedUser.role_id
  )
    .order('date', { ascending: false })

  if (workerId) {
    query = query.eq('worker_id', workerId)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching transport payments:', error)
    return []
  }

  return data
}

export async function createTransportPayment(formData: {
  worker_id: string
  amount: number
  date: string
  status: 'paid' | 'pending'
}) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const role = (extendedUser?.role_id || '').toLowerCase()
  const authorized = ['admin', 'gerente', 'operaciones', 'administracion'].includes(role)

  if (!authorized) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('transport_payments')
    .insert([{
      ...formData,
      company_id: companyId
    }])
    .select()

  if (error) {
    console.error('Error creating transport payment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/workers/${formData.worker_id}`)
  revalidatePath('/transport')
  revalidatePath('/reports')
  revalidatePath('/dashboard')
  return { success: true, data: data[0] }
}
