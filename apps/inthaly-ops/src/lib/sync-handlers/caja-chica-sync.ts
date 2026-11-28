import { registerPettyCashTransaction, updatePettyCashTransaction, deletePettyCashTransaction } from '@/app/(main)/caja-chica/actions'

export async function cajaChicaSyncHandler(action: string, payload: any): Promise<boolean> {
  try {
    switch (action) {
      case 'create_transaction': {
        const res = await registerPettyCashTransaction(payload)
        return !res?.error
      }
      case 'update_transaction': {
        const res = await updatePettyCashTransaction(payload.id, payload.updates)
        return !res?.error
      }
      case 'delete_transaction': {
        const res = await deletePettyCashTransaction(payload.id)
        return !res?.error
      }
      default:
        console.warn('Unknown caja-chica action:', action)
        return false
    }
  } catch (error) {
    console.error('[SYNC_ERROR] cajaChicaSyncHandler:', error)
    return false
  }
}
