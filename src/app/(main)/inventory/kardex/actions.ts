'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'

export async function getKardexRecords(filters: {
  product_id: string
  warehouse_id?: string
  movement_type?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}) {
  const { 
    product_id, warehouse_id, movement_type, 
    date_from, date_to, 
    page = 1, limit = 50 
  } = filters

  try {
    const supabase = await createAdminClient()
    const { extendedUser } = await getUserSession()
    if (!extendedUser?.company_id) return { error: 'Acceso denegado.' }

    // Helper to calculate delta based on movement type/effect
    const getDelta = (m: any) => {
      const type = (m.type || '').toLowerCase()
      const effect = m.movement_types?.effect
      const qty = Math.abs(Number(m.quantity) || 0)
      
      // Si existe el campo delta explícito (Nivel ERP), lo usamos
      if (typeof m.delta === 'number') return m.delta

      // Si no, priorizamos el 'type' del registro individual ('ingreso'/'salida')
      // Esto es crítico para los Ajustes donde el movimiento_tipo es siempre 'AJU'
      if (type === 'salida') return -qty
      if (type === 'ingreso' || type === 'entrada') return qty

      // Fallback al efecto general del tipo de movimiento
      if (effect === 'OUT') return -qty
      if (effect === 'IN') return qty
      
      return 0
    }


    const warehouseBalances = new Map<string, number>()

    // 1. CALCULAR SALDOS INICIALES (PREVIO AL date_from)
    let initialBalanceQuery = supabase
      .from('inventory_movements')
      .select('quantity, archive_id, warehouse_id, type, movement_types(effect)')
      .eq('product_id', product_id)
      .eq('company_id', extendedUser.company_id)

    if (warehouse_id) initialBalanceQuery = initialBalanceQuery.eq('warehouse_id', warehouse_id)
    
    if (date_from) {
      initialBalanceQuery = initialBalanceQuery.lt('created_at', date_from)
    } else {
      // Si no hay date_from, empezamos desde el inicio de los tiempos (o una fecha muy antigua)
      // Pero para evitar traer miles de registros si no es necesario,
      // si no hay date_from, el saldo inicial periodo se considera 0 o lo que haya antes del "primer" movimiento.
      // Sin embargo, para un Kardex completo, date_from suele estar vacío.
      // Si está vacío, no filtramos por LT, por lo tanto preMovements será vacío.
      initialBalanceQuery = initialBalanceQuery.lt('created_at', '1900-01-01')
    }

    const { data: preMovements } = await initialBalanceQuery
    ;(preMovements || []).forEach((m: any) => {
      const wId = m.warehouse_id
      const delta = getDelta(m)
      warehouseBalances.set(wId, (warehouseBalances.get(wId) || 0) + delta)
    })

    // 2. CONTAR TOTAL PARA PAGINACIÓN
    let countQuery = supabase
      .from('inventory_movements')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', product_id)
      .eq('company_id', extendedUser.company_id)

    if (warehouse_id) countQuery = countQuery.eq('warehouse_id', warehouse_id)
    if (date_from) countQuery = countQuery.gte('created_at', date_from)
    if (date_to) {
      const finalDateTo = date_to.includes('T') ? date_to : `${date_to}T23:59:59.999Z`
      countQuery = countQuery.lte('created_at', finalDateTo)
    }

    const { count: totalCount } = await countQuery
    const totalPages = Math.ceil((totalCount || 0) / limit)

    // 3. CALCULAR SALDOS OFFSET (De date_from hasta el inicio de la página actual)
    const offset = (page - 1) * limit
    if (offset > 0) {
      let offsetQuery = supabase
        .from('inventory_movements')
        .select('quantity, warehouse_id, type, movement_types(effect)')
        .eq('product_id', product_id)
        .eq('company_id', extendedUser.company_id)
        .order('created_at', { ascending: true })
        .range(0, offset - 1)

      if (warehouse_id) offsetQuery = offsetQuery.eq('warehouse_id', warehouse_id)
      if (date_from) offsetQuery = offsetQuery.gte('created_at', date_from)
      
      const { data: offRowMovements } = await offsetQuery
      ;(offRowMovements || []).forEach((m: any) => {
        const wId = m.warehouse_id
        const delta = getDelta(m)
        warehouseBalances.set(wId, (warehouseBalances.get(wId) || 0) + delta)
      })
    }

    // Guardamos una copia de los saldos al inicio de este periodo para el header
    const initialBalancesSnapshot = new Map(warehouseBalances)

    // 4. OBTENER REGISTROS DE LA PÁGINA
    let query = supabase
      .from('inventory_movements')
      .select('*, movement_types(name, effect, code), warehouses(name), users:user_id(name)')
      .eq('product_id', product_id)
      .eq('company_id', extendedUser.company_id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (warehouse_id) query = query.eq('warehouse_id', warehouse_id)
    if (date_from) query = query.gte('created_at', date_from)
    if (date_to) {
      const finalDateTo = date_to.includes('T') ? date_to : `${date_to}T23:59:59.999Z`
      query = query.lte('created_at', finalDateTo)
    }

    const { data, error } = await query
    if (error) throw error

    const enrichedData = (data || []).map((record: any) => {
      const wId = record.warehouse_id
      const delta = getDelta(record)
      const mTypeCode = record.movement_types?.code
      const mTypeEffect = record.movement_types?.effect
      
      const newBalance = (warehouseBalances.get(wId) || 0) + delta
      warehouseBalances.set(wId, newBalance)

      // Friendly names and types
      let uiType = 'Movimiento'
      let contextLabel = ''
      const warehouseName = record.warehouses?.name || 'Almacén'

      if (mTypeCode === 'TRF' || mTypeEffect === 'BOTH') {
        uiType = 'Transferencia'
        contextLabel = record.observation?.includes('→') ? record.observation : warehouseName
      } else if (mTypeCode === 'AJU' || record.document_type === 'AJU') {
        uiType = 'Ajuste'
        contextLabel = '' // No aplica para ajustes
      } else if (delta < 0 || record.type === 'salida' || mTypeEffect === 'OUT') {
        uiType = 'Salida'
        contextLabel = `Desde: ${warehouseName}`
      } else {
        uiType = 'Ingreso'
        contextLabel = `Hacia: ${warehouseName}`
      }
      
      // Document Normalization (Avoid ING-ING-0001)
      let docDisplay = record.document_number || 'S/N'
      const docType = record.document_type || ''
      if (docType && !docDisplay.startsWith(docType)) {
        docDisplay = `${docType}-${docDisplay}`
      }
      
      return {
        ...record,
        entrada: delta > 0 ? delta : 0,
        salida: delta < 0 ? Math.abs(delta) : 0,
        saldo_acumulado: newBalance,
        doc_display: docDisplay,
        ui_type: uiType,
        context_label: contextLabel
      }
    })


    // El initialBalance que enviamos al header es la suma de los saldos iniciales
    // de los almacenes involucrados (o solo del filtrado)
    let totalInitialBalance = 0
    if (warehouse_id) {
      totalInitialBalance = initialBalancesSnapshot.get(warehouse_id) || 0
    } else {
      initialBalancesSnapshot.forEach(val => totalInitialBalance += val)
    }

    return { 
      data: enrichedData, 
      pagination: { totalPages, totalCount, currentPage: page },
      initialBalance: totalInitialBalance
    }
  } catch (err: any) {
    console.error('KARDEX_SERVER_CRASH:', err)
    return { error: `Error interno al procesar el kardex: ${err.message}` }
  }
}

