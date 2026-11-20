'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation, getActiveViewMode } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getWorkerDocuments() {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 if (!extendedUser || !companyId) return []

 const supabase = await createAdminClient()

 let query = applyIsolation(
 supabase.from('worker_documents').select(`
 *, 
 worker:workers(name, last_name)
 `),
 companyId,
 extendedUser.role_id
 )
 .order('created_at', { ascending: false })

 const viewMode = await getActiveViewMode()
 if (viewMode === 'WORKER' || extendedUser.role_id === 'trabajador') {
 query = query.eq('worker_id', extendedUser.worker_id)
 }

 const { data, error } = await query

 if (error) {
 console.error('[DOCUMENTS] Error fetching documents:', JSON.stringify(error))
 return []
 }

 return data || []
}

export async function addWorkerDocument(formData: FormData) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 
 // Auth Check
 const allowedRoles = ['admin', 'company_admin', 'super_admin', 'superadmin', 'operaciones']
 const isAuthorized = extendedUser && (allowedRoles.includes(extendedUser.role_id?.toLowerCase()))

 if (!extendedUser || !isAuthorized || !companyId) {
 return { success: false, error: 'Acceso Denegado (403): Solo administradores pueden gestionar esta acción.' }
 }

 const worker_id = formData.get('worker_id') as string
 const name = formData.get('name') as string
 const file_type = formData.get('file_type') as string
 const issue_date = formData.get('issue_date') as string
 const expiry_date = formData.get('expiry_date') as string
 const file = formData.get('file') as File | null

 if (!worker_id || !name || !file_type) {
 return { success: false, error: 'Datos obligatorios faltantes (Trabajador, Nombre, Tipo).' }
 }

 const supabase = await createAdminClient()

 let file_url = ''
 let file_path = ''
 let size = 0

 // Handle File Upload on Server
 if (file && file.size > 0) {
 const { uploadFile, generateStoragePath } = await import('@/lib/storage')
 const storagePath = generateStoragePath(companyId, 'workers', worker_id, file.name)
 
 const uploadResult = await uploadFile(file, 'worker_documents', storagePath)
 file_url = uploadResult.publicUrl
 file_path = uploadResult.path
 size = file.size
 }

 const insertPayload: any = {
 worker_id,
 company_id: companyId,
 name,
 file_type,
 file_url: file_url || null,
 file_path: file_path || null,
 size: size || null,
 issue_date: issue_date || null,
 expiry_date: expiry_date || null,
 created_at: new Date().toISOString()
 }

 console.log('[DOCUMENTS] Stabilized Insert:', JSON.stringify(insertPayload))

 const { data, error } = await supabase
 .from('worker_documents')
 .insert(insertPayload)
 .select(`
 *, 
 worker:workers(name, last_name)
 `)

 if (error) {
 console.error('[DOCUMENTS] Insert error:', JSON.stringify(error))
 return { success: false, error: `Error de base de datos: ${error.message}` }
 }

 revalidatePath('/documents')
 revalidatePath('/dashboard')
 return { success: true, error: null, data: data?.[0] }
 } catch (e: any) {
 console.error('[DOCUMENTS] Unexpected error:', e.message)
 return { success: false, error: `Error inesperado: ${e.message}` }
 }
}

export async function deleteDocument(id: string) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const isAuthorized = extendedUser && extendedUser.role_id !== 'trabajador'

 if (!extendedUser || !isAuthorized || !companyId) {
 return { success: false, error: 'Acceso Denegado (403): Solo administradores pueden gestionar esta acción.' }
 }

 const supabase = await createClient()

 // Fetch document to extract file_path before deleting
 const { data: doc } = await applyIsolation(
 supabase.from('worker_documents').select('file_path'),
 companyId,
 extendedUser.role_id
 )
 .eq('id', id)
 .single()

 if (doc?.file_path) {
 // Remove file from storage
 await supabase.storage.from('worker_documents').remove([doc.file_path])
 }

 const { error } = await applyIsolation(
 supabase.from('worker_documents').delete(),
 companyId,
 extendedUser.role_id
 ).eq('id', id)

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
