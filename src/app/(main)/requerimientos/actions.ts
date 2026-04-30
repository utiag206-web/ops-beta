'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserSession } from '@/lib/auth'

export async function getRequirements(filters?: { status?: string, priority?: string }) {
  const supabase = await createAdminClient()
  const { extendedUser } = await getUserSession()
  
  if (!extendedUser?.company_id) return { error: 'Acceso denegado: No se encontró empresa vinculada.' }

  // Scoping: JEFE_AREA solo ve su área
  const isJefeArea = extendedUser.role_id === 'jefe_area'
  const userArea = extendedUser.area

  let query = supabase
    .from('requirements')
    .select('*')
    .eq('company_id', extendedUser.company_id)
    .order('created_at', { ascending: false })

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
  const userIds = [...new Set(data.map(r => r.created_by).filter(Boolean))]
  const productIds = [...new Set(data.map(r => r.product_id).filter(Boolean))]

  const [{ data: users }, { data: products }] = await Promise.all([
    supabase.from('users').select('id, name').in('id', userIds),
    supabase.from('products').select('id, name, code, unit').in('id', productIds)
  ])

  const enrichedData = data.map(req => ({
    ...req,
    user: users?.find(u => u.id === req.created_by),
    products: products?.find(p => p.id === req.product_id)
  }))

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
  const supabase = await createAdminClient()
  const { extendedUser } = await getUserSession()

  if (!extendedUser?.id || !extendedUser?.company_id) {
    return { error: 'Sesión inválida o sin empresa vinculada.' }
  }

  const { data, error } = await supabase
    .from('requirements')
    .insert([{
      ...payload,
      company_id: extendedUser.company_id,
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
  const supabase = await createAdminClient()
  const { extendedUser } = await getUserSession()

  const allowedRoles = ['admin', 'gerente', 'operaciones', 'almacen', 'jefe_area']
  const userRole = extendedUser?.role_id || ''
  
  if (!allowedRoles.includes(userRole) || userRole === 'trabajador') {
    return { error: 'Acceso Denegado: No tienes permisos administrativos para esta acción.' }
  }

  // Si es JEFE_AREA, solo puede actualizar si el área coincide (validación extra)
  if (extendedUser?.role_id === 'jefe_area') {
    const { data: req } = await supabase.from('requirements').select('area').eq('id', id).single()
    if (req?.area !== extendedUser.area) {
      return { error: 'No puedes gestionar requerimientos fuera de tu área.' }
    }
  }

  const { error } = await supabase
    .from('requirements')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Error updating status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/requerimientos')
  return { success: true }
}

export async function approveRequirementWithMovement(reqId: string, warehouseId: string) {
  const supabase = await createAdminClient()
  const { extendedUser } = await getUserSession()

  const allowedRoles = ['admin', 'operaciones', 'almacen']
  const userRole = extendedUser?.role_id || ''

  if (!allowedRoles.includes(userRole) || userRole === 'trabajador') {
    return { error: 'Acceso Denegado (403): Sin permisos para despachar inventario.' }
  }

  // 1. Obtener el requerimiento
  const { data: req, error: reqError } = await supabase
    .from('requirements')
    .select('*')
    .eq('id', reqId)
    .single()

  if (reqError || !req) return { error: 'Requerimiento no encontrado.' }
  if (req.status === 'aprobado') return { error: 'El requerimiento ya fue aprobado.' }
  if (!req.product_id || req.quantity <= 0) return { error: 'Requerimiento inválido para generación de movimiento.' }

  // 2. Obtener tipo de movimiento de salida (SAL)
  const { data: mType } = await supabase
    .from('movement_types')
    .select('id')
    .eq('company_id', extendedUser.company_id)
    .eq('code', 'SAL')
    .maybeSingle()

  // 3. Generar el movimiento de salida (que a su vez dispara el trigger para descontar stock)
  const { data: movement, error: movError } = await supabase
    .from('inventory_movements')
    .insert([{
      company_id: extendedUser.company_id,
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

  // 3. Actualizar el requerimiento a aprobado y vincularlo
  const { error: updateError } = await supabase
    .from('requirements')
    .update({ 
      status: 'aprobado',
      movement_id: movement.id
    })
    .eq('id', reqId)

  if (updateError) {
    return { error: 'Error al marcar como aprobado, pero la salida se generó.' }
  }

  revalidatePath('/requerimientos')
  revalidatePath('/inventory/history')
  revalidatePath('/inventory/stock')
  revalidatePath('/dashboard')
  
  return { success: true }
}
