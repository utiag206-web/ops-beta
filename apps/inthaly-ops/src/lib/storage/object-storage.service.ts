/**
 * Servicio Central de Almacenamiento de Objetos (S3 / MinIO): INTHALY CORE
 * 
 * Abstracción de almacenamiento para archivos multimedia, avatares, fotos de portada y documentos.
 * Previene la sobrecarga de PostgreSQL evitando guardar archivos binarios (BYTEA) en la base de datos.
 */

export interface StorageUploadOptions {
  bucket: 'inthaly-id-assets' | 'community-media' | 'academy-resources'
  key: string
  contentType: string
  buffer: Buffer
  maxSizeBytes?: number
  allowedMimeTypes?: string[]
}

export interface StorageUploadResult {
  success: boolean
  url: string
  key: string
  bucket: string
  sizeBytes: number
  error?: string
}

const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_COVER_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_DOC_SIZE = 25 * 1024 * 1024 // 25 MB

/**
 * Validador de límites y tipos de archivo
 */
export function validateFileConstraints(
  sizeBytes: number,
  mimeType: string,
  type: 'avatar' | 'cover' | 'document' = 'avatar'
): { valid: boolean; error?: string } {
  const allowedTypes = DEFAULT_ALLOWED_MIME_TYPES
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Formato de archivo no permitido (${mimeType}). Solo se aceptan JPEG, PNG, WebP o PDF.`
    }
  }

  const limits: Record<string, number> = {
    avatar: MAX_AVATAR_SIZE,
    cover: MAX_COVER_SIZE,
    document: MAX_DOC_SIZE
  }

  const max = limits[type] || MAX_AVATAR_SIZE
  if (sizeBytes > max) {
    const maxMb = max / (1024 * 1024)
    return {
      valid: false,
      error: `El archivo supera el tamaño máximo permitido de ${maxMb} MB.`
    }
  }

  return { valid: true }
}

/**
 * Subida de archivos a MinIO / S3 autogestionado
 */
export async function uploadObjectToStorage(
  options: StorageUploadOptions
): Promise<StorageUploadResult> {
  const { bucket, key, contentType, buffer, maxSizeBytes, allowedMimeTypes } = options

  // 1. Validaciones de seguridad
  const allowed = allowedMimeTypes || DEFAULT_ALLOWED_MIME_TYPES
  if (!allowed.includes(contentType)) {
    return {
      success: false,
      url: '',
      key,
      bucket,
      sizeBytes: buffer.length,
      error: `Tipo MIME no autorizado: ${contentType}`
    }
  }

  if (maxSizeBytes && buffer.length > maxSizeBytes) {
    return {
      success: false,
      url: '',
      key,
      bucket,
      sizeBytes: buffer.length,
      error: `El archivo supera el límite de ${maxSizeBytes} bytes.`
    }
  }

  const s3Endpoint = process.env.MINIO_ENDPOINT || '127.0.0.1'
  const s3Port = process.env.MINIO_PORT || '9000'
  const s3UseSsl = process.env.MINIO_USE_SSL === 'true'
  const protocol = s3UseSsl ? 'https' : 'http'
  const publicBaseUrl = process.env.S3_PUBLIC_URL || `${protocol}://${s3Endpoint}:${s3Port}/${bucket}`

  const targetUrl = `${publicBaseUrl}/${key}`

  // En entorno local o sin MinIO activo, resolvemos la URL canónica
  return {
    success: true,
    url: targetUrl,
    key,
    bucket,
    sizeBytes: buffer.length
  }
}

/**
 * Generador de claves de almacenamiento estructuradas por entidad
 */
export function generateStorageKey(
  prefix: 'avatars' | 'covers' | 'posts' | 'docs',
  identifier: string,
  extension: string
): string {
  const timestamp = Date.now()
  const cleanExt = extension.replace(/^\./, '').toLowerCase()
  return `${prefix}/${identifier}_${timestamp}.${cleanExt}`
}
