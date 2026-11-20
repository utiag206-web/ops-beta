import { createIncidencia } from '@/app/(main)/incidencias/actions'
import { uploadBase64Photo } from '@/lib/upload-base64'

export async function incidenciasSyncHandler(action: string, payload: any): Promise<boolean> {
  try {
    if (payload.evidence_base64) {
      const url = await uploadBase64Photo(payload.evidence_base64, payload.company_id || 'unknown', 'soma')
      if (url) {
        payload.photo_urls = [url]
      }
      delete payload.evidence_base64
    }

    switch (action) {
      case 'create_incidencia': {
        const res = await createIncidencia(payload)
        return !!res?.success
      }
      default:
        console.warn('Unknown incidencias action:', action)
        return false
    }
  } catch (error) {
    console.error('[SYNC_ERROR] incidenciasSyncHandler:', error)
    return false
  }
}
