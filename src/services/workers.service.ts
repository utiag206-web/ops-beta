/**
 * Servicio de Dominio: Personal y Nómina (Workers Service) — INTHALY
 * Encapsula el acceso a datos y operaciones de negocio para trabajadores.
 */

import { applyIsolation } from '@/lib/auth'
import type { Worker, WorkerDocument, WorkerChild } from '@/types/workers.types'
import type { ActionResponse } from '@/types/common.types'

export interface GetWorkersOptions {
  companyId: string
  roleId: string
  status?: string
  isRecent?: boolean
}

export interface WorkerDetailResult extends Worker {
  financial: Record<string, unknown>
  personal: Record<string, unknown>
}

/**
 * Obtiene la lista de trabajadores aplicando aislamiento por empresa.
 */
export async function getWorkersList(
  supabase: any,
  options: GetWorkersOptions
): Promise<Worker[]> {
  const { companyId, roleId, status, isRecent } = options

  let query = supabase
    .from('workers')
    .select('id, name, last_name, dni, position, status, phone, hire_date, photo_url, created_at, company_id, worker_financial(daily_rate, monthly_salary)')

  query = applyIsolation(query, companyId, roleId)

  if (status) {
    query = query.eq('status', status)
  }

  if (isRecent) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    query = query.gte('created_at', thirtyDaysAgo.toISOString())
  }

  const { data: workers, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('[WorkersService] Error fetching workers:', error)
    return []
  }

  return (workers || []).map((w: any): Worker => {
    const fin = Array.isArray(w.worker_financial) ? w.worker_financial[0] : w.worker_financial
    return {
      ...w,
      daily_rate: fin?.daily_rate || 0,
      monthly_salary: fin?.monthly_salary || 0
    }
  })
}

/**
 * Obtiene el detalle completo de un trabajador por ID con datos financieros y personales.
 */
export async function getWorkerById(
  supabase: any,
  id: string,
  companyId: string,
  roleId: string
): Promise<WorkerDetailResult | null> {
  const query = applyIsolation(
    supabase.from('workers').select('*, worker_financial(*), worker_personal(*)'),
    companyId,
    roleId
  )
    .eq('id', id)
    .single()

  const { data, error } = await query

  if (error || !data) {
    if (error) console.error('[WorkersService] Error fetching worker by id:', error)
    return null
  }

  const fin = Array.isArray(data.worker_financial) ? data.worker_financial[0] : data.worker_financial
  const pers = Array.isArray(data.worker_personal) ? data.worker_personal[0] : data.worker_personal

  return {
    ...data,
    financial: fin || {},
    personal: pers || {}
  }
}

/**
 * Obtiene los documentos asociados a un trabajador.
 */
export async function getWorkerDocuments(
  supabase: any,
  workerId: string,
  companyId: string,
  roleId: string
): Promise<WorkerDocument[]> {
  const query = applyIsolation(
    supabase.from('worker_documents').select('*'),
    companyId,
    roleId
  )
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('[WorkersService] Error fetching worker documents:', error)
    return []
  }

  return data || []
}

/**
 * Obtiene la lista de hijos/cargas de un trabajador.
 */
export async function getWorkerChildren(
  supabase: any,
  workerId: string,
  companyId: string,
  roleId: string
): Promise<WorkerChild[]> {
  const query = applyIsolation(
    supabase.from('worker_children').select('*'),
    companyId,
    roleId
  )
    .eq('worker_id', workerId)
    .order('created_at', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('[WorkersService] Error fetching worker children:', error)
    return []
  }

  return data || []
}

/**
 * Desactiva un trabajador (cambia estado a inactivo).
 */
export async function setWorkerStatus(
  supabase: any,
  id: string,
  status: 'active' | 'inactive',
  companyId: string,
  roleId: string
): Promise<ActionResponse<boolean>> {
  const query = applyIsolation(
    supabase.from('workers').update({ status }),
    companyId,
    roleId
  ).eq('id', id)

  const { error } = await query

  if (error) {
    console.error(`[WorkersService] Error setting worker status to ${status}:`, error)
    return { success: false, error: error.message }
  }

  return { success: true, data: true }
}
