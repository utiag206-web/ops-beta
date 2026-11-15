/**
 * Servicio de Dominio: Logística, Almacenes e Inventarios — INTHALY
 * Encapsula consultas de almacenes, stock consolidado, kardex y movimientos.
 */

import { applyIsolation } from '@/lib/auth'
import type { StockItem, InventoryMovement } from '@/types/inventory.types'

export interface InventoryContextParams {
  companyId: string
  roleId: string
  area?: string
}

/**
 * Consulta la lista de almacenes disponibles aplicando aislamiento y blindaje de área.
 */
export async function getWarehouses(
  supabase: any,
  params: InventoryContextParams & { allWarehouses?: boolean }
) {
  const { companyId, roleId, area, allWarehouses } = params

  let query = applyIsolation(
    supabase.from('warehouses').select('id, name, code, area, is_default'),
    companyId,
    roleId
  )

  // [BLINDAJE_AREA]
  if (area === 'Cocina' && !allWarehouses) {
    query = query.or('area.eq.COCINA,name.ilike.%Cocina%')
  }

  const { data, error } = await query.order('name', { ascending: true })

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

/**
 * Consulta los tipos de movimiento parametrizados en el sistema.
 */
export async function getMovementTypes(
  supabase: any,
  params: InventoryContextParams
) {
  const { companyId, roleId } = params

  const { data, error } = await applyIsolation(
    supabase.from('movement_types').select('*'),
    companyId,
    roleId
  ).order('name', { ascending: true })

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

/**
 * Consulta el stock actual por producto y almacén.
 */
export async function getInventoryStock(
  supabase: any,
  params: InventoryContextParams
): Promise<{ data?: StockItem[]; error?: string }> {
  const { companyId, roleId, area } = params

  let query = applyIsolation(
    supabase.from('inventory_stock').select('*, products(name, code, unit, category, min_stock), warehouses!inner(name, area)'),
    companyId,
    roleId
  )

  // [BLINDAJE_AREA]
  if (area === 'Cocina') {
    query = query.or('area.eq.COCINA,name.ilike.%Cocina%', { foreignTable: 'warehouses' })
  }

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) {
    console.error('[InventoryService] Error fetching stock:', error)
    return { error: error.message }
  }

  return { data: data || [] }
}

/**
 * Consulta los últimos movimientos de kardex y calcula los saldos iniciales optimizados.
 */
export async function getInventoryMovements(
  supabase: any,
  params: InventoryContextParams & { limit?: number }
): Promise<{ data?: InventoryMovement[]; initialBalances?: Record<string, number>; error?: string }> {
  const { companyId, roleId, area, limit = 100 } = params

  let query = applyIsolation(
    supabase.from('inventory_movements').select('id, created_at, product_id, warehouse_id, movement_type_id, type, quantity, document_type, document_number, responsible_name, observation, reference, products(id, name, code, unit), warehouses!inner(id, name, area), movement_types(id, name, effect, code), users:user_id(name)'),
    companyId,
    roleId
  )

  // [BLINDAJE_AREA]
  if (area === 'Cocina') {
    query = query.or('area.eq.COCINA,name.ilike.%Cocina%', { foreignTable: 'warehouses' })
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[InventoryService] Error fetching movements:', error)
    return { error: error.message }
  }

  if (!data || data.length === 0) return { data: [], initialBalances: {} }

  // Cálculo de saldos eficiente (Reverse Calculation)
  const initialBalances: Record<string, number> = {}

  try {
    const productIds = [...new Set(data.map((m: any) => m.product_id))]
    const warehouseIds = [...new Set(data.map((m: any) => m.warehouse_id))]

    const { data: currentStocks } = await applyIsolation(
      supabase.from('inventory_stock').select('product_id, warehouse_id, quantity'),
      companyId,
      roleId
    ).in('product_id', productIds).in('warehouse_id', warehouseIds)

    const stockMap: Record<string, number> = {}
    currentStocks?.forEach((s: any) => {
      stockMap[`${s.product_id}|${s.warehouse_id}`] = s.quantity || 0
    })

    data.forEach((m: any) => {
      const pair = `${m.product_id}|${m.warehouse_id}`
      if (initialBalances[pair] === undefined) {
        initialBalances[pair] = stockMap[pair] || 0
      }
    })
  } catch (e) {
    console.error('[InventoryService] Failed to calculate optimized balances:', e)
  }

  return { data, initialBalances }
}

/**
 * Trazabilidad histórica de movimientos para un producto y almacén específico.
 */
export async function getMovementTraceability(
  supabase: any,
  params: InventoryContextParams & { productId: string; warehouseId?: string }
) {
  const { companyId, roleId, productId, warehouseId } = params

  if (!productId || productId === 'none') return { data: [] }

  let query = applyIsolation(
    supabase
      .from('inventory_movements')
      .select('id, type, quantity, location, observation, product_id, created_at, warehouse_id, movement_type_id, document_type, document_number, reference, responsible_name, users(name), warehouses(name), movement_types(name, effect, code), products(name, code, unit)'),
    companyId,
    roleId
  ).eq('product_id', productId)

  if (warehouseId && warehouseId !== 'all') {
    query = query.eq('warehouse_id', warehouseId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('[InventoryService] Error fetching traceability:', error)
    return { error: error.message }
  }

  return { data: data || [] }
}
