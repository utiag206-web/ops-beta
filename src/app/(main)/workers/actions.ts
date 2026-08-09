'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { generateAutomaticWorkerCodes } from '@/lib/company-hr-settings'

export async function getWorkers(status?: string, isRecent?: boolean) {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 const supabase = await createAdminClient()

 let query = supabase
 .from('workers')
 .select('*, worker_financial(daily_rate, monthly_salary)')
 
 query = applyIsolation(query, companyId, extendedUser.role_id)

 if (status) {
 query = query.eq('status', status)
 }

 if (isRecent) {
 const thirtyDaysAgo = new Date()
 thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
 query = query.gte('created_at', thirtyDaysAgo.toISOString())
 }

 const { data: workers, error } = await query.order('created_at', { ascending: false })

 if (error) {
 console.error('Error fetching workers', error)
 return []
 }

 return (workers || []).map((w: any) => {
 const fin = Array.isArray(w.worker_financial) ? w.worker_financial[0] : w.worker_financial
 return {
 ...w,
 daily_rate: fin?.daily_rate || 0,
 monthly_salary: fin?.monthly_salary || 0
 }
 })
}

export async function exportWorkersAllData() {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 const supabase = await createAdminClient()
 let query = supabase
 .from('workers')
 .select('*, worker_financial(*), worker_personal(*)')
 
 query = applyIsolation(query, companyId, extendedUser.role_id)

 const { data, error } = await query
 .order('name', { ascending: true })

 if (error) {
 console.error('Error fetching workers for export:', error)
 return []
 }

 return data.map(w => {
 const fin = Array.isArray(w.worker_financial) ? w.worker_financial[0] : w.worker_financial
 const pers = Array.isArray(w.worker_personal) ? w.worker_personal[0] : w.worker_personal

 return {
 ...w,
 financial: fin || {},
 personal: pers || {}
 }
 })
}

export async function getWorkersShort() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  const supabase = await createAdminClient()
  const { data, error } = await applyIsolation(
  supabase.from('workers').select('*'),
  companyId,
  extendedUser.role_id
  ).eq('status', 'active').order('name', { ascending: true })

  if (error) return []
  return data
}

export async function getAllWorkersForExport() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  const supabase = await createAdminClient()
  const { data, error } = await applyIsolation(
    supabase.from('workers').select('*, worker_personal(area)'),
    companyId,
    extendedUser.role_id
  ).order('name', { ascending: true })

  if (error) return []
  return data
}

export async function createWorker(prevState: any, formData: FormData) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 const allowedRoles = ['admin', 'operaciones', 'super_admin', 'superadmin']
 if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
 return { success: false, error: 'No tienes permisos para crear trabajadores.' }
 }

 const name = formData.get('name') as string
 const lastName = formData.get('last_name') as string
 const dni = formData.get('dni') as string
 const position = formData.get('position') as string
 const phone = (formData.get('phone') as string) || null
 const hireDate = (formData.get('hire_date') as string) || null

 if (!name || !dni || !position) {
 return { success: false, error: 'Nombre, DNI y Cargo son obligatorios.' }
 }

 const supabase = await createAdminClient()

  let cod = (formData.get('cod') as string) || null
  if (!cod) {
  const generatedCodes = await generateAutomaticWorkerCodes(supabase, companyId, 1)
  cod = generatedCodes[0]
  }

  const { data: newWorker, error } = await supabase
  .from('workers')
  .insert({
  company_id: companyId,
  name,
  last_name: lastName || null,
  dni,
  cod,
  position,
  phone,
  hire_date: hireDate || null,
  status: 'active'
  })
  .select('id')
  .single()

 if (error || !newWorker) {
 console.error('Error insertando trabajador:', error)
 return { success: false, error: 'Hubo un error al guardar el trabajador.' }
 }

 // Sync phone number to worker_personal
 const { error: personalErr } = await supabase
 .from('worker_personal')
 .upsert({
 worker_id: newWorker.id,
 company_id: companyId,
 phone_number: phone,
 updated_at: new Date().toISOString()
 }, { onConflict: 'worker_id' })

 if (personalErr) {
 console.error('Error syncing phone to worker_personal:', personalErr.message)
 }

 revalidatePath('/workers')
 revalidatePath('/dashboard')
 return { success: true, error: null }
 } catch (error) {
 return { success: false, error: 'Error inesperado.' }
 }
}

