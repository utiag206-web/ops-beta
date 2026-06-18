'use client'
 
import { useState } from 'react'
import Link from 'next/link'
import { 
  Users, UserCheck, ShieldAlert, BadgeDollarSign, 
  Package, Boxes, ClipboardCheck, Activity, 
  Clock, CheckCircle2, ArrowRight, FileText,
  Mountain, Bed, Construction, MountainSnow,
  Bus, Coins, Calendar, Shield, GraduationCap, MessageSquare, Eye,
  ArrowDownLeft, ArrowUpRight, AlertTriangle, Building2, ShoppingCart, Truck, Plus, AlertCircle,
  LayoutDashboard, LayoutGrid, Box, TrendingUp, TrendingDown, ArrowUpDown, ClipboardList, ShieldCheck,
  UserCircle
} from 'lucide-react'
import { StatWidget, AlertWidget, ListWidget, WelcomeHero } from './widgets'
import { AttendanceMarker } from '@/components/attendance/attendance-marker'
import { PPEList } from '@/components/ppe/ppe-list'
import { BonusList } from '@/components/bonuses/bonus-list'
import { TransportList } from '@/components/transport/transport-list'
import { AttendanceList } from '@/components/attendance/attendance-list'
import { ROLE_NAMES } from '@/lib/constants'

interface DashboardShellProps {
  user: any
  stats: any
  localIp?: string
}

