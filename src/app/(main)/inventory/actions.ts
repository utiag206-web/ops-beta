'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserSession, requirePermission, getStrictCompanyId, applyIsolation } from '@/lib/auth'

export async function deleteProduct(id: string) {
  try {
    const extendedUser = await requirePermission('admin')
    const companyId = await getStrictCompanyId()

    const supabase = await createAdminClient()
    
    const { error } = await applyIsolation(
      supabase.from('products').delete(),
      companyId,
      extendedUser.role_id
    ).eq('id', id)

    if (error) throw error

    revalidatePath('/inventory/products')
    revalidatePath('/inventory/stock')
    return { success: true }
  } catch (error: any) {
    console.error('DELETE_PRODUCT_ERROR:', error)
    return { error: error.message }
  }
}

export async function getWarehouses() {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  const supabase = await createAdminClient()

  let query = applyIsolation(
    supabase.from('warehouses').select('id, name, code, area'),
    companyId,
    extendedUser.role_id
  )

  // [BLINDAJE_AREA]
  if (extendedUser?.area === 'Cocina') {
    query = query.or('area.eq.COCINA,name.ilike.%Cocina%')
  }

  const { data, error } = await query.order('name', { ascending: true })

  if (error) return { error: error.message }
  return { data: data || [] }
}

export async function getMovementTypes() {
  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()

    const { data, error } = await applyIsolation(
      supabase.from('movement_types').select('*'),
      companyId,
      extendedUser.role_id
    )

    if (error) {
      console.error("[INVENTORY_ERROR] Error fetching movement types:", error.message)
      return { error: `Error DB: ${error.message}` }
    }

    // Validar integridad básica
    const requiredEffects = ['IN', 'OUT', 'BOTH']
    const existingEffects = (data || []).map(t => t.effect)
    const missingAny = !data || data.length === 0 || requiredEffects.some(eff => !existingEffects.includes(eff))

    if (missingAny) {
      const seedResult = await seedMovementTypes(companyId)
      if (seedResult.error) return { error: `Error de inicialización: ${seedResult.error}` }
      
      const { data: finalData } = await applyIsolation(
        supabase.from('movement_types').select('*'),
        companyId,
        extendedUser.role_id
      )
      return { data: finalData || seedResult.data || [] }
    }

    return { data }
  } catch (err: any) {
    console.error("[INVENTORY_CRITICAL] getMovementTypes failed:", err.message)
    return { error: err.message }
  }
}

async function seedMovementTypes(companyId: string): Promise<{ data?: any[], error?: string }> {
  if (!companyId || companyId === 'undefined' || companyId === 'null') {
    console.error("[INVENTORY_SEED_ERROR] Invalid companyId provided for seeding:", companyId)
    return { error: "ID de empresa inválido o no seleccionado." }
  }

  try {
    const supabase = await createAdminClient()
    
    // 1. Obtener qué códigos ya existen para esta empresa
    const { data: existing, error: fetchError } = await supabase
      .from('movement_types')
      .select('code, name, effect')
      .eq('company_id', companyId)

    if (fetchError) {
      console.error("[INVENTORY_SEED_ERROR] Error checking existing types:", fetchError.message)
      return { error: fetchError.message }
    }

    const existingCodes = (existing || []).map(t => t.code)
    const defaults = [
      { company_id: companyId, name: 'Ingreso Almacén', code: 'ING', effect: 'IN' },
      { company_id: companyId, name: 'Salida Consumo', code: 'SAL', effect: 'OUT' },
      { company_id: companyId, name: 'Transferencia', code: 'TRF', effect: 'BOTH' },
      { company_id: companyId, name: 'Ajuste Stock', code: 'AJU', effect: 'IN' }
    ]

    // 2. Filtrar solo los que NO existen
    const missing = defaults.filter(d => !existingCodes.includes(d.code))

    if (missing.length === 0) {
      console.log(`[INVENTORY_SEED] All default types already exist for company ${companyId}.`)
      return { data: existing || [] }
    }

    console.log(`[INVENTORY_SEED] Inserting ${missing.length} missing types for company ${companyId}...`)

    // 3. Insertar los faltantes
    const { data: inserted, error: insertError } = await supabase
      .from('movement_types')
      .insert(missing)
      .select()

    if (insertError) {
      console.error('[INVENTORY_SEED_CRITICAL] Error inserting missing movement types:', insertError.message)
      return { error: insertError.message }
    }

    console.log(`[INVENTORY_SEED_SUCCESS] Seeded ${inserted?.length || 0} missing types.`)
    return { data: [...(existing || []), ...(inserted || [])] }
  } catch (err: any) {
    console.error("[INVENTORY_SEED_EXCEPTION]:", err.message)
    return { error: err.message }
  }
}

