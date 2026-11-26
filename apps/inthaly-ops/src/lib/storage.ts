
// [HARDENING_SEGURIDAD] Reglas estrictas de validación de archivos
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'xlsx', 'xls', 'csv', 'doc', 'docx', 'txt']
const DANGEROUS_EXTENSIONS = ['svg', 'html', 'htm', 'xhtml', 'xml', 'exe', 'dll', 'bat', 'cmd', 'sh', 'php', 'js', 'mjs', 'py', 'cgi', 'vbs', 'ps1']
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15 Megabytes

export function validateUploadFile(fileName: string, sizeBytes: number, mimeType?: string) {
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`El archivo excede el tamaño máximo permitido de 15MB (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB)`)
  }
  if (!fileName || typeof fileName !== 'string' || fileName.includes('..') || fileName.startsWith('/') || fileName.includes('\\')) {
    throw new Error('Ruta o nombre de archivo inválido (Path Traversal detectado)')
  }
  const ext = (fileName.split('.').pop() || '').toLowerCase().trim()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext) || DANGEROUS_EXTENSIONS.includes(ext)) {
    throw new Error(`Tipo de archivo no permitido (.${ext}). Solo se permiten documentos seguros e imágenes (JPG, PNG, WEBP, PDF, Excel).`)
  }
}



export type StorageBucket = 'incidencias' | 'worker_documents' | 'ppe_signatures' | 'petty-cash' | 'soma' | 'planta'

export async function uploadFile(
  file: File | Blob, 
  bucket: StorageBucket, 
  path: string
) {
  // [HARDENING_CHECK] Validación preventiva de seguridad
  validateUploadFile(path, file.size, file.type)

  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = await createAdminClient()

  // 1. ArrayBuffer conversion
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // [MAGIC_BYTES_CHECK] Verificación de cabeceras de archivo para formatos comunes
  const fileExt = (path.split('.').pop() || '').toLowerCase().trim()
  if (buffer.length >= 4) {
    if (fileExt === 'pdf' && !buffer.slice(0, 4).toString().startsWith('%PDF')) {
      throw new Error('Contenido de archivo inválido: Cabecera no coincide con formato PDF legítimo.')
    }
    if (fileExt === 'png' && (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47)) {
      throw new Error('Contenido de archivo inválido: Cabecera no coincide con formato PNG legítimo.')
    }
    if ((fileExt === 'jpg' || fileExt === 'jpeg') && (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF)) {
      throw new Error('Contenido de archivo inválido: Cabecera no coincide con formato JPEG legítimo.')
    }
  }
 
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
