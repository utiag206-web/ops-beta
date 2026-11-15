/**
 * Servicio de Dominio: Tareo Operativo y Asistencia — INTHALY
 * Encapsula consultas de partes diarios, marcas de asistencia y configuración mensual.
 */

import { applyIsolation } from '@/lib/auth'
import type { ActionResponse } from '@/types/common.types'

export interface TareoQueryParams {
  startDate: string
  endDate: string
  companyId: string
  roleId: string
}

export interface TareoRecordData {
  worker_id: string
  date: string
  status: string
  is_manual?: boolean
}

/**
 * Consulta registros de tareo para un rango de fechas.
 */
export async function getTareoRecords(
  supabase: any,
  params: TareoQueryParams
): Promise<TareoRecordData[]> {
  const { startDate, endDate, companyId, roleId } = params

  const { data, error } = await applyIsolation(
    supabase.from('tareo_records').select('worker_id, date, status, is_manual'),
    companyId,
    roleId
  )
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) {
    console.error('[TareoService] Error fetching tareo records:', error.message)
    return []
  }

  return data || []
}

/**
 * Inserta, actualiza o elimina (si status es nulo) un registro diario de tareo.
 */
export async function upsertTareoRecord(
  supabase: any,
  payload: {
    worker_id: string
    date: string
    status: string | null
    companyId: string
    roleId: string
  }
): Promise<ActionResponse<boolean>> {
  const { worker_id, date, status, companyId, roleId } = payload

  try {
    if (!status) {
      const { error } = await applyIsolation(
        supabase.from('tareo_records').delete(),
        companyId,
        roleId
      ).match({
        worker_id,
        date
      })

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('tareo_records')
        .upsert({
          worker_id,
          company_id: companyId,
          date,
          status,
          is_manual: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'worker_id,date,company_id'
        })

      if (error) throw error
    }

    return { success: true, data: true }
  } catch (error: any) {
    console.error('[TareoService] Error upserting tareo record:', error?.message)
    return { success: false, error: error?.message || 'Error guardando tareo' }
  }
}

/**
 * Obtiene la configuración de horas diarias del mes.
 */
export async function getTareoConfig(
  supabase: any,
  month: string,
  companyId: string,
  roleId: string
): Promise<{ daily_hours: number } | null> {
  const { data, error } = await applyIsolation(
    supabase.from('tareo_config').select('daily_hours'),
    companyId,
    roleId
  )
    .eq('month', month)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('[TareoService] Error fetching config:', error.message)
  }

  return data
}

/**
 * Obtiene notas mensuales asociadas a los trabajadores.
 */
export async function getTareoNotes(
  supabase: any,
  month: string,
  companyId: string,
  roleId: string
): Promise<{ worker_id: string; note: string }[]> {
  const { data, error } = await applyIsolation(
    supabase.from('tareo_monthly_notes').select('worker_id, note'),
    companyId,
    roleId
  ).eq('month', month)

  if (error) {
    console.error('[TareoService] Error fetching notes:', error.message)
    return []
  }

  return data || []
}

/**
 * Obtiene marcas de asistencia registradas en el rango.
 */
export async function getAttendancePunches(
  supabase: any,
  startDate: string,
  endDate: string,
  companyId: string,
  roleId: string
): Promise<any[]> {
  const { data, error } = await applyIsolation(
    supabase.from('attendance_punches').select('*'),
    companyId,
    roleId
  )
    .gte('punch_time', `${startDate}T00:00:00`)
    .lte('punch_time', `${endDate}T23:59:59`)
    .order('punch_time', { ascending: true })

  if (error) {
    console.error('[TareoService] Error fetching attendance punches:', error.message)
    return []
  }

  return data || []
}
