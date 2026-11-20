'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, requirePermission, getStrictCompanyId, applyIsolation } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { normalizeAreaName } from '@/lib/permissions'

export async function getPettyCashStats(area: string) {
 const { extendedUser } = await getUserSession()
 const companyId = await getStrictCompanyId()
 
 if (!extendedUser || !companyId) throw new Error('No autorizado')

 // Blindaje de seguridad por Área
 const role = extendedUser.role_id?.toLowerCase()
 const isAdmin = ['admin', 'gerente', 'super_admin', 'superadmin'].includes(role)
 let finalArea = area
 
 if (!isAdmin) {
 if (!extendedUser.area) {
 throw new Error('No autorizado: Tu usuario no tiene un área asignada. Contacta al administrador.')
 }
 finalArea = extendedUser.area
 }
 
 const supabase = await createAdminClient()
 const today = new Date()
 const firstDayOfMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`

 // 1. Obtener todas las transacciones para Saldo Actual (Total histórico de la caja)
 const { data: allTransactions } = await applyIsolation(
 supabase.from('petty_cash_transactions').select('amount, type'),
 companyId,
 extendedUser.role_id
 ).ilike('area', finalArea)

 const balance = (allTransactions || []).reduce((acc: number, t: any) => {
 return t.type === 'ingreso' ? acc + Number(t.amount) : acc - Number(t.amount)
 }, 0)

 // 2. Obtener estadísticas del mes actual
 const { data: monthTransactions } = await applyIsolation(
 supabase.from('petty_cash_transactions').select('amount, type'),
 companyId,
 extendedUser.role_id
 )
 .ilike('area', finalArea)
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

 // Blindaje de seguridad por Área
 const role = extendedUser.role_id?.toLowerCase()
 const isAdmin = ['admin', 'gerente', 'super_admin', 'superadmin'].includes(role)
 let finalArea = area
 
 if (!isAdmin) {
 if (!extendedUser.area) {
 return { error: 'No autorizado: Tu usuario no tiene un área asignada. Contacta al administrador.' }
 }
 finalArea = extendedUser.area
 }

 const supabase = await createAdminClient()
 const { data, error } = await applyIsolation(
 supabase.from('petty_cash_transactions').select('*, responsible:users!responsible_id(name)'),
 companyId,
 extendedUser.role_id
 )
 .ilike('area', finalArea) // [SYNC_NORMALIZATION]
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

 // [BLINDAJE_ESTRICTO] El área se determina dinámicamente si no es administrador
 let finalArea = payload.area
 const role = extendedUser.role_id?.toLowerCase()
 const isAdmin = ['admin', 'gerente', 'super_admin', 'superadmin'].includes(role)
 
 if (!isAdmin) {
 if (!extendedUser.area) {
 return { error: 'No autorizado: Tu usuario no tiene un área asignada. Contacta al administrador.' }
 }
 finalArea = extendedUser.area
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

 if (!payload.target_area || payload.target_area.toLowerCase() === finalArea.toLowerCase()) {
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
 const enrichedReason = `${payload.reason} [TRF: ${sourceArea} -> ${destArea}]`

 // Realizar transferencia atómica mediante función RPC en PostgreSQL
 const { error: rpcError } = await supabase.rpc('register_petty_cash_transfer', {
 p_company_id: companyId,
 p_responsible_id: extendedUser.id,
 p_source_area: sourceArea,
 p_dest_area: destArea,
 p_amount: payload.amount,
 p_reason: enrichedReason,
 p_payment_method: payload.payment_method,
 p_operation_number: transferRef,
 p_date: payload.date || new Date().toISOString().split('T')[0],
 p_voucher_url: payload.voucher_url || null
 })

 if (rpcError) {
 console.error('[PETTY_CASH_RPC_ERROR]:', rpcError)
 return { error: `Error en transferencia: ${rpcError.message}` }
 }

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
 if (currentTx && currentTx.category === 'transferencia' && currentTx.operation_number) {
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

 // Obtener la transacción actual para ver si es transferencia
 const { data: currentTx } = await applyIsolation(
 supabase.from('petty_cash_transactions').select('category, operation_number, reason, area'),
 companyId,
 extendedUser.role_id
 ).eq('id', id).maybeSingle()

 const role = extendedUser.role_id?.toLowerCase()
 const isAdmin = ['admin', 'gerente', 'super_admin', 'superadmin'].includes(role)
 
 if (!isAdmin) {
 if (!extendedUser.area) {
 return { error: 'No autorizado: Tu usuario no tiene un área asignada. Contacta al administrador.' }
 }
 if (!currentTx || normalizeAreaName(currentTx.area) !== normalizeAreaName(extendedUser.area)) {
 return { error: 'No tienes permisos para actualizar transacciones de otras áreas.' }
 }
 }

 let updateQuery
 if (currentTx && currentTx.category === 'transferencia' && currentTx.operation_number) {
 let updatedPayload = { ...payload }
 if (payload.reason) {
 const trfMatch = currentTx.reason.match(/\[TRF: .*? -> .*?\]/)
 if (trfMatch && !payload.reason.includes('[TRF:')) {
 updatedPayload.reason = `${payload.reason} ${trfMatch[0]}`
 }
 }
 updateQuery = applyIsolation(
 supabase.from('petty_cash_transactions').update(updatedPayload),
 companyId,
 extendedUser.role_id
 ).eq('operation_number', currentTx.operation_number).eq('category', 'transferencia')
 } else {
 updateQuery = applyIsolation(
 supabase.from('petty_cash_transactions').update(payload),
 companyId,
 extendedUser.role_id
 ).eq('id', id)
 }

 const { error } = await updateQuery

 if (error) return { error: error.message }
 
 revalidatePath('/caja-chica')
 return { success: true }
}
