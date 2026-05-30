'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getWorkCycles() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()
  
  let query = applyIsolation(
    supabase.from('work_cycles').select(`id, worker_id, work_days, rest_days, cycle_start_date, worker:workers(name)`),
    companyId,
    extendedUser.role_id
  )

  if (extendedUser.role_id === 'trabajador') {
    query = query.eq('worker_id', extendedUser.worker_id)
  }

  const { data, error } = await query
  
  if (error) {
    console.error('[TAREO] Error fetching work cycles:', error.message)
    return []
  }

  return data || []
}

export async function assignWorkCycle(payload: {
  worker_id: string
  work_days: number
  rest_days: number
  cycle_start_date: string
}) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser || ['trabajador', 'worker'].includes(extendedUser.role_id?.toLowerCase())) {
      return { success: false, error: 'No autorizado' }
    }

    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('work_cycles')
      .insert({
        ...payload,
        company_id: companyId || (payload as any).company_id
      })
      .select()

    if (error) {
      console.error('[TAREO] Insert error:', error.message)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/tareo')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deleteWorkCycle(id: string) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser || ['trabajador', 'worker'].includes(extendedUser.role_id?.toLowerCase())) {
      return { success: false, error: 'No autorizado' }
    }

    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()
    const { error } = await applyIsolation(
      supabase.from('work_cycles').delete(),
      companyId,
      extendedUser.role_id
    ).eq('id', id)

    if (error) {
      console.error('[TAREO] Delete error:', error.message)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/tareo')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getTareoRecords(startDate: string, endDate: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()
  const { data, error } = await applyIsolation(
    supabase.from('tareo_records').select('worker_id, date, status'),
    companyId,
    extendedUser.role_id
  )
    .gte('date', startDate)
    .lte('date', endDate)
  
  if (error) {
    console.error('[TAREO] Error fetching records:', error.message)
    return []
  }
  return data || []
}

export async function upsertTareoRecord(payload: {
  worker_id: string
  date: string
  status: string | null
}) {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    if (!extendedUser || ['trabajador', 'worker'].includes(extendedUser.role_id?.toLowerCase())) {
       return { success: false, error: 'No autorizado' }
    }
    const supabase = await createAdminClient()

    if (!payload.status) {
      const { error } = await applyIsolation(
        supabase.from('tareo_records').delete(),
        companyId,
        extendedUser.role_id
      ).match({
          worker_id: payload.worker_id,
          date: payload.date
        })
      
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('tareo_records')
        .upsert({
          worker_id: payload.worker_id,
          company_id: companyId || (payload as any).company_id,
          date: payload.date,
          status: payload.status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'worker_id,date,company_id'
        })

      if (error) throw error
    }

    return { success: true }
  } catch (e: any) {
    console.error('[TAREO] Upsert error:', e.message)
    return { success: false, error: e.message }
  }
}

export async function getTareoConfig(month: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()
  const { data, error } = await applyIsolation(
    supabase.from('tareo_config').select('daily_hours'),
    companyId,
    extendedUser.role_id
  ).eq('month', month)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('[TAREO] Error fetching config:', error.message)
  }
  return data
}

export async function upsertTareoConfig(month: string, daily_hours: number) {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    if (!extendedUser || ['trabajador', 'worker'].includes(extendedUser.role_id?.toLowerCase())) {
       return { success: false, error: 'No autorizado' }
    }
    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('tareo_config')
      .upsert({
        company_id: companyId || (month as any).company_id, // month is string, just an example
        month,
        daily_hours,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id,month'
      })

    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getTareoNotes(month: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()
  const { data, error } = await applyIsolation(
    supabase.from('tareo_monthly_notes').select('worker_id, note'),
    companyId,
    extendedUser.role_id
  )
    .eq('month', month)

  if (error) {
    console.error('[TAREO] Error fetching notes:', error.message)
    return []
  }
  return data || []
}

export async function upsertTareoNote(worker_id: string, month: string, note: string) {
  try {
  const { extendedUser } = await getUserSession()
  if (!extendedUser || ['trabajador', 'worker'].includes(extendedUser.role_id?.toLowerCase())) {
     return { success: false, error: 'No autorizado' }
  }
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  if (!note || note.trim() === '') {
     const { error } = await applyIsolation(
      supabase.from('tareo_monthly_notes').delete(),
      companyId,
      extendedUser.role_id
    ).match({
          worker_id,
          month
        })
       if (error) throw error
    } else {
       const { error } = await supabase
        .from('tareo_monthly_notes')
        .upsert({
          company_id: companyId || (worker_id as any).company_id,
          worker_id,
          month,
          note,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'worker_id,month,company_id'
        })
       if (error) throw error
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getAttendancePunches(startDate: string, endDate: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()
  const { data, error } = await applyIsolation(
    supabase.from('attendance_logs').select('id, worker_id, date_local, type, timestamp'),
    companyId,
    extendedUser.role_id
  )
    .gte('date_local', startDate)
    .lte('date_local', endDate)
    .order('timestamp', { ascending: true })

  if (error) {
    console.error('[TAREO] Punches fetch error:', error.message)
    return []
  }
  return data || []
}

export async function syncAttendancePunches(payload: {
  worker_id: string
  date_local: string
  punches: { time: string, type: 'in' | 'out' }[]
}) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser || ['trabajador', 'worker'].includes(extendedUser.role_id?.toLowerCase())) {
       return { success: false, error: 'No autorizado' }
    }
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error: delError } = await applyIsolation(
      supabase.from('attendance_logs').delete(),
      companyId,
      extendedUser.role_id
    ).match({
        worker_id: payload.worker_id,
        date_local: payload.date_local
      })
    
    if (delError) throw delError

    if (payload.punches.length > 0) {
      const rows = payload.punches.map(p => {
        let tStr = p.time.length === 5 ? p.time + ":00" : p.time
        const timestamp = `${payload.date_local}T${tStr}-05:00`
        
        return {
          company_id: companyId || (payload as any).company_id,
          worker_id: payload.worker_id,
          date_local: payload.date_local,
          type: p.type,
          timestamp: timestamp
        }
      })

      const { error: insError } = await supabase
        .from('attendance_logs')
        .insert(rows)

      if (insError) throw insError
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getTareoDashboardData(month: string, startDate: string, endDate: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  const [records, notes, config, punches] = await Promise.all([
    applyIsolation(supabase.from('tareo_records').select('worker_id, date, status'), companyId, extendedUser.role_id)
      .gte('date', startDate)
      .lte('date', endDate),
    applyIsolation(supabase.from('tareo_monthly_notes').select('worker_id, note'), companyId, extendedUser.role_id)
      .eq('month', month),
    applyIsolation(supabase.from('tareo_config').select('daily_hours'), companyId, extendedUser.role_id)
      .eq('month', month)
      .maybeSingle(),
    applyIsolation(supabase.from('attendance_logs').select('id, worker_id, date_local, type, timestamp'), companyId, extendedUser.role_id)
      .gte('date_local', startDate)
      .lte('date_local', endDate)
      .order('timestamp', { ascending: true })
  ])

  return {
    records: records.data || [],
    notes: notes.data || [],
    dailyHours: config.data?.daily_hours || 10.25,
    punches: punches.data || []
  }
}

