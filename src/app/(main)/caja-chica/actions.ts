'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, requirePermission, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getPettyCashStats(area: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  
  if (!extendedUser || !companyId) throw new Error('No autorizado')
  
  const supabase = await createAdminClient()
  const today = new Date()
  const firstDayOfMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`

  // 1. Obtener todas las transacciones para Saldo Actual (Total histórico de la caja)
  const { data: allTransactions } = await applyIsolation(
    supabase.from('petty_cash_transactions').select('amount, type'),
    companyId,
    extendedUser.role_id
  ).ilike('area', area)

  const balance = (allTransactions || []).reduce((acc: number, t: any) => {
    return t.type === 'ingreso' ? acc + Number(t.amount) : acc - Number(t.amount)
  }, 0)

  // 2. Obtener estadísticas del mes actual
  const { data: monthTransactions } = await applyIsolation(
    supabase.from('petty_cash_transactions').select('amount, type'),
    companyId,
    extendedUser.role_id
  )
    .ilike('area', area)
    .gte('date', firstDayOfMonth)

  const monthIncome = (monthTransactions || [])
    .filter((t: any) => t.type === 'ingreso')
    .reduce((acc: number, t: any) => acc + Number(t.amount), 0)

  const monthExpenses = (monthTransactions || [])
    .filter((t: any) => t.type === 'egreso')
    .reduce((acc: number, t: any) => acc + Number(t.amount), 0)
  
  return {
    balance,
    monthIncome,
    monthExpenses,
    initialAmount: balance + monthExpenses - monthIncome // Valor informativo
  }
}

export async function getPettyCashTransactions(area: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  if (!extendedUser || !companyId) return { error: 'No autorizado' }

  const supabase = await createAdminClient()
  const { data, error } = await applyIsolation(
    supabase.from('petty_cash_transactions').select('*, responsible:users!responsible_id(name)'),
    companyId,
    extendedUser.role_id
  )
    .ilike('area', area) // [SYNC_NORMALIZATION]
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return { error: error.message }
  return { data }
}

export async function registerPettyCashTransaction(payload: {
  area: string
  reason: string
  amount: number
  payment_method: 'efectivo' | 'transferencia' | 'yape'
  type: 'ingreso' | 'egreso'
  category: string
  operation_number?: string
  date?: string
  voucher_url?: string
  target_area?: string
}) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()

  if (!extendedUser || !companyId) return { error: 'No autorizado' }

  // [BLINDAJE_ESTRICTO] El área se determina por el rol si no es administrador
  let finalArea = payload.area
  const role = extendedUser.role_id?.toLowerCase()
  
  if (role !== 'admin' && role !== 'gerente') {
    if (role === 'operaciones') {
      finalArea = 'Operaciones'
    } else if (role === 'administracion') {
      finalArea = 'Administración'
    } else if (extendedUser.area === 'Cocina') {
      finalArea = 'Cocina'
    }
  }

  let finalType = payload.type
  let finalCategory = payload.category
  
  // Normalizar motivo para búsqueda de palabras clave
  const reasonNormalized = payload.reason.toLowerCase()
  const isInitialFund = reasonNormalized.includes('fondo inicial') || 
                        reasonNormalized.includes('capital inicial') || 
                        reasonNormalized.includes('apertura')

  // Si se detecta fondo inicial, forzar tipo ingreso y categoría fondo_inicial
  if (isInitialFund) {
    finalType = 'ingreso'
    finalCategory = 'fondo_inicial'
  }

  const supabase = await createAdminClient()

  // --- LÓGICA DE TRANSFERENCIA ---
  if (finalCategory === 'transferencia') {
    const isCentralRole = ['admin', 'gerente', 'super_admin', 'superadmin', 'administracion', 'finanzas', 'caja central'].includes(role || '')
    if (!isCentralRole) {
      return { error: 'No autorizado: Solo los roles de gestión y administración central pueden transferir fondos.' }
    }

    if (!payload.target_area || payload.target_area === finalArea) {
      return { error: 'Debes seleccionar una caja de contraparte válida y diferente de la actual.' }
    }

    // Definir qué caja disminuye (origen) y qué caja aumenta (destino)
    const sourceArea = finalType === 'egreso' ? finalArea : payload.target_area
    const destArea = finalType === 'egreso' ? payload.target_area : finalArea

    // Validar fondos del origen
    const statsSource = await getPettyCashStats(sourceArea)
    if (statsSource && payload.amount > statsSource.balance) {
      return { error: `Saldo insuficiente en la caja de ${sourceArea}. Saldo disponible: S/ ${statsSource.balance.toFixed(2)}` }
    }

    // Generar un ID de transferencia para relacionarlas en operation_number
    const transferRef = payload.operation_number || `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // 1. Insertar el egreso en la caja de origen
    const { error: errorOut } = await supabase
      .from('petty_cash_transactions')
      .insert([{
        reason: `[TRANSFERENCIA] Enviado a ${destArea}: ${payload.reason}`,
        amount: payload.amount,
        payment_method: payload.payment_method,
        type: 'egreso',
        category: 'transferencia',
        operation_number: transferRef,
        voucher_url: payload.voucher_url,
        date: payload.date || new Date().toISOString().split('T')[0],
        area: sourceArea,
        company_id: companyId,
        responsible_id: extendedUser.id
      }])

    if (errorOut) return { error: `Error al registrar egreso en ${sourceArea}: ${errorOut.message}` }

    // 2. Insertar el ingreso en la caja de destino
    const { error: errorIn } = await supabase
      .from('petty_cash_transactions')
      .insert([{
        reason: `[TRANSFERENCIA] Recibido de ${sourceArea}: ${payload.reason}`,
        amount: payload.amount,
        payment_method: payload.payment_method,
        type: 'ingreso',
        category: 'transferencia',
        operation_number: transferRef,
        voucher_url: payload.voucher_url,
        date: payload.date || new Date().toISOString().split('T')[0],
        area: destArea,
        company_id: companyId,
        responsible_id: extendedUser.id
      }])

    if (errorIn) return { error: `Error al registrar ingreso en ${destArea}: ${errorIn.message}` }

    revalidatePath('/dashboard')
    revalidatePath('/caja-chica')
    return { success: true }
  }

  // --- LÓGICA DE TRANSACCIÓN INDEPENDIENTE ---
  // Si es un egreso, validar saldo disponible (excepto para admin/gerente/super_admin)
  if (finalType === 'egreso' && !['admin', 'gerente', 'super_admin'].includes(role || '')) {
    const stats = await getPettyCashStats(finalArea)
    if (stats && payload.amount > stats.balance) {
      return { error: `Saldo insuficiente en ${finalArea}. Saldo disponible: S/ ${stats.balance.toFixed(2)}` }
    }
  }

  const { error } = await supabase
    .from('petty_cash_transactions')
    .insert([{
      reason: payload.reason,
      amount: payload.amount,
      payment_method: payload.payment_method,
      type: finalType,
      category: finalCategory,
      operation_number: payload.operation_number,
      date: payload.date || new Date().toISOString().split('T')[0],
      voucher_url: payload.voucher_url,
      area: finalArea,
      company_id: companyId,
      responsible_id: extendedUser.id
    }])

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard')
  revalidatePath('/caja-chica')
  return { success: true }
}

