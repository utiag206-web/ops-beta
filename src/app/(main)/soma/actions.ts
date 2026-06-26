'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getWorkerSession } from '@/app/actions/worker-auth'

// SOMA Trainings Actions
export async function getSomaTrainings() {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()
 const { data, error } = await applyIsolation(
 supabase.from('soma_trainings').select(`
 *,
 participants:soma_training_participants(
 id,
 status,
 worker:workers(id, name, last_name, position)
 )
 `),
 companyId,
 extendedUser.role_id
 ).order('date', { ascending: false })

 if (error) {
 console.error('Error fetching soma trainings:', error)
 return []
 }
 return data || []
}

export async function createSomaTraining(payload: {
 title: string
 description: string
 trainer: string
 date: string
 expiry_date: string | null
 material_url?: string | null
 participants: string[]
}) {
 const companyId = await getStrictCompanyId()
 const { extendedUser } = await getUserSession()
 const supabase = await createAdminClient()

 // 1. Insert training header
 const { data: training, error: tError } = await supabase
 .from('soma_trainings')
 .insert([{
 company_id: companyId || (payload as any).company_id,
 title: payload.title,
 description: payload.description || null,
 trainer: payload.trainer,
 date: payload.date,
 expiry_date: payload.expiry_date || null,
 material_url: payload.material_url || null,
 created_by: extendedUser.id
 }])
 .select()
 .single()

 if (tError) {
 console.error('[SOMA] ERROR_CABECERA_CAPACITACION:', tError)
 return { error: `Error cabecera: ${tError.message}` }
 }


 // 2. Insert participants
 if (payload.participants.length > 0) {
 const participantsData = payload.participants.map(workerId => ({
 training_id: training.id,
 worker_id: workerId,
 company_id: companyId || training.company_id,
 status: 'pendiente'
 }))

 const { error: pError } = await supabase
 .from('soma_training_participants')
 .insert(participantsData)

 if (pError) {
 console.error('[SOMA] ERROR_PARTICIPANTES_RLS:', pError)
 // ROLLBACK: Eliminar cabecera para evitar inconsistencia
 await applyIsolation(
 supabase.from('soma_trainings').delete(),
 companyId,
 extendedUser.role_id
 ).eq('id', training.id)
 
 return { 
 error: `Error participantes (RLS?): ${pError.message}. Se ha cancelado la creación para evitar datos huérfanos.` 
 }
 }
 }

 revalidatePath('/dashboard')
 revalidatePath('/soma/capacitaciones')
 return { success: true }
}

export async function updateSomaTraining(id: string, payload: {
 title: string
 description: string
 trainer: string
 date: string
 expiry_date: string | null
 material_url?: string | null
 participants: string[]
}) {
 const companyId = await getStrictCompanyId()
 const { extendedUser } = await getUserSession()
 const supabase = await createAdminClient()

 // 1. Update training header
 const { error: uError } = await supabase
 .from('soma_trainings')
 .update({
 title: payload.title,
 description: payload.description || null,
 trainer: payload.trainer,
 date: payload.date,
 expiry_date: payload.expiry_date || null,
 material_url: payload.material_url || null
 })
 .eq('id', id)
 .eq('company_id', companyId)

 if (uError) {
 console.error('[SOMA] ERROR_UPDATE_CAPACITACION:', uError)
 return { error: `Error actualizando capacitación: ${uError.message}` }
 }

 // 2. Fetch existing participants
 const { data: existingParticipants } = await supabase
 .from('soma_training_participants')
 .select('worker_id, status, id')
 .eq('training_id', id)
 .eq('company_id', companyId)

 const existingMap = new Map((existingParticipants || []).map(p => [p.worker_id, p]))

 // Determine who to delete and who to insert
 const newWorkerIds = new Set(payload.participants)
 const toDeleteIds: string[] = []
 
 for (const exp of (existingParticipants || [])) {
 if (!newWorkerIds.has(exp.worker_id)) {
 toDeleteIds.push(exp.id)
 }
 }

 const toInsertData: any[] = []
 for (const wid of payload.participants) {
 if (!existingMap.has(wid)) {
 toInsertData.push({
 training_id: id,
 worker_id: wid,
 company_id: companyId,
 status: 'pendiente'
 })
 }
 }

 // Delete removed participants
 if (toDeleteIds.length > 0) {
 const { error: dError } = await supabase
 .from('soma_training_participants')
 .delete()
 .in('id', toDeleteIds)
 if (dError) {
 console.error('[SOMA] ERROR_DELETE_PARTICIPANTES_CAPACITACION:', dError)
 return { error: `Error actualizando participantes (eliminación): ${dError.message}` }
 }
 }

 // Insert new participants
 if (toInsertData.length > 0) {
 const { error: iError } = await supabase
 .from('soma_training_participants')
 .insert(toInsertData)
 if (iError) {
 console.error('[SOMA] ERROR_INSERT_PARTICIPANTES_CAPACITACION:', iError)
 return { error: `Error actualizando participantes (inserción): ${iError.message}` }
 }
 }

 revalidatePath('/dashboard')
 revalidatePath('/soma/capacitaciones')
 return { success: true }
}

