import { signWorkerPortalPPEDelivery } from '@/app/actions/worker-portal'

export async function ppeSyncHandler(action: string, payload: any): Promise<boolean> {
  try {
    switch (action) {
      case 'sign_delivery': {
        const res = await signWorkerPortalPPEDelivery(payload.deliveryId, payload.signatureBase64)
        return res.success
      }
      default:
        console.warn('Unknown ppe action:', action)
        return false
    }
  } catch (error) {
    console.error('[SYNC_ERROR] ppeSyncHandler:', error)
    return false
  }
}
