'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { requireAction } from '@/lib/rbac/server-guards'
import { revalidatePath } from 'next/cache'

export interface MaintenanceRecord {
  id: string
  company_id?: string
  equipment_asset_id?: string | null
  equipment_name: string
  equipment_code: string
  equipment_type: string
  maintenance_type: 'preventivo' | 'correctivo' | 'predictivo'
  description: string
  technician: string
  technician_worker_id?: string | null
  date: string
  hours_or_km: number
  status: 'completado' | 'en_progreso' | 'programado' | 'anulado' | 'archivado'
  cost?: number
  next_service?: string | null
  observations?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface FuelRecord {
  id: string
  company_id?: string
  equipment_asset_id?: string | null
  equipment_name: string
  equipment_code: string
  equipment_type: string
  date: string
  gallons: number
  initial_hours: number
  final_hours: number
  hours_operated: number
  ratio: number
  operator: string
  operator_worker_id?: string | null
  turn: 'dia' | 'noche'
  status?: 'activo' | 'anulado' | 'archivado'
  observation?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface ChecklistRecord {
  id: string
  company_id?: string
  equipment_asset_id?: string | null
  equipment_name: string
  equipment_code: string
  equipment_type: string
  inspector: string
  inspector_worker_id?: string | null
  date: string
  turn: 'dia' | 'noche'
  status: 'aprobado' | 'observado' | 'rechazado' | 'anulado'
  checks: { name: string; status: 'ok' | 'fail' | 'na'; comment?: string }[]
  observations?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface ToolRecord {
  id: string
  company_id?: string
  code: string
  name: string
  category: string
  brand?: string | null
  condition: 'operativo' | 'en_reparacion' | 'de_baja'
  assigned_to?: string | null
  assigned_worker_id?: string | null
  location: string
  last_inspection_date?: string | null
  status?: 'activo' | 'anulado' | 'archivado' | 'baja'
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

// In-memory / localStorage bridge for seamless immediate operation while integrating schema
export async function getMecanicaOverview() {
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  // Pull existing assets to correlate with mechanics
  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('company_id', companyId)

  return {
    totalAssets: assets?.length || 0,
    activeVehicles: assets?.filter(a => a.type?.toLowerCase().includes('vehiculo') || a.type?.toLowerCase().includes('camioneta')).length || 0,
    activeGenerators: assets?.filter(a => a.name?.toLowerCase().includes('generador') || a.name?.toLowerCase().includes('grupo')).length || 0,
    activeCompressors: assets?.filter(a => a.name?.toLowerCase().includes('compresor') || a.name?.toLowerCase().includes('compresora')).length || 0,
    assets: assets || []
  }
}

// ================================================================
// MANTENIMIENTO: SERVER ACTIONS (Persistencia Real + RBAC + RLS)
// ================================================================

export async function getMaintenanceRecords(equipmentType?: string) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser) return { success: false, error: 'Sesión no iniciada.' }

    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    let query = applyIsolation(
      supabase.from('mechanics_maintenance').select('*'),
      companyId,
      extendedUser.role_id
    )

    if (equipmentType) {
      if (equipmentType === 'vehiculo') {
        query = query.in('equipment_type', ['vehiculo', 'vehiculo_liviano', 'vehiculo_pesado'])
      } else {
        query = query.eq('equipment_type', equipmentType)
      }
    }

    const { data, error } = await query.order('date', { ascending: false }).order('created_at', { ascending: false })

    if (error) {
      console.error('[MECANICA_ERROR] getMaintenanceRecords:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: (data || []) as MaintenanceRecord[] }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] getMaintenanceRecords exception:', error)
    return { success: false, error: error.message || 'Error inesperado al obtener mantenimientos.', data: [] }
  }
}

export async function createMaintenanceRecord(payload: {
  equipment_asset_id?: string | null
  equipment_name: string
  equipment_code: string
  equipment_type?: string
  maintenance_type?: 'preventivo' | 'correctivo' | 'predictivo'
  description: string
  technician: string
  technician_worker_id?: string | null
  date?: string
  hours_or_km?: number
  status?: 'programado' | 'en_progreso' | 'completado' | 'anulado' | 'archivado'
  cost?: number
  next_service?: string | null
  observations?: string | null
}) {
  try {
    const user = await requireAction('mecanica', 'create')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    if (!payload.equipment_name || !payload.equipment_code || !payload.description || !payload.technician) {
      return { success: false, error: 'Faltan campos obligatorios para el mantenimiento.' }
    }

    const hoursOrKm = Math.max(0, Number(payload.hours_or_km) || 0)
    const cost = Math.max(0, Number(payload.cost) || 0)

    const insertPayload = {
      company_id: companyId,
      equipment_asset_id: payload.equipment_asset_id || null,
      equipment_name: payload.equipment_name.trim(),
      equipment_code: payload.equipment_code.trim().toUpperCase(),
      equipment_type: payload.equipment_type || 'vehiculo',
      maintenance_type: payload.maintenance_type || 'preventivo',
      description: payload.description.trim(),
      technician: payload.technician.trim(),
      technician_worker_id: payload.technician_worker_id || null,
      date: payload.date || new Date().toISOString().split('T')[0],
      hours_or_km: hoursOrKm,
      status: payload.status || 'completado',
      cost: cost,
      next_service: payload.next_service || null,
      observations: payload.observations?.trim() || null,
      created_by: user.id
    }

    const { data, error } = await supabase
      .from('mechanics_maintenance')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      console.error('[MECANICA_ERROR] createMaintenanceRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/mantenimiento-vehiculos')
    revalidatePath('/mecanica/generador-mantenimiento')
    revalidatePath('/mecanica/compresora-mantenimiento')
    revalidatePath('/mecanica/equipos-mina')
    revalidatePath('/mecanica')

    return { success: true, data: data as MaintenanceRecord }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] createMaintenanceRecord exception:', error)
    return { success: false, error: error.message || 'Error al crear mantenimiento.' }
  }
}

export async function updateMaintenanceRecord(
  id: string,
  payload: Partial<Omit<MaintenanceRecord, 'id' | 'company_id' | 'created_at' | 'created_by'>>
) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (payload.equipment_name !== undefined) updateData.equipment_name = payload.equipment_name.trim()
    if (payload.equipment_code !== undefined) updateData.equipment_code = payload.equipment_code.trim().toUpperCase()
    if (payload.equipment_type !== undefined) updateData.equipment_type = payload.equipment_type
    if (payload.maintenance_type !== undefined) updateData.maintenance_type = payload.maintenance_type
    if (payload.description !== undefined) updateData.description = payload.description.trim()
    if (payload.technician !== undefined) updateData.technician = payload.technician.trim()
    if (payload.technician_worker_id !== undefined) updateData.technician_worker_id = payload.technician_worker_id || null
    if (payload.date !== undefined) updateData.date = payload.date
    if (payload.hours_or_km !== undefined) updateData.hours_or_km = Math.max(0, Number(payload.hours_or_km) || 0)
    if (payload.status !== undefined) updateData.status = payload.status
    if (payload.cost !== undefined) updateData.cost = Math.max(0, Number(payload.cost) || 0)
    if (payload.next_service !== undefined) updateData.next_service = payload.next_service || null
    if (payload.observations !== undefined) updateData.observations = payload.observations?.trim() || null
    if (payload.equipment_asset_id !== undefined) updateData.equipment_asset_id = payload.equipment_asset_id || null

