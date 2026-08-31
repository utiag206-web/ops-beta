'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface MaintenanceRecord {
  id: string
  equipment_name: string
  equipment_code: string
  equipment_type: string // 'vehiculo_liviano' | 'vehiculo_pesado' | 'generador' | 'compresora' | 'equipo_mina'
  maintenance_type: 'preventivo' | 'correctivo' | 'predictivo'
  description: string
  technician: string
  date: string
  hours_or_km: number
  status: 'completado' | 'en_progreso' | 'programado'
  cost?: number
  observations?: string
}

export interface FuelRecord {
  id: string
  equipment_name: string
  equipment_code: string
  equipment_type: 'generador' | 'compresora' | 'vehiculo' | 'mina'
  date: string
  gallons: number
  initial_hours: number
  final_hours: number
  operator: string
  turn: 'dia' | 'noche'
  observation?: string
}

export interface ChecklistRecord {
  id: string
  equipment_name: string
  equipment_code: string
  inspector: string
  date: string
  turn: 'dia' | 'noche'
  status: 'aprobado' | 'observado' | 'rechazado'
  items: { item: string; status: 'ok' | 'fail' | 'na'; comment?: string }[]
  observations?: string
}

export interface ToolRecord {
  id: string
  code: string
  name: string
  category: string
  brand: string
  condition: 'operativo' | 'en_reparacion' | 'de_baja'
  assigned_to?: string
  location: string
  last_inspection_date: string
}

// In-memory / localStorage bridge for seamless immediate operation while integrating schema
export async function getMecanicaOverview() {
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  // Pull existing assets to correlate with mechanics
  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('company_id', companyId)

  return {
    totalAssets: assets?.length || 0,
    activeVehicles: assets?.filter(a => a.type?.toLowerCase().includes('vehiculo') || a.type?.toLowerCase().includes('camioneta')).length || 0,
    activeGenerators: assets?.filter(a => a.name?.toLowerCase().includes('generador') || a.name?.toLowerCase().includes('grupo')).length || 1,
    activeCompressors: assets?.filter(a => a.name?.toLowerCase().includes('compresor') || a.name?.toLowerCase().includes('compresora')).length || 1,
    assets: assets || []
  }
}
