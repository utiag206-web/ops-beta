import { createClient, createAdminClient } from '@/lib/supabase/server'

export type StorageBucket = 'incidencias' | 'worker_documents' | 'ppe' | 'petty-cash' | 'soma'

export async function uploadFile(
  file: File | Blob, 
  bucket: StorageBucket, 
  path: string
) {
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
  const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  return `${companyId}/${module}/${identifier}/${timestamp}_${cleanName}.${fileExt}`
}