export async function getProductsMinimal() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  const supabase = await createAdminClient()

  // Solo traemos lo estrictamente necesario para el selector de búsqueda
  const { data, error } = await applyIsolation(
    supabase.from('products').select('id, name, unit'),
    companyId,
    extendedUser.role_id
  ).order('name', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data: data || [] }
}

export async function getProducts() {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  
  // workers need reading access for requirements, so we skip the strict 'inventory' module check for them
  if (extendedUser?.role_id !== 'trabajador') {
    await requirePermission('inventory')
  }
  
  const supabase = await createAdminClient()

  // Selección completa de columnas para cumplir con la interfaz Product
  const { data, error } = await applyIsolation(
    supabase.from('products').select('id, name, code, unit, category, min_stock, type, has_expiry, expiry_date, equivalence, created_at, inventory_stock(quantity)'),
    companyId,
    extendedUser.role_id
  ).order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products:', error)
    return { error: error.message }
  }

  const enrichedProducts = data?.map(p => {
    const stockItems = (p.inventory_stock as any[]) || []
    const total_stock = stockItems.reduce((acc, s) => acc + (s.quantity || 0), 0) || 0
    return {
      ...p,
      total_stock
    }
  })

  return { data: enrichedProducts }
}

export async function createProduct(payload: {
  code: string
  name: string
  category: string
  unit: string
  type: string
  has_expiry: boolean
  min_stock: number
  equivalence?: string
  expiry_date?: string
  initial_location?: string
  initial_stock?: number
}) {
  try {
    const companyId = await getStrictCompanyId()
    const { extendedUser } = await getUserSession()
    const supabase = await createAdminClient()

    const { initial_location, initial_stock, ...productPayload } = payload

    const sanitized = {
      ...productPayload,
      expiry_date: productPayload.has_expiry && productPayload.expiry_date ? productPayload.expiry_date : null,
      equivalence: productPayload.equivalence || null,
      company_id: companyId
    }

    const { data: product, error: pError } = await supabase
      .from('products')
      .insert([sanitized])
      .select()
      .maybeSingle()

    if (pError) {
      return { error: `Error creando producto: ${pError.message}` }
    }

    if (!product) {
      return { error: 'El producto se creó pero no se pudo recuperar la información.' }
    }

    if (initial_stock && initial_stock > 0) {
      const qty = initial_stock
      let warehouseId: string | null = null

      if (initial_location && initial_location.trim() !== '') {
        const { data: existingWh } = await applyIsolation(
          supabase.from('warehouses').select('id'),
          companyId,
          extendedUser.role_id
        )
        .ilike('name', initial_location.trim())
        .maybeSingle()
        
        if (existingWh) warehouseId = existingWh.id
      }

      // Fallback: Si no hay ubicación o no existe, usar el primer almacén de la empresa
      if (!warehouseId) {
        const { data: firstWh } = await applyIsolation(
          supabase.from('warehouses').select('id'),
          companyId,
          extendedUser.role_id
        )
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
        
        if (firstWh) {
          warehouseId = firstWh.id
        } else {
          // Si ni siquiera hay almacenes, crear uno "Almacén General"
          const { data: newWh, error: whErr } = await supabase
            .from('warehouses')
            .insert([{ 
              name: 'Almacén General', 
              company_id: companyId,
              code: 'GEN' 
            }])
            .select('id')
            .single()
          
          if (whErr) throw new Error(`Error fatal: No se pudo crear almacén base: ${whErr.message}`)
          warehouseId = newWh.id
        }
      }

      const { error: sError } = await supabase.rpc('upsert_inventory_stock', {
        p_product_id: product.id,
        p_warehouse_id: warehouseId,
        p_company_id: companyId,
        p_quantity: qty
      })

      if (sError) {
        return { error: `Producto creado, pero falló el registro de stock: ${sError.message}` }
      }

      const { data: mtIng } = await applyIsolation(
        supabase.from('movement_types').select('id'),
        companyId,
        extendedUser.role_id
      )
      .eq('code', 'ING')
      .maybeSingle()

      await supabase
        .from('inventory_movements')
        .insert([{
          product_id: product.id,
          warehouse_id: warehouseId,
          company_id: companyId,
          user_id: extendedUser.id,
          movement_type_id: mtIng?.id || null,
          type: 'ingreso',
          quantity: qty,
          observation: 'Carga inicial por creación de producto',
          document_type: 'ING',
          document_number: 'INICIAL'
        }])
    }

    revalidatePath('/inventory/products')
    revalidatePath('/inventory/stock')
    revalidatePath('/inventory/history')
    
    return { success: true, data: product }
  } catch (error: any) {
    return { error: `Error inesperado: ${error.message}` }
  }
}