export async function updateWorker(prevState: any, formData: FormData) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const allowedRoles = ['admin', 'operaciones', 'super_admin', 'superadmin']
 if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
 return { success: false, error: 'No tienes permisos para editar trabajadores.' }
 }

 const id = formData.get('id') as string
 const name = formData.get('name') as string
 const lastName = formData.get('last_name') as string
 const dni = formData.get('dni') as string
 const position = formData.get('position') as string
 const phone = (formData.get('phone') as string) || null
 const hireDate = (formData.get('hire_date') as string) || null
 const status = (formData.get('status') as string) || 'active'
 
 // Photo handling
 const photoFile = formData.get('photo') as File | null
 let photo_url = formData.get('existing_photo_url') as string | null

 if (!id || !name || !dni || !position) {
 return { success: false, error: 'Nombre, DNI y Cargo son obligatorios.' }
 }

 const supabase = await createAdminClient()

 if (photoFile && photoFile.size > 0) {
 const fileExt = photoFile.name.split('.').pop()
 const fileName = `${companyId}/${id}-${Date.now()}.${fileExt}`
 
 const { data: uploadData, error: uploadError } = await supabase.storage
 .from('worker_photos')
 .upload(fileName, photoFile, {
 cacheControl: '3600',
 upsert: true
 })

 if (uploadError) {
 console.error('Error uploading photo:', uploadError)
 return { success: false, error: 'Error al subir la fotografía.' }
 }

 const { data: publicUrlData } = supabase.storage
 .from('worker_photos')
 .getPublicUrl(fileName)
 
 photo_url = publicUrlData.publicUrl
 }

 const { error } = await supabase
 .from('workers')
 .update({
 name,
 last_name: lastName || null,
 dni,
 position,
 phone,
 hire_date: hireDate || null,
 status,
 photo_url
 })
 .eq('id', id)
 .eq('company_id', companyId)

 if (error) {
 console.error('Error actualizando trabajador:', error)
 return { success: false, error: 'Hubo un error al actualizar el trabajador.' }
 }

 // Sync phone number to worker_personal
 const { error: personalErr } = await supabase
 .from('worker_personal')
 .upsert({
 worker_id: id,
 company_id: companyId,
 phone_number: phone,
 updated_at: new Date().toISOString()
 }, { onConflict: 'worker_id' })

 if (personalErr) {
 console.error('Error syncing phone to worker_personal:', personalErr.message)
 }

 revalidatePath('/workers')
 revalidatePath('/dashboard')
 return { success: true, error: null }
 } catch (error) {
 return { success: false, error: 'Error inesperado.' }
 }
}

export async function deleteWorker(id: string) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const allowedRoles = ['admin', 'operaciones', 'super_admin', 'superadmin']
 if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
 return { success: false, error: 'No tienes permisos.' }
 }

 const supabase = await createAdminClient()

  const { error } = await supabase
  .from('workers')
  .update({ status: 'inactive' })
  .eq('id', id)
  .eq('company_id', companyId)

 if (error) {
 console.error('Error desactivando trabajador:', error)
 return { success: false, error: `Hubo un error al desactivar: ${error.message}` }
 }

 revalidatePath('/workers')
 revalidatePath('/dashboard')
 return { success: true, error: null }
 } catch (error) {
 return { success: false, error: 'Error inesperado.' }
 }
}