export async function deleteSomaTraining(id: string) {
 const companyId = await getStrictCompanyId()
 const { extendedUser } = await getUserSession()
 const supabase = await createAdminClient()

 // Delete participants first to avoid FK constraints
 await supabase
 .from('soma_training_participants')
 .delete()
 .eq('training_id', id)
 .eq('company_id', companyId)

 const { error } = await supabase
 .from('soma_trainings')
 .delete()
 .eq('id', id)
 .eq('company_id', companyId)

 if (error) {
 console.error('[SOMA] ERROR_DELETE_CAPACITACION:', error)
 return { error: `Error eliminando capacitación: ${error.message}` }
 }

 revalidatePath('/dashboard')
 revalidatePath('/soma/capacitaciones')
 return { success: true }
}

// SOMA Talks Actions
export async function getSomaTalks() {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()
 const { data, error } = await applyIsolation(
 supabase.from('soma_talks').select(`
 *,
 leader:users!leader_id(name),
 participants:soma_talk_participants(
 id,
 status,
 confirmed_at,
 worker:workers(id, name, last_name, position)
 )
 `),
 companyId,
 extendedUser.role_id
 ).order('date', { ascending: false })

 if (error) {
 console.error('Error fetching soma talks:', error)
 return []
 }
 return data || []
}

export async function createSomaTalk(payload: {
 topic: string
 date: string
 location: string
 photo_url?: string
 participants: string[]
}) {
 const companyId = await getStrictCompanyId()
 const { extendedUser } = await getUserSession()
 const supabase = await createAdminClient()

 // 1. Insert talk header
 const { data: talk, error: tError } = await supabase
 .from('soma_talks')
 .insert([{
 company_id: companyId || (payload as any).company_id,
 topic: payload.topic,
 date: payload.date,
 location: payload.location,
 photo_url: payload.photo_url,
 target_area: (payload as any).target_area, 
 material_url: (payload as any).material_url,
 leader_id: extendedUser.id
 }])
 .select()
 .single()

 if (tError) {
 console.error('[SOMA] ERROR_CABECERA_CHARLA:', tError)
 return { error: `Error cabecera charla: ${tError.message}` }
 }


 // 2. Insert participants
 if (payload.participants.length > 0) {
 const participantsData = payload.participants.map(workerId => ({
 talk_id: talk.id,
 worker_id: workerId,
 company_id: companyId || talk.company_id,
 status: 'pendiente',
 confirmed_at: null
 }))

 const { error: pError } = await supabase
 .from('soma_talk_participants')
 .insert(participantsData)

 if (pError) {
 console.error('[SOMA] ERROR_PARTICIPANTES_CHARLA_RLS:', pError)
 // ROLLBACK
 await applyIsolation(
 supabase.from('soma_talks').delete(),
 companyId,
 extendedUser.role_id
 ).eq('id', talk.id)
 
 return { 
 error: `Error participantes charla: ${pError.message}. Se ha revertido la creación.` 
 }
 }
 }

 revalidatePath('/dashboard')
 revalidatePath('/soma/charlas')
 return { success: true }
}

