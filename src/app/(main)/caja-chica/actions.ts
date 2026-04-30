'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserSession, requirePermission } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getPettyCashStats(area: string) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return null
  
  const supabase = await createClient()
  const today = new Date()
  const firstDayOfMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`

  // 1. Obtener todas las transacciones para Saldo Actual (Total histórico de la caja)
  const { data: allTransactions } = await supabase
    .from('petty_cash_transactions')
    .select('amount, type')
    .eq('company_id', extendedUser.company_id)
    .ilike('area', area)

  const balance = (allTransactions || []).reduce((acc, t) => {
    return t.type === 'ingreso' ? acc + Number(t.amount) : acc - Number(t.amount)
  }, 0)

  // 2. Obtener estadísticas del mes actual
  const { data: monthTransactions } = await supabase
    .from('petty_cash_transactions')
    .select('amount, type')
    .eq('company_id', extendedUser.company_id)
    .ilike('area', area)
    .gte('date', firstDayOfMonth)

  const monthIncome = (monthTransactions || [])
    .filter(t => t.type === 'ingreso')
    .reduce((acc, t) => acc + Number(t.amount), 0)

  const monthExpenses = (monthTransactions || [])
    .filter(t => t.type === 'egreso')
    .reduce((acc, t) => acc + Number(t.amount), 0)
  
  return {
    balance,
    monthIncome,
    monthExpenses,
    initialAmount: balance + monthExpenses - monthIncome // Valor informativo
  }
}

export async function getPettyCashTransactions(area: string) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return { error: 'No autorizado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('petty_cash_transactions')
    .select('*, responsible:users!responsible_id(name)')
    .eq('company_id', extendedUser.company_id)
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
}) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return { error: 'No autorizado' }

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

  const supabase = await createClient()

  // Si es un egreso, validar saldo disponible (excepto para admin/gerente)
  if (finalType === 'egreso' && extendedUser.role_id !== 'admin' && extendedUser.role_id !== 'gerente') {
    const stats = await getPettyCashStats(payload.area)
    if (stats && payload.amount > stats.balance) {
      return { error: `Saldo insuficiente. Saldo disponible: S/ ${stats.balance.toFixed(2)}` }
    }
  }

  const { error } = await supabase
    .from('petty_cash_transactions')
    .insert([{
      ...payload,
      type: finalType,
      category: finalCategory,
      company_id: extendedUser.company_id,
      responsible_id: extendedUser.id,
      date: payload.date || new Date().toISOString().split('T')[0]
    }])

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard')
  revalidatePath('/caja-chica')
  return { success: true }
}
