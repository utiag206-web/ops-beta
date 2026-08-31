'use server'

import { cookies } from 'next/headers'
import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { getWorkerSession } from './worker-auth'
import { revalidatePath } from 'next/cache'
import { getCompanyTimezone, getCompanyLocalTime } from '@/lib/date-utils'
import { evaluateDailyAttendance } from '@/lib/tareo-engine'
import { getCompanyHrSettings } from '@/lib/company-hr-settings'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getAddressFromCoords(lat?: number, lng?: number): Promise<string | null> {
  // TODO: Implement actual reverse geocoding
  return null;
}

// Helper slugify to match dynamic resolution
const slugify = (text: string) => {
 return text
 .toString()
 .toLowerCase()
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .replace(/[^a-z0-9\s-]/g, '')
 .trim()
 .replace(/\s+/g, '-')
 .replace(/-+/g, '-');
}

/**
 * Resolves a company name and logo based on its slug.
 * Used on the Worker Portal login page.
 */
export async function resolveCompany(companySlug: string) {
 try {
 if (!companySlug) return { success: false, error: 'Slug no proporcionado' }
 
 const supabase = await createAdminClient()
  const { data: companies, error } = await supabase
  .from('companies')
  .select('id, name, logo_url, working_hours')
  
  if (error || !companies) {
  console.error('[WORKER_PORTAL] Error resolving company slug:', error)
  return { success: false, error: 'Error al consultar la empresa' }
  }

  const company = companies.find(c => (c as any).slug === companySlug || slugify(c.name) === companySlug)
  if (!company) {
  return { success: false, error: 'Empresa no encontrada' }
  }

  const hrSettings = getCompanyHrSettings(company)

  return {
  success: true,
  company: {
  id: company.id,
  name: company.name,
  logo_url: company.logo_url,
  slug: slugify(company.name),
  gps_enabled: hrSettings.attendance_settings.enable_gps_tracking !== false
  }
 }
 } catch (error: any) {
 console.error('[WORKER_PORTAL] Unexpected error in resolveCompany:', error)
 return { success: false, error: 'Error inesperado al buscar la empresa' }
 }
}

/**
 * Fetches dashboard statistics specifically for the worker portal
 */
export async function getWorkerPortalStats() {
 noStore()
 try {
 const session = await getWorkerSession()
 if (!session) return null

 const { workerId, companyId } = session
 const supabase = await createAdminClient()
 const ianaTimezone = await getCompanyTimezone(companyId)
 const { date: today } = getCompanyLocalTime(ianaTimezone)

  // Fetch stats concurrently
  const [att, ppe, docs, bns, trns, pmts, nextT, nextS] = await Promise.all([
    supabase.from('attendance').select('id, date, check_in, break_start, break_end, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, break_start_lat, break_start_lng, break_end_lat, break_end_lng, check_in_address, check_out_address, break_start_address, break_end_address, created_at').eq('worker_id', workerId).eq('date', today).maybeSingle(),
    supabase.from('ppe_deliveries').select('id', { count: 'exact', head: true }).eq('worker_id', workerId).or('status.eq.pending_signature,signature_url.is.null'),
    supabase.from('worker_documents').select('id', { count: 'exact', head: true }).eq('worker_id', workerId),
    supabase.from('bonuses').select('amount, status').eq('worker_id', workerId),
    supabase.from('transport_payments').select('amount, status').eq('worker_id', workerId),
    supabase.from('worker_payments').select('amount, status').eq('worker_id', workerId),
    supabase.from('soma_trainings').select('title, date').eq('company_id', companyId).gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('soma_talks').select('topic, date').eq('company_id', companyId).gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle()
  ])

  const totalBonusesAmount = (bns.data || []).reduce((acc: number, b: any) => acc + (Number(b.amount) || 0), 0)
  const totalTransportAmount = (trns.data || []).reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0)
  const totalPaymentsAmount = (pmts.data || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0)

  const pendingBenefitsAmount = [
    ...(bns.data || []),
    ...(trns.data || []),
    ...(pmts.data || [])
  ].filter((item: any) => item.status === 'pending')
  .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0)

  const paidBenefitsAmount = [
    ...(bns.data || []),
    ...(trns.data || []),
    ...(pmts.data || [])
  ].filter((item: any) => item.status === 'paid')
  .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0)

  let statusText = 'SIN REGISTRO'
  if (att.data) {
    if (att.data.check_in && !att.data.break_start && !att.data.check_out) {
      statusText = 'PRESENTE'
    } else if (att.data.check_in && att.data.break_start && !att.data.break_end && !att.data.check_out) {
      statusText = 'EN REFRIGERIO'
    } else if (att.data.check_in && att.data.break_start && att.data.break_end && !att.data.check_out) {
      statusText = 'TURNO ACTIVO'
    } else if (att.data.check_in && att.data.check_out) {
      statusText = 'JORNADA COMPLETADA'
    } else if (att.data.check_in) {
      statusText = 'PRESENTE'
    }
  }

  return {
    todayAttendance: statusText,
    todayAttendanceDetail: att.data || null,
    totalBonuses: bns.data?.length || 0,
    totalBonusesAmount,
    totalTransportAmount,
    totalPaymentsAmount,
    pendingBenefitsAmount,
    paidBenefitsAmount,
    totalDocs: docs.count || 0,
    pendingPPE: ppe.count || 0,
    nextTraining: nextT.data?.title || 'No programada',
    nextTrainingDate: nextT.data?.date || null,
    nextTalk: nextS.data?.topic || 'No programada',
    nextTalkDate: nextS.data?.date || null,
  }
  } catch (error) {
    console.error('[WORKER_PORTAL] Error fetching stats:', error)
    return null
  }
}

