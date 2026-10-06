'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { requireAction } from '@/lib/rbac/server-guards'
import { revalidatePath } from 'next/cache'

export interface PlantMineralBatch {
  id: string
  company_id?: string
  batch_code: string
  guide_number?: string | null
  truck_plate: string
  vehicle_asset_id?: string | null
  driver_name: string
  driver_worker_id?: string | null
  origin_mine: string
  mineral_type: string
  gross_weight: number
  tare_weight: number
  net_weight: number
  reception_date: string
  reception_time: string
  moisture_pct?: number | null
  quality_status?: 'optimo' | 'regular' | 'observado' | 'rechazado' | null
  quality_notes?: string | null
  stockpile?: string | null
  operator_name?: string | null
  operator_worker_id?: string | null
  discharge_time?: string | null
  processing_start_time?: string | null
  processing_end_time?: string | null
  stage: 'ingresado' | 'descargado' | 'acopio' | 'proceso' | 'muestreo' | 'laboratorio' | 'ley_final' | 'terminado' | 'anulado'
  evidences?: any[]
  isPending?: boolean
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface PlantMineralSample {
  id: string
  company_id?: string
  batch_id: string
  sample_code: string
  sampling_date: string
  sampling_time: string
  sampler_name: string
  sampler_worker_id?: string | null
  has_counter_sample: boolean
  counter_sample_code?: string | null
  lab_result_date?: string | null
  obtained_grade?: number | null
  lab_notes?: string | null
  counter_sample_result?: number | null
  final_agreed_grade?: number | null
  status: 'tomada' | 'enviada_laboratorio' | 'resultado_recibido' | 'ley_acordada' | 'anulada'
  evidences?: any[]
  isPending?: boolean
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

const EVIDENCES_REGEX = /<!--__EVIDENCES_START__([\s\S]*?)__EVIDENCES_END__-->/

function packBatchNotes(notes: string | null | undefined, evidences: any[] | undefined): string | null {
  const cleanNotes = (notes || '').replace(EVIDENCES_REGEX, '').trim()
  if (!evidences || !Array.isArray(evidences) || evidences.length === 0) {
    return cleanNotes || null
  }
  return `${cleanNotes}\n<!--__EVIDENCES_START__${JSON.stringify(evidences)}__EVIDENCES_END__-->`.trim()
}

function unpackBatchNotes(notes: string | null | undefined): { notes: string | null, evidences: any[] } {
  if (!notes) return { notes: null, evidences: [] }
  const match = notes.match(EVIDENCES_REGEX)
  if (!match) return { notes, evidences: [] }
  try {
    const evidences = JSON.parse(match[1])
    const cleanNotes = notes.replace(EVIDENCES_REGEX, '').trim()
    return { notes: cleanNotes || null, evidences: Array.isArray(evidences) ? evidences : [] }
  } catch {
    return { notes, evidences: [] }
  }
}

export async function getPlantBatches() {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser) return { success: false, error: 'Sesión no iniciada.', data: [] }

    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const query = applyIsolation(
      supabase.from('plant_mineral_batches').select('*'),
      companyId,
      extendedUser.role_id
    )

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    const formattedData = (data || []).map((batch: any) => {
      const { notes, evidences } = unpackBatchNotes(batch.quality_notes)
      return {
        ...batch,
        quality_notes: notes,
        evidences: batch.evidences && batch.evidences.length > 0 ? batch.evidences : evidences
      }
    })

    return { success: true, data: formattedData as PlantMineralBatch[] }
  } catch (error: any) {
    console.error('[PLANTA_ERROR] getPlantBatches:', error)
    return { success: false, error: error.message || 'Error al obtener lotes.', data: [] }
  }
}