export async function updateProduct(id: string, payload: any) {
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  // Sanitize payload: convert empty strings to null for optional columns
  const sanitized = { ...payload }
  
  // Remove fields that do not belong to the products schema table for updates
  delete sanitized.inventory_stock
  delete sanitized.total_stock
  delete sanitized.id
  delete sanitized.company_id
  delete sanitized.created_at
  delete sanitized.updated_at
  
  if (sanitized.hasOwnProperty('expiry_date')) {
    sanitized.expiry_date = sanitized.has_expiry && sanitized.expiry_date ? sanitized.expiry_date : null
  }
  if (sanitized.hasOwnProperty('equivalence')) {
    sanitized.equivalence = sanitized.equivalence || null
  }

  const { extendedUser } = await getUserSession()
  const { data, error } = await applyIsolation(
    supabase.from('products').update(sanitized),
    companyId,
    extendedUser.role_id
  ).eq('id', id)
  .select()

  if (error) {
    console.error('UPDATE_PRODUCT_ERROR:', error)
    return { error: error.message }
  }

  revalidatePath('/inventory/products')
  revalidatePath('/inventory/stock')
  revalidatePath('/inventory/history')
  revalidatePath('/inventory/kardex')
  return { success: true, data }
}

export async function getInventoryStock() {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  const supabase = await createAdminClient()

  let query = applyIsolation(
    supabase.from('inventory_stock').select('*, products(name, code, unit, category, min_stock), warehouses!inner(name, area)'),
    companyId,
    extendedUser.role_id
  )

  // [BLINDAJE_AREA]
  if (extendedUser.area === 'Cocina') {
    query = query.or('area.eq.COCINA,name.ilike.%Cocina%', { foreignTable: 'warehouses' })
  }

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching stock:', error)
    return { error: error.message }
  }

  return { data }
}