/**
 * Fast endpoint to just fetch attendance data for state machine changes
 * avoiding fetching documents/bonuses/trainings
 */
export async function getWorkerAttendanceOnly() {
 noStore()
 try {
  const session = await getWorkerSession()
  if (!session) return null

  const { workerId, companyId } = session
  const supabase = await createAdminClient()
  const ianaTimezone = await getCompanyTimezone(companyId)
  const { date: today } = getCompanyLocalTime(ianaTimezone)

  const att = await supabase.from('attendance')
    .select('id, date, check_in, break_start, break_end, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, break_start_lat, break_start_lng, break_end_lat, break_end_lng, check_in_address, check_out_address, break_start_address, break_end_address, created_at')
    .eq('worker_id', workerId)
    .eq('date', today)
    .maybeSingle()

  let statusText = 'SIN REGISTRO'
  if (att.data) {
    if (att.data.check_in && !att.data.break_start && !att.data.check_out) {
      statusText = 'PRESENTE'
    } else if (att.data.check_in && att.data.break_start && !att.data.break_end && !att.data.check_out) {
      statusText = 'EN REFRIGERIO'
    } else if (att.data.check_in && att.data.break_start && att.data.break_end && !att.data.check_out) {
      statusText = 'TURNO ACTIVO'
    } else if (att.data.check_in && att.data.check_out) {
      statusText = 'JORNADA COMPLETADA'
    } else if (att.data.check_in) {
      statusText = 'PRESENTE'
    }
  }

  return {
    todayAttendance: statusText,
    todayAttendanceDetail: att.data || null,
  }
 } catch (error) {
  console.error('[WORKER_PORTAL] Error fetching fast attendance:', error)
  return null
 }
}

export type ShiftPunchType = 'in' | 'break_start' | 'break_end' | 'out' | 'shift_change' | 'commission' | 'permission' | 'exit_plant' | 'reentry' | 'pause'

/**
 * Unified Server Action for multi-stage attendance punching with atomic attendance_logs and attendance sync
 */