export async function reactivateWorker(id: string) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const allowedRoles = ['admin', 'operaciones', 'super_admin', 'superadmin']
 if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
 return { success: false, error: 'No tienes permisos.' }
 }

 const supabase = await createAdminClient()

  const { error } = await supabase
  .from('workers')
  .update({ status: 'active' })
  .eq('id', id)
  .eq('company_id', companyId)

 if (error) {
 console.error('Error reactivando trabajador:', error)
 return { success: false, error: `Hubo un error al reactivar: ${error.message}` }
 }

 revalidatePath('/workers')
 revalidatePath('/dashboard')
 return { success: true, error: null }
 } catch (error) {
 return { success: false, error: 'Error inesperado.' }
 }
}



// --- DOCUMENT ACTIONS ---

export async function getWorkerById(id: string) {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 const supabase = await createAdminClient()
 const { data, error } = await applyIsolation(
 supabase.from('workers').select('*, worker_financial(*), worker_personal(*)'),
 companyId,
 extendedUser.role_id
 )
 .eq('id', id)
 .single()

 if (error) {
 console.error('Error fetching worker by id:', error)
 return null
 }

 // Flatten the relations slightly for easier frontend access
 const fin = Array.isArray(data.worker_financial) ? data.worker_financial[0] : data.worker_financial
 const pers = Array.isArray(data.worker_personal) ? data.worker_personal[0] : data.worker_personal

 return {
 ...data,
 financial: fin || {},
 personal: pers || {}
 }
}

export async function getWorkerDocuments(workerId: string) {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 const supabase = await createAdminClient()
 const { data, error } = await applyIsolation(
 supabase.from('worker_documents').select('*'),
 companyId,
 extendedUser.role_id
 ).eq('worker_id', workerId)
 .order('created_at', { ascending: false })

 if (error) return []

 // Enhance documents with signed URLs for secure access
 const docsWithUrls = await Promise.all((data || []).map(async (doc: any) => {
 if (!doc.file_path) return doc;

 const { data: signedData, error: signedError } = await supabase.storage
 .from('worker_documents')
 .createSignedUrl(doc.file_path, 3600) // 1 hour access

 return {
 ...doc,
 file_url: signedData?.signedUrl || doc.file_url // Fallback to public if signed fails
 }
 }))

 return docsWithUrls
}

export async function uploadWorkerDocument(formData: FormData) {
 try {
 const { extendedUser } = await getUserSession()

 const workerId = formData.get('worker_id') as string
 const name = formData.get('name') as string
 const fileType = formData.get('file_type') as string
 const file = formData.get('file') as File
 const issueDate = (formData.get('issue_date') as string) || null
 const expiryDate = (formData.get('expiry_date') as string) || null

 const companyId = await getStrictCompanyId()

 const allowedRoles = ['admin', 'operaciones', 'super_admin', 'superadmin']
 if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
 return { success: false, error: `Tu rol (${extendedUser.role_id}) no tiene permisos para subir documentos.` }
 }

 if (!file || file.size === 0) {
 return { success: false, error: 'El archivo está vacío o no se seleccionó.' }
 }

 const supabase = await createAdminClient()

 // Verify the worker belongs to the same company
 const { data: workerRecord, error: workerErr } = await supabase
 .from('workers')
 .select('id, company_id')
 .eq('id', workerId)
 .eq('company_id', companyId)
 .single()

 if (workerErr || !workerRecord) {
 return { success: false, error: 'Trabajador no encontrado o no pertenece a tu empresa.' }
 }

 // Upload file to Supabase Storage using central utility
 const { uploadFile, generateStoragePath } = await import('@/lib/storage')
 const storagePath = generateStoragePath(
 companyId,
 'workers',
 workerId,
 file.name
 )

 const { publicUrl } = await uploadFile(file, 'worker_documents', storagePath)

 // Save record to database
 const { error: dbError } = await supabase
 .from('worker_documents')
 .insert({
 worker_id: workerId,
 company_id: companyId,
 name,
 file_type: fileType,
 file_url: publicUrl,
 file_path: storagePath,
 size: file.size,
 issue_date: issueDate,
 expiry_date: expiryDate
 })

 if (dbError) {
 console.error('[UPLOAD] DB insert error:', dbError)
 return { success: false, error: `Error al guardar registro: ${dbError.message}` }
 }

 revalidatePath(`/workers/${workerId}`)
 revalidatePath('/dashboard')
 return { success: true, error: null }

 } catch (error: any) {
 console.error('[UPLOAD] Unexpected error:', error)
 return { success: false, error: `Error inesperado: ${error.message}` }
 }
}

