'use server'

import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { getWorkerSession } from './worker-auth'
import { revalidatePath } from 'next/cache'
import { getCompanyTimezone, getCompanyLocalTime } from '@/lib/date-utils'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      .select('id, name, logo_url')
    
    if (error || !companies) {
      console.error('[WORKER_PORTAL] Error resolving company slug:', error)
      return { success: false, error: 'Error al consultar la empresa' }
    }

    const company = companies.find(c => (c as any).slug === companySlug || slugify(c.name) === companySlug)
    if (!company) {
      return { success: false, error: 'Empresa no encontrada' }
    }

    return {
      success: true,
      company: {
        id: company.id,
        name: company.name,
        logo_url: company.logo_url,
        slug: slugify(company.name)
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
  try {
    const session = await getWorkerSession()
    if (!session) return null

    const { workerId, companyId } = session
    const supabase = await createAdminClient()
    const ianaTimezone = await getCompanyTimezone(companyId)
    const { date: today } = getCompanyLocalTime(ianaTimezone)

    // Fetch stats concurrently
    const [att, ppe, docs, bns, trns, nextT, nextS] = await Promise.all([
      supabase.from('attendance').select('check_in, check_out, created_at').eq('worker_id', workerId).eq('date', today).maybeSingle(),
      supabase.from('ppe_deliveries').select('id', { count: 'exact', head: true }).eq('worker_id', workerId).or('status.eq.pending_signature,signature_url.is.null'),
      supabase.from('worker_documents').select('id', { count: 'exact', head: true }).eq('worker_id', workerId),
      supabase.from('bonuses').select('amount, status').eq('worker_id', workerId),
      supabase.from('transport_payments').select('amount, status').eq('worker_id', workerId),
      supabase.from('soma_trainings').select('title, date').eq('company_id', companyId).gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle(),
      supabase.from('soma_talks').select('topic, date').eq('company_id', companyId).gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle()
    ])

    const totalBonusesAmount = (bns.data || []).reduce((acc: number, b: any) => acc + (Number(b.amount) || 0), 0)
    const totalTransportAmount = (trns.data || []).reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0)

    const pendingBenefitsAmount = [
      ...(bns.data || []),
      ...(trns.data || [])
    ].filter((item: any) => item.status === 'pending')
     .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0)

    const paidBenefitsAmount = [
      ...(bns.data || []),
      ...(trns.data || [])
    ].filter((item: any) => item.status === 'paid')
     .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0)

    let statusText = 'SIN REGISTRO'
    if (att.data) {
      if (att.data.check_in && !att.data.check_out) {
        statusText = 'PRESENTE'
      } else if (att.data.check_in && att.data.check_out) {
        statusText = 'SALIDA'
      }
    }

    return {
      todayAttendance: statusText,
      todayAttendanceDetail: att.data || null,
      totalBonuses: bns.data?.length || 0,
      totalBonusesAmount,
      totalTransportAmount,
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
 * Marks check-in attendance for the logged-in worker
 */
export async function checkInWorker() {
  try {
    const session = await getWorkerSession()
    if (!session) return { success: false, error: 'Sesión no válida o expirada.' }

    const { workerId, companyId, companySlug } = session
    const supabase = await createAdminClient()
    const ianaTimezone = await getCompanyTimezone(companyId)
    const { date: today, time: now } = getCompanyLocalTime(ianaTimezone)

    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        worker_id: workerId,
        company_id: companyId,
        date: today,
        check_in: now
      }])
      .select()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Ya realizaste el ingreso hoy.' }
      }
      console.error('[WORKER_PORTAL] Error checking in:', error)
      return { success: false, error: 'Error de base de datos al registrar ingreso.' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/attendance')
    revalidatePath('/reports')
    return { success: true, data: data[0] }
  } catch (error: any) {
    console.error('[WORKER_PORTAL] Unexpected check-in error:', error)
    return { success: false, error: 'Ocurrió un error inesperado al registrar el ingreso.' }
  }
}

/**
 * Marks check-out attendance for the logged-in worker
 */
export async function checkOutWorker() {
  try {
    const session = await getWorkerSession()
    if (!session) return { success: false, error: 'Sesión no válida o expirada.' }

    const { workerId, companyId, companySlug } = session
    const supabase = await createAdminClient()
    const ianaTimezone = await getCompanyTimezone(companyId)
    const { date: today, time: now } = getCompanyLocalTime(ianaTimezone)

    const { error } = await supabase
      .from('attendance')
      .update({ check_out: now })
      .eq('worker_id', workerId)
      .eq('date', today)
      .is('check_out', null)

    if (error) {
      console.error('[WORKER_PORTAL] Error checking out:', error)
      return { success: false, error: 'Error al actualizar salida en el sistema.' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/attendance')
    revalidatePath('/reports')
    return { success: true }
  } catch (error: any) {
    console.error('[WORKER_PORTAL] Unexpected check-out error:', error)
    return { success: false, error: 'Ocurrió un error inesperado al registrar la salida.' }
  }
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
        signature_url: fileName
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

    const [bRes, tRes] = await Promise.all([
      supabase.from('bonuses').select('*').eq('worker_id', workerId).order('date', { ascending: false }),
      supabase.from('transport_payments').select('*').eq('worker_id', workerId).order('date', { ascending: false })
    ])

    const bList = (bRes.data || []).map((b: any) => ({
      ...b,
      type: 'bono',
      concept: b.bonus_type || 'Bono General'
    }))

    const tList = (tRes.data || []).map((t: any) => ({
      ...t,
      type: 'pasaje',
      concept: 'Reembolso de Pasaje / Movilidad'
    }))

    // Merge and sort by date descending
    return [...bList, ...tList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('[WORKER_PORTAL] Error fetching financial benefits:', error)
    return []
  }
}
