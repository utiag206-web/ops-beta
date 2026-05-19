
import { createAdminClient } from './supabase/server'

/**
 * Initializes a new company with default data needed for operation.
 */
export async function bootstrapCompany(companyId: string) {
  const supabase = await createAdminClient()
  console.log(`[BOOTSTRAP] 🚀 Initializing data for company: ${companyId}`)

  // 1. Movement Types
  const movementDefaults = [
    { company_id: companyId, name: 'Ingreso Almacén', code: 'ING', effect: 'IN' },
    { company_id: companyId, name: 'Salida Consumo', code: 'SAL', effect: 'OUT' },
    { company_id: companyId, name: 'Transferencia', code: 'TRF', effect: 'BOTH' },
    { company_id: companyId, name: 'Ajuste de Stock', code: 'ADJUST', effect: 'IN' }
  ]

  // 2. Warehouses
  const warehouseDefaults = [
    { company_id: companyId, name: 'Almacén General', code: 'GEN' },
    { company_id: companyId, name: 'Almacén Cocina', code: 'COC', area: 'COCINA' }
  ]

  // 3. Categories
  const categoryDefaults = [
    { company_id: companyId, name: 'EPP', description: 'Equipos de Protección Personal' },
    { company_id: companyId, name: 'Herramientas', description: 'Herramientas y Equipos' },
    { company_id: companyId, name: 'Insumos', description: 'Insumos generales' },
    { company_id: companyId, name: 'Cocina', description: 'Insumos para cocina' }
  ]

  // 4. Units
  const unitDefaults = [
    { company_id: companyId, name: 'Unidad', abbreviation: 'UND' },
    { company_id: companyId, name: 'Paquete', abbreviation: 'PQT' },
    { company_id: companyId, name: 'Caja', abbreviation: 'CJ' },
    { company_id: companyId, name: 'Kilogramo', abbreviation: 'KG' }
  ]

  // 5. SOMA Defaults
  const somaDefaults = [
    { company_id: companyId, topic: 'Inducción de Seguridad', description: 'Capacitación inicial' },
    { company_id: companyId, topic: 'Primeros Auxilios', description: 'Atención de emergencias' }
  ]

  try {
    const results = await Promise.all([
      supabase.from('movement_types').upsert(movementDefaults, { onConflict: 'company_id, code' }),
      supabase.from('warehouses').upsert(warehouseDefaults, { onConflict: 'company_id, code' }),
      supabase.from('categories').upsert(categoryDefaults, { onConflict: 'company_id, name' }),
      supabase.from('units').upsert(unitDefaults, { onConflict: 'company_id, abbreviation' }),
      supabase.from('soma_talks').upsert(somaDefaults, { onConflict: 'company_id, topic' })
    ])

    results.forEach((res, idx) => {
      if (res.error) {
        console.warn(`[BOOTSTRAP_WARN] Step ${idx} failed: ${res.error.message}`)
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error(`[BOOTSTRAP_ERROR] Fatal error: ${error.message}`)
    return { success: false, error: error.message }
  }
}
