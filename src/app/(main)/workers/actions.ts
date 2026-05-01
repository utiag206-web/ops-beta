'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'

export async function getWorkers(status?: string, isRecent?: boolean) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return []

  const supabase = await createAdminClient()

  let query = supabase
    .from('workers')
    .select('*, worker_financial(daily_rate, monthly_salary)')
    .eq('company_id', extendedUser.company_id)

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

  return workers.map((w: any) => {
    const fin = Array.isArray(w.worker_financial) ? w.worker_financial[0] : w.worker_financial
    return {
      ...w,
      daily_rate: fin?.daily_rate || 0,
      monthly_salary: fin?.monthly_salary || 0
    }
  })
}

export async function getWorkersShort() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return []

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('company_id', extendedUser.company_id)
    .order('name', { ascending: true })

  if (error) return []
  return data
}

export async function createWorker(prevState: any, formData: FormData) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser?.company_id) {
      return { success: false, error: 'No se encontró la empresa del usuario.' }
    }

    const allowedRoles = ['admin', 'operaciones']
    if (!extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
      return { success: false, error: 'No tienes permisos para crear trabajadores.' }
    }

    const name = formData.get('name') as string
    const dni = formData.get('dni') as string
    const position = formData.get('position') as string
    const phone = (formData.get('phone') as string) || null
    const hireDate = (formData.get('hire_date') as string) || null

    if (!name || !dni || !position) {
      return { success: false, error: 'Nombre, DNI y Cargo son obligatorios.' }
    }

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('workers')
      .insert({
        company_id: extendedUser.company_id,
        name,
        dni,
        position,
        phone,
        hire_date: hireDate,
        status: 'active'
      })

    if (error) {
      console.error('Error insertando trabajador:', error)
      return { success: false, error: 'Hubo un error al guardar el trabajador.' }
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
    const allowedRoles = ['admin', 'operaciones']
    if (!extendedUser?.company_id || !extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
      return { success: false, error: 'No tienes permisos para editar trabajadores.' }
    }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
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
      const fileName = `${extendedUser.company_id}/${id}-${Date.now()}.${fileExt}`
      
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
        dni,
        position,
        phone,
        hire_date: hireDate,
        status,
        photo_url
      })
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)

    if (error) {
      console.error('Error actualizando trabajador:', error)
      return { success: false, error: 'Hubo un error al actualizar el trabajador.' }
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
    const allowedRoles = ['admin', 'operaciones']
    if (!extendedUser?.company_id || !extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
      return { success: false, error: 'No tienes permisos.' }
    }

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)

    if (error) {
      console.error('Error eliminando trabajador:', error)
      return { success: false, error: 'Hubo un error al eliminar.' }
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
  if (!extendedUser?.company_id) return null

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('workers')
    .select('*, worker_financial(*), worker_personal(*)')
    .eq('id', id)
    .eq('company_id', extendedUser.company_id)
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
  const { extendedUser, user } = await getUserSession()
  if (!extendedUser?.company_id) return []

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('worker_documents')
    .select('*')
    .eq('worker_id', workerId)
    .eq('company_id', extendedUser.company_id)
    .order('created_at', { ascending: false })

  if (error) return []

  // Enhance documents with signed URLs for secure access
  const docsWithUrls = await Promise.all((data || []).map(async (doc) => {
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

    if (!extendedUser?.company_id) {
      return { success: false, error: 'No se detectó company_id en tu sesión.' }
    }

    const allowedRoles = ['admin', 'operaciones']
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
      .eq('company_id', extendedUser.company_id)
      .single()

    if (workerErr || !workerRecord) {
      return { success: false, error: 'Trabajador no encontrado o no pertenece a tu empresa.' }
    }

    // Upload file to Supabase Storage using central utility
    const { uploadFile, generateStoragePath } = await import('@/lib/storage')
    const storagePath = generateStoragePath(
      extendedUser.company_id,
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
        company_id: extendedUser.company_id,
        name,
        file_type: fileType,
        file_url: publicUrl,
        file_path: storagePath,
        size: file.size
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
    const allowedRoles = ['admin', 'operaciones']
    if (!extendedUser?.company_id || !extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
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
      .eq('company_id', extendedUser.company_id)

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
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createAdminClient()
  
  // Prepare data with company_id
  const workersToInsert = workersData.map(worker => ({
    name: worker.name,
    dni: worker.dni?.toString(),
    position: worker.position,
    phone: worker.phone?.toString(),
    hire_date: worker.hire_date || new Date().toISOString().split('T')[0],
    company_id: extendedUser.company_id,
    status: 'active'
  }))

  const { data, error } = await supabase
    .from('workers')
    .insert(workersToInsert)
    .select()

  if (error) {
    console.error('Error importing workers:', error)
    return { success: false, error: error.message }
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
    const allowedRoles = ['admin', 'operaciones']
    if (!extendedUser?.company_id || !extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
      return { success: false, error: 'No tienes permisos.' }
    }

    const supabase = await createAdminClient()
    const failedFields: string[] = []

    // 1. Update basic workers table - Safe Blocks
    const { error: errA } = await supabase
      .from('workers')
      .update({
        name: payload.laboral.name,
        dni: payload.laboral.document_number || payload.laboral.dni,
        position: payload.laboral.position,
        hire_date: payload.laboral.hire_date,
        status: payload.laboral.current_status || payload.laboral.status || 'ACTIVO',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', extendedUser.company_id)
    
    if (errA) throw new Error(`Fallo crítico en tabla trabajadores: ${errA.message}`)

    const extendedFields = {
      last_name: payload.laboral.last_name,
      cod: payload.laboral.cod,
      guardia: payload.laboral.guardia,
      condition: payload.laboral.condition,
      work_system: payload.laboral.work_system,
      termination_date: payload.laboral.termination_date
    }

    for (const [key, value] of Object.entries(extendedFields)) {
      if (!value) continue;
      const { error: errB } = await supabase
        .from('workers')
        .update({ [key]: value })
        .eq('id', id)
      
      if (errB) {
        failedFields.push(key)
        console.warn(`[SCHEMA_LIMITATION] Column '${key}' missing in root 'workers' table.`)
      }
    }

    // 2. Upsert financial
    const { error: err2 } = await supabase
      .from('worker_financial')
      .upsert({
        worker_id: id,
        company_id: extendedUser.company_id,
        ...payload.financial,
        updated_at: new Date().toISOString()
      }, { onConflict: 'worker_id' })

    if (err2) {
      console.error('[FINANCIAL_UPDATE_ERROR]', err2.message)
      failedFields.push('datos_financieros')
    }

    // 3. Upsert personal
    const { error: err3 } = await supabase
      .from('worker_personal')
      .upsert({
        worker_id: id,
        company_id: extendedUser.company_id,
        ...payload.personal,
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
  if (!extendedUser?.company_id) return []

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('worker_children')
    .select('*')
    .eq('worker_id', workerId)
    .eq('company_id', extendedUser.company_id)
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
    const allowedRoles = ['admin', 'operaciones']
    if (!extendedUser?.company_id || !extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
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
        .eq('company_id', extendedUser.company_id)
        .eq('worker_id', workerId)
      error = res.error
    } else {
      // Insert
      const res = await supabase
        .from('worker_children')
        .insert({
          company_id: extendedUser.company_id,
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
    const allowedRoles = ['admin', 'operaciones']
    if (!extendedUser?.company_id || !extendedUser.role_id || !allowedRoles.includes(extendedUser.role_id)) {
      return { success: false, error: 'No tienes permisos para eliminar.' }
    }

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('worker_children')
      .delete()
      .eq('id', id)
      .eq('worker_id', workerId)
      .eq('company_id', extendedUser.company_id)

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

