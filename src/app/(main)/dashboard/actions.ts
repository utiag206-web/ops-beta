'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserSession, applyIsolation } from '@/lib/auth'

export async function getDashboardStats() {
  try {
    const session = await getUserSession()
    const user = session?.extendedUser
    
    if (!user) return null

    // Usamos el ID activo (que puede ser el de impersonación) directamente de la sesión optimizada
    const companyId = user.active_company_id || user.company_id
    
    if (!companyId && user.role_id !== 'super_admin' && user.role_id !== 'superadmin') {
      return null
    }

    const supabase = await createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    let stats: any = {
      role_id: user.role_id,
      company_name: user.companies?.name || 'Sistema'
    }

    // 1. PRIORIDAD ESTRICTA PARA DATA FETCHING
    const isAdmin = ['admin', 'gerente', 'administracion', 'super_admin', 'superadmin'].includes(user.role_id?.toLowerCase())
    const isSoma = !isAdmin && (user.role_id === 'soma' || (user.role_id === 'jefe_area' && user.area === 'Seguridad SOMA'))
    const isCocina = !isAdmin && !isSoma && (user.role_id === 'jefe_area' && user.area === 'Cocina')
    const isOperaciones = !isAdmin && !isSoma && !isCocina && (user.role_id === 'operaciones' || user.role_id === 'jefe_area')
    const isAlmacen = !isAdmin && !isSoma && !isCocina && !isOperaciones && (user.role_id === 'almacen')
    const isWorker = !isAdmin && !isSoma && !isCocina && !isOperaciones && !isAlmacen && (user.role_id === 'trabajador')

    // 2. FETCH POR MODO EXCLUSIVO
    if (isAdmin) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      const [u, w, p, cashTotal, inc, reqs, movsToday, critical, weekly, comps, pendingBonuses, pendingTransport, assets] = await Promise.all([
        applyIsolation(supabase.from('users').select('id', { count: 'exact', head: true }), companyId, user.role_id),
        applyIsolation(supabase.from('workers').select('id', { count: 'exact', head: true }), companyId, user.role_id),
        applyIsolation(supabase.from('products').select('id', { count: 'exact', head: true }), companyId, user.role_id),
        applyIsolation(supabase.from('petty_cash_transactions').select('amount, type'), companyId, user.role_id),
        applyIsolation(supabase.from('incidencias').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('status', 'abierta'),
        applyIsolation(supabase.from('requirements').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('status', 'pendiente'),
        applyIsolation(supabase.from('worker_movements').select('id', { count: 'exact', head: true }), companyId, user.role_id).gte('created_at', today),
        applyIsolation(supabase.from('inventory_stock').select('id', { count: 'exact', head: true }), companyId, user.role_id).lt('quantity', 5),
        applyIsolation(supabase.from('inventory_movements').select('created_at, type, effect, quantity'), companyId, user.role_id).gte('created_at', sevenDaysAgoStr),
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        applyIsolation(supabase.from('bonuses').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('status', 'pendiente'),
        applyIsolation(supabase.from('transport_payments').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('status', 'pendiente'),
        applyIsolation(supabase.from('assets').select('id', { count: 'exact', head: true }), companyId, user.role_id)
      ])

      const isSuperAdmin = user.role_id === 'super_admin' || user.role_id === 'superadmin'

      const balance = (cashTotal.data || []).reduce((acc, t) => {
        const val = Number(t.amount) || 0
        return t.type === 'ingreso' ? acc + val : acc - val
      }, 0)

      const activityMap: Record<string, number> = {}
      stats.weeklyMovements = {}
      for (let i = 0; i < 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        activityMap[dateStr] = 0
        stats.weeklyMovements[dateStr] = { in: 0, out: 0 }
      }
      
      if (weekly.data) {
        weekly.data.forEach(m => {
          if (!m.created_at) return
          const date = m.created_at.split('T')[0]
          if (!stats.weeklyMovements[date]) return
          if (m.effect === 'IN') stats.weeklyMovements[date].in += Number(m.quantity) || 0
          if (m.effect === 'OUT') stats.weeklyMovements[date].out += Number(m.quantity) || 0
        })
      }

      const weeklyActivity = Object.entries(activityMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, count]) => ({ day, count }))

      stats.admin = {
        activeUsers: u.count || 0,
        totalWorkers: w.count || 0,
        totalCajaChicaBalance: balance,
        openIncidents: inc.count || 0,
        movementsToday: movsToday.count || 0,
        activeCompanies: isSuperAdmin ? (comps.count || 1) : 1, // El admin solo ve su propia empresa
        pendingRequirementsCount: reqs.count || 0,
        criticalProductsCount: critical.count || 0,
        pendingBonusesCount: pendingBonuses.count || 0,
        pendingTransportCount: pendingTransport.count || 0,
        assetsCount: assets?.count || 0,
        weeklyActivity
      }
    } 
    else if (isSoma) {
      const [trains, talks, inc, ppe, stops] = await Promise.all([
        applyIsolation(supabase.from('soma_trainings').select('id, expiry_date'), companyId, user.role_id),
        applyIsolation(supabase.from('soma_talks').select('id', { count: 'exact', head: true }), companyId, user.role_id),
        applyIsolation(supabase.from('incidencias').select('*'), companyId, user.role_id),
        applyIsolation(supabase.from('ppe_deliveries').select('id, equipment_name, worker:workers(name)'), companyId, user.role_id).eq('status', 'pending_signature').limit(5),
        applyIsolation(supabase.from('soma_hsec_stop').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('status', 'abierta')
      ])
      const incidentData = inc.data || []
      const criticalCount = incidentData.filter(i => ['fatal', 'crítico', 'grave'].includes(i.severity?.toLowerCase())).length
      const lastAcc = incidentData.filter(i => ['fatal', 'crítico', 'grave'].includes(i.severity?.toLowerCase()))
        .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      
      stats.soma = {
        openIncidents: incidentData.filter(i => i.status === 'abierta').length,
        criticalIncidents: criticalCount,
        openStops: stops.count || 0,
        expiredTrainings: (trains.data || []).filter(t => t.expiry_date && new Date(t.expiry_date) < new Date()).length,
        totalTalks: talks.count || 0,
        daysWithoutAccidents: lastAcc ? Math.floor((new Date().getTime() - new Date(lastAcc.created_at).getTime()) / (1000 * 3600 * 24)) : 365,
        pendingFollowUp: incidentData.filter(i => i.status === 'seguimiento').length
      }
      stats.pendingPPE_list = ppe.data || []
    }
    else if (isCocina) {
      const [cash, stock, movs, reqs] = await Promise.all([
        applyIsolation(supabase.from('petty_cash_transactions').select('amount, type'), companyId, user.role_id).ilike('area', 'Cocina'),
        applyIsolation(supabase.from('inventory_stock').select('quantity, warehouses!inner(area)'), companyId, user.role_id).ilike('warehouses.area', 'Cocina'),
        applyIsolation(supabase.from('inventory_movements').select('quantity, type, warehouses!inner(area), products(name)'), companyId, user.role_id).gte('created_at', today).ilike('warehouses.area', 'Cocina'),
        applyIsolation(supabase.from('requirements').select('*'), companyId, user.role_id).ilike('area', 'Cocina').eq('status', 'pendiente')
      ])

      stats.kitchen = {
        criticalProducts: (stock?.data || []).filter(s => s.quantity < 5).length,
        consumptionToday: (movs.data || []).filter(m => m.type === 'salida').reduce((acc, m) => acc + (Number(m.quantity) || 0), 0),
        incomingToday: (movs.data || []).filter(m => m.type === 'ingreso').reduce((acc, m) => acc + (Number(m.quantity) || 0), 0),
        balance: (cash?.data || []).reduce((acc, t) => t.type === 'ingreso' ? acc + (Number(t.amount) || 0) : acc - (Number(t.amount) || 0), 0),
        pendingRequirements: reqs.data?.length || 0,
        recentPurchases: (movs.data || []).filter(m => m.type === 'ingreso').slice(0, 5)
      }
    }
    else if (isOperaciones) {
      const [reqs, wrks, movs, inc, prod, trs, att] = await Promise.all([
        applyIsolation(supabase.from('requirements').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('status', 'pendiente'),
        applyIsolation(supabase.from('workers').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('status', 'active'),
        applyIsolation(supabase.from('worker_movements').select('id', { count: 'exact', head: true }), companyId, user.role_id).gte('created_at', today),
        applyIsolation(supabase.from('incidencias').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('status', 'abierta'),
        applyIsolation(supabase.from('tareo_records').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('date', today),
        applyIsolation(supabase.from('worker_movements').select('id', { count: 'exact', head: true }), companyId, user.role_id).or(`subida_date.not.is.null,bajada_date.not.is.null`).gte('created_at', today),
        applyIsolation(supabase.from('attendance').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('date', today)
      ])
      
      const prodScore = prod.count || 0
      const target = 100 // Meta base operativa
      
      stats.ops = {
        productionToday: prodScore,
        activeWorkers: wrks.count || 0,
        pendingRequirements: reqs.count || 0,
        movementsToday: movs.count || 0,
        openIncidents: inc.count || 0,
        transfersToday: trs.count || 0,
        attendanceToday: att.count || 0,
        productivity: Math.round((prodScore / target) * 100)
      }
    }
    else if (isAlmacen) {
      const [prods, crit, movs, reqs, trs] = await Promise.all([
        applyIsolation(supabase.from('products').select('id', { count: 'exact', head: true }), companyId, user.role_id),
        applyIsolation(supabase.from('inventory_stock').select('id', { count: 'exact', head: true }), companyId, user.role_id).lt('quantity', 5),
        applyIsolation(supabase.from('inventory_movements').select('type'), companyId, user.role_id).gte('created_at', today),
        applyIsolation(supabase.from('requirements').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('status', 'pendiente'),
        applyIsolation(supabase.from('inventory_movements').select('id', { count: 'exact', head: true }), companyId, user.role_id).eq('document_type', 'TRS').eq('observation', 'PENDIENTE')
      ])
      
      const movsData = movs.data || []
      
      stats.logistics = {
        registeredProducts: prods.count || 0,
        criticalProducts: crit.count || 0,
        incomingToday: movsData.filter(m => m.type === 'ingreso').length,
        outgoingToday: movsData.filter(m => m.type === 'salida').length,
        pendingTransfers: trs.count || 0,
        pendingRequirements: reqs.count || 0,
        movementsToday: movsData.length
      }
    }
    else if (isWorker && user.worker_id) {
      const [att, ppe, docs, bns, nextT, nextS] = await Promise.all([
        supabase.from('attendance').select('status, created_at').eq('worker_id', user.worker_id).eq('date', today).maybeSingle(),
        supabase.from('ppe_deliveries').select('id', { count: 'exact', head: true }).eq('worker_id', user.worker_id).or('status.eq.pending_signature,signature_url.is.null'),
        supabase.from('worker_documents').select('id', { count: 'exact', head: true }).eq('worker_id', user.worker_id),
        supabase.from('bonuses').select('id', { count: 'exact', head: true }).eq('worker_id', user.worker_id),
        applyIsolation(supabase.from('soma_trainings').select('title, date'), companyId, user.role_id).gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle(),
        applyIsolation(supabase.from('soma_talks').select('topic, date'), companyId, user.role_id).gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle()
      ])

      const { data: workerData } = await supabase.from('workers').select('status').eq('id', user.worker_id).maybeSingle()

      stats.worker = {
        todayAttendance: att.data?.status || 'SIN REGISTRO',
        totalBonuses: bns.count || 0,
        totalDocs: docs.count || 0,
        pendingPPE: ppe.count || 0,
        nextTraining: nextT.data?.title || 'No programada',
        nextTalk: nextS.data?.topic || 'No programada',
        laborStatus: workerData?.status || 'Active'
      }
    }

    // 3. FETCH TRANSVERSAL SOMA PARA TODOS
    const [lastTalk, lastTrain] = await Promise.all([
      applyIsolation(supabase.from('soma_talks').select('topic, date'), companyId, user.role_id).order('date', { ascending: false }).limit(1).maybeSingle(),
      applyIsolation(supabase.from('soma_trainings').select('title, date'), companyId, user.role_id).order('date', { ascending: false }).limit(1).maybeSingle()
    ])
    stats.transversalSoma = {
      lastTalk: lastTalk.data,
      lastTraining: lastTrain.data
    }

    // 4. DATOS PERSONALES PARA ADMINS/JEFES QUE SON TRABAJADORES
    if (user.worker_id && !isWorker) {
      const [ppe, bns, trns, att] = await Promise.all([
        supabase.from('ppe_deliveries').select('*').eq('worker_id', user.worker_id).order('delivery_date', { ascending: false }).limit(3),
        supabase.from('bonuses').select('*').eq('worker_id', user.worker_id).order('date', { ascending: false }).limit(3),
        supabase.from('transport_payments').select('*').eq('worker_id', user.worker_id).order('date', { ascending: false }).limit(3),
        supabase.from('attendance').select('*').eq('worker_id', user.worker_id).order('date', { ascending: false }).limit(5)
      ])
      stats.personalStats = { ppe: ppe.data || [], bonuses: bns.data || [], transport: trns.data || [], attendance: att.data || [] }
    }

    return stats
  } catch (err: any) {
    if (err.digest?.startsWith('NEXT_REDIRECT')) throw err
    console.error("[DASHBOARD_STATS_ERROR]:", err.message)
    return null
  }
}

export async function getTodayAttendance() {
  const { extendedUser } = await getUserSession()
  if (!extendedUser?.worker_id) return null
  const supabase = await createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase.from('attendance').select('id, status, created_at').eq('worker_id', extendedUser.worker_id).eq('date', today).maybeSingle()
  return error ? null : data
}