export async function deleteWorkerDocument(id: string, workerId: string, filePath: string) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const allowedRoles = ['admin', 'operaciones', 'super_admin', 'superadmin']
 if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
 return { success: false, error: 'No tienes permisos.' }
 }

 const supabase = await createAdminClient()

 // 1. Delete from Storage
 const { error: storageError } = await supabase.storage
 .from('worker_documents')
 .remove([filePath])

 if (storageError) {
 console.error('Storage Delete Error:', storageError)
 return { success: false, error: 'Error al eliminar el archivo.' }
 }

 // 2. Delete from DB
 const { error: dbError } = await supabase
 .from('worker_documents')
 .delete()
 .eq('id', id)
 .eq('company_id', companyId)

 if (dbError) {
 console.error('DB Delete Error:', dbError)
 return { success: false, error: 'Error al eliminar el registro.' }
 }

 revalidatePath(`/workers/${workerId}`)
 revalidatePath('/dashboard')
 return { success: true, error: null }
 } catch (error) {
 console.error('Unexpected Error:', error)
 return { success: false, error: 'Error inesperado.' }
 }
}

export async function importWorkers(workersData: any[]) {
 const companyId = await getStrictCompanyId()

  const supabase = await createAdminClient()
  
  const missingCodCount = workersData.filter((w: any) => !w.cod).length
  let autoCodes: string[] = []
  if (missingCodCount > 0) {
  autoCodes = await generateAutomaticWorkerCodes(supabase, companyId, missingCodCount)
  }

  let autoIndex = 0
  const workersToInsert = workersData.map((worker: any) => {
  let finalCod = worker.cod || null
  if (!finalCod) {
  finalCod = autoCodes[autoIndex++]
  }
  return {
  name: worker.name,
  last_name: worker.last_name || null,
  dni: worker.dni?.toString(),
  document_number: worker.dni?.toString(),
  cod: finalCod,
  position: worker.position,
  phone: worker.phone?.toString(),
  hire_date: worker.hire_date || new Date().toISOString().split('T')[0],
  company_id: companyId,
  status: 'active'
  }
  })

 const { data, error } = await supabase
 .from('workers')
 .upsert(workersToInsert, { 
 onConflict: 'company_id, dni',
 ignoreDuplicates: false 
 })
 .select()

 if (error) {
 console.error('Error importing workers:', error)
 return { success: false, error: error.message }
 }

 if (data && data.length > 0) {
 // Inicializar worker_personal y worker_financial en lote para evitar datos huérfanos
 const personalToUpsert = data.map((w: any) => {
 const orig = workersToInsert.find((x: any) => x.dni === w.dni);
 return {
 worker_id: w.id,
 company_id: companyId,
 phone_number: orig?.phone || null,
 updated_at: new Date().toISOString()
 };
 });

 const financialToUpsert = data.map((w: any) => ({
 worker_id: w.id,
 company_id: companyId,
 daily_rate: 0,
 monthly_salary: 0,
 updated_at: new Date().toISOString()
 }));

 const { error: personalErr } = await supabase
 .from('worker_personal')
 .upsert(personalToUpsert, { onConflict: 'worker_id' });

 if (personalErr) {
 console.error('Error importing worker_personal rows:', personalErr.message);
 }

 const { error: financialErr } = await supabase
 .from('worker_financial')
 .upsert(financialToUpsert, { onConflict: 'worker_id' });

 if (financialErr) {
 console.error('Error importing worker_financial rows:', financialErr.message);
 }
 }

 revalidatePath('/workers')
 revalidatePath('/dashboard')
 return { success: true, count: data.length }
}

