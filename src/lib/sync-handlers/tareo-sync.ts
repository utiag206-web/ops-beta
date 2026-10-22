import { upsertTareoRecord } from '@/app/(main)/tareo/actions'

export async function tareoSyncHandler(action: string, payload: any): Promise<boolean> {
  try {
    switch (action) {
      case 'upsert_tareo_record': {
        const res = await upsertTareoRecord({
          worker_id: payload.worker_id,
          date: payload.date,
          status: payload.status
        })
        return res.success
      }
      default:
        console.warn('Unknown tareo action:', action)
        return false
    }
  } catch (error) {
    console.error('[SYNC_ERROR] tareoSyncHandler:', error)
    return false
  }
}
