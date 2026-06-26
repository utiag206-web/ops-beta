'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * ==========================================
 * SERVER ACTIONS - CONTROL DE PRODUCCIÓN
 * ==========================================
 */

export async function getProductionRecords(dateStr?: string) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()

 let query = supabase
 .from('production_control')
 .select('*')
 .eq('company_id', companyId)

 if (dateStr) {
 query = query.eq('date', dateStr)
 }

 const { data, error } = await query.order('date', { ascending: false }).order('created_at', { ascending: true })

 if (error) {
 console.error('[PRODUCTION_ACTIONS] Error fetching records:', error)
 throw error
 }

 return data || []
 } catch (error: any) {
 console.error('[PRODUCTION_ACTIONS] Unexpected error in getProductionRecords:', error.message)
 return []
 }
}

export async function upsertProductionRecord(record: any) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()

 const payload = {
 ...record,
 company_id: companyId,
 created_by: record.created_by || extendedUser.id,
 warehouse_id: record.warehouse_id || null
 }

 // Si tiene ID, realizamos una validación previa de aislamiento para evitar hackeo
 if (payload.id) {
 const { data: existing, error: checkError } = await supabase
 .from('production_control')
 .select('id, company_id')
 .eq('id', payload.id)
 .single()

 if (checkError || !existing) {
 throw new Error('Registro no encontrado para modificar')
 }
 if (existing.company_id !== companyId) {
 throw new Error('No autorizado para modificar este registro')
 }
 }

 const { data, error } = await supabase
 .from('production_control')
 .upsert(payload, { onConflict: 'id' })
 .select()
 .single()

 if (error) {
 console.error('[PRODUCTION_ACTIONS] Error in upsert:', error)
 return { success: false, error: error.message }
 }

 // SINCRONIZACIÓN DE INVENTARIO (FASE SIMULADA - IDEMPOTENTE)
 if (data && payload.warehouse_id) {
 await syncOperationsInventory(
 supabase, 
 companyId, 
 payload.created_by, 
 payload.warehouse_id, 
 data.id, 
 'production', 
 data
 )
 }

 revalidatePath('/operaciones/produccion')
 return { success: true, data }
 } catch (error: any) {
 console.error('[PRODUCTION_ACTIONS] Unexpected error in upsertProductionRecord:', error.message)
 return { success: false, error: error.message }
 }
}

export async function deleteProductionRecord(id: string) {
 try {
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()

 // Validación previa de aislamiento
 const { data: existing, error: checkError } = await supabase
 .from('production_control')
 .select('id, company_id')
 .eq('id', id)
 .single()

 if (checkError || !existing) {
 throw new Error('Registro no encontrado para eliminar')
 }
 if (existing.company_id !== companyId) {
 throw new Error('No autorizado para eliminar este registro')
 }

 // Limpiar inventario y restaurar stock
 await cleanOperationsInventory(supabase, companyId, id, 'production')

 const { error } = await supabase
 .from('production_control')
 .delete()
 .eq('id', id)

 if (error) {
 console.error('[PRODUCTION_ACTIONS] Error in delete:', error)
 return { success: false, error: error.message }
 }

 revalidatePath('/operaciones/produccion')
 return { success: true }
 } catch (error: any) {
 console.error('[PRODUCTION_ACTIONS] Unexpected error in deleteProductionRecord:', error.message)
 return { success: false, error: error.message }
 }
}

/**
 * ==========================================
 * SERVER ACTIONS - CONTROL DE MADERAS
 * ==========================================
 */

export async function getWoodRecords(dateStr?: string) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()

 let query = supabase
 .from('wood_control')
 .select('*')
 .eq('company_id', companyId)

 if (dateStr) {
 query = query.eq('date', dateStr)
 }

 const { data, error } = await query.order('date', { ascending: false }).order('created_at', { ascending: true })

 if (error) {
 console.error('[WOOD_ACTIONS] Error fetching records:', error)
 throw error
 }

 return data || []
 } catch (error: any) {
 console.error('[WOOD_ACTIONS] Unexpected error in getWoodRecords:', error.message)
 return []
 }
}

