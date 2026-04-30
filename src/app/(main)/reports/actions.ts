'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserSession } from '@/lib/auth'

export async function getReportsData(month?: number, year?: number) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return null

  const supabase = await createClient()
  
  const now = new Date()
  const targetMonth = month || now.getMonth() + 1
  const targetYear = year || now.getFullYear()

  // Last Month for comparison
  const lastMonth = targetMonth === 1 ? 12 : targetMonth - 1
  const lastMonthYear = targetMonth === 1 ? targetYear - 1 : targetYear

  const getDateRange = (m: number, y: number) => {
    const start = `${y}-${m.toString().padStart(2, '0')}-01`
    const last = new Date(y, m, 0).getDate()
    const end = `${y}-${m.toString().padStart(2, '0')}-${last}`
    return { start, end }
  }

  const currentRange = getDateRange(targetMonth, targetYear)
  const lastRange = getDateRange(lastMonth, lastMonthYear)

  // 2. FINANCIAL DATA (Bonuses & Transport) - Fetch both months in one query to save roundtrips
  const fullRangeStart = lastRange.start
  const fullRangeEnd = currentRange.end

  const [workersRes, financialsRes, attendanceRes, ppeRes, somaRes] = await Promise.all([
    supabase.from('workers').select('id, status, position').eq('company_id', extendedUser.company_id),
    Promise.all([
      supabase.from('bonuses').select('amount, status, date').eq('company_id', extendedUser.company_id).gte('date', fullRangeStart).lte('date', fullRangeEnd),
      supabase.from('transport_payments').select('amount, status, date').eq('company_id', extendedUser.company_id).gte('date', fullRangeStart).lte('date', fullRangeEnd)
    ]),
    supabase.from('attendance').select('date, worker_id, check_in, check_out').eq('company_id', extendedUser.company_id).gte('date', currentRange.start).lte('date', currentRange.end),
    supabase.from('ppe_deliveries').select('status, worker_id, signature_url').eq('company_id', extendedUser.company_id),
    Promise.all([
      supabase.from('incidencias').select('*').eq('company_id', extendedUser.company_id),
      supabase.from('soma_trainings').select('*').eq('company_id', extendedUser.company_id),
      supabase.from('soma_hsec_stop').select('*').eq('company_id', extendedUser.company_id)
    ])
  ])

  const workers = workersRes.data || []
  const [bonuses, transport] = financialsRes.map(r => r.data || [])
  const attendance = attendanceRes.data || []
  const ppe = ppeRes.data || []
  const [incidencias, trainings, hsec] = somaRes.map(r => r.data || [])

  const activeCount = workers.filter(w => w.status === 'active').length
  const inactiveCount = workers.length - activeCount

  const splitDataByMonth = (items: any[], range: { start: string, end: string }) => 
    items.filter(i => i.date >= range.start && i.date <= range.end)

  const currentFinancials = {
    bonuses: splitDataByMonth(bonuses, currentRange),
    transport: splitDataByMonth(transport, currentRange)
  }
  const lastFinancials = {
    bonuses: splitDataByMonth(bonuses, lastRange),
    transport: splitDataByMonth(transport, lastRange)
  }

  const calculateTotals = (data: { bonuses: any[], transport: any[] }) => {
    let bPaid = 0, bPending = 0, tPaid = 0, tPending = 0
    data.bonuses.forEach(b => b.status === 'paid' ? bPaid += Number(b.amount) : bPending += Number(b.amount))
    data.transport.forEach(t => t.status === 'paid' ? tPaid += Number(t.amount) : tPending += Number(t.amount))
    return { bPaid, bPending, tPaid, tPending, total: bPaid + bPending + tPaid + tPending }
  }

  const currentTotals = calculateTotals(currentFinancials)
  const lastTotals = calculateTotals(lastFinancials)

  const totalDays = new Date(targetYear, targetMonth, 0).getDate()
  const uniqueDates = Array.from(new Set(attendance.map(a => a.date))).length
  const avgAttendance = uniqueDates > 0 ? attendance.length / uniqueDates : 0

  // 4. PPE COMPLIANCE
  const totalPPE = ppe.length
  const signedPPE = ppe.filter(p => p.status === 'delivered' && p.signature_url).length
  const pendingPPE = totalPPE - signedPPE
  
  // Workers with at least one pending PPE
  const workersWithPendingPPE = Array.from(new Set(ppe.filter(p => p.status !== 'delivered').map(p => p.worker_id))).length

  return {
    workers: { active: activeCount, inactive: inactiveCount, total: workers?.length || 0 },
    financials: { current: currentTotals, last: lastTotals, data: currentFinancials },
    attendance: { 
      avgDaily: avgAttendance.toFixed(1), 
      totalRecords: attendance?.length || 0,
      raw: attendance || []
    },
    ppe: { 
      total: totalPPE, 
      signed: signedPPE, 
      pending: pendingPPE, 
      rate: totalPPE > 0 ? Math.round((signedPPE / totalPPE) * 100) : 0,
      workersPending: workersWithPendingPPE
    },
    soma: {
      incidencias: incidencias.length,
      openIncidencias: incidencias.filter(i => i.status === 'abierta').length,
      trainings: trainings.length,
      hsec: hsec.length,
      openHsec: hsec.filter(h => h.status === 'abierta').length
    },
    period: { month: targetMonth, year: targetYear }
  }
}

export async function getDetailedHistory(filters: {
  type: 'bonuses' | 'transport' | 'attendance',
  startDate: string,
  endDate: string,
  workerId?: string
}) {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.company_id) return []

  const supabase = await createClient()
  const tableName = filters.type === 'transport' ? 'transport_payments' : filters.type
  let query = supabase
    .from(tableName)
    .select('*, worker:workers(name, position)')
    .eq('company_id', extendedUser.company_id)
    .gte('date', filters.startDate)
    .lte('date', filters.endDate)

  if (filters.workerId) {
    query = query.eq('worker_id', filters.workerId)
  }

  const { data, error } = await query.order('date', { ascending: false })
  if (error) return []
  return data
}
