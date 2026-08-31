'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  FileSpreadsheet, Search, LayoutGrid, Users, 
  Pickaxe, Boxes, Coins, ShieldCheck, Download, 
  Sparkles, Filter, CheckCircle2, ArrowUpDown, 
  History, Clock, ShieldAlert, FileText, ChevronRight,
  RefreshCw, AlertCircle, Table, Layers, SlidersHorizontal,
  ArrowRight, Check, Database, Loader2, X
} from 'lucide-react'
import { toast } from 'sonner'
import { REPORT_REGISTRY, REPORT_CATEGORIES } from '@/lib/export-center/registry'
import { 
  ReportDefinition, ExportFilterValues, ReportPreviewResult, 
  ExportAuditItem, AuxiliaryExportData 
} from '@/lib/export-center/types'
import { DynamicFilterField } from './dynamic-filter-field'
import { ReportSelectorCombobox } from './report-selector-combobox'
import { fetchReportData, previewReportData, getExportAuditLogs } from '@/app/(main)/reports/export-center/actions'
import { generateExecutiveExcel, generateCsv } from '@/lib/export-center/formatters/excel-exporter'

interface ExportHubViewProps {
  auxData: AuxiliaryExportData
}

export function ExportHubView({ auxData }: ExportHubViewProps) {
  // 1. Report Selector State
  const [selectedReportId, setSelectedReportId] = useState<string>(REPORT_REGISTRY[0].id)
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all')
  
  // 2. Format & Loading States
  const [format, setFormat] = useState<'excel' | 'csv'>('excel')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [previewResult, setPreviewResult] = useState<ReportPreviewResult | null>(null)
  
  // 3. Audit Drawer State
  const [showAuditDrawer, setShowAuditDrawer] = useState(false)
  const [auditLogs, setAuditLogs] = useState<ExportAuditItem[]>([])
  const [isAuditLoading, setIsAuditLoading] = useState(false)

  // 4. Peru Local Timezone Date Calculation (America/Lima)
  const { todayStr, startOfMonth } = useMemo(() => {
    const now = new Date()
    // Local date string in YYYY-MM-DD format
    const localDateStr = now.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' })
    const parts = localDateStr.split('-')
    const startStr = `${parts[0]}-${parts[1]}-01`
    return {
      todayStr: localDateStr,
      startOfMonth: startStr
    }
  }, [])

  // 5. Universal Filter State
  const [filters, setFilters] = useState<ExportFilterValues>({
    periodPreset: 'month',
    startDate: startOfMonth,
    endDate: todayStr,
    area: 'all',
    workerId: 'all',
    warehouseId: 'all',
    status: 'all',
    searchTerm: '',
    stockCondition: 'all',
    equipmentType: 'all',
    conceptType: 'all',
    paymentMethod: 'all',
    priority: 'all',
    severity: 'all',
    shift: 'all',
    includeInitialBalance: true,
    format: 'excel'
  })

  // 6. Currently active report definition resolved from registry
  const currentReport = useMemo(() => {
    return REPORT_REGISTRY.find(r => r.id === selectedReportId) || REPORT_REGISTRY[0]
  }, [selectedReportId])

  // Filter available reports by active category tab
  const availableReports = useMemo(() => {
    if (selectedCategoryTab === 'all') return REPORT_REGISTRY
    return REPORT_REGISTRY.filter(r => r.category === selectedCategoryTab)
  }, [selectedCategoryTab])

  // 7. Preview Executor
  const runPreview = useCallback(async (report: ReportDefinition, activeFilters: ExportFilterValues) => {
    setIsPreviewLoading(true)
    try {
      const res = await previewReportData(report.actionKey, { ...activeFilters, format })
      setPreviewResult(res)
    } catch (e: any) {
      console.error('[EXPORT_HUB_PREVIEW_ERROR]:', e)
      setPreviewResult({
        success: false,
        totalCount: 0,
        columns: [],
        sampleRows: [],
        error: e.message
      })
    } finally {
      setIsPreviewLoading(false)
    }
  }, [format])

  // Run preview on initial load and when report changes
  useEffect(() => {
    runPreview(currentReport, filters)
  }, [currentReport.id])

  // Switching report from selector
  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId)
    const report = REPORT_REGISTRY.find(r => r.id === reportId) || REPORT_REGISTRY[0]
    
    // Reset filters to standard defaults
    const freshFilters: ExportFilterValues = {
      periodPreset: 'month',
      startDate: startOfMonth,
      endDate: todayStr,
      area: 'all',
      workerId: 'all',
      warehouseId: 'all',
      status: 'all',
      searchTerm: '',
      stockCondition: 'all',
      equipmentType: 'all',
      conceptType: 'all',
      paymentMethod: 'all',
      priority: 'all',
      severity: 'all',
      shift: 'all',
      includeInitialBalance: true,
      format: 'excel'
    }
    setFilters(freshFilters)
    runPreview(report, freshFilters)
  }

  // Filter change handler
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => {
      const updated = { 
        ...prev, 
        [key]: value,
        ...(key === 'startDate' || key === 'endDate' ? { periodPreset: 'custom' as const } : {})
      }
      runPreview(currentReport, updated)
      return updated
    })
  }

  // Period preset change handler
  const handlePresetChange = (preset: 'today' | 'week' | 'month' | 'last_month' | 'quarter' | 'custom') => {
    if (preset === 'custom') {
      setFilters(prev => {
        const updated = { ...prev, periodPreset: 'custom' as const }
        runPreview(currentReport, updated)
        return updated
      })
      return
    }

    const now = new Date()
    let start = todayStr
    let end = todayStr

    if (preset === 'today') {
      start = todayStr
      end = todayStr
    } else if (preset === 'week') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      start = d.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' })
      end = todayStr
    } else if (preset === 'month') {
      start = startOfMonth
      end = todayStr
    } else if (preset === 'last_month') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
      start = prevMonth.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' }).substring(0, 7) + '-01'
      end = lastDay.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' })
    } else if (preset === 'quarter') {
      const d = new Date()
      d.setDate(d.getDate() - 90)
      start = d.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' })
      end = todayStr
    }

    setFilters(prev => {
      const updated = {
        ...prev,
        periodPreset: preset,
        startDate: start,
        endDate: end
      }
      runPreview(currentReport, updated)
      return updated
    })
  }

  // Quick filter presets handler
  const handleApplyQuickFilter = (values: Record<string, any>) => {
    const updated = { ...filters, ...values }
    if (values.periodPreset) {
      handlePresetChange(values.periodPreset)
    } else {
      setFilters(updated)
      runPreview(currentReport, updated)
    }
  }

  // Reset filters handler
  const handleResetFilters = () => {
    const fresh: ExportFilterValues = {
      periodPreset: 'month',
      startDate: startOfMonth,
      endDate: todayStr,
      area: 'all',
      workerId: 'all',
      warehouseId: 'all',
      status: 'all',
      searchTerm: '',
      stockCondition: 'all',
      equipmentType: 'all',
      conceptType: 'all',
      paymentMethod: 'all',
      priority: 'all',
      severity: 'all',
      shift: 'all',
      includeInitialBalance: true,
      format: 'excel'
    }
    setFilters(fresh)
    runPreview(currentReport, fresh)
  }

  // Single export executor
  const handleExecuteExport = async () => {
    const toastId = toast.loading(`Generando archivo de ${currentReport.title}...`)
    setIsExporting(true)
    try {
      const result = await fetchReportData(currentReport.actionKey, { ...filters, format })

      if (!result || !result.success) {
        toast.error(result?.error || 'Error al generar la exportación.', { id: toastId })
        return
      }

      const { columns, data } = result

      if (!data || data.length === 0) {
        toast.warning('No se encontraron registros para los filtros seleccionados.', { id: toastId })
        return
      }

      if (format === 'csv') {
        generateCsv(`${currentReport.code}_${currentReport.title}`, columns, data)
        toast.success(`Archivo CSV generado (${data.length} registros auditados).`, { id: toastId })
      } else {
        await generateExecutiveExcel({
          fileName: `${currentReport.code}_${currentReport.title}`,
          sheetName: currentReport.categoryLabel,
          title: `REPORTE OFICIAL: ${currentReport.title}`,
          companyInfo: auxData.company,
          filterSummary: filters,
          columns,
          data
        })
        toast.success(`Libro Excel oficial exportado (${data.length} filas verificadas).`, { id: toastId })
      }
    } catch (error: any) {
      console.error('[EXPORT_ERROR]:', error)
      toast.error('Ocurrió un error inesperado durante la exportación.', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  // Open audit drawer
  const handleOpenAudit = async () => {
    setShowAuditDrawer(true)
    setIsAuditLoading(true)
    try {
      const logs = await getExportAuditLogs()
      setAuditLogs(logs)
    } finally {
      setIsAuditLoading(false)
    }
  }

  const totalFound = previewResult?.totalCount || 0

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. Header Banner — INTHALY OPS Standard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
              <FileSpreadsheet className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                  Centro de Reportes y Exportaciones
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {auxData.company?.name || 'Inthaly OPS'}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                Motor centralizado de descargas y auditoría para todas las áreas de la empresa.
              </p>
            </div>
          </div>
        </div>

        {/* Audit Button */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={handleOpenAudit}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm active:scale-95"
          >
            <History size={16} className="text-blue-600" />
            <span>Auditoría de Descargas</span>
          </button>
        </div>
      </div>

      {/* 2. UNIFIED DYNAMIC FORM WORKSPACE — THE ONLY COMPONENT ON PAGE */}
      <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
        
        {/* PASO 1: SELECCIÓN DEL REPORTE */}
        <div className="p-6 md:p-8 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                1
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
                  Seleccionar Reporte
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Elige la plantilla que deseas generar; el formulario adaptará sus filtros automáticamente.
                </p>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {REPORT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryTab(cat.id)
                    const firstInCat = REPORT_REGISTRY.find(r => cat.id === 'all' || r.category === cat.id)
                    if (firstInCat) handleSelectReport(firstInCat.id)
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    selectedCategoryTab === cat.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Report Selector (Option 1: Spotlight-style Command Combobox) */}
          <div className="pt-1">
            <ReportSelectorCombobox
              currentReport={currentReport}
              onSelectReport={handleSelectReport}
            />
          </div>
        </div>

        {/* PASO 2: PARÁMETROS Y FILTROS DINÁMICOS */}
        <div className="p-6 md:p-8 space-y-5 bg-slate-50/40">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                2
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
                  Parámetros de &ldquo;{currentReport.title}&rdquo;
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Configura los criterios de búsqueda requeridos para este reporte.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all"
            >
              Restablecer
            </button>
          </div>

          {/* Quick Filter Presets (If defined in schema) */}
          {currentReport.quickFilters && currentReport.quickFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400">Filtros rápidos:</span>
              {currentReport.quickFilters.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyQuickFilter(q.values)}
                  className="py-1.5 px-3 rounded-xl bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-xs font-bold text-slate-700 transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles size={12} className="text-blue-500" />
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Dynamic Filter Grid Form */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {currentReport.filters.map(fieldSchema => (
                <DynamicFilterField
                  key={fieldSchema.key}
                  schema={fieldSchema}
                  value={filters[fieldSchema.key]}
                  onChange={handleFilterChange}
                  auxData={auxData}
                  datePreset={filters.periodPreset}
                  onPresetChange={handlePresetChange}
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                />
              ))}
            </div>
          </div>
        </div>

        {/* PASO 3: FORMATO Y VISTA PREVIA EN TIEMPO REAL */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              3
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
                Formato y Validación de Registros
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Comprueba la cantidad y muestra de datos encontrados antes de la descarga.
              </p>
            </div>
          </div>

          {/* Format Selection Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormat('excel')}
              className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all text-left ${
                format === 'excel'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm ring-1 ring-emerald-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                format === 'excel' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <p className="text-xs md:text-sm font-bold">Libro de Excel Oficial (.xlsx)</p>
                <p className="text-[11px] text-slate-500 font-medium">Con membrete de {auxData.company?.name} y columnas estructuradas</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all text-left ${
                format === 'csv'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm ring-1 ring-blue-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                format === 'csv' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <FileText size={22} />
              </div>
              <div>
                <p className="text-xs md:text-sm font-bold">Archivo Plano CSV (.csv)</p>
                <p className="text-[11px] text-slate-500 font-medium">Texto delimitado por comas con codificación universal UTF-8</p>
              </div>
            </button>
          </div>

          {/* Validation Status Banner */}
          <div className={`p-4 md:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
            totalFound > 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                totalFound > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {isPreviewLoading ? (
                  <Loader2 size={20} className="animate-spin text-slate-600" />
                ) : totalFound > 0 ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <AlertCircle size={22} />
                )}
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold tracking-tight">
                  {isPreviewLoading ? 'Consultando registros en vivo...' : `${totalFound} REGISTROS ENCONTRADOS`}
                </h3>
                <p className="text-xs opacity-80 font-medium">
                  {totalFound > 0
                    ? `Datos autorizados y validados para ${auxData.company?.name}.`
                    : 'No se encontraron registros con los filtros seleccionados. Ajusta los parámetros.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => runPreview(currentReport, filters)}
              disabled={isPreviewLoading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2 shrink-0 self-end sm:self-center active:scale-95 cursor-pointer"
            >
              <RefreshCw size={13} className={isPreviewLoading ? 'animate-spin' : ''} />
              <span>Actualizar Vista</span>
            </button>
          </div>

          {/* Live Preview Sample Table */}
          {(previewResult?.sampleRows || []).length > 0 && (
            <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-2">
                  <Table size={15} className="text-blue-600" />
                  <span>Muestra de Datos (Primeras {previewResult?.sampleRows.length} filas):</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Vista previa de validación</span>
              </div>

              <div className="overflow-x-auto max-h-56 custom-scrollbar rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      {(previewResult?.columns || []).map((col, idx) => (
                        <th key={idx} className="p-2.5 border-b border-slate-200 whitespace-nowrap">
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {previewResult?.sampleRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/80">
                        {previewResult.columns.map((col, cIdx) => (
                          <td key={cIdx} className="p-2.5 whitespace-nowrap text-slate-800">
                            {col.key === '_index' ? rIdx + 1 : (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* PASO 4: ACCIÓN PRINCIPAL DE DESCARGA */}
        <div className="p-6 md:p-8 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
            La descarga se generará de forma segura y quedará registrada en la bitácora de auditoría.
          </p>

          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={isExporting || totalFound === 0}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold rounded-xl md:rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generando Archivo...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Descargar Archivo {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* 3. AUDIT LOGS MODAL DRAWER */}
      {showAuditDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-2xl md:rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Historial y Auditoría de Descargas</h3>
                  <p className="text-xs text-slate-400 font-medium">Trazabilidad de exportaciones generadas en la empresa</p>
                </div>
              </div>
              <button onClick={() => setShowAuditDrawer(false)} className="p-2 text-white/60 hover:text-white bg-white/10 rounded-xl">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isAuditLoading ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">Cargando bitácora de auditoría...</div>
              ) : auditLogs.length === 0 ? (
                <div className="py-12 text-center space-y-2 text-slate-400">
                  <FileText size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No hay descargas registradas recientemente</p>
                  <p className="text-[11px]">Cada vez que descargues un reporte quedará registrado aquí para fines de auditoría.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{log.reportTitle}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                            {log.format}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Descargado por <strong className="text-slate-600">{log.userName}</strong> • {new Date(log.createdAt).toLocaleString('es-PE')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-800">{log.recordsCount}</span>
                        <p className="text-[10px] text-slate-400 font-medium">registros</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuditDrawer(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
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
