import { registerMovement, updateMovement, deleteMovement } from '@/app/(main)/movements/actions'

export async function movementsSyncHandler(action: string, payload: any): Promise<boolean> {
  try {
    switch (action) {
      case 'create_movement': {
        const res = await registerMovement(payload)
        return res.success
      }
      case 'update_movement': {
        const res = await updateMovement(payload.id, payload.updates)
        return res.success
      }
      case 'delete_movement': {
        const res = await deleteMovement(payload.id)
        return res.success
      }
      default:
        console.warn('Unknown movements action:', action)
        return false
    }
  } catch (error) {
    console.error('Movements sync error:', error)
    return false
  }
}