export async function upsertWoodRecord(record: any) {
 try {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()

 const payload = {
 ...record,
 company_id: companyId,
 created_by: record.created_by || extendedUser.id,
 warehouse_id: record.warehouse_id || null
 }

 // Si tiene ID, realizamos una validación previa de aislamiento para evitar hackeo
 if (payload.id) {
 const { data: existing, error: checkError } = await supabase
 .from('wood_control')
 .select('id, company_id')
 .eq('id', payload.id)
 .single()

 if (checkError || !existing) {
 throw new Error('Registro no encontrado para modificar')
 }
 if (existing.company_id !== companyId) {
 throw new Error('No autorizado para modificar este registro')
 }
 }

 const { data, error } = await supabase
 .from('wood_control')
 .upsert(payload, { onConflict: 'id' })
 .select()
 .single()

 if (error) {
 console.error('[WOOD_ACTIONS] Error in upsert:', error)
 return { success: false, error: error.message }
 }

 // SINCRONIZACIÓN DE INVENTARIO (FASE SIMULADA - IDEMPOTENTE)
 if (data && payload.warehouse_id) {
 await syncOperationsInventory(
 supabase, 
 companyId, 
 payload.created_by, 
 payload.warehouse_id, 
 data.id, 
 'wood', 
 data
 )
 }

 revalidatePath('/operaciones/maderas')
 return { success: true, data }
 } catch (error: any) {
 console.error('[WOOD_ACTIONS] Unexpected error in upsertWoodRecord:', error.message)
 return { success: false, error: error.message }
 }
}

export async function deleteWoodRecord(id: string) {
 try {
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()

 // Validación previa de aislamiento
 const { data: existing, error: checkError } = await supabase
 .from('wood_control')
 .select('id, company_id')
 .eq('id', id)
 .single()

 if (checkError || !existing) {
 throw new Error('Registro no encontrado para eliminar')
 }
 if (existing.company_id !== companyId) {
 throw new Error('No autorizado para eliminar este registro')
 }

 // Limpiar inventario y restaurar stock
 await cleanOperationsInventory(supabase, companyId, id, 'wood')

 const { error } = await supabase
 .from('wood_control')
 .delete()
 .eq('id', id)

 if (error) {
 console.error('[WOOD_ACTIONS] Error in delete:', error)
 return { success: false, error: error.message }
 }

 revalidatePath('/operaciones/maderas')
 return { success: true }
 } catch (error: any) {
 console.error('[WOOD_ACTIONS] Unexpected error in deleteWoodRecord:', error.message)
 return { success: false, error: error.message }
 }
}

/**
 * ==========================================
 * HELPER: SINCRONIZACIÓN OPERACIONES -> INVENTARIO
 * Garantiza idempotencia borrando movimientos previos y recreando los simulados
 * ==========================================
 */