export async function registerWorkerPunch(
  type: ShiftPunchType,
  coords?: { lat?: number; lng?: number; accuracy?: number; locationId?: string }
) {
  noStore()
  try {
    const session = await getWorkerSession()
    if (!session) return { success: false, error: 'Sesión no válida o expirada.' }

    const { workerId, companyId, companySlug } = session
    const supabase = await createAdminClient()
    const ianaTimezone = await getCompanyTimezone(companyId)
    const { date: today, time: now } = getCompanyLocalTime(ianaTimezone)

    // Reverse geocoding address fetch
    const address = await getAddressFromCoords(coords?.lat, coords?.lng)
    const timestampISO = new Date().toISOString()

    // 1. ATOMIC INSERT INTO attendance_logs
    const logPayload: any = {
      company_id: companyId,
      worker_id: workerId,
      date_local: today,
      type: type,
      timestamp: timestampISO
    }

    if (coords?.lat !== undefined && coords?.lng !== undefined) {
      logPayload.latitude = coords.lat
      logPayload.longitude = coords.lng
      logPayload.accuracy = coords.accuracy || null
      if (address) logPayload.address = address
    }

    const { error: logErr } = await supabase.from('attendance_logs').insert([logPayload])
    if (logErr) {
      console.warn('[WORKER_PORTAL] Warning inserting attendance_log:', logErr.message)
      delete logPayload.latitude
      delete logPayload.longitude
      delete logPayload.accuracy
      delete logPayload.address
      const { error: retryLogErr } = await supabase.from('attendance_logs').insert([logPayload])
      if (retryLogErr) {
        console.error('[WORKER_PORTAL] Fatal error inserting attendance_log:', retryLogErr)
        return { success: false, error: `DB Error (logs): ${retryLogErr.message}` }
      }
    }

    // 2. UPSERT / UPDATE attendance table summary
    const { data: existingAtt } = await supabase
      .from('attendance')
      .select('id, check_in, break_start, break_end, check_out')
      .eq('worker_id', workerId)
      .eq('date', today)
      .maybeSingle()

    if (type === 'in') {
      if (existingAtt?.check_in) {
        return { success: false, error: 'Ya registraste la entrada del día de hoy.' }
      }
      const attPayload: any = {
        check_in: now
      }
      if (coords?.lat !== undefined && coords?.lng !== undefined) {
        attPayload.check_in_lat = coords.lat
        attPayload.check_in_lng = coords.lng
        attPayload.latitude = coords.lat
        attPayload.longitude = coords.lng
        if (address) attPayload.check_in_address = address
      }
      
      let { data, error: attErr } = await supabase.from('attendance')
        .upsert(
          { worker_id: workerId, company_id: companyId, date: today, ...attPayload },
          { onConflict: 'worker_id,date', ignoreDuplicates: false }
        )
        
      if (attErr) {
        console.error('[WORKER_PORTAL] Fatal error upserting attendance:', attErr)
        return { success: false, error: `DB Error (att): ${attErr.message}` }
      }
    } else if (existingAtt) {
      const updateData: any = { updated_at: new Date().toISOString() }
      if (type === 'break_start') {
        updateData.break_start = now
        if (coords?.lat !== undefined) {
          updateData.break_start_lat = coords.lat
          updateData.break_start_lng = coords.lng
          if (address) updateData.break_start_address = address
        }
      } else if (type === 'break_end') {
        updateData.break_end = now
        if (coords?.lat !== undefined) {
          updateData.break_end_lat = coords.lat
          updateData.break_end_lng = coords.lng
          if (address) updateData.break_end_address = address
        }
      } else if (type === 'out') {
        updateData.check_out = now
        if (coords?.lat !== undefined) {
          updateData.check_out_lat = coords.lat
          updateData.check_out_lng = coords.lng
          if (address) updateData.check_out_address = address
        }
      }

      let { error: updateErr } = await supabase.from('attendance').update(updateData).eq('worker_id', workerId).eq('date', today)
      if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('column'))) {
        // Strip extra gps address fields
        delete updateData.break_start_lat
        delete updateData.break_start_lng
        delete updateData.break_start_address
        delete updateData.break_end_lat
        delete updateData.break_end_lng
        delete updateData.break_end_address
        delete updateData.check_out_lat
        delete updateData.check_out_lng
        delete updateData.check_out_address
        await supabase.from('attendance').update(updateData).eq('worker_id', workerId).eq('date', today)
      }
    }

    // 3. AUTOMATIC ENGINE SYNC WITH tareo_records (unless manually overridden by HR)
    try {
      const { data: existingTareo } = await supabase
        .from('tareo_records')
        .select('id, is_manual, status')
        .eq('worker_id', workerId)
        .eq('date', today)
        .maybeSingle()

      if (!existingTareo || !existingTareo.is_manual) {
        // Fetch company settings directly from DB or via helper
        const { data: comp } = await supabase.from('companies').select('*').eq('id', companyId).single()
        const hrSettings = getCompanyHrSettings(comp)
        const settings = hrSettings.attendance_settings
        
        const { data: dayPunches } = await supabase
          .from('attendance_logs')
          .select('type, timestamp, latitude, longitude, accuracy, address')
          .eq('worker_id', workerId)
          .eq('date_local', today)
          .order('timestamp', { ascending: true })

        const evaluation = evaluateDailyAttendance(today, null, dayPunches || [], settings)
        await supabase.from('tareo_records').upsert({
          company_id: companyId,
          worker_id: workerId,
          date: today,
          status: evaluation.status,
          hours_worked: evaluation.effectiveHours,
          overtime_hours: evaluation.overtimeHours,
          tardiness_minutes: evaluation.tardinessMinutes,
          is_manual: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'worker_id,date' })
      }
    } catch (tareoErr) {
      console.warn('[WORKER_PORTAL] Warning syncing tareo_record:', tareoErr)
    }

    // 4. FETCH NEW ATTENDANCE STATE TO RETURN
    const { data: updatedAtt } = await supabase
      .from('attendance')
      .select('id, date, check_in, break_start, break_end, check_out, check_in_lat, check_in_lng, check_out_lat, check_out_lng, break_start_lat, break_start_lng, break_end_lat, break_end_lng, check_in_address, check_out_address, break_start_address, break_end_address, created_at')
      .eq('worker_id', workerId)
      .eq('date', today)
      .maybeSingle()

    let statusText = 'SIN REGISTRO'
    if (updatedAtt) {
      if (updatedAtt.check_in && !updatedAtt.break_start && !updatedAtt.check_out) {
        statusText = 'PRESENTE'
      } else if (updatedAtt.check_in && updatedAtt.break_start && !updatedAtt.break_end && !updatedAtt.check_out) {
        statusText = 'EN REFRIGERIO'
      } else if (updatedAtt.check_in && updatedAtt.break_start && updatedAtt.break_end && !updatedAtt.check_out) {
        statusText = 'TURNO ACTIVO'
      } else if (updatedAtt.check_in && updatedAtt.check_out) {
        statusText = 'JORNADA COMPLETADA'
      } else if (updatedAtt.check_in) {
        statusText = 'PRESENTE'
      }
    }

    // 5. SURGICAL REVALIDATION OF ALL IMPACTED PATHS
    revalidatePath('/tareo')
    revalidatePath('/attendance')
    revalidatePath('/dashboard')
    revalidatePath('/reports')
    revalidatePath(`/w/${companySlug}`, 'page')

    return { 
      success: true, 
      timestamp: now, 
      address,
      todayAttendance: statusText,
      todayAttendanceDetail: updatedAtt || null
    }
  } catch (error: any) {
    console.error('[WORKER_PORTAL] Error registering punch:', error)
    return { success: false, error: 'No se pudo procesar la marcación. Intente nuevamente.' }
  }
}

