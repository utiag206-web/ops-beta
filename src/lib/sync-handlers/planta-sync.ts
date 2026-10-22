import { updateBatchInCache, saveBatchesToCache } from '@/lib/offline-sync'
import { createPlantBatch, updatePlantBatch, createPlantSample, updatePlantSample } from '@/app/(main)/operaciones/planta/actions'
import { uploadBase64Photo } from '@/lib/upload-base64'

export async function plantaSyncHandler(action: string, payload: any): Promise<boolean | { success: boolean, newId?: string }> {
  try {
    const targetObj = action.startsWith('update') ? payload.updates : payload;
    const safeCompanyId = payload.company_id || payload.updates?.company_id || targetObj?.company_id || 'general';
    
    // Check if there are offline photos to upload in evidences array
    if (targetObj && Array.isArray(targetObj.evidences)) {
      for (let i = 0; i < targetObj.evidences.length; i++) {
        const ev = targetObj.evidences[i];
        if (ev.url && ev.url.startsWith('data:image')) {
          const uploadedUrl = await uploadBase64Photo(ev.url, safeCompanyId, 'planta');
          if (uploadedUrl) {
            targetObj.evidences[i].url = uploadedUrl;
          }
        }
      }
    }

    switch (action) {
      case 'create_batch': {
        const { id, isPending, ...batchData } = payload;
        const res = await createPlantBatch(batchData)
        return res.success ? { success: true, newId: res.data?.id } : false
      }
      case 'update_batch': {
        const res = await updatePlantBatch(payload.id, payload.updates)
        if (res.success && res.data) {
          await updateBatchInCache(payload.id, res.data as any)
          return { success: true }
        }
        return res.success ? { success: true } : false
      }
      case 'create_sample': {
        const { id, isPending, ...sampleData } = payload;
        const res = await createPlantSample(sampleData)
        return res.success ? { success: true, newId: res.data?.id } : false
      }
      case 'update_sample': {
        const res = await updatePlantSample(payload.id, payload.updates)
        return res.success ? { success: true } : false
      }
      default:
        console.warn('Unknown planta action:', action)
        return false
    }
  } catch (error) {
    console.error('Planta sync error:', error)
    return false
  }
}
