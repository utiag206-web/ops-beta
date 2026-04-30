'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// SOMA Trainings Actions
export async function getSomaTrainings() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('soma_trainings')
    .select(`
      *,
      participants:soma_training_participants(
        id,
        worker:workers(id, name)
      )
    `)
    .eq('company_id', extendedUser.company_id)
    .order('date', { ascending: false })

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
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return { error: 'No autorizado' }

  const supabase = await createClient()

  // 1. Insert training header
  const { data: training, error: tError } = await supabase
    .from('soma_trainings')
    .insert([{
      company_id: extendedUser.company_id,
      title: payload.title,
      trainer: payload.trainer,
      date: payload.date,
      expiry_date: payload.expiry_date,
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
      company_id: extendedUser.company_id, // Alineación de esquema
      status: 'completado'
    }))

    const { error: pError } = await supabase
      .from('soma_training_participants')
      .insert(participantsData)

    if (pError) {
      console.error('[SOMA] ERROR_PARTICIPANTES_RLS:', pError)
      // ROLLBACK: Eliminar cabecera para evitar inconsistencia
      await supabase.from('soma_trainings').delete().eq('id', training.id)
      
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
  if (!extendedUser?.company_id) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('soma_talks')
    .select(`
      *,
      leader:users!leader_id(name),
      participants:soma_talk_participants(
        id,
        worker:workers(id, name)
      )
    `)
    .eq('company_id', extendedUser.company_id)
    .order('date', { ascending: false })

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
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return { error: 'No autorizado' }

  const supabase = await createClient()

  // 1. Insert talk header
  const { data: talk, error: tError } = await supabase
    .from('soma_talks')
    .insert([{
      company_id: extendedUser.company_id,
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
      company_id: extendedUser.company_id // Alineación de esquema
    }))

    const { error: pError } = await supabase
      .from('soma_talk_participants')
      .insert(participantsData)

    if (pError) {
      console.error('[SOMA] ERROR_PARTICIPANTES_CHARLA_RLS:', pError)
      // ROLLBACK
      await supabase.from('soma_talks').delete().eq('id', talk.id)
      
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
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.worker_id) return { error: 'Solo los trabajadores pueden confirmar asistencia.' }

  const supabase = await createClient()

  // Check if already confirmed
  const { data: existing } = await supabase
    .from('soma_talk_participants')
    .select('id')
    .eq('talk_id', talkId)
    .eq('worker_id', extendedUser.worker_id)
    .maybeSingle()

  if (existing) return { error: 'Ya has confirmado tu asistencia a esta charla.' }

  const { error } = await supabase
    .from('soma_talk_participants')
    .insert([{
      talk_id: talkId,
      worker_id: extendedUser.worker_id,
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