/**
 * Backward-compatible checkInWorker wrapper
 */
export async function checkInWorker(coords?: { lat?: number; lng?: number; accuracy?: number; locationId?: string }) {
  return registerWorkerPunch('in', coords)
}

/**
 * Backward-compatible checkOutWorker wrapper
 */
export async function checkOutWorker(coords?: { lat?: number; lng?: number; accuracy?: number; locationId?: string }) {
  return registerWorkerPunch('out', coords)
}

/**
 * Backward-compatible startBreakWorker wrapper
 */
export async function startBreakWorker(coords?: { lat?: number; lng?: number; accuracy?: number; locationId?: string }) {
  return registerWorkerPunch('break_start', coords)
}

/**
 * Backward-compatible endBreakWorker wrapper
 */
export async function endBreakWorker(coords?: { lat?: number; lng?: number; accuracy?: number; locationId?: string }) {
  return registerWorkerPunch('break_end', coords)
}

/**
 * Fetches all worker documents and generates signed URLs for security
 */
export async function getWorkerPortalDocuments() {
 try {
 const session = await getWorkerSession()
 if (!session) return []

 const { workerId } = session
 const supabase = await createAdminClient()

 const { data, error } = await supabase
 .from('worker_documents')
 .select('*')
 .eq('worker_id', workerId)
 .order('created_at', { ascending: false })

 if (error) {
 console.error('[WORKER_PORTAL] Error fetching worker documents:', error)
 return []
 }

 // Enhance documents with 1-hour secure signed URLs
 const docsWithUrls = await Promise.all((data || []).map(async (doc: any) => {
 if (!doc.file_path) return doc;

 const { data: signedData, error: signedError } = await supabase.storage
 .from('worker_documents')
 .createSignedUrl(doc.file_path, 3600)

 return {
 ...doc,
 file_url: signedData?.signedUrl || doc.file_url
 }
 }))

 return docsWithUrls
 } catch (error) {
 console.error('[WORKER_PORTAL] Unexpected error in getWorkerPortalDocuments:', error)
 return []
 }
}