export async function updateWorkerFullProfile(id: string, payload: {
 laboral: any,
 financial: any,
 personal: any
}) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const allowedRoles = ['admin', 'operaciones', 'super_admin', 'superadmin']
 if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
 return { success: false, error: 'No tienes permisos.' }
 }

 const supabase = await createAdminClient()
 const failedFields: string[] = []

 // 1. Update basic workers table
 const { error: errA } = await supabase
 .from('workers')
 .update({
 name: payload.laboral.name,
 last_name: payload.laboral.last_name || null,
 dni: payload.laboral.document_number || payload.laboral.dni,
 document_number: payload.laboral.document_number || payload.laboral.dni,
 cod: payload.laboral.cod || null,
 position: payload.laboral.position,
 guardia: payload.laboral.guardia || null,
 condition: payload.laboral.condition || null,
 work_system: payload.laboral.work_system || null,
 phone: payload.personal.phone_number || null,
 hire_date: payload.laboral.hire_date || null,
 termination_date: payload.laboral.termination_date || null,
 status: payload.laboral.current_status || payload.laboral.status || 'active',
 updated_at: new Date().toISOString()
 })
 .eq('id', id)
 .eq('company_id', companyId)
 
 if (errA) throw new Error(`Fallo crítico en tabla trabajadores: ${errA.message}`)

 // 2. Upsert financial
 const { error: err2 } = await supabase
 .from('worker_financial')
 .upsert({
 worker_id: id,
 company_id: companyId,
 ...payload.financial,
 updated_at: new Date().toISOString()
 }, { onConflict: 'worker_id' })

 if (err2) {
 console.error('[FINANCIAL_UPDATE_ERROR]', err2.message)
 failedFields.push('datos_financieros')
 }

 const sanitizedPersonal = {
 ...payload.personal,
 birth_date: payload.personal.birth_date || null,
 marital_status: payload.personal.marital_status || null,
 gender: payload.personal.gender || null
 }

 // 3. Upsert personal
 const { error: err3 } = await supabase
 .from('worker_personal')
 .upsert({
 worker_id: id,
 company_id: companyId,
 ...sanitizedPersonal,
 updated_at: new Date().toISOString()
 }, { onConflict: 'worker_id' })

 if (err3) {
 console.error('[PERSONAL_UPDATE_ERROR]', err3.message)
 failedFields.push('datos_personales')
 }

 revalidatePath(`/workers/${id}`)
 revalidatePath('/workers')
 
 return { 
 success: true, 
 failedFields: failedFields.length > 0 ? failedFields : undefined,
 message: failedFields.length > 0 
 ? `Guardado parcial en el servidor principal. Campos no compatibles omitidos: ${failedFields.join(', ')}` 
 : 'Perfil actualizado exitosamente en producción.'
 }
 } catch (error: any) {
 console.error('[UPDATE FULL PROFILE] Fatal Error in Root:', error)
 return { success: false, error: error.message || 'Error al procesar la actualización del perfil.' }
 }
}

// --- WORKER CHILDREN ACTIONS ---

export async function getWorkerChildren(workerId: string) {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()

 const supabase = await createAdminClient()
 const { data, error } = await applyIsolation(
 supabase.from('worker_children').select('*'),
 companyId,
 extendedUser.role_id
 )
 .eq('worker_id', workerId)
 .order('fecha_nacimiento', { ascending: true })

 if (error) {
 console.error('Error fetching worker children:', error)
 return []
 }

 return data
}