async function syncOperationsInventory(
 supabase: any,
 companyId: string,
 userId: string,
 warehouseId: string,
 sourceId: string,
 sourceType: string,
 recordData: any
) {
 try {
 // 1. Obtener el Movement Type 'OPS_OUT_SIM'
 let { data: moveType } = await supabase
 .from('movement_types')
 .select('id')
 .eq('company_id', companyId)
 .eq('code', 'OPS_OUT_SIM')
 .maybeSingle()

 if (!moveType) {
 console.warn(`[SYNC_INV] No OPS_OUT_SIM movement type found for company ${companyId}. Auto-creating one...`)
 const { data: newMoveType, error: createError } = await supabase
 .from('movement_types')
 .insert({
 company_id: companyId,
 name: 'Consumo Operativo (Simulado)',
 code: 'OPS_OUT_SIM',
 effect: 'OUT',
 is_system: true
 })
 .select('id')
 .single()

 if (createError || !newMoveType) {
 console.error('[SYNC_INV] Failed to auto-create OPS_OUT_SIM movement type:', createError)
 return
 }
 moveType = newMoveType
 }

 // 2. Limpiar Movimientos Anteriores (Idempotencia) y restaurar stock anterior
 const { data: existingLinks } = await supabase
 .from('operations_inventory_link')
 .select('movement_id, inventory_movements:movement_id(product_id, warehouse_id, quantity)')
 .eq('company_id', companyId)
 .eq('source_type', sourceType)
 .eq('source_id', sourceId)

 if (existingLinks && existingLinks.length > 0) {
 for (const link of existingLinks) {
 const mov = link.inventory_movements
 if (mov) {
 // Restaurar stock: como fue una salida (deducción), sumamos la cantidad de vuelta
 const { error: stockErr } = await supabase.rpc('upsert_inventory_stock', {
 p_product_id: mov.product_id,
 p_warehouse_id: mov.warehouse_id,
 p_company_id: companyId,
 p_quantity: mov.quantity // cantidad positiva para restaurar
 })
 if (stockErr) {
 console.error(`[SYNC_INV] Falló al restaurar stock anterior:`, stockErr.message)
 }
 }
 }

 const movementIds = existingLinks.map((l: any) => l.movement_id)
 // Borrar de inventory_movements elimina en cascada los links
 await supabase
 .from('inventory_movements')
 .delete()
 .in('id', movementIds)
 }

 // 3. Cargar Catálogo de Mapeo Activo
 let { data: existingMappings } = await supabase
 .from('operations_product_mapping')
 .select('column_name, product_id, unit_ratio')
 .eq('company_id', companyId)
 .eq('operation_type', sourceType)
 .eq('is_active', true)

 let mappings = existingMappings || []

 // Identificar columnas esperadas y reglas de auto-mapeo
 const rules: Record<string, string[]> = {
 // Columnas de Control de Maderas
 boards_2in: ['tabla', 'board'],
 rajas: ['raja'],
 strut_8in: ['puntal 8', 'strut 8'],
 strut_6in: ['puntal 6', 'strut 6'],
 strut_4in: ['puntal 4', 'strut 4'],
 // Columnas de Control de Producción
 nails_qty: ['clavo', 'nail'],
 cambuchos: ['cambucho', 'gambucho'],
 chocolate_qty: ['chocolate'],
 pita_meters: ['pita']
 }

 const expectedCols = sourceType === 'production' 
 ? ['nails_qty', 'cambuchos', 'chocolate_qty', 'pita_meters']
 : ['boards_2in', 'rajas', 'strut_8in', 'strut_6in', 'strut_4in']

 const mappedCols = mappings.map((m: any) => m.column_name)
 const missingCols = expectedCols.filter(col => !mappedCols.includes(col))

 if (missingCols.length > 0) {
 console.log(`[SYNC_INV] Missing mappings for: ${missingCols.join(', ')}. Auto-creating...`)
 const { data: companyProducts } = await supabase
 .from('products')
 .select('id, name, code')
 .eq('company_id', companyId)

 if (companyProducts && companyProducts.length > 0) {
 const autoMappings: any[] = []
 for (const colName of missingCols) {
 const keywords = rules[colName]
 if (!keywords) continue

 const matchedProduct = companyProducts.find((p: any) => {
 const pName = (p.name || '').toLowerCase()
 const pCode = (p.code || '').toLowerCase()
 return keywords.some(kw => pName.includes(kw) || pCode.includes(kw))
 })

 if (matchedProduct) {
 autoMappings.push({
 company_id: companyId,
 operation_type: sourceType,
 column_name: colName,
 product_id: matchedProduct.id,
 unit_ratio: 1,
 is_active: true
 })
 }
 }

 if (autoMappings.length > 0) {
 const { data: insertedMappings, error: upsertError } = await supabase
 .from('operations_product_mapping')
 .upsert(autoMappings, { onConflict: 'company_id,operation_type,column_name' })
 .select('column_name, product_id, unit_ratio')
 
 if (upsertError) {
 console.error('[SYNC_INV] Failed to upsert auto-mappings:', upsertError)
 }

 if (insertedMappings) {
 mappings = [...mappings, ...insertedMappings]
 }
 }
 }
 }

 if (!mappings || mappings.length === 0) return

 // 4. Generar Nuevos Movimientos
 const newMovements = []
 const workplaceName = recordData.workplace || 'Desconocido'
 
 for (const mapping of mappings) {
 const rawValue = recordData[mapping.column_name]
 
 // Parsear a número (manejando strings como "2.50m", etc. si es posible, aunque las columnas numéricas ya son numéricas)
 const qty = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)
 
 if (qty && !isNaN(qty) && qty > 0) {
 const finalQuantity = qty * (mapping.unit_ratio || 1)
 
 newMovements.push({
 company_id: companyId,
 product_id: mapping.product_id,
 warehouse_id: warehouseId,
 user_id: userId,
 created_by: userId,
 movement_type_id: moveType.id,
 quantity: finalQuantity,
 type: 'salida',
 document_type: 'OPS',
 document_number: `REQ-${sourceType.substring(0, 3).toUpperCase()}-${sourceId.split('-')[0]}`,
 observation: `Consumo Operacional - Labor: ${workplaceName}`
 })
 }
 }

 if (newMovements.length === 0) return

 // 5. Insertar Movimientos en Bloque
 const { data: insertedMovements, error: insertError } = await supabase
 .from('inventory_movements')
 .insert(newMovements)
 .select('id')

 if (insertError || !insertedMovements) {
 console.error('[SYNC_INV] Failed to insert movements:', insertError)
 return
 }

 // 5b. Actualizar Stock en base de datos para cada movimiento insertado (Deducción)
 for (const mov of newMovements) {
 const { error: stockErr } = await supabase.rpc('upsert_inventory_stock', {
 p_product_id: mov.product_id,
 p_warehouse_id: mov.warehouse_id,
 p_company_id: companyId,
 p_quantity: -mov.quantity // valor negativo para restar del stock
 })
 if (stockErr) {
 console.error(`[SYNC_INV] Falló al descontar stock para el producto ${mov.product_id}:`, stockErr.message)
 }
 }

 // 6. Insertar Nuevos Enlaces de Trazabilidad
 const linksToInsert = insertedMovements.map((mov: any) => ({
 company_id: companyId,
 source_type: sourceType,
 source_id: sourceId,
 movement_id: mov.id
 }))

 await supabase.from('operations_inventory_link').insert(linksToInsert)

 } catch (err: any) {
 console.error('[SYNC_INV] Fatal error during inventory sync:', err.message)
 }
}

