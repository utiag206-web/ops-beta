'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation, getActiveViewMode } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getBonuses(workerId?: string) {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()

    if (!extendedUser || !companyId) return []

    const supabase = await createAdminClient()
    
    // Base queries sin join automático para evitar conflicto UUID vs TEXT
    let bQuery = applyIsolation(supabase.from('bonuses').select('*'), companyId, extendedUser.role_id)
    let tQuery = applyIsolation(supabase.from('transport_payments').select('*'), companyId, extendedUser.role_id)
    let pQuery = applyIsolation(supabase.from('worker_payments').select('*'), companyId, extendedUser.role_id)

    // UUID context filters
    const viewMode = await getActiveViewMode()
    if (viewMode === 'WORKER' || extendedUser.role_id === 'trabajador') {
      const wId = extendedUser.worker_id;
      if (wId && UUID_REGEX.test(wId)) {
        bQuery = bQuery.eq('worker_id', wId)
        tQuery = tQuery.eq('worker_id', wId)
        pQuery = pQuery.eq('worker_id', wId)
      }
    } else if (workerId && UUID_REGEX.test(workerId)) {
      bQuery = bQuery.eq('worker_id', workerId)
      tQuery = tQuery.eq('worker_id', workerId)
      pQuery = pQuery.eq('worker_id', workerId)
    }

    const [bRes, tRes, pRes] = await Promise.all([
      bQuery.order('date', { ascending: false }).limit(50),
      tQuery.order('date', { ascending: false }).limit(50),
      pQuery.order('date', { ascending: false }).limit(50)
    ])

    const rawBonuses = bRes.data || []
    const rawTransport = tRes.data || []
    const rawPayments = pRes.data || []

    // Obtener IDs únicos de trabajadores para hidratar nombres manualmente
    const wIds = Array.from(new Set([
      ...rawBonuses.map((b: any) => b.worker_id),
      ...rawTransport.map((t: any) => t.worker_id),
      ...rawPayments.map((p: any) => p.worker_id)
    ])).filter((id: any) => id && UUID_REGEX.test(id))

    const { data: workersList } = wIds.length > 0 
      ? await supabase.from('workers').select('id, name, last_name').in('id', wIds).eq('company_id', companyId)
      : { data: [] }

    const workerMap = new Map((workersList || []).map(w => [w.id, { ...w, name: `${w.name} ${w.last_name || ''}`.trim() }]))

    const bList = rawBonuses.map((b: any) => ({ 
      ...b, 
      type: 'bono',
      worker: workerMap.get(b.worker_id) || { name: 'Desconocido' }
    }))

    const tList = rawTransport.map((t: any) => ({ 
      ...t, 
      type: 'pasaje',
      bonus_type: t.concept || 'Pasaje',
      worker: workerMap.get(t.worker_id) || { name: 'Desconocido' }
    }))

    const paymentTypeLabels: any = {
      salary: 'Sueldo',
      advance: 'Adelanto',
      liquidation: 'Liquidación',
      extra: 'Pago Extraordinario'
    }

    const pList = rawPayments.map((p: any) => ({
      ...p,
      type: 'pago',
      bonus_type: `${paymentTypeLabels[p.payment_type] || 'Pago'} (${p.period || 'mensual'})`,
      worker: workerMap.get(p.worker_id) || { name: 'Desconocido' }
    }))

    return [...bList, ...tList, ...pList].sort((a, b) => {
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
  type?: 'bono' | 'pasaje' | 'pago'
  payment_type?: 'salary' | 'advance' | 'liquidation' | 'extra'
  period?: string
  payment_method?: string
  observations?: string
  document_url?: string
}) {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    const role = (extendedUser?.role_id || '').toLowerCase()
    const authorized = ['admin', 'gerente', 'administracion', 'super_admin', 'superadmin'].includes(role)

    if (!companyId || !UUID_REGEX.test(companyId) || !authorized) {
      return { success: false, error: 'No autorizado o sesión inválida' }
    }

    const workerId = formData.worker_id?.trim()
    if (!workerId || !UUID_REGEX.test(workerId)) {
      return { success: false, error: 'Error de identificación del trabajador. Recarga la página e intenta nuevamente.' }
    }

    const supabase = await createAdminClient()

    if (formData.type === 'pago') {
      const insertData = {
        company_id: companyId,
        worker_id: workerId,
        date: formData.date,
        period: formData.period || 'mensual',
        payment_type: formData.payment_type || 'salary',
        amount: formData.amount,
        payment_method: formData.payment_method || 'efectivo',
        observations: formData.observations || '',
        document_url: formData.document_url || null,
        status: formData.status
      }

      const { data, error } = await supabase
        .from('worker_payments')
        .insert([insertData])
        .select('id')

      if (error) {
        console.error('Error inserting worker payment:', error)
        return { success: false, error: 'Error al registrar pago: ' + error.message }
      }

      revalidatePath(`/workers/${workerId}`)
      revalidatePath('/bonuses')
      revalidatePath('/reports')
      revalidatePath('/dashboard')
      return { success: true, data: data?.[0] }
    }

    const isPasaje = formData.type === 'pasaje' || formData.bonus_type.toLowerCase().includes('pasaje')
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

    const { data, error } = await supabase
      .from(targetTable)
      .insert([insertData])
      .select('id')

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
    const companyId = await getStrictCompanyId()
    const role = (extendedUser?.role_id || '').toLowerCase()
    const authorized = ['admin', 'gerente', 'administracion', 'super_admin', 'superadmin'].includes(role)

    if (!extendedUser || !companyId || !authorized) {
      return { success: false, error: 'No autorizado' }
    }

    const supabase = await createAdminClient()
    
    // Intentar actualizar en bonos
    const { data: bData, error: bError } = await applyIsolation(
      supabase.from('bonuses').update({ status }),
      companyId,
      extendedUser.role_id
    )
      .eq('id', id)
      .select('id')

    // Si no se encontró en bonos, intentar en pasajes
    if (bError || !bData || bData.length === 0) {
      const { data: tData, error: tError } = await applyIsolation(
        supabase.from('transport_payments').update({ status }),
        companyId,
        extendedUser.role_id
      )
        .eq('id', id)
        .select('id')
      
      // Si tampoco se encontró en pasajes, intentar en pagos
      if (tError || !tData || tData.length === 0) {
        const { error: pError } = await applyIsolation(
          supabase.from('worker_payments').update({ status }),
          companyId,
          extendedUser.role_id
        )
          .eq('id', id)
        
        if (pError) {
          console.error('Error updating payment status:', pError)
          return { success: false, error: pError.message }
        }
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

export async function deleteBonus(id: string) {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    const role = (extendedUser?.role_id || '').toLowerCase()
    const authorized = ['admin', 'gerente', 'administracion', 'super_admin', 'superadmin'].includes(role)

    if (!extendedUser || !companyId || !authorized) {
      return { success: false, error: 'No autorizado' }
    }

    const supabase = await createAdminClient()

    // Intentar borrar en bonos
    const { data: bData, error: bError } = await applyIsolation(
      supabase.from('bonuses').delete().eq('id', id).select('id'),
      companyId,
      extendedUser.role_id
    )

    // Si no se borró nada o hubo error, intentar en pasajes
    if (bError || !bData || bData.length === 0) {
      const { data: tData, error: tError } = await applyIsolation(
        supabase.from('transport_payments').delete().eq('id', id).select('id'),
        companyId,
        extendedUser.role_id
      )
      
      // Si tampoco en pasajes, intentar en pagos
      if (tError || !tData || tData.length === 0) {
        const { error: pError } = await applyIsolation(
          supabase.from('worker_payments').delete().eq('id', id),
          companyId,
          extendedUser.role_id
        )
        if (pError) throw pError
      }
    }

    revalidatePath('/bonuses')
    revalidatePath('/reports')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Error deleteBonus:', err)
    return { success: false, error: err.message }
  }
}

export async function updateBonus(
  id: string, 
  currentType: 'bono' | 'pasaje' | 'pago', 
  formData: {
    type: 'bono' | 'pasaje' | 'pago'
    worker_id: string
    bonus_type: string
    amount: number
    date: string
    status: 'paid' | 'pending'
    payment_type?: 'salary' | 'advance' | 'liquidation' | 'extra'
    period?: string
    payment_method?: string
    observations?: string
    document_url?: string
  }
) {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    const role = (extendedUser?.role_id || '').toLowerCase()
    const authorized = ['admin', 'gerente', 'administracion', 'super_admin', 'superadmin'].includes(role)

    if (!companyId || !UUID_REGEX.test(companyId) || !authorized) {
      return { success: false, error: 'No autorizado o sesión inválida' }
    }

    const workerId = formData.worker_id?.trim()
    if (!workerId || !UUID_REGEX.test(workerId)) {
      return { success: false, error: 'Trabajador inválido' }
    }

    const supabase = await createAdminClient()
    const newType = formData.type

    const getOldTable = (t: string) => t === 'bono' ? 'bonuses' : t === 'pasaje' ? 'transport_payments' : 'worker_payments'

    if (currentType !== newType) {
      // Borrar del origen
      const oldTable = getOldTable(currentType)
      await applyIsolation(supabase.from(oldTable).delete(), companyId, extendedUser.role_id).eq('id', id)

      // Insertar en el destino
      if (newType === 'pago') {
        const insertData = {
          company_id: companyId,
          worker_id: workerId,
          date: formData.date,
          period: formData.period || 'mensual',
          payment_type: formData.payment_type || 'salary',
          amount: formData.amount,
          payment_method: formData.payment_method || 'efectivo',
          observations: formData.observations || '',
          document_url: formData.document_url || null,
          status: formData.status
        }
        const { error } = await supabase.from('worker_payments').insert([insertData])
        if (error) throw error
      } else {
        const insertData: any = {
          worker_id: workerId,
          amount: formData.amount,
          date: formData.date,
          status: formData.status,
          company_id: companyId
        }
        if (newType === 'bono') {
          insertData.bonus_type = formData.bonus_type
        }
        const { error } = await supabase.from(newType === 'pasaje' ? 'transport_payments' : 'bonuses').insert([insertData])
        if (error) throw error
      }
    } else {
      // Actualizar en el mismo destino
      if (newType === 'pago') {
        const updateData: any = {
          worker_id: workerId,
          date: formData.date,
          period: formData.period || 'mensual',
          payment_type: formData.payment_type || 'salary',
          amount: formData.amount,
          payment_method: formData.payment_method || 'efectivo',
          observations: formData.observations || '',
          status: formData.status
        }
        if (formData.document_url !== undefined) {
          updateData.document_url = formData.document_url
        }

        const { error } = await applyIsolation(
          supabase.from('worker_payments').update(updateData),
          companyId,
          extendedUser.role_id
        ).eq('id', id)

        if (error) throw error
      } else {
        const targetTable = getOldTable(newType)
        const updateData: any = {
          worker_id: workerId,
          amount: formData.amount,
          date: formData.date,
          status: formData.status
        }
        if (newType === 'bono') {
          updateData.bonus_type = formData.bonus_type
        }

        const { error } = await applyIsolation(
          supabase.from(targetTable).update(updateData),
          companyId,
          extendedUser.role_id
        ).eq('id', id)

        if (error) throw error
      }
    }

    revalidatePath(`/workers/${workerId}`)
    revalidatePath('/bonuses')
    revalidatePath('/reports')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (err: any) {
    console.error('Error in updateBonus:', err)
    return { success: false, error: err.message }
  }
}
