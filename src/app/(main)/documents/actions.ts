'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getWorkerDocuments() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser) return []

  const supabase = await createClient()

  console.log("--- AUDIT: DOCUMENTS FETCH INICIO ---")
  console.log("QUERY ALIASED: supabase.from('worker_documents').select('*, worker:workers!fk_worker_documents_worker(...)')")

  let query = supabase
    .from('worker_documents')
    .select(`*, worker:workers(name)`)
    .eq('company_id', extendedUser.company_id)
    .order('created_at', { ascending: false })

  if (extendedUser.role_id === 'trabajador') {
    query = query.eq('worker_id', extendedUser.worker_id)
  }

  const { data, error } = await query

  console.log("FETCH RESULT DOCUMENTS:", data, error)
  console.log("--- AUDIT: DOCUMENTS FETCH FIN ---")

  if (error) {
    console.error('[DOCUMENTS] Error fetching documents:', JSON.stringify(error))
    return []
  }

  console.log(`[DOCUMENTS] Fetched ${data?.length ?? 0} documents for company ${extendedUser.company_id}`)
  return data || []
}

export async function addWorkerDocument(payload: {
  worker_id: string
  name: string
  file_type: string
  issue_date: string
  expiry_date: string
  file_url?: string
  file_path?: string
}) {
  try {
    const { extendedUser } = await getUserSession()
    const userRole = extendedUser?.role_id || ''
    if (!extendedUser || userRole === 'trabajador') {
      return { success: false, error: 'Acceso Denegado (403): Solo administradores pueden gestionar esta acción.' }
    }

    const supabase = await createClient()

    // Only insert the columns that are guaranteed to exist and not be null-constrained
    const insertPayload: any = {
      worker_id: payload.worker_id,
      company_id: extendedUser.company_id,
      name: payload.name,
      file_type: payload.file_type,
    }

    // Add optional date fields if they exist (require ALTER TABLE migration)
    if (payload.expiry_date) insertPayload.expiry_date = payload.expiry_date
    if (payload.issue_date) insertPayload.issue_date = payload.issue_date
    if (payload.file_url) insertPayload.file_url = payload.file_url
    if (payload.file_path) insertPayload.file_path = payload.file_path

    console.log('[DOCUMENTS] Inserting:', JSON.stringify(insertPayload))

    const { data, error } = await supabase
      .from('worker_documents')
      .insert(insertPayload)
      .select()

    console.log('[DOCUMENTS] Insert result:', JSON.stringify(data))
    if (error) {
      console.error('[DOCUMENTS] Insert error:', JSON.stringify(error))
      return { success: false, error: `${error.message} (code: ${error.code})` }
    }

    revalidatePath('/documents')
    revalidatePath('/dashboard')
    return { success: true, error: null }
  } catch (e: any) {
    console.error('[DOCUMENTS] Unexpected error:', e.message)
    return { success: false, error: e.message }
  }
}

export async function deleteDocument(id: string) {
  try {
    const { extendedUser } = await getUserSession()
    const userRole = extendedUser?.role_id || ''
    if (!extendedUser || userRole === 'trabajador') {
      return { success: false, error: 'Acceso Denegado (403): Solo administradores pueden gestionar esta acción.' }
    }

    const supabase = await createClient()

    // Fetch document to extract file_path before deleting
    const { data: doc } = await supabase
      .from('worker_documents')
      .select('file_path')
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)
      .single()

    if (doc?.file_path) {
      // Remove file from storage
      await supabase.storage.from('worker_documents').remove([doc.file_path])
    }

    const { error } = await supabase
      .from('worker_documents')
      .delete()
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)

    if (error) {
      console.error('[DOCUMENTS] Delete error:', JSON.stringify(error))
      return { success: false, error: `${error.message} (code: ${error.code})` }
    }

    revalidatePath('/documents')
    revalidatePath('/dashboard')
    return { success: true, error: null }
  } catch (e: any) {
    console.error('[DOCUMENTS] Unexpected error:', e.message)
    return { success: false, error: e.message }
  }
}