export async function upsertWorkerChild(formData: FormData) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const allowedRoles = ['admin', 'operaciones', 'super_admin', 'superadmin']
 if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
 return { success: false, error: 'No tienes permisos para gestionar hijos.' }
 }

 const workerId = formData.get('worker_id') as string
 const id = formData.get('id') as string // optional for update
 const nombre = formData.get('nombre') as string
 const fecha_nacimiento = formData.get('fecha_nacimiento') as string
 const genero = formData.get('genero') as string

 if (!workerId || !nombre || !fecha_nacimiento) {
 return { success: false, error: 'Nombre y Fecha de Nacimiento son obligatorios.' }
 }

 const supabase = await createAdminClient()

 let error

 if (id) {
 // Update
 const res = await supabase
 .from('worker_children')
 .update({
 nombre,
 fecha_nacimiento,
 genero,
 updated_at: new Date().toISOString()
 })
 .eq('id', id)
 .eq('company_id', companyId)
 .eq('worker_id', workerId)
 error = res.error
 } else {
 // Insert
 const res = await supabase
 .from('worker_children')
 .insert({
 company_id: companyId,
 worker_id: workerId,
 nombre,
 fecha_nacimiento,
 genero
 })
 error = res.error
 }

 if (error) {
 console.error('Error guardando hijo:', error)
 return { success: false, error: 'Error al guardar el registro del hijo.' }
 }

 revalidatePath(`/workers/${workerId}`)
 return { success: true, error: null }
 } catch (err: any) {
 return { success: false, error: 'Error inesperado al procesar la solicitud.' }
 }
}

export async function deleteWorkerChild(id: string, workerId: string) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const allowedRoles = ['admin', 'operaciones', 'super_admin', 'superadmin']
 if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
 return { success: false, error: 'No tienes permisos para eliminar.' }
 }

 const supabase = await createAdminClient()
 const { error } = await supabase
 .from('worker_children')
 .delete()
 .eq('id', id)
 .eq('worker_id', workerId)
 .eq('company_id', companyId)

 if (error) {
 console.error('Error eliminando hijo:', error)
 return { success: false, error: 'Hubo un error al eliminar el registro.' }
 }

 revalidatePath(`/workers/${workerId}`)
 return { success: true, error: null }
 } catch (error) {
 return { success: false, error: 'Error inesperado.' }
 }
}

export async function uploadWorkerPhoto(workerId: string, formData: FormData) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const allowedRoles = ['admin', 'operaciones', 'super_admin', 'superadmin']
 if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
 return { success: false, error: 'No tienes permisos para subir fotografías.' }
 }

 const photoFile = formData.get('photo') as File | null
 if (!photoFile || photoFile.size === 0) {
 return { success: false, error: 'No se ha proporcionado ningún archivo.' }
 }

 const supabase = await createAdminClient()

 const fileExt = photoFile.name.split('.').pop()
 const fileName = `${companyId}/${workerId}-${Date.now()}.${fileExt}`

 const { data: uploadData, error: uploadError } = await supabase.storage
 .from('worker_photos')
 .upload(fileName, photoFile, {
 cacheControl: '3600',
 upsert: true
 })

 if (uploadError) {
 console.error('Error uploading photo:', uploadError)
 return { success: false, error: 'Error al subir la fotografía a almacenamiento.' }
 }

 const { data: publicUrlData } = supabase.storage
 .from('worker_photos')
 .getPublicUrl(fileName)

 const photo_url = publicUrlData.publicUrl

 const { error: dbError } = await supabase
 .from('workers')
 .update({ photo_url })
 .eq('id', workerId)

 if (dbError) {
 console.error('Error updating worker photo URL:', dbError)
 return { success: false, error: 'La fotografía se subió pero no se pudo asociar al trabajador.' }
 }

 revalidatePath(`/workers/${workerId}`)
 revalidatePath('/workers')
 revalidatePath('/dashboard')
 
 return { success: true, photo_url }
 } catch (error: any) {
 console.error('Unexpected upload error:', error)
 return { success: false, error: error.message || 'Error inesperado al subir la foto.' }
 }
}

