'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Filter,
  Eye,
  Printer,
  Loader2
} from 'lucide-react'
import { StatsCard, SimpleBarChart, DonutChart } from '@/components/reports/visual-reports'
import { getDetailedHistory } from '@/app/(main)/reports/actions'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

export function ReportsDashboard({ 
  initialData, 
  workers = [], 
  selectedWorkerId 
}: { 
  initialData: any
  workers?: any[]
  selectedWorkerId?: string
}) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const stats = data

  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean
    type: 'bonuses' | 'transport' | 'payments'
    data: any[]
    loading: boolean
  }>({
    isOpen: false,
    type: 'bonuses',
    data: [],
    loading: false
  })

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ]
  
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

  const handlePeriodChange = (newMonth: number, newYear: number) => {
    const workerParam = selectedWorkerId ? `&workerId=${selectedWorkerId}` : ''
    router.push(`/reports?month=${newMonth}&year=${newYear}${workerParam}`)
  }

  const handleOpenDetails = async (type: 'bonuses' | 'transport' | 'payments') => {
    setDetailsModal({
      isOpen: true,
      type,
      data: [],
      loading: true
    })

    try {
      const history = await getDetailedHistory({
        type,
        startDate: `${stats.period.year}-${stats.period.month.toString().padStart(2, '0')}-01`,
        endDate: `${stats.period.year}-${stats.period.month.toString().padStart(2, '0')}-${new Date(stats.period.year, stats.period.month, 0).getDate()}`,
        workerId: selectedWorkerId
      })

      setDetailsModal(prev => ({
        ...prev,
        data: history || [],
        loading: false
      }))
    } catch (error) {
      console.error('Error fetching details:', error)
      setDetailsModal(prev => ({
        ...prev,
        loading: false
      }))
      toast.error('Ocurrió un error al obtener el detalle de los registros.')
    }
  }

  const getConceptLabel = (h: any, type: string) => {
    if (h.bonus_type) return h.bonus_type
    if (type === 'transport') return 'Pasaje'
    if (type === 'payments') {
      const pType = h.payment_type || ''
      if (pType === 'salary') return 'Sueldo'
      if (pType === 'advance') return 'Adelanto'
      if (pType === 'liquidation') return 'Liquidación'
      if (pType === 'extra') return 'Pago Extraordinario'
      return 'Pago Planilla'
    }
    return 'Asistencia'
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión. Por favor permite las ventanas emergentes.')
      return
    }

    const title = detailsModal.type === 'bonuses' 
      ? 'Reporte de Bonos' 
      : detailsModal.type === 'transport' 
        ? 'Reporte de Pasajes' 
        : 'Reporte de Planillas y Pagos'
    const monthName = months.find(m => m.value === stats.period.month)?.label || ''
    
    let rowsHtml = ''
    detailsModal.data.forEach((h: any) => {
      rowsHtml += `
        <tr>
          <td>${h.date ? new Date(h.date + 'T12:00:00').toLocaleDateString() : '—'}</td>
          <td>${h.worker?.name || 'No asignado'}</td>
          <td>${h.worker?.position || '—'}</td>
          <td>${getConceptLabel(h, detailsModal.type)}</td>
          <td>S/ ${(Number(h.amount) || 0).toFixed(2)}</td>
          <td>${h.status === 'paid' ? 'Pagado' : 'Pendiente'}</td>
        </tr>
      `
    })

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; padding: 20px; }
            h1 { font-size: 20px; font-weight: bold; margin-bottom: 5px; color: #1e293b; }
            p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
            tr:hover { background-color: #f1f5f9; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 5px; font-weight: bold; font-size: 9px; text-transform: uppercase; }
            .badge-paid { background-color: #ecfdf5; color: #047857; }
            .badge-pending { background-color: #fffbeb; color: #b45309; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Periodo: ${monthName} ${stats.period.year} | Registros Totales: ${detailsModal.data.length}</p>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Trabajador</th>
                <th>Cargo</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleExport = async (type: 'bonuses' | 'transport' | 'attendance' | 'payments') => {
    const history = await getDetailedHistory({
      type: type === 'payments' ? 'payments' : type as any,
      startDate: `${stats.period.year}-${stats.period.month.toString().padStart(2, '0')}-01`,
      endDate: `${stats.period.year}-${stats.period.month.toString().padStart(2, '0')}-${new Date(stats.period.year, stats.period.month, 0).getDate()}`,
      workerId: selectedWorkerId
    })

    const titleType = type === 'bonuses' 
      ? 'Bonos' 
      : type === 'transport' 
        ? 'Pasajes' 
        : type === 'payments' 
          ? 'Planillas' 
          : 'Asistencia'

    if (!history || !history.length) {
      toast.info(`No hay registros de ${titleType} en este periodo. Se descargará una plantilla vacía.`)
      const headers = [
        {
          Fecha: 'Sin registros para este periodo',
          Trabajador: '',
          Cargo: '',
          Concepto: '',
          Monto: '',
          Ingreso: '',
          Salida: '',
          Estado: ''
        }
      ]
      const worksheet = XLSX.utils.json_to_sheet(headers)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Vacío')
      XLSX.writeFile(workbook, `Reporte_${type}_Vacio_${stats.period.month}_${stats.period.year}.xlsx`)
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(history.map((h: any) => ({
      Fecha: h.date,
      Trabajador: h.worker?.name || 'No asignado',
      Cargo: h.worker?.position || 'No especificado',
      Concepto: getConceptLabel(h, type),
      Monto: h.amount ? `S/ ${h.amount}` : '-',
      Ingreso: h.check_in || '-',
      Salida: h.check_out || '-',
      Estado: h.status || '-'
    })))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')
    XLSX.writeFile(workbook, `Reporte_${type}_${stats.period.month}_${stats.period.year}.xlsx`)
  }

  const getTrend = (current: number, last: number) => {
    if (last === 0) return { value: current > 0 ? 100 : 0, isPositive: true }
    const diff = ((current - last) / last) * 100
    return { value: Math.round(diff * 10) / 10, isPositive: diff >= 0 }
  }

  const financialTrend = getTrend(stats.financials.current.total, stats.financials.last.total)

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Period Selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Resumen Ejecutivo</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
            Período de Análisis Consolidado
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Worker Selector Dropdown */}
          {workers && workers.length > 0 && (
            <div className="flex-1 sm:flex-none flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Users size={16} className="text-slate-400 mr-2" />
              <select
                className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-4 cursor-pointer max-w-[200px]"
                value={selectedWorkerId || 'all'}
                onChange={(e) => {
                  const val = e.target.value
                  const workerParam = val === 'all' ? '' : `&workerId=${val}`
                  router.push(`/reports?month=${stats.period.month}&year=${stats.period.year}${workerParam}`)
                }}
              >
                <option value="all">👥 Todos los trabajadores</option>
                {workers.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.last_name ? `${w.last_name}, ${w.name}` : w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 sm:flex-none flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Calendar size={16} className="text-slate-400 mr-2" />
            <select
              className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-4 cursor-pointer"
              value={stats.period.month}
              onChange={(e) => handlePeriodChange(Number(e.target.value), stats.period.year)}
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 sm:flex-none flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Calendar size={16} className="text-slate-400 mr-2" />
            <select
              className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-4 cursor-pointer"
              value={stats.period.year}
              onChange={(e) => handlePeriodChange(stats.period.month, Number(e.target.value))}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
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
          subtitle={`Pagado: S/ ${(stats.financials.current.bPaid + stats.financials.current.tPaid + stats.financials.current.pPaid).toFixed(2)}`}
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
          {(() => {
            const daysInMonth = new Date(stats.period.year, stats.period.month, 0).getDate()
            const dailyCounts = Array(daysInMonth).fill(0)
            stats.attendance.raw.forEach((curr: any) => {
              const day = new Date(curr.date + 'T12:00:00').getDate()
              if (day >= 1 && day <= daysInMonth) {
                dailyCounts[day - 1]++
              }
            })
            return (
              <SimpleBarChart 
                data={dailyCounts} 
                maxValue={stats.workers.active || 1}
                label={new Date(0, stats.period.month - 1).toLocaleString('es-ES', { month: 'short' })}
              />
            )
          })()}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Coins className="text-amber-500" size={18} />
                    Estado de Bonos
                </h3>
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenDetails('bonuses')}
                      title="Ver Detalle"
                      className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                        <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleExport('bonuses')}
                      title="Exportar a Excel"
                      className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                        <Download size={18} />
                    </button>
                </div>
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
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenDetails('transport')}
                      title="Ver Detalle"
                      className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                        <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleExport('transport')}
                      title="Exportar a Excel"
                      className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                        <Download size={18} />
                    </button>
                </div>
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

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Coins className="text-emerald-500" size={18} />
                    Planilla y Sueldos
                </h3>
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenDetails('payments')}
                      title="Ver Detalle"
                      className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                        <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleExport('payments')}
                      title="Exportar a Excel"
                      className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ejecutado (Pagado)</p>
                        <h4 className="text-xl font-black text-slate-800">S/ {stats.financials.current.pPaid.toFixed(2)}</h4>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendiente</p>
                        <h4 className="text-xl font-black text-emerald-600">S/ {stats.financials.current.pPending.toFixed(2)}</h4>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-1000" 
                      style={{ width: `${stats.financials.current.pPaid > 0 ? (stats.financials.current.pPaid / (stats.financials.current.pPaid + stats.financials.current.pPending) * 100) : 0}%` }}
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
                <div 
                  onClick={() => router.push('/ppe')}
                  className="bg-white/80 p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-white hover:shadow-md hover:scale-[1.01] transition-all border border-transparent hover:border-rose-100"
                >
                    <div>
                        <p className="text-xs font-bold text-slate-700">Firmas de EPP Pendientes</p>
                        <p className="text-[10px] text-slate-500">Hay {stats.ppe.pending} equipos entregados sin firma de confirmación.</p>
                    </div>
                    <ChevronRight size={20} className="text-rose-400" />
                </div>
              )}
              {(stats.financials.current.bPending > 0 || stats.financials.current.tPending > 0 || stats.financials.current.pPending > 0) && (
                <div 
                  onClick={() => router.push('/bonuses')}
                  className="bg-white/80 p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-white hover:shadow-md hover:scale-[1.01] transition-all border border-transparent hover:border-amber-100"
                >
                    <div>
                        <p className="text-xs font-bold text-slate-700">Pagos Pendientes de Procesar</p>
                        <p className="text-[10px] text-slate-500">Total acumulado en espera: S/ {(stats.financials.current.bPending + stats.financials.current.tPending + stats.financials.current.pPending).toFixed(2)}</p>
                    </div>
                    <ChevronRight size={20} className="text-amber-400" />
                </div>
              )}
          </div>
      </div>

      {/* Modal Detalle de Registros */}
      {detailsModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setDetailsModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-4 mb-6 shrink-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                detailsModal.type === 'bonuses' ? 'bg-amber-50 text-amber-500' : detailsModal.type === 'transport' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'
              }`}>
                {detailsModal.type === 'bonuses' ? <Coins size={24} /> : detailsModal.type === 'transport' ? <Bus size={24} /> : <Coins size={24} />}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest">Desglose de Registros</span>
                <h3 className="text-xl font-bold text-slate-800 mt-0.5">
                  {detailsModal.type === 'bonuses' ? 'Detalle de Bonificaciones' : detailsModal.type === 'transport' ? 'Detalle de Pasajes y Movilidad' : 'Detalle de Planillas y Pagos'}
                </h3>
                <p className="text-xs text-slate-500">
                  Periodo: {months.find(m => m.value === stats.period.month)?.label} {stats.period.year}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 border border-slate-100 rounded-2xl">
              {detailsModal.loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 size={32} className="text-blue-600 animate-spin" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cargando registros...</p>
                </div>
              ) : detailsModal.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${
                    detailsModal.type === 'bonuses' ? 'bg-amber-50 border-amber-100 text-amber-400' : detailsModal.type === 'transport' ? 'bg-indigo-50 border-indigo-100 text-indigo-400' : 'bg-emerald-50 border-emerald-100 text-emerald-400'
                  }`}>
                    {detailsModal.type === 'bonuses' ? <Coins size={28} /> : detailsModal.type === 'transport' ? <Bus size={28} /> : <Coins size={28} />}
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Sin registros</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    No se encontraron transacciones registradas de {detailsModal.type === 'bonuses' ? 'bonos' : detailsModal.type === 'transport' ? 'pasajes' : 'pagos de planilla'} para este periodo.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 sticky top-0 backdrop-blur-sm">
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trabajador</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargo</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Concepto</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monto</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {detailsModal.data.map((h: any) => (
                      <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-xs font-bold text-slate-600">
                          {h.date ? new Date(h.date + 'T12:00:00').toLocaleDateString() : '—'}
                        </td>
                        <td className="py-4 px-6 text-xs font-black text-slate-800 uppercase">
                          {h.worker?.name || 'No asignado'}
                        </td>
                        <td className="py-4 px-6 text-xs font-medium text-slate-500 capitalize">
                          {h.worker?.position || '—'}
                        </td>
                        <td className="py-4 px-6 text-xs font-medium text-slate-600">
                          {getConceptLabel(h, detailsModal.type)}
                        </td>
                        <td className="py-4 px-6 text-xs font-black text-slate-800">
                          S/ {(Number(h.amount) || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                            h.status === 'paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {h.status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center shrink-0 border-t border-slate-100 pt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport(detailsModal.type)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Download size={14} /> Exportar Excel
                </button>
                {detailsModal.data.length > 0 && (
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl border border-slate-200 transition-all active:scale-95 cursor-pointer"
                  >
                    <Printer size={14} /> Imprimir / PDF
                  </button>
                )}
              </div>
              <button 
                onClick={() => setDetailsModal(prev => ({ ...prev, isOpen: false }))}
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