export async function confirmSomaTalk(talkId: string) {
 let workerId: string | null = null
 let companyId: string | null = null

 const workerSession = await getWorkerSession()
 if (workerSession) {
 workerId = workerSession.workerId
 companyId = workerSession.companyId
 } else {
 const { extendedUser } = await getUserSession()
 workerId = extendedUser?.worker_id || null
 companyId = await getStrictCompanyId()
 }

 if (!workerId || !companyId) {
 return { error: 'Solo los trabajadores autorizados de la empresa pueden confirmar asistencia.' }
 }

 const supabase = await createAdminClient()

 // Check if participant row exists
 const { data: existing } = await supabase
 .from('soma_talk_participants')
 .select('id, status')
 .eq('talk_id', talkId)
 .eq('worker_id', workerId)
 .maybeSingle()

 if (existing) {
 if (existing.status === 'confirmado') {
 return { error: 'Ya has confirmado tu asistencia a esta charla.' }
 }

 const { error } = await supabase
 .from('soma_talk_participants')
 .update({
 status: 'confirmado',
 confirmed_at: new Date().toISOString()
 })
 .eq('id', existing.id)

 if (error) return { error: error.message }
 } else {
 const { error } = await supabase
 .from('soma_talk_participants')
 .insert([{
 talk_id: talkId,
 worker_id: workerId,
 company_id: companyId,
 status: 'confirmado',
 confirmed_at: new Date().toISOString()
 }])

 if (error) return { error: error.message }
 }

 revalidatePath('/soma/charlas')
 revalidatePath('/dashboard')
 return { success: true }
}

export async function updateSomaTalk(id: string, payload: {
 topic: string
 date: string
 location: string
 photo_url?: string
 target_area?: string
 material_url?: string
 participants: string[]
}) {
 const companyId = await getStrictCompanyId()
 const { extendedUser } = await getUserSession()
 const supabase = await createAdminClient()

 // 1. Update talk header
 const { error: uError } = await supabase
 .from('soma_talks')
 .update({
 topic: payload.topic,
 date: payload.date,
 location: payload.location,
 photo_url: payload.photo_url,
 target_area: payload.target_area || null,
 material_url: payload.material_url || null
 })
 .eq('id', id)
 .eq('company_id', companyId)

 if (uError) {
 console.error('[SOMA] ERROR_UPDATE_CHARLA:', uError)
 return { error: `Error actualizando charla: ${uError.message}` }
 }

 // 2. Fetch existing participants
 const { data: existingParticipants } = await supabase
 .from('soma_talk_participants')
 .select('worker_id, status, id')
 .eq('talk_id', id)
 .eq('company_id', companyId)

 const existingMap = new Map((existingParticipants || []).map(p => [p.worker_id, p]))

 // Determine who to delete and who to insert
 const newWorkerIds = new Set(payload.participants)
 const toDeleteIds: string[] = []
 
 for (const exp of (existingParticipants || [])) {
 if (!newWorkerIds.has(exp.worker_id)) {
 toDeleteIds.push(exp.id)
 }
 }

 const toInsertData: any[] = []
 for (const wid of payload.participants) {
 if (!existingMap.has(wid)) {
 toInsertData.push({
 talk_id: id,
 worker_id: wid,
 company_id: companyId,
 status: 'pendiente',
 confirmed_at: null
 })
 }
 }

 // Delete removed participants
 if (toDeleteIds.length > 0) {
 const { error: dError } = await supabase
 .from('soma_talk_participants')
 .delete()
 .in('id', toDeleteIds)
 if (dError) {
 console.error('[SOMA] ERROR_DELETE_PARTICIPANTES_CHARLA:', dError)
 return { error: `Error actualizando participantes (eliminación): ${dError.message}` }
 }
 }

 // Insert new participants
 if (toInsertData.length > 0) {
 const { error: iError } = await supabase
 .from('soma_talk_participants')
 .insert(toInsertData)
 if (iError) {
 console.error('[SOMA] ERROR_INSERT_PARTICIPANTES_CHARLA:', iError)
 return { error: `Error actualizando participantes (inserción): ${iError.message}` }
 }
 }

 revalidatePath('/dashboard')
 revalidatePath('/soma/charlas')
 return { success: true }
}

