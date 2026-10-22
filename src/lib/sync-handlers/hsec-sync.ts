import { createHsecStop, updateHsecStop, deleteHsecStop, closeHsecStop } from '@/app/(main)/soma/hsec/actions'

export async function hsecSyncHandler(action: string, payload: any): Promise<boolean> {
  try {
    switch (action) {
      case 'create_hsec_stop': {
        const res = await createHsecStop(payload)
        return !res.error
      }
      case 'update_hsec_stop': {
        const res = await updateHsecStop(payload.id, payload.updates)
        return !res.error
      }
      case 'delete_hsec_stop': {
        const res = await deleteHsecStop(payload.id)
        return !res.error
      }
      case 'close_hsec_stop': {
        const res = await closeHsecStop(payload.id)
        return !res.error
      }
      default:
        console.warn('Unknown hsec action:', action)
        return false
    }
  } catch (error) {
    console.error('HSEC sync error:', error)
    return false
  }
}
