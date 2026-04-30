'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'

// 1. Stock actual por almacén
export async function getStockByWarehouse() {
  const supabase = await createClient()
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return { error: 'Acceso denegado' }

    // Buscamos productos y agrupamos sus stocks
  const { data, error } = await supabase
    .from('inventory_stock')
    .select(`
      quantity,
      warehouses!inner (name),
      products!inner (name, code, unit, category)
    `)
    .eq('company_id', extendedUser.company_id)
    .gt('quantity', 0) // Solo mostrar si hay stock

  if (error) return { error: error.message }
  return { data }
}

// 2. Productos bajo stock mínimo
export async function getLowStockProducts() {
  const supabase = await createClient()
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return { error: 'Acceso denegado' }

  // Usar query nativa estructurada
  // Traer stock total de cada producto y filtrar
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('id, name, code, min_stock, unit, category, inventory_stock(quantity)')
    .eq('company_id', extendedUser.company_id)

  if (pError) return { error: pError.message }

  const lowStock = products?.map(p => {
    const total = p.inventory_stock.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0)
    return { ...p, total_stock: total }
  }).filter(p => p.total_stock <= p.min_stock)

  return { data: lowStock }
}

// 3. Productos sin movimiento (últimos 30 días)
export async function getDormantProducts() {
  const supabase = await createClient()
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return { error: 'Acceso denegado' }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const isoDate = thirtyDaysAgo.toISOString()

  // Obtenemos los IDs de productos que SÍ han tenido movimiento en 30 días
  const { data: recentMoves, error: mError } = await supabase
    .from('inventory_movements')
    .select('product_id')
    .eq('company_id', extendedUser.company_id)
    .gte('created_at', isoDate)

  if (mError) return { error: mError.message }

  const activeProductIds = new Set(recentMoves?.map(m => m.product_id))

  // Traer stock de productos que NO están en los recientes pero que tienen existencia > 0
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('id, name, code, category, unit, inventory_stock(quantity)')
    .eq('company_id', extendedUser.company_id)

  if (pError) return { error: pError.message }

  const dormant = products?.filter(p => !activeProductIds.has(p.id))
    .map(p => {
      const total = p.inventory_stock.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0)
      return { ...p, total_stock: total }
    })
    .filter(p => p.total_stock > 0) // Dormidos pero que ocupan plata/espacio

  return { data: dormant }
}

// 4. Top productos más consumidos (Solo OUT, excluir ajustes)
export async function getTopConsumedProducts() {
  const supabase = await createClient()
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return { error: 'Acceso denegado' }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // type 'salida' representa las salidas operativas reales. Ajustes decremento son 'ajuste'
  const { data: movements, error } = await supabase
    .from('inventory_movements')
    .select('quantity, products (name, code, unit, category)')
    .eq('company_id', extendedUser.company_id)
    .eq('type', 'salida')
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (error) return { error: error.message }

  // Agrupar y sumar
  const consumedMap = new Map<string, any>()
  movements?.forEach((m: any) => {
    // Supabase returns either object or array of objects depending on schema
    const prod = Array.isArray(m.products) ? m.products[0] : m.products
    const code = prod?.code
    if (!code) return
    if (!consumedMap.has(code)) {
      consumedMap.set(code, {
        code,
        name: prod?.name,
        unit: prod?.unit,
        category: prod?.category,
        total_consumed: 0
      })
    }
    const item = consumedMap.get(code)
    item.total_consumed += Math.abs(m.quantity)
  })

  // Convertir a array, ordenar DESC y coger top 20
  const arr = Array.from(consumedMap.values())
  arr.sort((a, b) => b.total_consumed - a.total_consumed)

  return { data: arr.slice(0, 20) }
}
