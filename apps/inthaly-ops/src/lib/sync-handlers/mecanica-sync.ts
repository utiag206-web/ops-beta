import { 
  createMaintenanceRecord, updateMaintenanceRecord, anularMaintenanceRecord, reactivarMaintenanceRecord, deleteMaintenanceRecord,
  createFuelRecord, updateFuelRecord, anularFuelRecord, reactivarFuelRecord, deleteFuelRecord,
  createChecklistRecord, updateChecklistRecord, anularChecklistRecord, reactivarChecklistRecord, deleteChecklistRecord,
  createToolRecord, updateToolRecord, anularToolRecord, reactivarToolRecord, deleteToolRecord
} from '@/app/(main)/mecanica/actions'

export async function mecanicaSyncHandler(action: string, payload: any): Promise<boolean> {
  try {
    switch (action) {
      // 1. Mantenimiento de Vehículos y Equipos
      case 'create_maintenance':
      case 'create_order': {
        const res = await createMaintenanceRecord(payload)
        return res.success
      }
      case 'update_maintenance':
      case 'update_order': {
        const res = await updateMaintenanceRecord(payload.id, payload.updates || payload)
        return res.success
      }
      case 'anular_maintenance': {
        const res = await anularMaintenanceRecord(payload.id)
        return res.success
      }
      case 'reactivar_maintenance': {
        const res = await reactivarMaintenanceRecord(payload.id)
        return res.success
      }
      case 'delete_maintenance': {
        const res = await deleteMaintenanceRecord(payload.id)
        return res.success
      }

      // 2. Control de Combustible
      case 'create_fuel': {
        const res = await createFuelRecord(payload)
        return res.success
      }
      case 'update_fuel': {
        const res = await updateFuelRecord(payload.id, payload.updates || payload)
        return res.success
      }
      case 'anular_fuel': {
        const res = await anularFuelRecord(payload.id)
        return res.success
      }
      case 'reactivar_fuel': {
        const res = await reactivarFuelRecord(payload.id)
        return res.success
      }
      case 'delete_fuel': {
        const res = await deleteFuelRecord(payload.id)
        return res.success
      }

      // 3. Checklists Preoperacionales
      case 'create_checklist': {
        const res = await createChecklistRecord(payload)
        return res.success
      }
      case 'update_checklist': {
        const res = await updateChecklistRecord(payload.id, payload.updates || payload)
        return res.success
      }
      case 'anular_checklist': {
        const res = await anularChecklistRecord(payload.id)
        return res.success
      }
      case 'reactivar_checklist': {
        const res = await reactivarChecklistRecord(payload.id)
        return res.success
      }
      case 'delete_checklist': {
        const res = await deleteChecklistRecord(payload.id)
        return res.success
      }

      // 4. Control de Herramientas
      case 'create_tool': {
        const res = await createToolRecord(payload)
        return res.success
      }
      case 'update_tool': {
        const res = await updateToolRecord(payload.id, payload.updates || payload)
        return res.success
      }
      case 'anular_tool': {
        const res = await anularToolRecord(payload.id)
        return res.success
      }
      case 'reactivar_tool': {
        const res = await reactivarToolRecord(payload.id)
        return res.success
      }
      case 'delete_tool': {
        const res = await deleteToolRecord(payload.id)
        return res.success
      }

      default:
        console.warn('[SYNC] Acción de mecánica no reconocida:', action)
        return false
    }
  } catch (error) {
    console.error('[SYNC_ERROR] mecanicaSyncHandler:', error)
    return false
  }
}
