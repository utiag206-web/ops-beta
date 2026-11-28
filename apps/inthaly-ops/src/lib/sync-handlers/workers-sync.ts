import { createWorker } from '@/app/(main)/workers/actions'

export async function workersSyncHandler(action: string, payload: any): Promise<boolean | { success: boolean, newId?: string }> {
  try {
    switch (action) {
      case 'create_worker': {
        const formData = new FormData()
        if (payload.name) formData.append('name', payload.name)
        if (payload.last_name) formData.append('last_name', payload.last_name)
        if (payload.dni) formData.append('dni', payload.dni)
        if (payload.position) formData.append('position', payload.position)
        if (payload.phone) formData.append('phone', payload.phone)
        if (payload.hire_date) formData.append('hire_date', payload.hire_date)
        if (payload.cod) formData.append('cod', payload.cod)

        const res = await createWorker(null, formData)
        if (res && res.success) {
          return {
            success: true,
            newId: (res as any)?.worker?.id || (res as any)?.id
          }
        }
        return false
      }
      default:
        console.warn('[SYNC_WORKERS] Unknown workers action:', action)
        return false
    }
  } catch (error) {
    console.error('[SYNC_ERROR] workersSyncHandler:', error)
    return false
  }
}