/**
 * Fetches all PPE/EPP deliveries for the logged-in worker
 */
export async function getWorkerPortalPPEDeliveries() {
 try {
 const session = await getWorkerSession()
 if (!session) return []

 const { workerId } = session
 const supabase = await createAdminClient()

 const { data, error } = await supabase
 .from('ppe_deliveries')
 .select('*')
 .eq('worker_id', workerId)
 .order('delivery_date', { ascending: false })

 if (error) {
 console.error('[WORKER_PORTAL] Error fetching PPE deliveries:', error)
 return []
 }

 return data || []
 } catch (error) {
 console.error('[WORKER_PORTAL] Unexpected error in getWorkerPortalPPEDeliveries:', error)
 return []
 }
}

/**
 * signs a PPE delivery directly from the worker portal
 */
export async function signWorkerPortalPPEDelivery(deliveryId: string, signatureBase64: string) {
 try {
 const session = await getWorkerSession()
 if (!session) return { success: false, error: 'Sesión no válida o expirada.' }

 const { workerId, companyId, companySlug } = session
 const supabase = await createAdminClient()

 // 1. Verify delivery belongs to this worker and company
 const { data: existing, error: fetchErr } = await supabase
 .from('ppe_deliveries')
 .select('id, worker_id')
 .eq('id', deliveryId)
 .eq('company_id', companyId)
 .single()

 if (fetchErr || !existing) {
 return { success: false, error: 'Registro de entrega no encontrado o no pertenece a su empresa.' }
 }

 if (existing.worker_id !== workerId) {
 return { success: false, error: 'Acceso denegado: esta entrega no le pertenece.' }
 }

 // 2. Upload PNG signature to Storage bucket 'ppe_signatures'
 const { uploadFile, generateStoragePath } = await import('@/lib/storage')
 const fileName = `signature_${deliveryId}.png`
 const storagePath = generateStoragePath(
 companyId,
 'ppe_signatures',
 workerId,
 fileName
 )
 
 const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, '')
 const buffer = Buffer.from(base64Data, 'base64')
 const blob = new Blob([buffer], { type: 'image/png' })

 const { publicUrl } = await uploadFile(blob, 'ppe_signatures', storagePath)

 // 3. Update status to 'signed' and set the signature_url
 const { data: updateData, error: updateError } = await supabase
 .from('ppe_deliveries')
 .update({
 status: 'signed',
 signature_url: publicUrl
 })
 .eq('id', deliveryId)
 .select()

 if (updateError) {
 console.error('[WORKER_PORTAL] DB update error on sign PPE:', updateError)
 return { success: false, error: 'Error al actualizar el estado de firma en la base de datos.' }
 }

 return { success: true }
 } catch (error: any) {
 console.error('[WORKER_PORTAL] Unexpected error during sign PPE:', error)
 return { success: false, error: 'Error inesperado al firmar el documento.' }
 }
}