export async function createPlantBatch(payload: Partial<PlantMineralBatch>) {
  try {
    const user = await requireAction('planta_mineral', 'create')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    if (!payload.batch_code || !payload.truck_plate || !payload.origin_mine || !payload.mineral_type) {
      return { success: false, error: 'Faltan campos obligatorios para el ingreso.' }
    }

    const packedNotes = packBatchNotes(payload.quality_notes, payload.evidences)

    const insertPayload: any = {
      company_id: companyId,
      batch_code: payload.batch_code,
      guide_number: payload.guide_number || null,
      truck_plate: payload.truck_plate,
      vehicle_asset_id: payload.vehicle_asset_id || null,
      driver_name: payload.driver_name || '',
      driver_worker_id: payload.driver_worker_id || null,
      origin_mine: payload.origin_mine,
      mineral_type: payload.mineral_type,
      gross_weight: payload.gross_weight || 0,
      tare_weight: payload.tare_weight || 0,
      net_weight: payload.net_weight || 0,
      reception_date: payload.reception_date || new Date().toISOString().split('T')[0],
      reception_time: payload.reception_time || new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }),
      discharge_time: payload.discharge_time || null,
      moisture_pct: payload.moisture_pct !== undefined && payload.moisture_pct !== null && payload.moisture_pct !== ('' as any) ? Number(payload.moisture_pct) : null,
      quality_status: payload.quality_status || null,
      quality_notes: packedNotes,
      stockpile: payload.stockpile || null,
      operator_name: payload.operator_name || null,
      operator_worker_id: payload.operator_worker_id || null,
      stage: payload.stage || 'ingresado',
      created_by: user.id
    }

    const timeFields = ['discharge_time', 'reception_time', 'processing_start_time', 'processing_end_time', 'reception_date', 'driver_worker_id', 'vehicle_asset_id', 'operator_worker_id'];
    timeFields.forEach(field => {
      if (insertPayload[field] === '') insertPayload[field] = null;
    });

    const { data, error } = await supabase
      .from('plant_mineral_batches')
      .insert([insertPayload])
      .select()
      .single()

    if (error) throw error

    const { notes, evidences } = unpackBatchNotes(data.quality_notes)
    data.quality_notes = notes
    data.evidences = evidences

    revalidatePath('/operaciones/planta')
    return { success: true, data: data as PlantMineralBatch }
  } catch (error: any) {
    console.error('[PLANTA_ERROR] createPlantBatch:', error)
    return { success: false, error: error.message || 'Error al crear ingreso.' }
  }
}

export async function updatePlantBatch(id: string, payload: Partial<PlantMineralBatch>) {
  try {
    await requireAction('planta_mineral', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const updateData: any = { ...payload, updated_at: new Date().toISOString() }
    delete updateData.id
    delete updateData.company_id
    delete updateData.created_at
    delete updateData.created_by
    delete updateData.isPending

    if (payload.evidences !== undefined || payload.quality_notes !== undefined) {
      let existingNotes = payload.quality_notes
      if (existingNotes === undefined) {
        const { data: current } = await supabase
          .from('plant_mineral_batches')
          .select('quality_notes')
          .eq('id', id)
          .eq('company_id', companyId)
          .single()
        existingNotes = current?.quality_notes || null
      }
      updateData.quality_notes = packBatchNotes(existingNotes, payload.evidences)
    }
    delete updateData.evidences

    const timeFields = ['discharge_time', 'reception_time', 'processing_start_time', 'processing_end_time', 'reception_date', 'driver_worker_id', 'vehicle_asset_id', 'operator_worker_id'];
    timeFields.forEach(field => {
      if (updateData[field] === '') updateData[field] = null;
    });

    if (updateData.quality_status === '') updateData.quality_status = null;

    const { data, error } = await supabase
      .from('plant_mineral_batches')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error

    const { notes, evidences } = unpackBatchNotes(data.quality_notes)
    data.quality_notes = notes
    data.evidences = evidences

    revalidatePath('/operaciones/planta')
    return { success: true, data: data as PlantMineralBatch }
  } catch (error: any) {
    console.error('[PLANTA_ERROR] updatePlantBatch:', error)
    return { success: false, error: error.message || 'Error al actualizar lote.' }
  }
}

export async function getPlantSamples(batchId: string) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser) return { success: false, error: 'Sesión no iniciada.', data: [] }

    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const query = applyIsolation(
      supabase.from('plant_mineral_samples').select('*').eq('batch_id', batchId),
      companyId,
      extendedUser.role_id
    )

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) throw error

    const formattedSamples = (data || []).map((sample: any) => {
      const { notes, evidences } = unpackBatchNotes(sample.lab_notes)
      return {
        ...sample,
        lab_notes: notes,
        evidences: sample.evidences && sample.evidences.length > 0 ? sample.evidences : evidences
      }
    })

    return { success: true, data: formattedSamples as PlantMineralSample[] }
  } catch (error: any) {
    console.error('[PLANTA_ERROR] getPlantSamples:', error)
    return { success: false, error: error.message || 'Error al obtener muestras.', data: [] }
  }
}