    const { data, error } = await supabase
      .from('mechanics_maintenance')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) {
      console.error('[MECANICA_ERROR] updateMaintenanceRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/mantenimiento-vehiculos')
    revalidatePath('/mecanica/generador-mantenimiento')
    revalidatePath('/mecanica/compresora-mantenimiento')
    revalidatePath('/mecanica/equipos-mina')
    revalidatePath('/mecanica')

    return { success: true, data: data as MaintenanceRecord }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] updateMaintenanceRecord exception:', error)
    return { success: false, error: error.message || 'Error al actualizar mantenimiento.' }
  }
}

export async function anularMaintenanceRecord(id: string) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_maintenance')
      .update({
        status: 'anulado',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] anularMaintenanceRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/mantenimiento-vehiculos')
    revalidatePath('/mecanica/generador-mantenimiento')
    revalidatePath('/mecanica/compresora-mantenimiento')
    revalidatePath('/mecanica/equipos-mina')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] anularMaintenanceRecord exception:', error)
    return { success: false, error: error.message || 'Error al anular mantenimiento.' }
  }
}

export async function reactivarMaintenanceRecord(id: string) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_maintenance')
      .update({
        status: 'completado',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] reactivarMaintenanceRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/mantenimiento-vehiculos')
    revalidatePath('/mecanica/generador-mantenimiento')
    revalidatePath('/mecanica/compresora-mantenimiento')
    revalidatePath('/mecanica/equipos-mina')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] reactivarMaintenanceRecord exception:', error)
    return { success: false, error: error.message || 'Error al reactivar mantenimiento.' }
  }
}