/**
 * Fetches all bonuses and transport payments for the logged-in worker
 */
export async function getWorkerPortalFinances() {
 try {
 const session = await getWorkerSession()
 if (!session) return []

 const { workerId, companyId } = session
 const supabase = await createAdminClient()

 const [bRes, tRes, pRes] = await Promise.all([
 supabase.from('bonuses').select('*').eq('company_id', companyId).eq('worker_id', workerId).order('date', { ascending: false }),
 supabase.from('transport_payments').select('*').eq('company_id', companyId).eq('worker_id', workerId).order('date', { ascending: false }),
 supabase.from('worker_payments').select('*').eq('company_id', companyId).eq('worker_id', workerId).order('date', { ascending: false })
 ])

 const bList = (bRes.data || []).map((b: any) => ({
 ...b,
 type: 'bono',
 concept: b.bonus_type || 'Bono General'
 }))

 const tList = (tRes.data || []).map((t: any) => ({
 ...t,
 type: 'pasaje',
 concept: t.concept || 'Reembolso de Pasaje / Movilidad'
 }))

 const paymentTypeLabels: any = {
 salary: 'Sueldo',
 advance: 'Adelanto',
 liquidation: 'Liquidación',
 extra: 'Pago Extraordinario'
 }

 const pList = (pRes.data || []).map((p: any) => ({
 ...p,
 type: 'pago',
 concept: `${paymentTypeLabels[p.payment_type] || 'Pago'} (${p.period || 'mensual'})`
 }))

 // Merge and sort by date descending
 return [...bList, ...tList, ...pList].sort((a, b) => {
 const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
 if (dateDiff === 0 && a.created_at && b.created_at) {
 return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
 }
 return dateDiff
 })
 } catch (error) {
 console.error('[WORKER_PORTAL] Error fetching financial benefits:', error)
 return []
 }
}

export async function getWorkerPortalSomaTalks() {
 try {
 const session = await getWorkerSession()
 if (!session) return []
 const { workerId, companyId } = session
 const supabase = await createAdminClient()

 // Fetch talks where this worker is a participant
 const { data, error } = await supabase
 .from('soma_talk_participants')
 .select(`
 id,
 status,
 confirmed_at,
 talk:soma_talks(
 id,
 topic,
 date,
 location,
 material_url,
 leader:users!leader_id(name)
 )
 `)
 .eq('worker_id', workerId)

 if (error) {
 console.error('[WORKER_PORTAL] Error fetching worker SOMA talks:', error)
 return []
 }

 // Sort by date descending
 return (data || []).sort((a: any, b: any) => {
 const dateA = a.talk?.date ? new Date(a.talk.date).getTime() : 0
 const dateB = b.talk?.date ? new Date(b.talk.date).getTime() : 0
 return dateB - dateA
 })
 } catch (error) {
 console.error('[WORKER_PORTAL] Unexpected error fetching SOMA talks:', error)
 return []
 }
}

export async function getWorkerPortalSomaTrainings() {
 try {
 const session = await getWorkerSession()
 if (!session) return []
 const { workerId, companyId } = session
 const supabase = await createAdminClient()

 // Fetch trainings where this worker is a participant
 const { data, error } = await supabase
 .from('soma_training_participants')
 .select(`
 id,
 status,
 training:soma_trainings(
 id,
 title,
 description,
 trainer,
 date,
 expiry_date,
 material_url
 )
 `)
 .eq('worker_id', workerId)

 if (error) {
 console.error('[WORKER_PORTAL] Error fetching worker SOMA trainings:', error)
 return []
 }

 // Sort by date descending
 return (data || []).sort((a: any, b: any) => {
 const dateA = a.training?.date ? new Date(a.training.date).getTime() : 0
 const dateB = b.training?.date ? new Date(b.training.date).getTime() : 0
 return dateB - dateA
 })
 } catch (error) {
 console.error('[WORKER_PORTAL] Unexpected error fetching SOMA trainings:', error)
 return []
 }
}
