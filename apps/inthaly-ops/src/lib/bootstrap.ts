
import { createAdminClient } from './supabase/server'

/**
 * Initializes a new company with default data needed for operation.
 */
export async function bootstrapCompany(companyId: string) {
 const supabase = await createAdminClient()
 console.log(`[BOOTSTRAP] 🚀 Programmatically initializing data for company: ${companyId}`)

 // 1. Movement Types Defaults
 const movementDefaults = [
 { company_id: companyId, name: 'Ingreso Almacén', code: 'ING', effect: 'IN' },
 { company_id: companyId, name: 'Salida Consumo', code: 'SAL', effect: 'OUT' },
 { company_id: companyId, name: 'Transferencia', code: 'TRF', effect: 'BOTH' },
 { company_id: companyId, name: 'Ajuste de Stock', code: 'ADJUST', effect: 'IN' },
 { company_id: companyId, name: 'Consumo Operativo Simulado', code: 'OPS_OUT_SIM', effect: 'OUT' }
 ]

 // 2. Warehouses Defaults
 const warehouseDefaults = [
 { company_id: companyId, name: 'Almacén General', code: 'GEN' },
 { company_id: companyId, name: 'Almacén Cocina', code: 'COC', area: 'COCINA' }
 ]



 try {
 // A. Programmatically Seed Movement Types
 const { data: existingTypes, error: typesFetchErr } = await supabase
 .from('movement_types')
 .select('code')
 .eq('company_id', companyId)
 
 if (typesFetchErr) console.warn('[BOOTSTRAP_WARN] Failed to fetch existing movement types:', typesFetchErr.message)
 const existingCodes = new Set((existingTypes || []).map((t: any) => t.code))
 const typesToInsert = movementDefaults.filter(t => !existingCodes.has(t.code))
 if (typesToInsert.length > 0) {
 const { error: insertErr } = await supabase.from('movement_types').insert(typesToInsert)
 if (insertErr) console.warn('[BOOTSTRAP_WARN] Failed to insert default movement types:', insertErr.message)
 }

 // B. Programmatically Seed Warehouses
 const { data: existingWh, error: whFetchErr } = await supabase
 .from('warehouses')
 .select('code, name')
 .eq('company_id', companyId)
 
 if (whFetchErr) console.warn('[BOOTSTRAP_WARN] Failed to fetch existing warehouses:', whFetchErr.message)
 const existingWhCodes = new Set((existingWh || []).map((w: any) => w.code))
 const existingWhNames = new Set((existingWh || []).map((w: any) => w.name.toLowerCase()))
 const whToInsert = warehouseDefaults.filter(w => !existingWhCodes.has(w.code) && !existingWhNames.has(w.name.toLowerCase()))
 if (whToInsert.length > 0) {
 const { error: insertErr } = await supabase.from('warehouses').insert(whToInsert)
 if (insertErr) console.warn('[BOOTSTRAP_WARN] Failed to insert default warehouses:', insertErr.message)
 }



 return { success: true }
 } catch (error: any) {
 console.error(`[BOOTSTRAP_ERROR] Fatal error: ${error.message}`)
 return { success: false, error: error.message }
 }
}