export async function deleteMaintenanceRecord(id: string) {
  try {
    await requireAction('mecanica', 'delete')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_maintenance')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] deleteMaintenanceRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/mantenimiento-vehiculos')
    revalidatePath('/mecanica/generador-mantenimiento')
    revalidatePath('/mecanica/compresora-mantenimiento')
    revalidatePath('/mecanica/equipos-mina')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] deleteMaintenanceRecord exception:', error)
    return { success: false, error: error.message || 'Error al eliminar mantenimiento.' }
  }
}

// ================================================================
// COMBUSTIBLE: SERVER ACTIONS (mechanics_fuel)
// ================================================================

export async function getFuelRecords(equipmentType?: string) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser) return { success: false, error: 'Sesión no iniciada.', data: [] }

    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    let query = applyIsolation(
      supabase.from('mechanics_fuel').select('*'),
      companyId,
      extendedUser.role_id
    )

    if (equipmentType) {
      query = query.eq('equipment_type', equipmentType)
    }

    const { data, error } = await query.order('date', { ascending: false }).order('created_at', { ascending: false })

    if (error) {
      console.error('[MECANICA_ERROR] getFuelRecords:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: (data || []) as FuelRecord[] }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] getFuelRecords exception:', error)
    return { success: false, error: error.message || 'Error al obtener registros de combustible.', data: [] }
  }
}

export async function createFuelRecord(payload: {
  equipment_asset_id?: string | null
  equipment_name: string
  equipment_code: string
  equipment_type: string
  date?: string
  gallons: number
  initial_hours?: number
  final_hours?: number
  operator: string
  operator_worker_id?: string | null
  turn?: 'dia' | 'noche'
  observation?: string | null
}) {
  try {
    const user = await requireAction('mecanica', 'create')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    if (!payload.equipment_name || !payload.equipment_code || !payload.operator) {
      return { success: false, error: 'Faltan campos obligatorios para el registro de combustible.' }
    }

    const gallons = Math.max(0, Number(payload.gallons) || 0)
    const initialHours = Math.max(0, Number(payload.initial_hours) || 0)
    const finalHours = Math.max(0, Number(payload.final_hours) || 0)
    const hoursOperated = finalHours >= initialHours ? Number((finalHours - initialHours).toFixed(2)) : 0
    const ratio = hoursOperated > 0 ? Number((gallons / hoursOperated).toFixed(2)) : 0

    const insertPayload = {
      company_id: companyId,
      equipment_asset_id: payload.equipment_asset_id || null,
      equipment_name: payload.equipment_name.trim(),
      equipment_code: payload.equipment_code.trim().toUpperCase(),
      equipment_type: payload.equipment_type || 'generador',
      date: payload.date || new Date().toISOString().split('T')[0],
      gallons,
      initial_hours: initialHours,
      final_hours: finalHours,
      hours_operated: hoursOperated,
      ratio,
      operator: payload.operator.trim(),
      operator_worker_id: payload.operator_worker_id || null,
      turn: payload.turn || 'dia',
      status: 'activo',
      observation: payload.observation?.trim() || null,
      created_by: user.id
    }

    const { data, error } = await supabase
      .from('mechanics_fuel')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      console.error('[MECANICA_ERROR] createFuelRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/generador-combustible')
    revalidatePath('/mecanica/compresora-combustible')
    revalidatePath('/mecanica')

    return { success: true, data: data as FuelRecord }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] createFuelRecord exception:', error)
    return { success: false, error: error.message || 'Error al registrar combustible.' }
  }
}

