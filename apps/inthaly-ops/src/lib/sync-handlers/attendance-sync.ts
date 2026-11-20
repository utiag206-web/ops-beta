import { checkIn, checkOut } from '@/app/(main)/attendance/actions'

export async function attendanceSyncHandler(action: string, payload: any): Promise<boolean> {
  try {
    switch (action) {
      case 'check_in': {
        const res = await checkIn()
        return res.success
      }
      case 'check_out': {
        const res = await checkOut()
        return res.success
      }
      default:
        console.warn('Unknown attendance action:', action)
        return false
    }
  } catch (error) {
    console.error('[SYNC_ERROR] attendanceSyncHandler:', error)
    return false
  }
}
