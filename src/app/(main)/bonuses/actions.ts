'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getBonuses(workerId?: string) {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = extendedUser?.company_id;
    if (!companyId || !UUID_REGEX.test(companyId)) return []

    const supabase = await createAdminClient()
    
    // Base queries sin join automático para evitar conflicto UUID vs TEXT
    let bQuery = supabase.from('bonuses').select('*').eq('company_id', companyId)
    let tQuery = supabase.from('transport_payments').select('*').eq('company_id', companyId)

    // UUID context filters
    if (extendedUser.role_id === 'trabajador') {
      const wId = extendedUser.worker_id;
      if (wId && UUID_REGEX.test(wId)) {
        bQuery = bQuery.eq('worker_id', wId)
        tQuery = tQuery.eq('worker_id', wId)
      }
    } else if (workerId && UUID_REGEX.test(workerId)) {
      bQuery = bQuery.eq('worker_id', workerId)
      tQuery = tQuery.eq('worker_id', workerId)
    }

    const [bRes, tRes] = await Promise.all([
      bQuery.order('date', { ascending: false }).limit(50),
      tQuery.order('date', { ascending: false }).limit(50)
    ])

    const rawBonuses = bRes.data || []
    const rawTransport = tRes.data || []

    // Obtener IDs únicos de trabajadores para hidratar nombres manualmente
    const wIds = Array.from(new Set([
      ...rawBonuses.map(b => b.worker_id),
      ...rawTransport.map(t => t.worker_id)
    ])).filter(id => id && UUID_REGEX.test(id))

    const { data: workersList } = wIds.length > 0 
      ? await supabase.from('workers').select('id, name').in('id', wIds)
      : { data: [] }

    const workerMap = new Map((workersList || []).map(w => [w.id, w]))

    const bList = rawBonuses.map(b => ({ 
      ...b, 
      type: 'bono',
      worker: workerMap.get(b.worker_id) || { name: 'Desconocido' }
    }))

    const tList = rawTransport.map(t => ({ 
      ...t, 
      type: 'pasaje',
      bonus_type: t.concept || 'Pasaje',
      worker: workerMap.get(t.worker_id) || { name: 'Desconocido' }
    }))

    return [...bList, ...tList].sort((a, b) => {
      const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (timeDiff === 0) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return timeDiff
    }).slice(0, 50)
  } catch (err) {
    console.error('Error en getBonuses:', err)
    return []
  }
}

export async function createBonus(formData: {
  worker_id: string
  bonus_type: string
  amount: number
  date: string
  status: 'paid' | 'pending'
}) {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = extendedUser?.company_id
    const role = (extendedUser?.role_id || '').toLowerCase()
    const authorized = ['admin', 'gerente', 'operaciones', 'administracion'].includes(role)

    if (!companyId || !UUID_REGEX.test(companyId) || !authorized) {
      return { success: false, error: 'No autorizado o sesión inválida' }
    }

    const workerId = formData.worker_id?.trim()
    if (!workerId || !UUID_REGEX.test(workerId)) {
      return { success: false, error: 'Error de identificación del trabajador. Recarga la página e intenta nuevamente.' }
    }

    const supabase = await createAdminClient()
    const isPasaje = formData.bonus_type.toLowerCase().includes('pasaje')
    const targetTable = isPasaje ? 'transport_payments' : 'bonuses'

    const insertData: any = {
      worker_id: workerId,
      amount: formData.amount,
      date: formData.date,
      status: formData.status,
      company_id: companyId
    }

    if (!isPasaje) {
      insertData.bonus_type = formData.bonus_type
    }
    // Note: 'transport_payments' table does not have a 'concept' column, 
    // so we skip adding it to avoid schema errors.

    const { data, error } = await supabase
      .from(targetTable)
      .insert([insertData])
      .select('id') // Solo seleccionar ID para minimizar tráfico y evitar fallos de cache de esquema

    if (error) {
      console.error(`Error en Supabase (${targetTable}):`, error)
      return { success: false, error: 'Error al registrar: ' + error.message }
    }

    revalidatePath(`/workers/${workerId}`)
    revalidatePath('/bonuses')
    revalidatePath('/reports')
    revalidatePath('/dashboard')
    
    return { success: true, data: data?.[0] }
  } catch (err: any) {
    console.error('Error crítico en createBonus:', err)
    return { success: false, error: 'Error inesperado: ' + err.message }
  }
}

export async function updateBonusStatus(id: string, status: 'paid' | 'pending') {
  try {
    const { extendedUser } = await getUserSession()
    const role = (extendedUser?.role_id || '').toLowerCase()
    const authorized = ['admin', 'gerente', 'operaciones', 'administracion'].includes(role)

    if (!extendedUser?.company_id || !authorized) {
      return { success: false, error: 'No autorizado' }
    }

    const supabase = await createAdminClient()
    
    // Intentar actualizar en bonos
    const { data: bData, error: bError } = await supabase
      .from('bonuses')
      .update({ status })
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)
      .select('id')

    // Si no se encontró en bonos, intentar en pasajes
    if (bError || !bData || bData.length === 0) {
      const { error: tError } = await supabase
        .from('transport_payments')
        .update({ status })
        .eq('id', id)
        .eq('company_id', extendedUser.company_id)
      
      if (tError) {
        console.error('Error updating transport status:', tError)
        return { success: false, error: tError.message }
      }
    }

    revalidatePath('/bonuses')
    revalidatePath('/reports')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