export async function updateFuelRecord(
  id: string,
  payload: Partial<Omit<FuelRecord, 'id' | 'company_id' | 'created_at' | 'created_by'>>
) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (payload.equipment_name !== undefined) updateData.equipment_name = payload.equipment_name.trim()
    if (payload.equipment_code !== undefined) updateData.equipment_code = payload.equipment_code.trim().toUpperCase()
    if (payload.equipment_type !== undefined) updateData.equipment_type = payload.equipment_type
    if (payload.date !== undefined) updateData.date = payload.date
    if (payload.operator !== undefined) updateData.operator = payload.operator.trim()
    if (payload.operator_worker_id !== undefined) updateData.operator_worker_id = payload.operator_worker_id || null
    if (payload.turn !== undefined) updateData.turn = payload.turn
    if (payload.status !== undefined) updateData.status = payload.status
    if (payload.observation !== undefined) updateData.observation = payload.observation?.trim() || null

    if (payload.gallons !== undefined || payload.initial_hours !== undefined || payload.final_hours !== undefined) {
      const { data: existing } = await supabase
        .from('mechanics_fuel')
        .select('gallons, initial_hours, final_hours')
        .eq('id', id)
        .eq('company_id', companyId)
        .single()

      const gallons = payload.gallons !== undefined ? Math.max(0, Number(payload.gallons) || 0) : existing?.gallons || 0
      const initialHours = payload.initial_hours !== undefined ? Math.max(0, Number(payload.initial_hours) || 0) : existing?.initial_hours || 0
      const finalHours = payload.final_hours !== undefined ? Math.max(0, Number(payload.final_hours) || 0) : existing?.final_hours || 0
      const hoursOperated = finalHours >= initialHours ? Number((finalHours - initialHours).toFixed(2)) : 0
      const ratio = hoursOperated > 0 ? Number((gallons / hoursOperated).toFixed(2)) : 0

      updateData.gallons = gallons
      updateData.initial_hours = initialHours
      updateData.final_hours = finalHours
      updateData.hours_operated = hoursOperated
      updateData.ratio = ratio
    }

    const { data, error } = await supabase
      .from('mechanics_fuel')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) {
      console.error('[MECANICA_ERROR] updateFuelRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/generador-combustible')
    revalidatePath('/mecanica/compresora-combustible')
    revalidatePath('/mecanica')

    return { success: true, data: data as FuelRecord }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] updateFuelRecord exception:', error)
    return { success: false, error: error.message || 'Error al actualizar combustible.' }
  }
}

export async function anularFuelRecord(id: string) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_fuel')
      .update({ status: 'anulado', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] anularFuelRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/generador-combustible')
    revalidatePath('/mecanica/compresora-combustible')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] anularFuelRecord exception:', error)
    return { success: false, error: error.message || 'Error al anular combustible.' }
  }
}

export async function reactivarFuelRecord(id: string) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_fuel')
      .update({ status: 'activo', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] reactivarFuelRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/generador-combustible')
    revalidatePath('/mecanica/compresora-combustible')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] reactivarFuelRecord exception:', error)
    return { success: false, error: error.message || 'Error al reactivar combustible.' }
  }
}

export async function deleteFuelRecord(id: string) {
  try {
    await requireAction('mecanica', 'delete')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_fuel')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] deleteFuelRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/generador-combustible')
    revalidatePath('/mecanica/compresora-combustible')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] deleteFuelRecord exception:', error)
    return { success: false, error: error.message || 'Error al eliminar combustible.' }
  }
}

// ================================================================
// CHECKLISTS: SERVER ACTIONS (mechanics_checklists)
// ================================================================

export async function getChecklistRecords(equipmentType?: string) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser) return { success: false, error: 'Sesión no iniciada.', data: [] }

    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    let query = applyIsolation(
      supabase.from('mechanics_checklists').select('*'),
      companyId,
      extendedUser.role_id
    )

    if (equipmentType) {
      query = query.eq('equipment_type', equipmentType)
    }

    const { data, error } = await query.order('date', { ascending: false }).order('created_at', { ascending: false })

    if (error) {
      console.error('[MECANICA_ERROR] getChecklistRecords:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: (data || []) as ChecklistRecord[] }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] getChecklistRecords exception:', error)
    return { success: false, error: error.message || 'Error al obtener checklists.', data: [] }
  }
}