export async function deletePettyCashTransaction(id: string) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  
  if (!extendedUser || !companyId) return { error: 'No autorizado' }
  const supabase = await createAdminClient()

  // Solo admin, gerente o super_admin pueden borrar
  const role = extendedUser.role_id?.toLowerCase()
  if (!['admin', 'gerente', 'super_admin', 'superadmin'].includes(role || '')) {
    return { error: 'No tienes permisos para eliminar movimientos de caja.' }
  }

  // Obtener la transacción actual para saber si es una transferencia
  const { data: currentTx } = await applyIsolation(
    supabase.from('petty_cash_transactions').select('category, operation_number'),
    companyId,
    extendedUser.role_id
  ).eq('id', id).maybeSingle()

  let deleteQuery
  if (currentTx && currentTx.category === 'transferencia' && currentTx.operation_number && currentTx.operation_number.startsWith('TRF-')) {
    // Es una transferencia vinculada, eliminamos ambas por su operation_number
    deleteQuery = applyIsolation(
      supabase.from('petty_cash_transactions').delete(),
      companyId,
      extendedUser.role_id
    ).eq('operation_number', currentTx.operation_number).eq('category', 'transferencia')
  } else {
    // Eliminación individual normal
    deleteQuery = applyIsolation(
      supabase.from('petty_cash_transactions').delete(),
      companyId,
      extendedUser.role_id
    ).eq('id', id)
  }

  const { error } = await deleteQuery

  if (error) return { error: error.message }
  
  revalidatePath('/caja-chica')
  return { success: true }
}

export async function updatePettyCashTransaction(id: string, payload: Partial<{
  reason: string
  amount: number
  payment_method: string
  category: string
  operation_number: string
  date: string
  voucher_url: string
}>) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  
  if (!extendedUser || !companyId) return { error: 'No autorizado' }
  const supabase = await createAdminClient()

  const { error } = await applyIsolation(
    supabase.from('petty_cash_transactions').update(payload),
    companyId,
    extendedUser.role_id
  ).eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/caja-chica')
  return { success: true }
}
