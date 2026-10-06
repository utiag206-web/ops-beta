import { 
  createMaintenanceRecord, 
  updateMaintenanceRecord
} from '@/app/(main)/mecanica/actions'

export async function mecanicaSyncHandler(action: string, payload: any): Promise<boolean> {
  try {
    switch (action) {
      case 'create_order': {
        const res = await createMaintenanceRecord(payload)
        return res.success
      }
      case 'update_order': {
        const res = await updateMaintenanceRecord(payload.id, payload.updates)
        return res.success
      }
      default:
        console.warn('Unknown mecanica action:', action)
        return false
    }
  } catch (error) {
    console.error('Mecanica sync error:', error)
    return false
  }
}