export async function createChecklistRecord(payload: {
  equipment_asset_id?: string | null
  equipment_name: string
  equipment_code: string
  equipment_type?: string
  inspector: string
  inspector_worker_id?: string | null
  date?: string
  turn?: 'dia' | 'noche'
  status?: 'aprobado' | 'observado' | 'rechazado' | 'anulado'
  checks: { name: string; status: 'ok' | 'fail' | 'na'; comment?: string }[]
  observations?: string | null
}) {
  try {
    const user = await requireAction('mecanica', 'create')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    if (!payload.equipment_name || !payload.equipment_code || !payload.inspector) {
      return { success: false, error: 'Faltan campos obligatorios para el checklist.' }
    }

    const insertPayload = {
      company_id: companyId,
      equipment_asset_id: payload.equipment_asset_id || null,
      equipment_name: payload.equipment_name.trim(),
      equipment_code: payload.equipment_code.trim().toUpperCase(),
      equipment_type: payload.equipment_type || 'vehiculo',
      inspector: payload.inspector.trim(),
      inspector_worker_id: payload.inspector_worker_id || null,
      date: payload.date || new Date().toISOString().split('T')[0],
      turn: payload.turn || 'dia',
      status: payload.status || 'aprobado',
      checks: payload.checks || [],
      observations: payload.observations?.trim() || null,
      created_by: user.id
    }

    const { data, error } = await supabase
      .from('mechanics_checklists')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      console.error('[MECANICA_ERROR] createChecklistRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/checklists')
    revalidatePath('/mecanica')

    return { success: true, data: data as ChecklistRecord }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] createChecklistRecord exception:', error)
    return { success: false, error: error.message || 'Error al registrar checklist.' }
  }
}

export async function updateChecklistRecord(
  id: string,
  payload: Partial<Omit<ChecklistRecord, 'id' | 'company_id' | 'created_at' | 'created_by'>>
) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (payload.equipment_name !== undefined) updateData.equipment_name = payload.equipment_name.trim()
    if (payload.equipment_code !== undefined) updateData.equipment_code = payload.equipment_code.trim().toUpperCase()
    if (payload.equipment_type !== undefined) updateData.equipment_type = payload.equipment_type
    if (payload.inspector !== undefined) updateData.inspector = payload.inspector.trim()
    if (payload.inspector_worker_id !== undefined) updateData.inspector_worker_id = payload.inspector_worker_id || null
    if (payload.date !== undefined) updateData.date = payload.date
    if (payload.turn !== undefined) updateData.turn = payload.turn
    if (payload.status !== undefined) updateData.status = payload.status
    if (payload.checks !== undefined) updateData.checks = payload.checks
    if (payload.observations !== undefined) updateData.observations = payload.observations?.trim() || null

    const { data, error } = await supabase
      .from('mechanics_checklists')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) {
      console.error('[MECANICA_ERROR] updateChecklistRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/checklists')
    revalidatePath('/mecanica')

    return { success: true, data: data as ChecklistRecord }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] updateChecklistRecord exception:', error)
    return { success: false, error: error.message || 'Error al actualizar checklist.' }
  }
}

export async function anularChecklistRecord(id: string) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_checklists')
      .update({ status: 'anulado', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] anularChecklistRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/checklists')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] anularChecklistRecord exception:', error)
    return { success: false, error: error.message || 'Error al anular checklist.' }
  }
}

export async function reactivarChecklistRecord(id: string) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_checklists')
      .update({ status: 'aprobado', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] reactivarChecklistRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/checklists')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] reactivarChecklistRecord exception:', error)
    return { success: false, error: error.message || 'Error al reactivar checklist.' }
  }
}

export async function deleteChecklistRecord(id: string) {
  try {
    await requireAction('mecanica', 'delete')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_checklists')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] deleteChecklistRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/checklists')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] deleteChecklistRecord exception:', error)
    return { success: false, error: error.message || 'Error al eliminar checklist.' }
  }
}

// ================================================================
// HERRAMIENTAS: SERVER ACTIONS (mechanics_tools)
// ================================================================