/**
 * ====================================================================
 * HELPER: LIMPIEZA DE INVENTARIO AL ELIMINAR REGISTROS OPERACIONALES
 * Restaura el stock de los productos consumidos y elimina los movimientos
 * ====================================================================
 */
export async function cleanOperationsInventory(
 supabase: any,
 companyId: string,
 sourceId: string,
 sourceType: string
) {
 try {
 const { data: existingLinks } = await supabase
 .from('operations_inventory_link')
 .select('movement_id, inventory_movements:movement_id(product_id, warehouse_id, quantity)')
 .eq('company_id', companyId)
 .eq('source_type', sourceType)
 .eq('source_id', sourceId)

 if (existingLinks && existingLinks.length > 0) {
 for (const link of existingLinks) {
 const mov = link.inventory_movements
 if (mov) {
 // Restaurar stock: como fue una salida (deducción), sumamos la cantidad de vuelta
 await supabase.rpc('upsert_inventory_stock', {
 p_product_id: mov.product_id,
 p_warehouse_id: mov.warehouse_id,
 p_company_id: companyId,
 p_quantity: mov.quantity // cantidad positiva para restaurar
 })
 }
 }

 const movementIds = existingLinks.map((l: any) => l.movement_id)
 await supabase.from('inventory_movements').delete().in('id', movementIds)
 }
 } catch (err: any) {
 console.error('[CLEAN_INV] Fatal error during inventory clean:', err.message)
 }
}
