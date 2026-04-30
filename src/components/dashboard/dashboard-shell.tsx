import Link from 'next/link'
import { 
  Users, UserCheck, ShieldAlert, BadgeDollarSign, 
  Package, Boxes, ClipboardCheck, Activity, 
  Clock, CheckCircle2, ArrowRight, FileText,
  Mountain, Bed, Construction, MountainSnow,
  Bus, Coins, Calendar, Shield, GraduationCap, MessageSquare, Eye,
  ArrowDownLeft, ArrowUpRight, AlertTriangle, Building2, ShoppingCart, Truck, Plus,
  LayoutDashboard, LayoutGrid, Box, TrendingUp, TrendingDown, ArrowUpDown, ClipboardList, ShieldCheck
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
}

// Lógica de prioridad estricta (Espejo de Sidebar y Actions)
// Lógica de prioridad estricta (Espejo de Sidebar y Actions)
function getViewMode(role_id: string, area: string | null) {
  if (['admin', 'gerente'].includes(role_id)) return 'ADMIN'
  if (role_id === 'administracion') return 'FINANCE'
  if (role_id === 'soma' || (role_id === 'jefe_area' && area === 'Seguridad SOMA')) return 'SOMA'
  if (role_id === 'jefe_area' && area === 'Cocina') return 'COCINA'
  if (role_id === 'operaciones' || (role_id === 'jefe_area' && area === 'Operaciones')) return 'OPERACIONES'
  if (role_id === 'almacen') return 'ALMACEN'
  if (role_id === 'trabajador') return 'WORKER'
  return 'DEFAULT'
}
export function DashboardShell({ user, stats }: DashboardShellProps) {
  const roleName = ROLE_NAMES[user.role_id] || "Usuario"
  const companyName = user.companies?.name || "Empresa"
  const viewMode = getViewMode(user.role_id, user.area)

  // Función para renderizar el gráfico de actividad (SVG ligero)
  const renderActivityChart = () => {
    if (!stats.weeklyActivity) return null
    const maxVal = Math.max(...stats.weeklyActivity.map((d: any) => d.count), 5)
    
    return (
      <div className="bg-white p-8 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="bg-indigo-50 p-3 rounded-2xl">
                <Activity className="text-indigo-600" size={22} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Actividad Semanal</h3>
           </div>
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Últimos 7 días</span>
        </div>
        
        <div className="flex-1 flex items-end justify-between gap-4 min-h-[140px] px-2">
           {stats.weeklyActivity.map((day: any, idx: number) => {
             const height = (day.count / maxVal) * 100
             return (
               <div key={idx} className="flex-1 flex flex-col items-center gap-3 group/bar">
                  <div className="relative w-full flex justify-center">
                    <div 
                      className="w-full max-w-[12px] bg-slate-100 rounded-full transition-all duration-700 relative overflow-hidden group-hover/bar:bg-blue-50"
                      style={{ height: '120px' }}
                    >
                      <div 
                        className="absolute bottom-0 left-0 w-full bg-blue-600 rounded-full transition-all duration-1000 delay-100 group-hover/bar:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      >
                         <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20" />
                      </div>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-10 bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-md opacity-0 group-hover/bar:opacity-100 transition-opacity mb-2 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                      {day.count} movs
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                    {new Date(day.day).toLocaleDateString('es', { weekday: 'short' }).replace('.', '')}
                  </span>
               </div>
             )
           })}
        </div>
      </div>
    )
  }

  const renderDashboardWidgets = () => {
    switch (viewMode) {
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
                icon={ShieldAlert} color="text-rose-600" bg="bg-rose-50" href="/incidencias"
              />
              <StatWidget 
                title="Movimientos" value={stats.admin?.movementsToday?.toString() || '0'} 
                icon={Truck} color="text-blue-600" bg="bg-blue-50" href="/movements"
              />
              <StatWidget 
                title="Requerimientos" value={stats.admin?.pendingRequirementsCount?.toString() || '0'} 
                icon={FileText} color="text-rose-500" bg="bg-rose-50" href="/requerimientos"
              />
              <StatWidget 
                title="Stock Crítico" value={stats.admin?.criticalProductsCount?.toString() || '0'} 
                icon={AlertTriangle} color="text-rose-700" bg="bg-rose-50" href="/inventory/stock"
              />
              <StatWidget 
                title="Empresas" value={stats.admin?.activeCompanies?.toString() || '0'} 
                icon={Building2} color="text-slate-600" bg="bg-slate-50" href="/company"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* ... existing activity chart col-span-2 ... */}
              <div className="xl:col-span-2 bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Actividad Semanal</h3>
                    <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Movimientos de Inventario</p>
                  </div>
                  <div className="bg-blue-50 px-5 py-2 rounded-2xl text-blue-600 font-black text-xs border border-blue-100 uppercase">Tiempo Real</div>
                </div>
                <div className="h-[300px] w-full flex items-end justify-between gap-4 px-4">
                  {(stats.admin?.weeklyActivity || []).map((day: any) => {
                    const height = Math.min((day.count / (Math.max(...stats.admin.weeklyActivity.map((d:any) => d.count), 1))) * 100, 100)
                    return (
                      <div key={day.day} className="flex-1 flex flex-col items-center gap-4 group">
                        <div className="relative w-full flex flex-col items-center">
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl translate-y-2 group-hover:translate-y-0">
                            {day.count} mov.
                          </div>
                          <div 
                            className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-indigo-400 rounded-2xl transition-all duration-1000 ease-out shadow-lg shadow-blue-200 group-hover:shadow-blue-300"
                            style={{ height: `${height}%`, minHeight: '8px' }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          {new Date(day.day).toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="xl:col-span-1 space-y-8">
                <div className="bg-[#1D4ED8] rounded-[3rem] p-10 shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                       <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                         <LayoutDashboard className="text-white" size={24} />
                       </div>
                       <h3 className="text-2xl font-black text-white tracking-tight">Acciones Rápidas</h3>
                    </div>
                    <div className="space-y-4">
                       <Link href="/workers" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group">
                          <div className="flex items-center gap-3">
                            <Users className="text-blue-300" size={18} />
                            <span className="text-sm font-black text-white uppercase tracking-tight">Gestión Personal</span>
                          </div>
                          <ArrowRight className="text-white/40 group-hover:translate-x-1 transition-transform" size={16} />
                       </Link>
                       <Link href="/caja-chica" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group">
                          <div className="flex items-center gap-3">
                            <Coins className="text-emerald-300" size={18} />
                            <span className="text-sm font-black text-white uppercase tracking-tight">Cargar Caja</span>
                          </div>
                          <ArrowRight className="text-white/40 group-hover:translate-x-1 transition-transform" size={16} />
                       </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <AlertTriangle size={14} className="text-rose-500" /> Alerta de Stock
                   </h4>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                         <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Insumos Críticos</span>
                         <span className="text-lg font-black text-rose-600">{stats.admin?.criticalProductsCount}</span>
                      </div>
                      <Link href="/inventory/stock" className="block text-center text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Inventario Total</Link>
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
               <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <TrendingUp className="text-emerald-500" size={24} /> Reporte Financiero Rápido
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total en Bonos</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">S/ {(stats.admin?.pendingBonusesCount * 150).toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 italic">* Estimado basado en promedio</p>
                     </div>
                     <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total en Pasajes</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">S/ {(stats.admin?.pendingTransportCount * 80).toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 italic">* Estimado basado en promedio</p>
                     </div>
                  </div>
               </div>
               <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
                  <h3 className="text-xl font-black mb-8">Gestión Financiera</h3>
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
                    icon={AlertTriangle} color="text-orange-600" bg="bg-orange-50" href="/incidencias"
                  />
                  <StatWidget 
                    title="Incidentes Críticos" value={stats.soma?.criticalIncidents?.toString() || '0'} 
                    icon={ShieldAlert} color="text-rose-600" bg="bg-rose-50" href="/incidencias"
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
                    title="Productos Críticos" value={stats.kitchen?.criticalProducts?.toString() || '0'} 
                    icon={AlertTriangle} color="text-rose-600" bg="bg-rose-50" href="/inventory/stock"
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
                    title="Movimientos Hoy" value={stats.ops?.movementsToday?.toString() || '0'} 
                    icon={Truck} color="text-indigo-600" bg="bg-indigo-50" href="/movements"
                  />
                  <StatWidget 
                    title="Incidencias Abiertas" value={stats.ops?.openIncidents?.toString() || '0'} 
                    icon={AlertTriangle} color="text-rose-600" bg="bg-rose-50" href="/incidencias"
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
                    title="Productos Críticos" value={stats.logistics?.criticalProducts?.toString() || '0'} 
                    icon={AlertTriangle} color="text-rose-600" bg="bg-rose-50" href="/inventory/stock"
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
        userName={user.name} 
        roleName={roleName} 
        area={user.area}
        companyName={companyName} 
        viewMode={viewMode}
      />

      {/* Attendance for Workers */}
      {viewMode === 'WORKER' && (
        <AttendanceMarker initialStatus={stats.todayAttendance} />
      )}

      {/* Main Stats Segment */}
      {renderDashboardWidgets()}

      {/* Comunicados de Seguridad Transversales (Nueva Sección) */}
      {stats.transversalSoma && (
        <div className="bg-slate-50 border border-slate-200 p-10 rounded-[3rem] shadow-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 group-hover:scale-125 transition-transform duration-1000">
             <Shield size={200} />
           </div>
           <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  Seguridad Industrial Inthaly
                </h3>
                <p className="text-slate-500 font-bold mt-2 max-w-md">Comunicados y alertas activas para todo el personal operativo en cumplimiento con estándares HSEC.</p>
              </div>
              <div className="flex flex-wrap gap-6">
                 {stats.transversalSoma.lastTalk && (
                    <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-5 hover:border-blue-200 hover:shadow-lg transition-all">
                       <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><MessageSquare size={24}/></div>
                       <div>
                         <span className="block text-[10px] uppercase font-black text-blue-600 tracking-widest mb-1">Última Charla</span>
                         <span className="block text-slate-800 font-bold">{stats.transversalSoma.lastTalk.topic}</span>
                       </div>
                    </div>
                 )}
                 {stats.transversalSoma.lastTraining && (
                    <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-5 hover:border-emerald-200 hover:shadow-lg transition-all">
                       <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><GraduationCap size={24}/></div>
                       <div>
                         <span className="block text-[10px] uppercase font-black text-emerald-600 tracking-widest mb-1">Capacitación</span>
                         <span className="block text-slate-800 font-bold">{stats.transversalSoma.lastTraining.title}</span>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Listas Secundarias Dinámicas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {stats.recentIncidents && (['ADMIN', 'SOMA', 'OPERACIONES'].includes(viewMode)) && (
          <ListWidget 
            title="Siguimiento de Incidencias"
            icon={Activity}
            color="text-orange-600"
            href="/incidencias"
            items={stats.recentIncidents.map((i: any) => ({
              title: i.equipment_name || 'Incidente Reportado',
              subtitle: i.description,
              badge: i.severity,
              badgeColor: i.severity === 'critica' || i.severity === 'fatal' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-orange-100 text-orange-700 border-orange-200'
            }))}
          />
        )}

        {stats.pendingRequirements && (['ADMIN', 'OPERACIONES', 'ALMACEN', 'COCINA'].includes(viewMode)) && (
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
               <h3 className="text-4xl font-black text-slate-800 tracking-tighter">Mi Panel Personal</h3>
               <p className="text-slate-500 font-bold text-xl mt-1">Resumen de tus beneficios y equipos vinculados</p>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100"><PPEList deliveries={stats.personalStats.ppe} isWorker={true} /></div>
            <div className="space-y-10">
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100"><BonusList bonuses={stats.personalStats.bonuses} isWorker={true} /></div>
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100"><TransportList payments={stats.personalStats.transport} isWorker={true} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
