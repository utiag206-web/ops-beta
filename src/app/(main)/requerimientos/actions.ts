'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'

export async function getRequirements(filters?: { status?: string, priority?: string }) {
 const companyId = await getStrictCompanyId()
 const { extendedUser } = await getUserSession()
 const supabase = await createAdminClient()
 
 // Scoping: JEFE_AREA solo ve su área
 const isJefeArea = extendedUser?.role_id === 'jefe_area'
 const userArea = extendedUser?.area

 let query = applyIsolation(
 supabase.from('requirements').select('*'),
 companyId,
 extendedUser.role_id
 ).order('created_at', { ascending: false })

 if (filters?.status && filters.status !== 'todos') {
 query = query.eq('status', filters.status)
 }
 
 if (filters?.priority && filters.priority !== 'todas') {
 query = query.eq('priority', filters.priority)
 }

 if (isJefeArea && userArea) {
 query = query.eq('area', userArea)
 }

 // [STRICT_RBAC] El trabajador solo ve lo que él mismo creó
 if (extendedUser.role_id === 'trabajador') {
 query = query.eq('created_by', extendedUser.id)
 }

 const { data, error } = await query

 if (error) {
 console.error('Error fetching requirements:', error)
 return { error: error.message }
 }

 // MANUAL JOIN: Fetch users and products to avoid schema relationship errors
 const userIds = [...new Set(data.map((r: any) => r.created_by).filter(Boolean))]
 const productIds = [...new Set(data.map((r: any) => r.product_id).filter(Boolean))]

 const adminSupabase = await createAdminClient()
 
 const fetchUsers = userIds.length > 0 
 ? adminSupabase.from('users').select('id, name').in('id', userIds)
 : Promise.resolve({ data: [] })
 
 const fetchProducts = productIds.length > 0
 ? applyIsolation(adminSupabase.from('products').select('id, name, code, unit'), companyId, extendedUser.role_id).in('id', productIds)
 : Promise.resolve({ data: [] })

 const [resUsers, resProducts] = await Promise.all([fetchUsers, fetchProducts])
 
 const users = resUsers.data || []
 const products = resProducts.data || []

 const enrichedData = data.map((req: any) => {
    let type = req.type
    let virtualProducts = products.find((p: any) => p.id === req.product_id)
    
    // Try to parse description brackets to enrich products virtual column
    if (req.description?.startsWith('[SOLICITUD DE FONDOS:')) {
      type = 'fondos'
      virtualProducts = {
        name: 'CAJA CHICA (FONDOS)',
        code: 'CAJA',
        unit: 'S/'
      }
    } else if (req.description?.startsWith('[PRODUCTO NUEVO:')) {
      type = 'insumo'
      const match = req.description.match(/^\[PRODUCTO NUEVO:\s*([^|]*?)\s*\|\s*UNIDAD:\s*([^\]]*?)\]/)
      if (match) {
        virtualProducts = {
          name: match[1].trim().toUpperCase(),
          code: 'PENDIENTE',
          unit: match[2]?.trim().toUpperCase() || 'UND',
          is_new: true
        }
      }
    } else if (req.description?.startsWith('[HERRAMIENTA:')) {
      type = 'herramienta'
      const match = req.description.match(/^\[HERRAMIENTA:\s*([^|]*?)\s*\|\s*CANT:\s*([^\]]*?)\]/)
      if (match) {
        virtualProducts = {
          name: match[1].toUpperCase(),
          code: 'HERR',
          unit: 'UND'
        }
      }
    } else if (req.description?.startsWith('[PERSONAL:')) {
      type = 'personal'
      const match = req.description.match(/^\[PERSONAL:\s*([^|]*?)\s*\|\s*CANT:\s*([^\]]*?)\]/)
      if (match) {
        virtualProducts = {
          name: `PERSONAL: ${match[1].toUpperCase()}`,
          code: 'PERS',
          unit: 'PERS'
        }
      }
    } else if (!req.product_id && (req.type === 'insumo' || !req.type)) {
      virtualProducts = {
        name: req.title || 'PRODUCTO PENDIENTE DE REGISTRO',
        code: 'PENDIENTE',
        unit: 'UND',
        is_new: true
      }
    }

    return {
      ...req,
      type,
      user: users.find((u: any) => u.id === req.created_by),
      products: virtualProducts
    }
  })

  return { data: enrichedData }
}

export async function createRequirement(payload: {
 title: string
 description: string
 type: string
 priority: string
 product_id?: string
 quantity?: number
}) {
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()
 const { extendedUser } = await getUserSession()

 if (!extendedUser?.id) {
 return { error: 'Sesión inválida.' }
 }

 // Workaround: Database check constraint only allows insumo, herramienta, personal.
 // We save funds/Caja Chica as insumo.
 let dbType = payload.type
 if (dbType === 'fondos') {
 dbType = 'insumo'
 }

 const { data, error } = await supabase
 .from('requirements')
 .insert([{
 ...payload,
 type: dbType,
 company_id: companyId || (payload as any).company_id,
 created_by: extendedUser.id,
 area: extendedUser.area, // Capturar área del creador
 status: 'pendiente'
 }])
 .select()

 if (error) {
 console.error('CREATE_REQ_SUPABASE_ERROR:', error)
 return { error: `Error Supabase: ${error.message}` }
 }

 revalidatePath('/requerimientos')
 revalidatePath('/dashboard')
 return { success: true, data }
}