export async function createPlantSample(payload: Partial<PlantMineralSample>) {
  try {
    const user = await requireAction('planta_mineral', 'create')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    if (!payload.batch_id || !payload.sample_code || !payload.sampler_name) {
      return { success: false, error: 'Faltan campos obligatorios para la muestra.' }
    }

    const packedNotes = packBatchNotes(payload.lab_notes, payload.evidences)

    const insertPayload: any = {
      company_id: companyId,
      batch_id: payload.batch_id,
      sample_code: payload.sample_code,
      sampling_date: payload.sampling_date || new Date().toISOString().split('T')[0],
      sampling_time: payload.sampling_time || new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }),
      sampler_name: payload.sampler_name,
      sampler_worker_id: payload.sampler_worker_id || null,
      has_counter_sample: payload.has_counter_sample || false,
      counter_sample_code: payload.counter_sample_code || null,
      status: payload.status || 'tomada',
      lab_notes: packedNotes,
      created_by: user.id
    }

    const timeFields = ['sampling_date', 'sampling_time', 'lab_dispatch_date', 'lab_dispatch_time', 'results_received_date', 'results_received_time', 'sampler_worker_id', 'lab_worker_id'];
    timeFields.forEach(field => {
      if (insertPayload[field] === '') insertPayload[field] = null;
    });

    const { data, error } = await supabase
      .from('plant_mineral_samples')
      .insert([insertPayload])
      .select()
      .single()

    if (error) throw error

    const { notes, evidences } = unpackBatchNotes(data.lab_notes)
    data.lab_notes = notes
    data.evidences = evidences

    revalidatePath('/operaciones/planta')
    return { success: true, data: data as PlantMineralSample }
  } catch (error: any) {
    console.error('[PLANTA_ERROR] createPlantSample:', error)
    return { success: false, error: error.message || 'Error al crear muestra.' }
  }
}

export async function updatePlantSample(id: string, payload: Partial<PlantMineralSample>) {
  try {
    await requireAction('planta_mineral', 'update')
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const updateData: any = { ...payload, updated_at: new Date().toISOString() }
    delete updateData.id
    delete updateData.company_id
    delete updateData.batch_id
    delete updateData.created_at
    delete updateData.created_by
    delete updateData.isPending

    if (payload.evidences !== undefined || payload.lab_notes !== undefined) {
      let existingNotes = payload.lab_notes
      if (existingNotes === undefined) {
        const { data: current } = await supabase
          .from('plant_mineral_samples')
          .select('lab_notes')
          .eq('id', id)
          .eq('company_id', companyId)
          .single()
        existingNotes = current?.lab_notes || null
      }
      updateData.lab_notes = packBatchNotes(existingNotes, payload.evidences)
    }
    delete updateData.evidences

    const timeFields = ['sampling_date', 'sampling_time', 'lab_dispatch_date', 'lab_dispatch_time', 'results_received_date', 'results_received_time', 'sampler_worker_id', 'lab_worker_id'];
    timeFields.forEach(field => {
      if (updateData[field] === '') updateData[field] = null;
    });

    const { data, error } = await supabase
      .from('plant_mineral_samples')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error

    const { notes, evidences } = unpackBatchNotes(data.lab_notes)
    data.lab_notes = notes
    data.evidences = evidences

    revalidatePath('/operaciones/planta')
    return { success: true, data: data as PlantMineralSample }
  } catch (error: any) {
    console.error('[PLANTA_ERROR] updatePlantSample:', error)
    return { success: false, error: error.message || 'Error al actualizar muestra.' }
  }
}