// Lógica de prioridad estricta (Espejo de Sidebar y Actions)
// Lógica de prioridad estricta (Espejo de Sidebar y Actions)
function getViewMode(role_id: string, area: string | null) {
  const role = role_id?.toLowerCase()
  const cleanArea = area?.toLowerCase() || ''
  if (role === 'gerente') return 'GERENTE'
  if (['admin', 'super_admin', 'superadmin'].includes(role)) return 'ADMIN'
  if (role === 'administracion') return 'FINANCE'
  if (role === 'soma' || (role === 'jefe_area' && cleanArea === 'seguridad soma')) return 'SOMA'
  if (role === 'jefe_area' && cleanArea === 'cocina') return 'COCINA'
  if (role === 'operaciones' || (role === 'jefe_area' && cleanArea === 'operaciones')) return 'OPERACIONES'
  if (role === 'almacen' || role === 'logistica' || (role === 'jefe_area' && ['almacén y mantenimiento', 'mecánica'].includes(cleanArea))) return 'ALMACEN'
  if (role === 'trabajador') return 'WORKER'
  return 'DEFAULT'
}
export function DashboardShell({ user, stats, localIp }: DashboardShellProps) {
  const roleName = ROLE_NAMES[user.role_id] || "Usuario"
  const companyName = user.company_name || "Empresa"
  const viewMode = stats.activeView === 'WORKER' ? 'WORKER' : getViewMode(user.role_id, user.area)

  const [selectedTalk, setSelectedTalk] = useState<any>(null)
  const [selectedTraining, setSelectedTraining] = useState<any>(null)

  const renderDashboardWidgets = () => {
    switch (viewMode) {
      case 'GERENTE':
        return (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <StatWidget 
                title="Personal Total" value={stats.admin?.totalWorkers?.toString() || '0'} 
                icon={UserCheck} color="text-indigo-600" bg="bg-indigo-50" href="/workers"
              />
              <StatWidget 
                title="Caja Chica Central" value={`S/ ${stats.admin?.totalCajaChicaBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`} 
                icon={Coins} color="text-emerald-600" bg="bg-emerald-50" href="/caja-chica"
              />
              <StatWidget 
                title="Requerimientos" value={stats.admin?.pendingRequirementsCount?.toString() || '0'} 
                icon={FileText} color="text-rose-500" bg="bg-rose-50" href="/requerimientos"
              />
               <StatWidget 
                title="Bonificaciones Pend." value={stats.admin?.pendingBonusesCount?.toString() || '0'} 
                icon={BadgeDollarSign} color="text-amber-600" bg="bg-amber-50" href="/bonuses"
              />
              <StatWidget 
                title="Incidentes Abiertos" value={stats.admin?.openIncidents?.toString() || '0'} 
                icon={ShieldAlert} color="text-rose-600" bg="bg-rose-50" href="/incidencias?category=soma"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Supervisión Semanal</h3>
                    <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Actividad General Operativa</p>
                  </div>
                  <div className="bg-indigo-50 px-5 py-2 rounded-2xl text-indigo-600 font-bold text-xs border border-indigo-100 uppercase">Monitoreo</div>
                </div>
                <div className="h-[200px] md:h-[300px] w-full flex items-end justify-between gap-2 md:gap-4 px-2 md:px-4">
                  {(stats.admin?.weeklyActivity || []).map((day: any) => {
                    const maxWeekly = Math.max(...(stats.admin?.weeklyActivity || []).map((d:any) => d.count || 0), 1)
                    const height = Math.min((day.count / maxWeekly) * 100, 100)
                    return (
                      <div key={day.day} className="flex-1 flex flex-col items-center gap-4 group">
                        <div className="relative w-full flex flex-col items-center">
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl translate-y-2 group-hover:translate-y-0">
                            {day.count} movs.
                          </div>
                          <div 
                            className="w-full max-w-[40px] bg-gradient-to-t from-indigo-600 to-blue-400 rounded-2xl transition-all duration-1000 ease-out shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300"
                            style={{ height: `${height}%`, minHeight: '8px' }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {(() => {
                            const [y, m, d] = day.day.split('-').map(Number)
                            return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' })
                          })()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="xl:col-span-1 space-y-8">
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl md:rounded-[2rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <h3 className="text-xl font-bold text-white tracking-tight mb-6 flex items-center gap-3">
                    <ShieldCheck size={24} className="text-emerald-400 animate-pulse" />
                    Consola de Aprobaciones
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Requerimientos</h4>
                        <p className="text-lg font-black text-white">{stats.admin?.pendingRequirementsCount} Pendientes</p>
                      </div>
                      <Link href="/requerimientos" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest transition-all">Ver</Link>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bonificaciones</h4>
                        <p className="text-lg font-black text-white">{stats.admin?.pendingBonusesCount} En Espera</p>
                      </div>
                      <Link href="/bonuses" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest transition-all">Ver</Link>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pasajes / Transportes</h4>
                        <p className="text-lg font-black text-white">{stats.admin?.pendingTransportCount} Pendientes</p>
                      </div>
                      <Link href="/bonuses" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest transition-all">Ver</Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <AlertCircle size={14} className="text-rose-500 animate-pulse" /> Incidentes de Seguridad
                   </h4>
                   <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">Incidencias Reportadas</span>
                     <span className="text-lg font-bold text-rose-600">{stats.admin?.openIncidents}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'ADMIN':
        return (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <StatWidget 
                title="Usuarios" value={stats.admin?.activeUsers?.toString() || '0'} 
                icon={Users} color="text-indigo-600" bg="bg-indigo-50" href="/users"
              />
              <StatWidget 
                title="Personal" value={stats.admin?.totalWorkers?.toString() || '0'} 
                icon={UserCheck} color="text-blue-600" bg="bg-blue-50" href="/workers"
              />
              <StatWidget 
                title="Caja Chica" value={`S/ ${stats.admin?.totalCajaChicaBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`} 
                icon={Coins} color="text-emerald-600" bg="bg-emerald-50" href="/caja-chica"
              />
               <StatWidget 
                title="Bonos Pend." value={stats.admin?.pendingBonusesCount?.toString() || '0'} 
                icon={BadgeDollarSign} color="text-amber-600" bg="bg-amber-50" href="/bonuses"
              />
              <StatWidget 
                title="Pasajes Pend." value={stats.admin?.pendingTransportCount?.toString() || '0'} 
                icon={Bus} color="text-indigo-500" bg="bg-indigo-50" href="/bonuses"
              />
              <StatWidget 
                title="Incidencias" value={stats.admin?.openIncidents?.toString() || '0'} 
                icon={ShieldAlert} color="text-rose-600" bg="bg-rose-50" href="/incidencias?category=soma"
              />
              <StatWidget 
                title="Gestión de Personal" value={stats.admin?.movementsToday?.toString() || '0'} 
                icon={UserCheck} color="text-blue-600" bg="bg-blue-50" href="/movements"
              />
              <StatWidget 
                title="Requerimientos" value={stats.admin?.pendingRequirementsCount?.toString() || '0'} 
                icon={FileText} color="text-rose-500" bg="bg-rose-50" href="/requerimientos"
              />
              <StatWidget 
                title="Control de Inventario" value={stats.admin?.totalProducts?.toString() || '0'} 
                icon={Boxes} color="text-indigo-600" bg="bg-indigo-50" href="/inventory/stock"
              />
              <StatWidget 
                title="Activos Controlados" value={stats.admin?.assetsCount?.toString() || '0'} 
                icon={Package} color="text-slate-600" bg="bg-slate-50" href="/assets"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* ... existing activity chart col-span-2 ... */}
              <div className="xl:col-span-2 bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Actividad Semanal</h3>
                    <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Movimientos de Inventario</p>
                  </div>
                  <div className="bg-blue-50 px-5 py-2 rounded-2xl text-blue-600 font-bold text-xs border border-blue-100 uppercase">Tiempo Real</div>
                </div>
                <div className="h-[200px] md:h-[300px] w-full flex items-end justify-between gap-2 md:gap-4 px-2 md:px-4">
                  {(stats.admin?.weeklyActivity || []).map((day: any) => {
                    const maxWeekly = Math.max(...(stats.admin?.weeklyActivity || []).map((d:any) => d.count || 0), 1)
                    const height = Math.min((day.count / maxWeekly) * 100, 100)
                    return (
                      <div key={day.day} className="flex-1 flex flex-col items-center gap-4 group">
                        <div className="relative w-full flex flex-col items-center">
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl translate-y-2 group-hover:translate-y-0">
                            {day.count} mov.
                          </div>
                          <div 
                            className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-indigo-400 rounded-2xl transition-all duration-1000 ease-out shadow-lg shadow-blue-200 group-hover:shadow-blue-300"
                            style={{ height: `${height}%`, minHeight: '8px' }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {(() => {
                            const [y, m, d] = day.day.split('-').map(Number)
                            return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' })
                          })()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="xl:col-span-1 space-y-8">
                <div className="bg-[#1D4ED8] rounded-2xl md:rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                       <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                         <LayoutDashboard className="text-white" size={24} />
                       </div>
                       <h3 className="text-2xl font-bold text-white tracking-tight">Acciones Rápidas</h3>
                    </div>
                    <div className="space-y-3">
                       <Link href="/workers" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group">
                          <div className="flex items-center gap-3">
                            <Users className="text-blue-300" size={18} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Registrar Trabajador</span>
                          </div>
                          <Plus className="text-white/40 group-hover:rotate-90 transition-transform" size={16} />
                       </Link>
                       <Link href="/incidencias?category=soma" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group">
                          <div className="flex items-center gap-3">
                            <ShieldAlert className="text-rose-300" size={18} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Registrar Incidencia</span>
                          </div>
                          <Plus className="text-white/40 group-hover:rotate-90 transition-transform" size={16} />
                       </Link>
                       <Link href="/requerimientos" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group">
                          <div className="flex items-center gap-3">
                            <FileText className="text-amber-300" size={18} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Crear Requerimiento</span>
                          </div>
                          <Plus className="text-white/40 group-hover:rotate-90 transition-transform" size={16} />
                       </Link>
                       <Link href="/inventory/stock" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group">
                          <div className="flex items-center gap-3">
                            <Package className="text-emerald-300" size={18} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Ingreso Inventario</span>
                          </div>
                          <Plus className="text-white/40 group-hover:rotate-90 transition-transform" size={16} />
                       </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <AlertTriangle size={14} className="text-rose-500" /> Alerta de Inventario
                   </h4>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                         <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">Productos con Bajo Stock</span>
                         <span className="text-lg font-bold text-rose-600">{stats.admin?.criticalProductsCount}</span>
                      </div>
                      <Link href="/inventory/stock" className="block text-center text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Ver Inventario Total</Link>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'FINANCE':
        return (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatWidget 
                title="Caja Chica (Admin)" value={`S/ ${stats.admin?.totalCajaChicaBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`} 
                icon={Coins} color="text-emerald-600" bg="bg-emerald-50" href="/caja-chica"
              />
              <StatWidget 
                title="Bonos por Pagar" value={stats.admin?.pendingBonusesCount?.toString() || '0'} 
                icon={BadgeDollarSign} color="text-amber-600" bg="bg-amber-50" href="/bonuses"
              />
              <StatWidget 
                title="Pasajes por Pagar" value={stats.admin?.pendingTransportCount?.toString() || '0'} 
                icon={Bus} color="text-indigo-600" bg="bg-indigo-50" href="/bonuses"
              />
              <StatWidget 
                title="Personal Registrado" value={stats.admin?.totalWorkers?.toString() || '0'} 
                icon={UserCheck} color="text-slate-600" bg="bg-slate-50" href="/workers"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <TrendingUp className="text-emerald-500" size={24} /> Reporte Financiero Rápido
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total en Bonos</p>
                        <p className="text-3xl font-bold text-slate-800 tracking-tighter">S/ {(stats.admin?.pendingBonusesCount * 150).toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 italic">* Estimado basado en promedio</p>
                     </div>
                     <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total en Pasajes</p>
                        <p className="text-3xl font-bold text-slate-800 tracking-tighter">S/ {(stats.admin?.pendingTransportCount * 80).toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 italic">* Estimado basado en promedio</p>
                     </div>
                  </div>
               </div>
               <div className="bg-slate-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
                  <h3 className="text-xl font-bold mb-8">Gestión Financiera</h3>
                  <div className="space-y-4">
                     <Link href="/caja-chica" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all">
                        <span className="text-sm font-bold">Resumen de Caja</span>
                        <ArrowRight size={16} />
                     </Link>
                     <Link href="/reports" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all">
                        <span className="text-sm font-bold">Reportes Excel</span>
                        <ArrowRight size={16} />
                     </Link>
                  </div>
               </div>
            </div>
          </div>
        )

      case 'SOMA':
        return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  <StatWidget 
                    title="Incidencias Abiertas" value={stats.soma?.openIncidents?.toString() || '0'} 
                    icon={AlertTriangle} color="text-orange-600" bg="bg-orange-50" href="/incidencias?category=soma"
                  />
                  <StatWidget 
                    title="Incidentes Críticos" value={stats.soma?.criticalIncidents?.toString() || '0'} 
                    icon={ShieldAlert} color="text-rose-600" bg="bg-rose-50" href="/incidencias?category=soma"
                  />
                  <StatWidget 
                    title="STOPs Abiertas" value={stats.soma?.openStops?.toString() || '0'} 
                    icon={Eye} color="text-rose-600" bg="bg-rose-50" href="/soma/hsec"
                  />
                  <StatWidget 
                    title="Capacitaciones Vencidas" value={stats.soma?.expiredTrainings?.toString() || '0'} 
                    icon={GraduationCap} color="text-amber-600" bg="bg-amber-50" href="/soma/capacitaciones"
                  />
                  <StatWidget 
                    title="Charlas Realizadas" value={stats.soma?.totalTalks?.toString() || '0'} 
                    icon={MessageSquare} color="text-blue-600" bg="bg-blue-50" href="/soma/charlas"
                  />
                  <StatWidget 
                    title="Días sin Accidentes" value={stats.soma?.daysWithoutAccidents?.toString() || '0'} 
                    icon={Activity} color="text-emerald-600" bg="bg-emerald-50"
                  />
                  <StatWidget 
                    title="Pendientes Seguimiento" value={stats.soma?.pendingFollowUp?.toString() || '0'} 
                    icon={ClipboardCheck} color="text-indigo-600" bg="bg-indigo-50"
                  />
                </div>
        )

      case 'COCINA':
        return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  <StatWidget 
                    title="Control de Inventario" value={stats.kitchen?.totalProducts?.toString() || '0'} 
                    icon={Boxes} color="text-indigo-600" bg="bg-indigo-50" href="/inventory/stock"
                  />
                  <StatWidget 
                    title="Consumo Hoy" value={`${stats.kitchen?.consumptionToday || '0'} UND`} 
                    icon={ArrowUpRight} color="text-rose-600" bg="bg-rose-50" href="/inventory/history"
                  />
                  <StatWidget 
                    title="Ingresos Hoy" value={`${stats.kitchen?.incomingToday || '0'} UND`} 
                    icon={ArrowDownLeft} color="text-emerald-600" bg="bg-emerald-50" href="/inventory/history"
                  />
                  <StatWidget 
                    title="Caja Chica" value={`S/ ${stats.kitchen?.balance?.toFixed(2) || '0.00'}`} 
                    icon={Coins} color="text-amber-500" bg="bg-amber-50" href="/caja-chica"
                  />
                  <StatWidget 
                    title="Requerimientos" value={stats.kitchen?.pendingRequirements?.toString() || '0'} 
                    icon={FileText} color="text-rose-600" bg="bg-rose-50" href="/requerimientos"
                  />
                </div>
        )

      case 'OPERACIONES':
        return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  <StatWidget 
                    title="Producción del Día" value={stats.ops?.productionToday?.toString() || '0'} 
                    icon={Activity} color="text-emerald-600" bg="bg-emerald-50"
                  />
                  <StatWidget 
                    title="Personal Activo" value={stats.ops?.activeWorkers?.toString() || '0'} 
                    icon={UserCheck} color="text-blue-600" bg="bg-blue-50" href="/workers"
                  />
                  <StatWidget 
                    title="Requerimientos" value={stats.ops?.pendingRequirements?.toString() || '0'} 
                    icon={ClipboardCheck} color="text-rose-600" bg="bg-rose-50" href="/requerimientos"
                  />
                  <StatWidget 
                    title="Gestión de Personal" value={stats.ops?.movementsToday?.toString() || '0'} 
                    icon={UserCheck} color="text-indigo-600" bg="bg-indigo-50" href="/movements"
                  />
                  <StatWidget 
                    title="Incidencias Abiertas" value={stats.ops?.openIncidents?.toString() || '0'} 
                    icon={AlertTriangle} color="text-rose-600" bg="bg-rose-50" href="/incidencias?category=soma"
                  />
                  <StatWidget 
                    title="Transferencias" value={stats.ops?.transfersToday?.toString() || '0'} 
                    icon={ArrowRight} color="text-indigo-400" bg="bg-indigo-50"
                  />
                  <StatWidget 
                    title="Asistencia Hoy" value={stats.ops?.attendanceToday?.toString() || '0'} 
                    icon={Calendar} color="text-blue-400" bg="bg-blue-50"
                  />
                  <StatWidget 
                    title="Productividad %" value={`${stats.ops?.productivity || '0'} %`} 
                    icon={Activity} color="text-emerald-400" bg="bg-emerald-50"
                  />
                </div>
        )

      case 'ALMACEN':
        return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  <StatWidget 
                    title="Productos Registrados" value={stats.logistics?.registeredProducts?.toString() || '0'} 
                    icon={LayoutGrid} color="text-indigo-600" bg="bg-indigo-50" href="/inventory/products"
                  />
                  <StatWidget 
                    title="Control de Inventario" value={stats.logistics?.registeredProducts?.toString() || '0'} 
                    icon={Boxes} color="text-indigo-600" bg="bg-indigo-50" href="/inventory/stock"
                  />
                  <StatWidget 
                    title="Entradas Hoy" value={stats.logistics?.incomingToday?.toString() || '0'} 
                    icon={ArrowDownLeft} color="text-emerald-600" bg="bg-emerald-50" href="/movements"
                  />
                  <StatWidget 
                    title="Salidas Hoy" value={stats.logistics?.outgoingToday?.toString() || '0'} 
                    icon={ArrowUpRight} color="text-rose-600" bg="bg-rose-50" href="/movements"
                  />
                  <StatWidget 
                    title="Activos Controlados" value={stats.admin?.assetsCount?.toString() || '0'} 
                    icon={Package} color="text-slate-600" bg="bg-slate-50" href="/assets"
                  />
                   <StatWidget 
                    title="Transferencias Pend." value={stats.logistics?.pendingTransfers?.toString() || '0'} 
                    icon={Truck} color="text-indigo-400" bg="bg-indigo-50"
                  />
                  <StatWidget 
                    title="Requerimientos" value={stats.logistics?.pendingRequirements?.toString() || '0'} 
                    icon={ClipboardCheck} color="text-rose-500" bg="bg-rose-50" href="/requerimientos"
                  />
                  <StatWidget 
                    title="Movimientos Hoy" value={stats.logistics?.movementsToday?.toString() || '0'} 
                    icon={Box} color="text-blue-600" bg="bg-blue-50" href="/movements"
                  />
                </div>
        )

      case 'WORKER':
        return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  <StatWidget 
                    title="Asistencia Hoy" value={stats.worker?.todayAttendance || 'SIN REGISTRO'} 
                    icon={Clock} color="text-blue-600" bg="bg-blue-50"
                  />
                  <StatWidget 
                    title="Mis Bonos" value={stats.worker?.totalBonuses?.toString() || '0'} 
                    icon={BadgeDollarSign} color="text-emerald-600" bg="bg-emerald-50" href="/profile"
                  />
                  <StatWidget 
                    title="Mis Documentos" value={stats.worker?.totalDocs?.toString() || '0'} 
                    icon={FileText} color="text-indigo-600" bg="bg-indigo-50" href="/documents"
                  />
                   <StatWidget 
                    title="EPP Pendientes" value={stats.worker?.pendingPPE?.toString() || '0'} 
                    icon={ShieldAlert} color="text-rose-600" bg="bg-rose-50" href="/ppe"
                  />
                  <StatWidget 
                    title="Próxima Capacitación" value={stats.worker?.nextTraining || 'No programada'} 
                    icon={GraduationCap} color="text-amber-600" bg="bg-amber-50"
                  />
                  <StatWidget 
                    title="Próxima Charla" value={stats.worker?.nextTalk || 'No programada'} 
                    icon={MessageSquare} color="text-blue-400" bg="bg-blue-50"
                  />
                  <StatWidget 
                    title="Estado Laboral" value={stats.worker?.laborStatus || 'Activo'} 
                    icon={UserCheck} color="text-emerald-400" bg="bg-emerald-50"
                  />
                </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-12 pb-20 max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Hero Section */}
      <WelcomeHero 
        userName={user.display_name} 
        roleName={roleName} 
        area={user.area}
        companyName={companyName} 
        viewMode={viewMode}
        companySlug={user.company_slug}
        localIp={localIp}
      />

      {/* Switcher de Vista removed for unified experience */}

      {/* Attendance for Workers */}
      {viewMode === 'WORKER' && (
        <AttendanceMarker initialStatus={stats.todayAttendance} />
      )}

      {/* Main Stats Segment */}
      {renderDashboardWidgets()}

      {/* Comunicados de Seguridad Transversales (Nueva Sección) */}
      {stats.transversalSoma && (
        <div className="bg-slate-50 border border-slate-200 p-10 rounded-[2rem] shadow-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 group-hover:scale-125 transition-transform duration-1000">
             <Shield size={200} />
           </div>
           <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  Seguridad Industrial Inthaly
                </h3>
                <p className="text-slate-500 font-bold mt-2 max-w-md">Comunicados y alertas activas para todo el personal operativo en cumplimiento con estándares HSEC.</p>
              </div>
              <div className="flex flex-wrap gap-6">
                 {stats.transversalSoma.lastTalk && (
                    <div 
                      onClick={() => setSelectedTalk(stats.transversalSoma.lastTalk)}
                      className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-5 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer"
                    >
                       <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><MessageSquare size={24}/></div>
                       <div>
                         <span className="block text-[10px] uppercase font-bold text-blue-600 tracking-widest mb-1">Última Charla</span>
                         <span className="block text-slate-800 font-bold keep-case">{stats.transversalSoma.lastTalk.topic}</span>
                       </div>
                    </div>
                 )}
                 {stats.transversalSoma.lastTraining && (
                    <div 
                      onClick={() => setSelectedTraining(stats.transversalSoma.lastTraining)}
                      className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-5 hover:border-emerald-200 hover:shadow-lg transition-all cursor-pointer"
                    >
                       <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><GraduationCap size={24}/></div>
                       <div>
                         <span className="block text-[10px] uppercase font-bold text-emerald-600 tracking-widest mb-1">Capacitación</span>
                         <span className="block text-slate-800 font-bold keep-case">{stats.transversalSoma.lastTraining.title}</span>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Listas Secundarias Dinámicas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {stats.recentIncidents && (['ADMIN', 'SOMA', 'OPERACIONES', 'GERENTE'].includes(viewMode)) && (
          <ListWidget 
            title="Siguimiento de Incidencias"
            icon={Activity}
            color="text-orange-600"
            href="/incidencias?category=soma"
            items={stats.recentIncidents.map((i: any) => ({
              title: i.equipment_name || 'Incidente Reportado',
              subtitle: i.description,
              badge: i.severity,
              badgeColor: i.severity === 'critica' || i.severity === 'fatal' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-orange-100 text-orange-700 border-orange-200'
            }))}
          />
        )}

        {stats.pendingRequirements && (['ADMIN', 'OPERACIONES', 'ALMACEN', 'COCINA', 'GERENTE'].includes(viewMode)) && (
          <ListWidget 
            title="Logística y Requerimientos"
            icon={ShoppingCart}
            color="text-indigo-600"
            href="/requerimientos"
            items={stats.pendingRequirements.map((r: any) => ({
              title: r.title || r.description,
              subtitle: `Prioridad: ${r.priority}`,
              badge: r.status,
              badgeColor: 'bg-blue-100 text-blue-700 border-blue-200'
            }))}
          />
        )}
      </div>

      {/* Panel Personal de Trabajador (si aplica) */}
      {user.worker_id && viewMode !== 'WORKER' && stats.personalStats && (
        <div className="pt-16 border-t border-slate-100 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="flex items-center gap-8">
             <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl relative">
                <ShieldAlert size={36} />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full border-4 border-white" />
             </div>
             <div>
               <h3 className="text-4xl font-bold text-slate-800 tracking-tighter">Mi Panel Personal</h3>
               <p className="text-slate-500 font-bold text-xl mt-1">Resumen de tus beneficios y equipos vinculados</p>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100"><PPEList deliveries={stats.personalStats.ppe} isWorker={true} /></div>
            <div className="space-y-10">
              <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100"><BonusList bonuses={stats.personalStats.bonuses} isWorker={true} /></div>
              <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100"><TransportList payments={stats.personalStats.transport} isWorker={true} /></div>
            </div>
          </div>
        </div>
      )}
 
      {/* Modal Detalle Charla */}
      {selectedTalk && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setSelectedTalk(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <MessageSquare size={24} />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold text-blue-600 tracking-widest">Detalle de Charla HSEC</span>
                <h3 className="text-xl font-bold text-slate-800 mt-0.5 keep-case truncate">{selectedTalk.topic}</h3>
              </div>
            </div>
            <div className="space-y-4 text-sm font-medium text-slate-600">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold text-[10px]">Fecha:</span>
                  <span className="text-slate-800 font-bold keep-case">{selectedTalk.date ? new Date(selectedTalk.date + 'T12:00:00').toLocaleDateString() : '—'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold text-[10px]">Ubicación / Frente:</span>
                  <span className="text-slate-800 font-bold keep-case">{selectedTalk.location || 'No especificado'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold text-[10px]">Líder de Charla:</span>
                  <span className="text-slate-800 font-bold keep-case">{selectedTalk.leader?.name || 'No especificado'}</span>
                </div>
                {selectedTalk.target_area && (
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-400 font-bold text-[10px]">Área Objetivo:</span>
                    <span className="text-slate-800 font-bold keep-case">{selectedTalk.target_area}</span>
                  </div>
                )}
                {selectedTalk.material_url && (
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400 font-bold text-[10px]">Material de Apoyo:</span>
                    <a 
                      href={selectedTalk.material_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1 keep-case"
                    >
                      Descargar Material <ArrowRight size={12} />
                    </a>
                  </div>
                )}
              </div>
              {selectedTalk.photo_url && (
                <div className="mt-4">
                  <span className="block text-slate-400 font-bold text-[10px] mb-2">Evidencia Fotográfica:</span>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img 
                      src={selectedTalk.photo_url} 
                      alt="Evidencia fotográfica" 
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setSelectedTalk(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Capacitación */}
      {selectedTraining && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setSelectedTraining(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                <GraduationCap size={24} />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold text-emerald-600 tracking-widest">Detalle de Capacitación</span>
                <h3 className="text-xl font-bold text-slate-800 mt-0.5 keep-case truncate">{selectedTraining.title}</h3>
              </div>
            </div>
            <div className="space-y-4 text-sm font-medium text-slate-600">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold text-[10px]">Fecha Realización:</span>
                  <span className="text-slate-800 font-bold keep-case">{selectedTraining.date ? new Date(selectedTraining.date + 'T12:00:00').toLocaleDateString() : '—'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold text-[10px]">Expositor / Capacitador:</span>
                  <span className="text-slate-800 font-bold keep-case">{selectedTraining.trainer || 'No especificado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-[10px]">Fecha de Vencimiento:</span>
                  <span className={`font-bold keep-case ${selectedTraining.expiry_date && new Date(selectedTraining.expiry_date) < new Date() ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedTraining.expiry_date ? new Date(selectedTraining.expiry_date + 'T12:00:00').toLocaleDateString() : 'No vence'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setSelectedTraining(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