export async function updateRequirementStatus(id: string, status: string) {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()

 const allowedRoles = ['admin', 'gerente', 'operaciones', 'almacen', 'jefe_area', 'super_admin']
 const userRole = extendedUser?.role_id || ''
 
 if (!allowedRoles.includes(userRole) || userRole === 'trabajador') {
 return { error: 'Acceso Denegado: No tienes permisos administrativos para esta acción.' }
 }

 // Si es JEFE_AREA, solo puede actualizar si el área coincide (validación extra)
 if (extendedUser?.role_id === 'jefe_area') {
 const { data: req } = await applyIsolation(
 supabase.from('requirements').select('area'),
 companyId,
 extendedUser.role_id
 ).eq('id', id).single()
 if (req?.area !== extendedUser.area) {
 return { error: 'No puedes gestionar requerimientos fuera de tu área.' }
 }
 }

 const { error } = await applyIsolation(
 supabase.from('requirements').update({ status }),
 companyId,
 extendedUser.role_id
 ).eq('id', id)

 if (error) {
 console.error('Error updating status:', error)
 return { error: error.message }
 }

 revalidatePath('/dashboard')
 revalidatePath('/requerimientos')
 return { success: true }
}

export async function approveRequirementWithMovement(reqId: string, warehouseId: string) {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 const supabase = await createAdminClient()

 const allowedRoles = ['admin', 'operaciones', 'almacen', 'super_admin']
 const userRole = extendedUser?.role_id || ''

 if (!allowedRoles.includes(userRole) || userRole === 'trabajador') {
 return { error: 'Acceso Denegado (403): Sin permisos para despachar inventario.' }
 }

 // 1. Obtener el requerimiento
 const { data: req, error: reqError } = await applyIsolation(
 supabase.from('requirements').select('*'),
 companyId,
 extendedUser.role_id
 )
 .eq('id', reqId)
 .single()

 if (reqError || !req) return { error: 'Requerimiento no encontrado.' }
 if (req.status === 'aprobado') return { error: 'El requerimiento ya fue aprobado.' }
 if (!req.product_id || req.quantity <= 0) return { error: 'Requerimiento inválido para generación de movimiento.' }

 // 2. Obtener tipo de movimiento de salida (SAL)
 const { data: mType } = await applyIsolation(
 supabase.from('movement_types').select('id'),
 companyId,
 extendedUser.role_id
 )
 .eq('code', 'SAL')
 .maybeSingle()

 // 3. Generar el movimiento de salida (que a su vez dispara el trigger para descontar stock)
 const { data: movement, error: movError } = await supabase
 .from('inventory_movements')
 .insert([{
 company_id: companyId || req.company_id, // Inherit from req if super_admin
 product_id: req.product_id,
 user_id: extendedUser.id,
 movement_type_id: mType?.id || null,
 type: 'salida',
 quantity: req.quantity,
 warehouse_id: warehouseId,
 document_type: 'SAL',
 document_number: `REQ-APP-${reqId.substring(0,4)}`,
 observation: `Salida generada por Aprobación de Requerimiento: ${req.title}`
 }])
 .select()
 .single()

 if (movError) {
 console.error('Error creating movement on approval:', movError)
 return { error: 'Error al generar salida de inventario: ' + movError.message }
 }

 // 3.5 Sincronizar stock (Descontar de forma atómica relativa)
 const { error: stockErr } = await supabase.rpc('upsert_inventory_stock', {
 p_product_id: req.product_id,
 p_warehouse_id: warehouseId,
 p_company_id: companyId || req.company_id,
 p_quantity: -req.quantity
 })

 if (stockErr) {
 console.error('Error updating stock on requirement approval:', stockErr)
 await supabase.from('inventory_movements').delete().eq('id', movement.id)
 return { error: 'Error al actualizar el stock físico en base de datos: ' + stockErr.message }
 }

 // 3. Actualizar el requerimiento a aprobado y vincularlo
 const { error: updateError } = await applyIsolation(
 supabase.from('requirements').update({ 
 status: 'aprobado',
 movement_id: movement.id
 }),
 companyId,
 extendedUser.role_id
 ).eq('id', reqId)

 if (updateError) {
 return { error: 'Error al marcar como aprobado, pero la salida se generó.' }
 }

 revalidatePath('/requerimientos')
 revalidatePath('/inventory/history')
 revalidatePath('/inventory/stock')
 revalidatePath('/dashboard')
 
 return { success: true }
}