export async function deleteSomaTalk(id: string) {
 const companyId = await getStrictCompanyId()
 const { extendedUser } = await getUserSession()
 const supabase = await createAdminClient()

 // Delete participants first to avoid FK constraints
 await supabase
 .from('soma_talk_participants')
 .delete()
 .eq('talk_id', id)
 .eq('company_id', companyId)

 const { error } = await supabase
 .from('soma_talks')
 .delete()
 .eq('id', id)
 .eq('company_id', companyId)

 if (error) {
 console.error('[SOMA] ERROR_DELETE_CHARLA:', error)
 return { error: `Error eliminando charla: ${error.message}` }
 }

 revalidatePath('/dashboard')
 revalidatePath('/soma/charlas')
 return { success: true }
}

export async function getCurrentUser() {
 const { extendedUser } = await getUserSession()
 return extendedUser
}

export async function confirmSomaTraining(trainingId: string) {
 let workerId: string | null = null
 let companyId: string | null = null

 const workerSession = await getWorkerSession()
 if (workerSession) {
 workerId = workerSession.workerId
 companyId = workerSession.companyId
 } else {
 const { extendedUser } = await getUserSession()
 workerId = extendedUser?.worker_id || null
 companyId = await getStrictCompanyId()
 }

 if (!workerId || !companyId) {
 return { error: 'Solo los trabajadores autorizados de la empresa pueden confirmar asistencia.' }
 }

 const supabase = await createAdminClient()

 // Check if participant row exists
 const { data: existing } = await supabase
 .from('soma_training_participants')
 .select('id, status')
 .eq('training_id', trainingId)
 .eq('worker_id', workerId)
 .maybeSingle()

 if (existing) {
 if (existing.status === 'completado') {
 return { error: 'Ya has confirmado tu asistencia a esta capacitación.' }
 }

 const { error } = await supabase
 .from('soma_training_participants')
 .update({
 status: 'completado'
 })
 .eq('id', existing.id)

 if (error) return { error: error.message }
 } else {
 const { error } = await supabase
 .from('soma_training_participants')
 .insert([{
 training_id: trainingId,
 worker_id: workerId,
 company_id: companyId,
 status: 'completado'
 }])

 if (error) return { error: error.message }
 }

 revalidatePath('/soma/capacitaciones')
 revalidatePath('/dashboard')
 return { success: true }
}

export async function completeTrainingParticipant(participantId: string) {
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()
 
 const { error } = await supabase
 .from('soma_training_participants')
 .update({ status: 'completado' })
 .eq('id', participantId)
 .eq('company_id', companyId)
 
 if (error) return { error: error.message }
 revalidatePath('/soma/capacitaciones')
 return { success: true }
}

export async function completeTalkParticipant(participantId: string) {
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()
 
 const { error } = await supabase
 .from('soma_talk_participants')
 .update({ status: 'confirmado', confirmed_at: new Date().toISOString() })
 .eq('id', participantId)
 .eq('company_id', companyId)
 
 if (error) return { error: error.message }
 revalidatePath('/soma/charlas')
 return { success: true }
}
