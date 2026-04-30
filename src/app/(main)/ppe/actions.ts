'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getPPEDeliveries(workerId?: string) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return []

  const supabase = await createAdminClient()
  let query = supabase
    .from('ppe_deliveries')
    .select('*, worker:workers(name)')
    .eq('company_id', extendedUser.company_id)
    .order('delivery_date', { ascending: false })

  if (extendedUser.role_id === 'trabajador') {
    query = query.eq('worker_id', extendedUser.worker_id)
  } else if (workerId) {
    query = query.eq('worker_id', workerId)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching PPE deliveries:', error)
    return []
  }

  return data
}

export async function createPPEDelivery(formData: {
  worker_id: string
  ppe_type: string
  delivery_date: string
}) {
  const { extendedUser } = await getUserSession()
  const userRole = extendedUser?.role_id || ''
  const allowedRoles = ['admin', 'gerente', 'operaciones']
  
  if (!extendedUser?.company_id || !allowedRoles.includes(userRole) || userRole === 'trabajador') {
    return { success: false, error: 'Acceso Denegado (403): No autorizado para registrar entregas globales.' }
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('ppe_deliveries')
    .insert([{
      ...formData,
      company_id: extendedUser.company_id,
      status: 'pending_signature'
    }])
    .select()

  if (error) {
    console.error('Error creating PPE delivery:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/workers/${formData.worker_id}`)
  revalidatePath('/ppe')
  revalidatePath('/dashboard')
  return { success: true, data: data[0] }
}

export async function signPPEDelivery(deliveryId: string, signatureBase64: string) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()
    
    // 0. Verify record exists and belongs to company
    const { data: existing, error: fetchErr } = await supabase
      .from('ppe_deliveries')
      .select('id, worker_id, status')
      .eq('id', deliveryId)
      .eq('company_id', extendedUser.company_id)
      .single()

    if (fetchErr || !existing) {
      return { success: false, error: "No se encontró el registro de entrega o no pertenece a tu empresa" }
    }

    // [STRICT_RBAC] Si es trabajador, solo puede firmar lo que es para él
    if (extendedUser.role_id === 'trabajador' && existing.worker_id !== extendedUser.worker_id) {
       return { success: false, error: "Acceso Denegado: No puedes firmar una entrega que no te pertenece." }
    }

    const { uploadFile, generateStoragePath } = await import('@/lib/storage')
    const fileName = `signature_${deliveryId}.png`
    const storagePath = generateStoragePath(
      extendedUser.company_id,
      'ppe',
      extendedUser.worker_id || extendedUser.id,
      fileName
    )
    
    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })

    const { publicUrl } = await uploadFile(blob, 'ppe', storagePath)

    // Use Admin Client to bypass RLS for status update
    const adminClient = await createAdminClient()

    const { data: updateData, error: updateError } = await adminClient
      .from('ppe_deliveries')
      .update({
        status: 'signed',
        signature_url: fileName
      })
      .eq('id', deliveryId)
      .select()

    if (updateError) {
      console.error('[PPE_SIGN] DB Update Error:', updateError)
      return { success: false, error: `Error al actualizar DB: ${updateError.message}` }
    }

    if (!updateData || updateData.length === 0) {
      return { success: false, error: 'No se pudo actualizar el registro (0 filas)' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/profile')
    revalidatePath('/ppe')
    
    return { success: true }
  } catch (error: any) {
    console.error("[PPE_SIGN] Unexpected error:", error)
    return { success: false, error: `Error inesperado: ${error.message || 'Desconocido'}` }
  }
}

// Debugging actions removed after successful verification