export async function updateStockRecord(payload: {
  product_id: string
  warehouse_id: string
  quantity: number
}) {
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  if (!payload.product_id || payload.product_id === 'none') return { error: 'Producto inválido.' }
  if (!payload.warehouse_id || payload.warehouse_id === 'none') return { error: 'Almacén inválido.' }

  const { error } = await supabase.rpc('set_inventory_stock', {
    p_product_id: payload.product_id,
    p_warehouse_id: payload.warehouse_id,
    p_company_id: companyId,
    p_quantity: payload.quantity
  })

  if (error) {
    console.error('STOCK_UPDATE_ERROR:', error)
    return { error: `Error al actualizar stock: ${error.message}` }
  }

  revalidatePath('/inventory/stock')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getInventoryMovements(limit = 100) {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  const supabase = await createAdminClient()

  let query = applyIsolation(
    supabase.from('inventory_movements').select('*, products(name, code, unit, id), users:user_id(name), warehouses!inner(name, area), movement_types(name, effect)'),
    companyId,
    extendedUser.role_id
  )

  // [BLINDAJE_AREA] Filtrado de movimientos por almacén de Cocina
  if (extendedUser.area === 'Cocina') {
    query = query.or('area.eq.COCINA,name.ilike.%Cocina%', { foreignTable: 'warehouses' })
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching movements:', error)
    return { error: error.message }
  }

  if (!data || data.length === 0) return { data: [], initialBalances: {} }

  // OPTIMIZACIÓN PRE-DEPLOY: Cálculo de saldos eficiente (Reverse Calculation)
  // En lugar de N queries paralelas por producto, calculamos basándonos en el stock actual.
  const initialBalances: Record<string, number> = {}
  
  try {
    const productIds = [...new Set(data.map(m => m.product_id))]
    const warehouseIds = [...new Set(data.map(m => m.warehouse_id))]

    const { data: currentStocks } = await applyIsolation(
      supabase.from('inventory_stock').select('product_id, warehouse_id, quantity'),
      companyId,
      extendedUser.role_id
    ).in('product_id', productIds).in('warehouse_id', warehouseIds)

    // Mapa de stock actual por par producto|almacén
    const stockMap: Record<string, number> = {}
    currentStocks?.forEach(s => {
      stockMap[`${s.product_id}|${s.warehouse_id}`] = s.quantity || 0
    })

    // Calculamos el saldo justo ANTES de cada movimiento del lote actual
    // Trabajamos de atrás hacia adelante (desde el stock actual)
    // Pero como el lote actual puede no ser "todo" el historial, es más seguro 
    // calcular el saldo en el punto exacto donde termina este lote.
    
    // Por ahora, para el Historial rápido, usaremos el mapeo de pares para marcar el punto de partida.
    data.forEach(m => {
      const pair = `${m.product_id}|${m.warehouse_id}`
      if (initialBalances[pair] === undefined) {
        initialBalances[pair] = stockMap[pair] || 0
      }
    })
  } catch (e) {
    console.error("[INVENTORY_OPTIMIZATION_ERROR] Failed to calculate optimized balances:", e)
  }

  return { data, initialBalances }
}

export async function getMovementTraceability(productId: string, warehouseId?: string) {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  const supabase = await createAdminClient()
  
  if (!productId || productId === 'none') return { data: [] }

  let query = applyIsolation(
    supabase.from('inventory_movements').select('*, products(name, code, unit), users:user_id(name), warehouses(name), movement_types(name, effect, code)'),
    companyId,
    extendedUser.role_id
  ).eq('product_id', productId)

  if (warehouseId && warehouseId !== 'none') {
    query = query.eq('warehouse_id', warehouseId)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching traceability:', error)
    return { error: error.message }
  }

  return { data }
}

export async function createMovement(payload: {
  product_id: string
  movement_type_id: string
  quantity: number
  warehouse_id: string
  target_warehouse_id?: string
  document_type?: string
  document_number?: string
  reference?: string
  observation?: string
  responsible_name?: string
}) {
  await requirePermission('inventory')
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  
  console.log(`[INVENTORY_DEBUG] createMovement. Company: ${companyId}, User: ${extendedUser?.email}`)

  if (!companyId) {
    console.warn(`[INVENTORY_DEBUG] createMovement blocked: No companyId in session.`)
    return { error: 'Acceso Denegado: Debes entrar a una empresa para realizar movimientos de inventario.' }
  }

  const supabase = await createAdminClient()

  // [BLINDAJE_AREA] Validar que el almacén de origen pertenece al área (si el usuario está restringido)
  if (extendedUser.area === 'Cocina') {
    const { data: wh } = await supabase.from('warehouses').select('area, name').eq('id', payload.warehouse_id).eq('company_id', companyId).single()
    const isKitchenWh = wh?.area === 'COCINA' || wh?.name.toLowerCase().includes('cocina')
    if (!isKitchenWh) {
      return { error: 'Acceso Denegado: No puedes realizar movimientos fuera de tu almacén de cocina.' }
    }
  }

  // Validate warehouse

  // 1. Obtener tipo de movimiento
  const { data: mType } = await supabase
    .from('movement_types')
    .select('*')
    .eq('id', payload.movement_type_id)
    .maybeSingle()
    
  if (!mType) return { error: 'Tipo de movimiento inválido o no existe.' }

  // 2. Información del producto para validar unidad
  const { data: product } = await supabase
    .from('products')
    .select('unit')
    .eq('id', payload.product_id)
    .maybeSingle()

  if (!product) return { error: 'Producto no encontrado.' }

  const isIntegerUnit = product ? ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(product.unit.toUpperCase()) : false
  let finalQty = isIntegerUnit ? Math.round(payload.quantity) : payload.quantity

  const isAdjustment = mType.code === 'ADJUST' || mType.code === 'AJU' || mType.effect === 'SET' || mType.name?.toLowerCase().includes('ajuste')
  
  // Solo bloqueamos negativo si NO es un ajuste
  if (!isAdjustment && finalQty < 0) return { error: 'La cantidad no puede ser negativa.' }

  try {
    const effect = mType.effect // IN, OUT, BOTH, SET

    // 0. Obtener stock actual para validación o cálculo de delta (Ajuste)
    const { data: st } = await supabase
      .from('inventory_stock')
      .select('quantity')
      .eq('product_id', payload.product_id)
      .eq('warehouse_id', payload.warehouse_id)
      .eq('company_id', companyId)
      .maybeSingle()
    
    const currentStock = st?.quantity || 0

    if (effect === 'BOTH') {
      // 🔁 TRANSFERENCIA (ATÓMICA VÍA RPC)
      if (!payload.target_warehouse_id) throw new Error('Se requiere un almacén de destino')
      if (currentStock < finalQty) {
        throw new Error(`⚠️ Stock insuficiente para transferencia: Disponible ${currentStock}, Requerido ${finalQty}`)
      }
      
      const nextNumRes = await getNextDocumentNumber('TRS')
      const trsDocNumber = payload.document_number || nextNumRes.data || `TRS-${Math.floor(Math.random() * 10000)}`

      const { data: sourceWh } = await supabase.from('warehouses').select('name').eq('id', payload.warehouse_id).eq('company_id', companyId).single()
      const { data: targetWh } = await supabase.from('warehouses').select('name').eq('id', payload.target_warehouse_id).eq('company_id', companyId).single()

      const { error: trfErr } = await supabase.rpc('transfer_inventory', {
        p_product_id: payload.product_id,
        p_company_id: companyId,
        p_source_warehouse_id: payload.warehouse_id,
        p_target_warehouse_id: payload.target_warehouse_id,
        p_quantity: finalQty,
        p_document_number: trsDocNumber,
        p_user_id: extendedUser.id,
        p_movement_type_id: mType.id,
        p_observation: payload.observation || `${sourceWh?.name || 'Origen'} → ${targetWh?.name || 'Destino'}`
      })

      if (trfErr) throw new Error(trfErr.message)

    } else if (isAdjustment) {
      // 🔧 AJUSTE POR DIFERENCIA (DELTA +/-)
      const delta = finalQty
      const newStock = currentStock + delta

      if (newStock < 0) {
        throw new Error(`⚠️ Ajuste inválido: Resultaría en stock negativo (Actual ${currentStock}, Delta ${delta})`)
      }

      const { error: moveErr } = await supabase.from('inventory_movements').insert([{
        product_id: payload.product_id,
        warehouse_id: payload.warehouse_id,
        company_id: companyId,
        user_id: extendedUser.id,
        created_by: extendedUser.id,
        movement_type_id: mType.id,
        quantity: Math.abs(delta),
        type: delta >= 0 ? 'ingreso' : 'salida',
        document_type: 'AJU',
        document_number: payload.document_number || 'AJU-INICIAL',
        observation: payload.observation || `Ajuste por conteo físico (${delta >= 0 ? 'incremento' : 'decremento'})`,
        responsible_name: payload.responsible_name
      }])

      if (moveErr) throw new Error(moveErr.message)

      const { error: stockErr } = await supabase.rpc('upsert_inventory_stock', {
        p_product_id: payload.product_id,
        p_warehouse_id: payload.warehouse_id,
        p_company_id: companyId,
        p_quantity: delta
      })
      if (stockErr) throw new Error(stockErr.message)

    } else {
      // 🟢 INGRESO / 🔴 SALIDA SIMPLE
      const isOut = effect === 'OUT'
      
      if (isOut && currentStock < finalQty) {
        throw new Error(`⚠️ Stock insuficiente: Disponible ${currentStock}, Requerido ${finalQty}`)
      }

      const docTypePrefix = isOut ? 'SAL' : 'ING'
      const nextNumRes = await getNextDocumentNumber(docTypePrefix)
      const finalDocNum = payload.document_number || nextNumRes.data || `${docTypePrefix}-ERROR`

      const { error: moveErr } = await supabase.from('inventory_movements').insert([{
        product_id: payload.product_id,
        warehouse_id: payload.warehouse_id,
        company_id: companyId,
        user_id: extendedUser.id,
        created_by: extendedUser.id,
        movement_type_id: mType.id,
        quantity: finalQty,
        type: isOut ? 'salida' : 'ingreso',
        document_type: docTypePrefix,
        document_number: finalDocNum,
        observation: payload.observation,
        reference: payload.reference,
        responsible_name: payload.responsible_name
      }])

      if (moveErr) throw new Error(moveErr.message)

      // Sincronizar stock (Relativo)
      const { error: stockErr } = await supabase.rpc('upsert_inventory_stock', {
        p_product_id: payload.product_id,
        p_warehouse_id: payload.warehouse_id,
        p_company_id: companyId,
        p_quantity: isOut ? -finalQty : finalQty
      })
      if (stockErr) throw new Error(`Error al actualizar stock: ${stockErr.message}`)
    }

    revalidatePath('/inventory/history')
    revalidatePath('/inventory/stock')
    revalidatePath('/inventory/products')
    revalidatePath('/inventory/kardex')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: any) {
    console.error('MOVEMENT_ERROR:', error)
    return { error: error.message }
  }
}

export async function getNextDocumentNumber(prefix: 'ING' | 'SAL' | 'TRS') {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  // Buscar el mayor número para este prefijo en esta compañía
  const { data: lastRecord } = await applyIsolation(
    supabase.from('inventory_movements').select('document_number'),
    companyId,
    extendedUser.role_id
  ).eq('document_type', prefix)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let nextNumber = 1
  if (lastRecord && typeof lastRecord.document_number === 'string') {
    const parts = lastRecord.document_number.split('-')
    const lastNumStr = parts.length > 1 ? parts[1] : parts[0].replace(/\D/g, '')
    const currentNumber = parseInt(lastNumStr, 10)
    if (!isNaN(currentNumber)) nextNumber = currentNumber + 1
  }
  
  return { data: `${prefix}-${nextNumber.toString().padStart(4, '0')}` }
}

export async function syncInventoryStock() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  try {
    // 1. Obtener todos los movimientos de la compañía
    const { data: movements, error: mError } = await applyIsolation(
      supabase.from('inventory_movements').select('product_id, warehouse_id, quantity, type, movement_types(effect)'),
      companyId,
      extendedUser.role_id
    )

    if (mError) throw mError

    // 2. Agrupar por Producto + Almacén
    const stockMap: Record<string, number> = {}
    movements?.forEach(m => {
      const key = `${m.product_id}|${m.warehouse_id}`
      const type = (m.type || '').toLowerCase()
      const effect = (m.movement_types as any)?.effect
      const qty = Number(m.quantity) || 0
      
      if (!stockMap[key]) stockMap[key] = 0
      
      // Lógica de nivel ERP: Priorizar dirección del movimiento individual
      if (type === 'salida' || effect === 'OUT') {
        stockMap[key] -= qty
      } else {
        stockMap[key] += qty
      }
    })

    // 3. Obtener registros actuales de stock para identificar qué poner en cero (si no hay movimientos)
    const { data: currentStock } = await applyIsolation(
      supabase.from('inventory_stock').select('product_id, warehouse_id'),
      companyId,
      extendedUser.role_id
    )

    const existingKeys = new Set(currentStock?.map(s => `${s.product_id}|${s.warehouse_id}`))

    // 4. Ejecutar UPSERTs
    
    for (const [key, total] of Object.entries(stockMap)) {
      const [pid, wid] = key.split('|')
      const { error: syncErr } = await supabase.rpc('set_inventory_stock', {
        p_product_id: pid,
        p_warehouse_id: wid,
        p_company_id: companyId,
        p_quantity: total
      })
      if (syncErr) console.error(`Error syncing ${key}:`, syncErr)
      existingKeys.delete(key)
    }

    // 5. Los que quedaron en existingKeys no tienen movimientos -> Poner en 0
    for (const key of existingKeys) {
      const [pid, wid] = key.split('|')
      await supabase.rpc('set_inventory_stock', {
        p_product_id: pid,
        p_warehouse_id: wid,
        p_company_id: companyId,
        p_quantity: 0
      })
    }

    revalidatePath('/inventory/stock')
    return { success: true }
  } catch (error: any) {
    console.error('SYNC_STOCK_ERROR:', error)
    return { error: error.message }
  }
}
function capitalizeName(str: string) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
}