export async function getToolRecords() {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser) return { success: false, error: 'Sesión no iniciada.', data: [] }

    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const query = applyIsolation(
      supabase.from('mechanics_tools').select('*'),
      companyId,
      extendedUser.role_id
    )

    const { data, error } = await query.order('name', { ascending: true })

    if (error) {
      console.error('[MECANICA_ERROR] getToolRecords:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: (data || []) as ToolRecord[] }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] getToolRecords exception:', error)
    return { success: false, error: error.message || 'Error al obtener herramientas.', data: [] }
  }
}

export async function createToolRecord(payload: {
  code: string
  name: string
  category: string
  brand?: string | null
  condition?: 'operativo' | 'en_reparacion' | 'de_baja'
  assigned_to?: string | null
  assigned_worker_id?: string | null
  location?: string
  last_inspection_date?: string | null
  status?: 'activo' | 'anulado' | 'archivado' | 'baja'
}) {
  try {
    const user = await requireAction('mecanica', 'create')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    if (!payload.code || !payload.name) {
      return { success: false, error: 'Código y nombre son obligatorios para la herramienta.' }
    }

    const insertPayload = {
      company_id: companyId,
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      category: payload.category || 'Manual',
      brand: payload.brand?.trim() || null,
      condition: payload.condition || 'operativo',
      assigned_to: payload.assigned_to?.trim() || null,
      assigned_worker_id: payload.assigned_worker_id || null,
      location: payload.location?.trim() || 'Taller',
      last_inspection_date: payload.last_inspection_date || new Date().toISOString().split('T')[0],
      status: payload.status || 'activo',
      created_by: user.id
    }

    const { data, error } = await supabase
      .from('mechanics_tools')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      console.error('[MECANICA_ERROR] createToolRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/herramientas')
    revalidatePath('/mecanica')

    return { success: true, data: data as ToolRecord }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] createToolRecord exception:', error)
    return { success: false, error: error.message || 'Error al registrar herramienta.' }
  }
}

export async function updateToolRecord(
  id: string,
  payload: Partial<Omit<ToolRecord, 'id' | 'company_id' | 'created_at' | 'created_by'>>
) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (payload.code !== undefined) updateData.code = payload.code.trim().toUpperCase()
    if (payload.name !== undefined) updateData.name = payload.name.trim()
    if (payload.category !== undefined) updateData.category = payload.category
    if (payload.brand !== undefined) updateData.brand = payload.brand?.trim() || null
    if (payload.condition !== undefined) updateData.condition = payload.condition
    if (payload.assigned_to !== undefined) updateData.assigned_to = payload.assigned_to?.trim() || null
    if (payload.assigned_worker_id !== undefined) updateData.assigned_worker_id = payload.assigned_worker_id || null
    if (payload.location !== undefined) updateData.location = payload.location?.trim() || 'Taller'
    if (payload.last_inspection_date !== undefined) updateData.last_inspection_date = payload.last_inspection_date || null
    if (payload.status !== undefined) updateData.status = payload.status

    const { data, error } = await supabase
      .from('mechanics_tools')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) {
      console.error('[MECANICA_ERROR] updateToolRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/herramientas')
    revalidatePath('/mecanica')

    return { success: true, data: data as ToolRecord }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] updateToolRecord exception:', error)
    return { success: false, error: error.message || 'Error al actualizar herramienta.' }
  }
}

export async function anularToolRecord(id: string) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_tools')
      .update({ status: 'anulado', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] anularToolRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/herramientas')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] anularToolRecord exception:', error)
    return { success: false, error: error.message || 'Error al anular herramienta.' }
  }
}

export async function reactivarToolRecord(id: string) {
  try {
    await requireAction('mecanica', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_tools')
      .update({ status: 'activo', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] reactivarToolRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/herramientas')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] reactivarToolRecord exception:', error)
    return { success: false, error: error.message || 'Error al reactivar herramienta.' }
  }
}

export async function deleteToolRecord(id: string) {
  try {
    await requireAction('mecanica', 'delete')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('mechanics_tools')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      console.error('[MECANICA_ERROR] deleteToolRecord:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/mecanica/herramientas')
    revalidatePath('/mecanica')

    return { success: true }
  } catch (error: any) {
    console.error('[MECANICA_ERROR] deleteToolRecord exception:', error)
    return { success: false, error: error.message || 'Error al eliminar herramienta.' }
  }
}


