'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

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
      trainer: payload.trainer,
      date: payload.date,
      expiry_date: payload.expiry_date || null,
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
      status: 'completado'
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
      company_id: companyId || talk.company_id
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
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.worker_id) return { error: 'Solo los trabajadores pueden confirmar asistencia.' }

  const supabase = await createAdminClient()

  // Check if already confirmed
  const { data: existing } = await applyIsolation(
    supabase.from('soma_talk_participants').select('id'),
    companyId,
    extendedUser.role_id
  )
    .eq('talk_id', talkId)
    .eq('worker_id', extendedUser.worker_id)
    .maybeSingle()

  if (existing) return { error: 'Ya has confirmado tu asistencia a esta charla.' }

  const { error } = await supabase
    .from('soma_talk_participants')
    .insert([{
      talk_id: talkId,
      worker_id: extendedUser.worker_id,
      company_id: companyId || (extendedUser as any).company_id,
      status: 'confirmado',
      confirmed_at: new Date().toISOString()
    }])

  if (error) return { error: error.message }

  revalidatePath('/soma/charlas')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getCurrentUser() {
  const { extendedUser } = await getUserSession()
  return extendedUser
}