export async function createWarehouse(payload: { name: string, code?: string }) {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  const supabase = await createAdminClient()

  const allowedRoles = ['admin', 'company_admin', 'super_admin', 'superadmin', 'gerente']
  if (!allowedRoles.includes(extendedUser.role_id)) {
    return { error: 'No tienes permisos para crear almacenes.' }
  }
  
  const normalizedName = capitalizeName(payload.name)
  if (!normalizedName) return { error: 'El nombre del almacén es inválido.' }

  const { data: existing } = await applyIsolation(
    supabase.from('warehouses').select('id'),
    companyId,
    extendedUser.role_id
  )
    .ilike('name', normalizedName)
    .maybeSingle()

  if (existing) {
    return { error: 'Ya existe un almacén con este nombre en tu empresa.' }
  }

  const { data, error } = await supabase.from('warehouses').insert([{
    company_id: companyId || payload.company_id, // Allow explicit company_id for super_admin
    name: normalizedName,
    code: payload.code?.trim().toUpperCase() || null
  }]).select('*').single()

  if (error) return { error: error.message }
  revalidatePath('/configuracion/warehouses')
  return { success: true, data }
}

export async function updateWarehouse(id: string, payload: { name: string, code?: string }) {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  const supabase = await createAdminClient()

  const allowedRoles = ['admin', 'company_admin', 'super_admin', 'superadmin', 'gerente']
  if (!allowedRoles.includes(extendedUser.role_id)) {
    return { error: 'No tienes permisos para editar almacenes.' }
  }
  
  const normalizedName = capitalizeName(payload.name)
  if (!normalizedName) return { error: 'El nombre del almacén es inválido.' }

  const { data: existing } = await applyIsolation(
    supabase.from('warehouses').select('id'),
    companyId,
    extendedUser.role_id
  )
    .ilike('name', normalizedName)
    .neq('id', id)
    .maybeSingle()

  if (existing) {
    return { error: 'Ya existe otro almacén con este nombre.' }
  }

  const { error } = await supabase
    .from('warehouses')
    .update({ 
      name: normalizedName,
      code: payload.code?.trim().toUpperCase() || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .match(companyId ? { company_id: companyId } : {})

  if (error) return { error: error.message }
  revalidatePath('/configuracion/warehouses')
  return { success: true }
}

export async function deleteWarehouse(id: string) {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  const supabase = await createAdminClient()

  const allowedRoles = ['admin', 'company_admin', 'super_admin', 'superadmin', 'gerente']
  if (!allowedRoles.includes(extendedUser.role_id)) {
    return { error: 'No tienes permisos para eliminar almacenes.' }
  }

  // Restricciones: Si tiene stock o movimientos, no se puede borrar (la base de datos debe arrojar error por FK RESTRICT)
  const { error } = await supabase
    .from('warehouses')
    .delete()
    .eq('id', id)
    .match(companyId ? { company_id: companyId } : {})

  if (error) {
    if (error.code === '23503') {
      return { error: 'No se puede eliminar porque existen movimientos o stock asociados a este almacén.' }
    }
    return { error: error.message }
  }

  revalidatePath('/configuracion/warehouses')
  return { success: true }
}

// =====================================
// PURCHASE ORDERS & SUPPLIERS
// =====================================

export async function getSuppliers() {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  const { data, error } = await applyIsolation(
    supabase.from('suppliers').select('*'),
    companyId,
    extendedUser.role_id
  ).order('name', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

export async function getNextPONumber() {
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  const { data: lastPO } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let nextNumber = 1
  if (lastPO && typeof lastPO.po_number === 'string' && lastPO.po_number.startsWith('OC-')) {
    const currentNumber = parseInt(lastPO.po_number.split('-')[1] || '0', 10)
    if (!isNaN(currentNumber)) nextNumber = currentNumber + 1
  }

  return { data: `OC-${nextNumber.toString().padStart(4, '0')}` }
}

export async function getPurchaseOrders(statusFilter?: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  let query = applyIsolation(
    supabase.from('purchase_orders').select(`
      *,
      suppliers(name, ruc)
    `),
    companyId,
    extendedUser.role_id
  ).order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  } else {
    // Por defecto ocultar anuladas en el selector de ingreso si no se pide filtro
    query = query.neq('status', 'ANULADA').neq('status', 'COMPLETADA')
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  return { data }
}

export async function getPurchaseOrderItems(poId: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()

  const { data, error } = await applyIsolation(
    supabase.from('purchase_order_items').select(`
      *,
      products(name, code, unit)
    `),
    companyId,
    extendedUser.role_id
  ).eq('po_id', poId)

  if (error) return { error: error.message }
  return { data }
}

export async function processInboundFromPO(payload: {
  // ...
}) {
  const companyId = await getStrictCompanyId()
  const { extendedUser } = await getUserSession()
  const supabase = await createAdminClient()

  try {
    // 1. Validaciones y creación de movimientos
    for (const item of payload.items) {
      if (item.quantity_to_receive <= 0) continue

      // Obtener el item de la OC actual para validar
      const { data: poItem, error: poItemErr } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('id', item.po_item_id)
        .eq('company_id', companyId)
        .single()

      if (poItemErr || !poItem) throw new Error('Item de Orden de Compra no encontrado')

      const alreadyReceived = Number(poItem.quantity_received || 0)
      const ordered = Number(poItem.quantity_ordered)
      if (alreadyReceived + item.quantity_to_receive > ordered) {
        throw new Error(`Exceso detectado en producto: Se pidió ${ordered}, ya se recibió ${alreadyReceived}. No se puede ingresar ${item.quantity_to_receive}.`)
      }

      // Crear Movimiento de Inventario
      const { error: moveErr } = await supabase.from('inventory_movements').insert([{
        company_id: companyId,
        user_id: extendedUser.id,
        created_by: extendedUser.id,
        product_id: item.product_id,
        warehouse_id: payload.warehouse_id,
        type: 'ingreso',
        quantity: item.quantity_to_receive,
        entry_origin: 'PO',
        po_id: payload.po_id,
        invoice_type: payload.invoice_type,
        invoice_number: payload.invoice_number,
        guide_number: payload.guide_number,
        document_date: payload.document_date,
        observation: payload.observation,
        document_type: payload.invoice_type, // para compatibilidad con listados viejos
        document_number: payload.invoice_number
      }])

      if (moveErr) throw moveErr

      // Actualizar Stock mediante RPC Atómico
      const { error: stockErr } = await supabase.rpc('upsert_inventory_stock', {
        p_product_id: item.product_id,
        p_warehouse_id: payload.warehouse_id,
        p_company_id: companyId,
        p_quantity: item.quantity_to_receive
      })

      if (stockErr) throw new Error(`Fallo al actualizar stock: ${stockErr.message}`)

      // Actualizar cantidad recibida en el item de la OC
      await supabase
        .from('purchase_order_items')
        .update({ quantity_received: alreadyReceived + item.quantity_to_receive })
        .eq('id', item.po_item_id)
        .eq('company_id', companyId)
    }

    // 2. Actualizar estado de la Orden de Compra
    const { data: allItems } = await supabase
      .from('purchase_order_items')
      .select('quantity_ordered, quantity_received')
      .eq('po_id', payload.po_id)
      .eq('company_id', companyId)

    if (allItems) {
      const isCompletelyReceived = allItems.every(i => Number(i.quantity_received) >= Number(i.quantity_ordered))
      const isPartiallyReceived = allItems.some(i => Number(i.quantity_received) > 0)

      let newStatus = 'PENDIENTE'
      if (isCompletelyReceived) newStatus = 'COMPLETADA'
      else if (isPartiallyReceived) newStatus = 'PARCIAL'

      await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', payload.po_id)
        .eq('company_id', companyId)
    }

    revalidatePath('/inventory/history')
    revalidatePath('/inventory/stock')
    return { success: true }
  } catch (err: any) {
    console.error('PO_INBOUND_ERROR:', err)
    return { error: err.message }
  }
}
