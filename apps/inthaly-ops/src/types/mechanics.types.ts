/**
 * Tipos de Dominio: Mecánica, Taller y Maquinaria Pesada — INTHALY
 * Definición central de órdenes de trabajo, combustible, checklists e inventario de taller.
 */

export interface Vehicle {
  id: string
  company_id: string
  plate_number: string
  internal_code?: string | null
  brand: string
  model: string
  vehicle_type: 'volquete' | 'camioneta' | 'cargador' | 'excavadora' | 'generador' | 'compresora' | string
  current_hourmeter?: number | null
  current_odometer?: number | null
  status: 'active' | 'in_maintenance' | 'out_of_service' | string
  created_at: string
}

export interface MaintenanceOrder {
  id: string
  company_id: string
  vehicle_id: string
  order_type: 'preventivo' | 'correctivo' | 'predictivo'
  description: string
  priority: 'baja' | 'media' | 'alta' | 'critica'
  status: 'abierta' | 'en_proceso' | 'completada' | 'cancelada'
  assigned_mechanic_id?: string | null
  hourmeter_at_maintenance?: number | null
  odometer_at_maintenance?: number | null
  cost_estimate?: number | null
  actual_cost?: number | null
  spare_parts_used?: Array<{ product_id: string; quantity: number; cost?: number }>
  notes?: string | null
  created_at: string
  completed_at?: string | null
}

export interface FuelDispatch {
  id: string
  company_id: string
  vehicle_id: string
  gallons: number
  fuel_type: 'diesel_d2' | 'gasolina_90' | 'gasolina_95' | string
  hourmeter_at_dispatch?: number | null
  odometer_at_dispatch?: number | null
  dispenser_name?: string | null
  dispatched_to_worker_id?: string | null
  dispatched_at: string
  ratio_gallons_per_hour?: number | null
}

export interface ChecklistItemResponse {
  code: string
  label: string
  status: 'ok' | 'fail' | 'na'
  observation?: string
  photo_url?: string
}

export interface ChecklistRecord {
  id: string
  company_id: string
  vehicle_id: string
  inspector_worker_id: string
  shift: 'dia' | 'noche'
  hourmeter: number
  odometer?: number | null
  responses: Record<string, ChecklistItemResponse | string | boolean>
  has_critical_failure: boolean
  inspector_signature_url?: string | null
  created_at: string
}

export interface MechanicalTool {
  id: string
  company_id: string
  code: string
  name: string
  category: string
  current_holder_worker_id?: string | null
  status: 'available' | 'in_use' | 'damaged' | 'in_calibration'
  calibration_due_date?: string | null
  created_at: string
}
