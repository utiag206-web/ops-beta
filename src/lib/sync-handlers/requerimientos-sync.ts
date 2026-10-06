import { createRequirement, updateRequirementStatus } from '@/app/(main)/requerimientos/actions'

export async function requerimientosSyncHandler(action: string, payload: any): Promise<boolean> {
  try {
    switch (action) {
      case 'create_requirement': {
        const res = await createRequirement(payload)
        return !res?.error
      }
      case 'update_status': {
        const res = await updateRequirementStatus(payload.id, payload.status)
        return !res?.error
      }
      default:
        console.warn('Unknown requerimientos action:', action)
        return false
    }
  } catch (error) {
    console.error('[SYNC_ERROR] requerimientosSyncHandler:', error)
    return false
  }
}
