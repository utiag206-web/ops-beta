'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'

export async function getReportsData(month?: number, year?: number) {
  const now = new Date()
  const targetMonth = month || now.getMonth() + 1
  const targetYear = year || now.getFullYear()

  try {
    const { extendedUser } = await getUserSession()
    const companyId = await getStrictCompanyId()
    const supabase = await createAdminClient()
    
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

    const fullRangeStart = lastRange.start
    const fullRangeEnd = currentRange.end

    const [workersRes, financialsRes, attendanceRes, ppeRes, somaRes] = await Promise.all([
      applyIsolation(supabase.from('workers').select('id, status, position'), companyId, extendedUser.role_id),
      Promise.all([
        applyIsolation(supabase.from('bonuses').select('amount, status, date'), companyId, extendedUser.role_id).gte('date', fullRangeStart).lte('date', fullRangeEnd),
        applyIsolation(supabase.from('transport_payments').select('amount, status, date'), companyId, extendedUser.role_id).gte('date', fullRangeStart).lte('date', fullRangeEnd)
      ]),
      applyIsolation(supabase.from('attendance').select('date, worker_id, check_in, check_out'), companyId, extendedUser.role_id).gte('date', currentRange.start).lte('date', currentRange.end),
      applyIsolation(supabase.from('ppe_deliveries').select('status, worker_id, signature_url'), companyId, extendedUser.role_id),
      Promise.all([
        applyIsolation(supabase.from('incidencias').select('*'), companyId, extendedUser.role_id),
        applyIsolation(supabase.from('soma_trainings').select('*'), companyId, extendedUser.role_id),
        applyIsolation(supabase.from('soma_hsec_stop').select('*'), companyId, extendedUser.role_id)
      ])
    ])

    const workers = workersRes.data || []
    const bonuses = financialsRes[0]?.data || []
    const transport = financialsRes[1]?.data || []
    const attendance = attendanceRes.data || []
    const ppe = ppeRes.data || []
    const incidencias = somaRes[0]?.data || []
    const trainings = somaRes[1]?.data || []
    const hsec = somaRes[2]?.data || []

    const activeCount = workers.filter(w => w.status === 'active').length
    const inactiveCount = workers.length - activeCount

    const splitDataByMonth = (items: any[], range: { start: string, end: string }) => 
      (items || []).filter(i => i.date >= range.start && i.date <= range.end)

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
      data.bonuses?.forEach(b => {
        const amt = Number(b.amount) || 0
        b.status === 'paid' ? bPaid += amt : bPending += amt
      })
      data.transport?.forEach(t => {
        const amt = Number(t.amount) || 0
        t.status === 'paid' ? tPaid += amt : tPending += amt
      })
      return { bPaid, bPending, tPaid, tPending, total: bPaid + bPending + tPaid + tPending }
    }

    const currentTotals = calculateTotals(currentFinancials)
    const lastTotals = calculateTotals(lastFinancials)

    const uniqueDates = Array.from(new Set(attendance.map(a => a.date))).length
    const avgAttendance = uniqueDates > 0 ? attendance.length / uniqueDates : 0

    const totalPPE = ppe.length
    const signedPPE = ppe.filter(p => p.status === 'delivered' && p.signature_url).length
    const pendingPPE = totalPPE - signedPPE
    const workersWithPendingPPE = Array.from(new Set(ppe.filter(p => p.status !== 'delivered').map(p => p.worker_id))).length

    return {
      workers: { active: activeCount, inactive: inactiveCount, total: workers?.length || 0 },
      financials: { current: currentTotals, last: lastTotals, data: currentFinancials },
      attendance: { 
        avgDaily: Number(avgAttendance || 0).toFixed(1), 
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
  } catch (error: any) {
    if (
      error.digest === 'DYNAMIC_SERVER_USAGE' ||
      error.message?.includes('DYNAMIC_SERVER_USAGE') ||
      error.message?.includes('Dynamic server usage')
    ) {
      throw error
    }
    console.error('[REPORTS_ERROR] Critical failure in analytics engine:', error.message)
    return {
      workers: { active: 0, inactive: 0, total: 0 },
      financials: { current: { bPaid: 0, bPending: 0, tPaid: 0, tPending: 0, total: 0 }, last: { bPaid: 0, bPending: 0, tPaid: 0, tPending: 0, total: 0 }, data: { bonuses: [], transport: [] } },
      attendance: { avgDaily: "0", totalRecords: 0, raw: [] },
      ppe: { total: 0, signed: 0, pending: 0, rate: 0, workersPending: 0 },
      soma: { incidencias: 0, openIncidencias: 0, trainings: 0, hsec: 0, openHsec: 0 },
      period: { month: targetMonth, year: targetYear }
    }
  }
}

export async function getDetailedHistory(filters: {
  type: 'bonuses' | 'transport' | 'attendance',
  startDate: string,
  endDate: string,
  workerId?: string
}) {
  const { extendedUser } = await getUserSession()
  const companyId = await getStrictCompanyId()
  const supabase = await createAdminClient()
  const tableName = filters.type === 'transport' ? 'transport_payments' : filters.type
  let query = applyIsolation(
    supabase.from(tableName).select('*, worker:workers(name, position)'),
    companyId,
    extendedUser.role_id
  )
    .gte('date', filters.startDate)
    .lte('date', filters.endDate)

  if (filters.workerId) {
    query = query.eq('worker_id', filters.workerId)
  }

  const { data, error } = await query.order('date', { ascending: false })
  if (error) return []
  return data
}
