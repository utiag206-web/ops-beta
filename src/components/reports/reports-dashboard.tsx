'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  TrendingUp, 
  Coins, 
  Bus, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  Download,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Filter
} from 'lucide-react'
import { StatsCard, SimpleBarChart, DonutChart } from '@/components/reports/visual-reports'
import { getDetailedHistory } from '@/app/(main)/reports/actions'
import * as XLSX from 'xlsx'

export function ReportsDashboard({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData)
  const stats = data

  const handleExport = async (type: 'bonuses' | 'transport' | 'attendance') => {
    const history = await getDetailedHistory({
      type,
      startDate: `${stats.period.year}-${stats.period.month.toString().padStart(2, '0')}-01`,
      endDate: `${stats.period.year}-${stats.period.month.toString().padStart(2, '0')}-${new Date(stats.period.year, stats.period.month, 0).getDate()}`
    })

    if (!history.length) return

    const worksheet = XLSX.utils.json_to_sheet(history.map((h: any) => ({
      Fecha: h.date,
      Trabajador: h.worker?.name,
      Cargo: h.worker?.position,
      Concepto: h.bonus_type || (type === 'transport' ? 'Pasaje' : 'Asistencia'),
      Monto: h.amount ? `S/ ${h.amount}` : '-',
      Ingreso: h.check_in || '-',
      Salida: h.check_out || '-',
      Estado: h.status || '-'
    })))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')
    XLSX.writeFile(workbook, `Reporte_${type}_${stats.period.month}_${stats.period.year}.xlsx`)
  }

  // Calculate trends vs last month
  const getTrend = (current: number, last: number) => {
    if (last === 0) return { value: current > 0 ? 100 : 0, isPositive: true }
    const diff = ((current - last) / last) * 100
    return { value: Math.round(diff * 10) / 10, isPositive: diff >= 0 }
  }

  const financialTrend = getTrend(stats.financials.current.total, stats.financials.last.total)

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Filters (Mocked for now) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Resumen Ejecutivo</h2>
          <p className="text-xs text-slate-500 font-medium">Periodo: {new Date(0, stats.period.month - 1).toLocaleString('es-ES', { month: 'long' })} {stats.period.year}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={16} />
            Filtros Avanzados
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Trabajadores Activos"
          value={stats.workers.active}
          subtitle={`${stats.workers.inactive} registrados inactivos`}
          icon={<Users size={20} />}
          color="blue"
        />
        <StatsCard 
          title="Gastos Totales"
          value={`S/ ${stats.financials.current.total.toFixed(2)}`}
          trend={{ ...financialTrend, label: 'vs mes ant.' }}
          icon={<Coins size={20} />}
          color="amber"
          subtitle={`Pagado: S/ ${(stats.financials.current.bPaid + stats.financials.current.tPaid).toFixed(2)}`}
        />
        <StatsCard 
          title="Asistencia Promedio"
          value={`${stats.attendance.avgDaily || 0}`}
          subtitle="Trabajadores por día"
          icon={<Clock size={20} />}
          color="emerald"
        />
        <StatsCard 
          title="Cumplimiento EPP"
          value={`${stats.ppe.rate}%`}
          subtitle={`${stats.ppe.pending} firmas pendientes`}
          icon={<ShieldCheck size={20} />}
          color="indigo"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={18} />
              Tendencia de Asistencia Diaria
            </h3>
            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase tracking-wider">
              {stats.attendance.totalRecords} Marcas Totales
            </span>
          </div>
          <SimpleBarChart 
            data={Object.values(stats.attendance.raw.reduce((acc: any, curr: any) => {
              const day = new Date(curr.date).getDate()
              acc[day] = (acc[day] || 0) + 1
              return acc
            }, {}))} 
            maxValue={stats.workers.active}
            label={new Date(0, stats.period.month - 1).toLocaleString('es-ES', { month: 'short' })}
          />
        </div>

        {/* Circular Compliance Charts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-between text-center">
            <h3 className="w-full font-bold text-slate-800 flex items-center gap-2 mb-6">
              <ShieldCheck className="text-indigo-600" size={18} />
              Estado de Firmas EPP
            </h3>
            <DonutChart percentage={stats.ppe.rate} label="Firmado" color="#4f46e5" size={150} />
            <div className="mt-6 w-full space-y-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Firmados</span>
                    <span className="font-bold text-slate-800">{stats.ppe.signed}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Pendientes</span>
                    <span className="font-bold text-rose-500">{stats.ppe.pending} equipos</span>
                </div>
                <div className="pt-2 border-t border-slate-50 text-[10px] text-slate-400 italic">
                    {stats.ppe.workersPending} trabajadores con firmas pendientes
                </div>
            </div>
        </div>
      </div>

      {/* Financial Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Coins className="text-amber-500" size={18} />
                    Estado de Bonos
                </h3>
                <button 
                  onClick={() => handleExport('bonuses')}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600"
                >
                    <Download size={18} />
                </button>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ejecutado (Pagado)</p>
                        <h4 className="text-xl font-black text-slate-800">S/ {stats.financials.current.bPaid.toFixed(2)}</h4>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendiente</p>
                        <h4 className="text-xl font-black text-amber-600">S/ {stats.financials.current.bPending.toFixed(2)}</h4>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full transition-all duration-1000" 
                      style={{ width: `${stats.financials.current.bPaid > 0 ? (stats.financials.current.bPaid / (stats.financials.current.bPaid + stats.financials.current.bPending) * 100) : 0}%` }}
                    />
                </div>
            </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Bus className="text-indigo-500" size={18} />
                    Estado de Pasajes
                </h3>
                <button 
                  onClick={() => handleExport('transport')}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600"
                >
                    <Download size={18} />
                </button>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ejecutado (Pagado)</p>
                        <h4 className="text-xl font-black text-slate-800">S/ {stats.financials.current.tPaid.toFixed(2)}</h4>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendiente</p>
                        <h4 className="text-xl font-black text-indigo-600">S/ {stats.financials.current.tPending.toFixed(2)}</h4>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-1000" 
                      style={{ width: `${stats.financials.current.tPaid > 0 ? (stats.financials.current.tPaid / (stats.financials.current.tPaid + stats.financials.current.tPending) * 100) : 0}%` }}
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Alerts & Critical Items */}
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-rose-600" size={24} />
            <h3 className="font-bold text-rose-800">Alertas de Gestión</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.ppe.pending > 0 && (
                <div className="bg-white/80 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-700">Firmas de EPP Pendientes</p>
                        <p className="text-[10px] text-slate-500">Hay {stats.ppe.pending} equipos entregados sin firma de confirmación.</p>
                    </div>
                    <ChevronRight size={20} className="text-rose-400" />
                </div>
              )}
              {(stats.financials.current.bPending > 0 || stats.financials.current.tPending > 0) && (
                <div className="bg-white/80 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-700">Pagos Pendientes de Procesar</p>
                        <p className="text-[10px] text-slate-500">Total acumulado en espera: S/ {(stats.financials.current.bPending + stats.financials.current.tPending).toFixed(2)}</p>
                    </div>
                    <ChevronRight size={20} className="text-amber-400" />
                </div>
              )}
          </div>
      </div>
    </div>
  )
}
