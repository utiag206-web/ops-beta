

export type StorageBucket = 'incidencias' | 'worker_documents' | 'ppe_signatures' | 'petty-cash' | 'soma'

export async function uploadFile(
 file: File | Blob, 
 bucket: StorageBucket, 
 path: string
) {
 const { createAdminClient } = await import('@/lib/supabase/server')
 const supabase = await createAdminClient()

 // 1. ArrayBuffer conversion
 const arrayBuffer = await file.arrayBuffer()
 const buffer = Buffer.from(arrayBuffer)
 
 // 2. Upload to Supabase
 const { data, error } = await supabase.storage
 .from(bucket)
 .upload(path, buffer, {
 contentType: file.type,
 upsert: true
 })

 if (error) {
 console.error(`[STORAGE_UPLOAD_ERROR] Bucket: ${bucket}, Path: ${path}:`, error.message)
 throw new Error(`Error al subir archivo: ${error.message}`)
 }

 // 3. Get Public URL
 const { data: { publicUrl } } = supabase.storage
 .from(bucket)
 .getPublicUrl(path)

 return {
 path: data.path,
 publicUrl
 }
}

export async function deleteFile(bucket: StorageBucket, path: string) {
 const { createAdminClient } = await import('@/lib/supabase/server')
 const supabase = await createAdminClient()
 const { error } = await supabase.storage.from(bucket).remove([path])
 if (error) {
 console.error(`[STORAGE_DELETE_ERROR] Bucket: ${bucket}, Path: ${path}:`, error.message)
 return { error: error.message }
 }
 return { success: true }
}

export function generateStoragePath(companyId: string, module: string, identifier: string, fileName: string) {
 const fileExt = fileName.split('.').pop()
 const timestamp = Date.now()
 
 // Sanitización profunda para evitar "Invalid key" en Supabase
 const sanitize = (text: string) => text
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
 .replace(/[^a-zA-Z0-9]/g, '_') // Cambiar caracteres especiales por guiones
 .toLowerCase()

 const sModule = sanitize(module)
 const sIdentifier = sanitize(identifier)
 const sFileName = sanitize(fileName.replace(`.${fileExt}`, ''))

 return `${companyId}/${sModule}/${sIdentifier}/${timestamp}_${sFileName}.${fileExt}`
}
