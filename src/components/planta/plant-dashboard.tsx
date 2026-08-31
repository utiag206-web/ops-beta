'use client'

import { useState } from 'react'
import { 
  Factory, Scale, Truck, Layers, Activity, CheckCircle2, AlertTriangle, 
  Search, Plus, Filter, ArrowRight, Clock, MapPin, User, ChevronRight, 
  ClipboardCheck, BarChart3, AlertOctagon, RotateCcw, Sparkles, LayoutGrid,
  ListFilter, FileSpreadsheet, Eye, Building2, ShieldCheck, Download
} from 'lucide-react'
import { useGlobalSettings } from '@/components/providers/global-settings-provider'
import { MineralBatch, PlantShiftChecklist, INITIAL_MINERAL_BATCHES, INITIAL_SHIFT_CHECKLIST } from './plant-mock-data'
import { MineralReceptionModal } from './mineral-reception-modal'
import { DischargeCheckModal } from './discharge-check-modal'
import { QualityEvaluationModal } from './quality-evaluation-modal'
import { PlantShiftLogModal } from './plant-shift-log-modal'

export function PlantDashboard() {
  const globalSettings = useGlobalSettings()
  const companyTitle = globalSettings?.ecosystem_name || 'INTHALY OPS · CONSTRUCTORA ROSS'

  const [batches, setBatches] = useState<MineralBatch[]>(INITIAL_MINERAL_BATCHES)
  const [shiftChecklist, setShiftChecklist] = useState<PlantShiftChecklist>(INITIAL_SHIFT_CHECKLIST)
  
  // UI State
  const [activeTab, setActiveTab] = useState<'all' | 'ingresado' | 'descargado' | 'acopio' | 'proceso' | 'terminado'>('all')
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [qualityFilter, setQualityFilter] = useState<string>('all')
  const [stockpileFilter, setStockpileFilter] = useState<string>('all')

  // Modals
  const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false)
  const [isShiftLogModalOpen, setIsShiftLogModalOpen] = useState(false)
  const [selectedBatchForDischarge, setSelectedBatchForDischarge] = useState<MineralBatch | null>(null)
  const [selectedBatchForQuality, setSelectedBatchForQuality] = useState<MineralBatch | null>(null)

  // Handlers
  const handleAddBatch = (newBatch: Omit<MineralBatch, 'id'>) => {
    const created: MineralBatch = {
      ...newBatch,
      id: `BATCH-${Date.now()}`
    }
    setBatches([created, ...batches])
  }

  const handleDischargeConfirm = (batchId: string, stockpile: string, operator: string) => {
    const now = new Date()
    const dischargeTime = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
    
    setBatches(batches.map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          stage: 'acopio',
          stockpile,
          operatorName: operator,
          dischargeTime
        }
      }
      return b
    }))
  }

  const handleQualityUpdate = (batchId: string, updates: Partial<MineralBatch>) => {
    setBatches(batches.map(b => b.id === batchId ? { ...b, ...updates } : b))
  }

  const handleAdvanceStage = (batchId: string) => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })

    setBatches(batches.map(b => {
      if (b.id === batchId) {
        if (b.stage === 'ingresado') return { ...b, stage: 'descargado', dischargeTime: timeStr }
        if (b.stage === 'descargado') return { ...b, stage: 'acopio' }
        if (b.stage === 'acopio') return { ...b, stage: 'proceso', processingStartTime: timeStr }
        if (b.stage === 'proceso') return { ...b, stage: 'terminado', processingEndTime: timeStr }
      }
      return b
    }))
  }

  // Filtered Batches
  const filteredBatches = batches.filter(b => {
    if (activeTab !== 'all' && b.stage !== activeTab) return false
    if (qualityFilter !== 'all' && b.qualityStatus !== qualityFilter) return false
    if (stockpileFilter !== 'all' && !b.stockpile.toLowerCase().includes(stockpileFilter.toLowerCase())) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return (
        b.batchCode.toLowerCase().includes(q) ||
        b.guideNumber.toLowerCase().includes(q) ||
        b.truckPlate.toLowerCase().includes(q) ||
        b.driverName.toLowerCase().includes(q) ||
        b.originMine.toLowerCase().includes(q) ||
        b.mineralType.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Metrics Calculations
  const totalTMH = batches.reduce((acc, b) => acc + b.netWeight, 0)
  const inStockpileTMH = batches.filter(b => b.stage === 'acopio' || b.stage === 'descargado').reduce((acc, b) => acc + b.netWeight, 0)
  const inProcessTMH = batches.filter(b => b.stage === 'proceso').reduce((acc, b) => acc + b.netWeight, 0)
  const optimalCount = batches.filter(b => b.qualityStatus === 'optimo' || b.qualityStatus === 'regular').length
  const observedCount = batches.filter(b => b.qualityStatus === 'observado' || b.qualityStatus === 'rechazado').length
  const qualityRate = batches.length > 0 ? Math.round((optimalCount / batches.length) * 100) : 100

  // Render Quality Badge
  const renderQualityBadge = (status: MineralBatch['qualityStatus']) => {
    switch (status) {
      case 'optimo':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">🟢 Óptimo (Bien)</span>
      case 'regular':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">🟡 Aceptable</span>
      case 'observado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">🔴 Observado (Mal)</span>
      case 'rechazado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-900 text-white border border-slate-700 shadow-sm">🚫 Rechazado</span>
    }
  }

  // Render Stage Badge
  const renderStageBadge = (stage: MineralBatch['stage']) => {
    switch (stage) {
      case 'ingresado':
        return <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">1. Ingresado (Balanza)</span>
      case 'descargado':
        return <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-200">2. Descargado</span>
      case 'acopio':
        return <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">3. En Acopio / Stockpile</span>
      case 'proceso':
        return <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200 animate-pulse">4. En Molienda / Tolva</span>
      case 'terminado':
        return <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">5. Procesado / Terminado</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner with Official System Branding (Vivid Royal Blue) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-900/20 border border-blue-500/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-black tracking-wide backdrop-blur-md">
                <Building2 size={13} className="text-white" />
                <span>{companyTitle}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 text-xs font-bold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                <span>Planta de Beneficio & Balanza Activa</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Factory className="text-blue-100" size={32} />
              Control de Planta y Trazabilidad de Mineral
            </h1>
            <p className="text-xs sm:text-sm text-blue-50 max-w-3xl leading-relaxed font-medium">
              Trazabilidad integral del ciclo metalúrgico: recepción y pesaje en balanza electrónica, control de canchas de acopio, triaje de calidad (Bien/Mal) y alimentación a tolva de tratamiento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsShiftLogModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-xs font-bold text-white transition-all flex items-center gap-2 backdrop-blur-md shadow-lg shadow-black/10 hover:scale-[1.02]"
            >
              <ClipboardCheck size={16} className="text-amber-300" />
              <span>Bitácora ({shiftChecklist.shift === 'dia' ? '☀️ Día' : '🌙 Noche'})</span>
            </button>

            <button
              onClick={() => setIsReceptionModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-blue-50 text-xs font-black text-blue-700 transition-all flex items-center gap-2 shadow-xl shadow-blue-950/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} className="text-blue-700" />
              <span>Nuevo Ingreso & Pesaje</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total TMH Hoy */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Recibido Hoy</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Scale size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalTMH.toFixed(1)} <span className="text-sm font-bold text-slate-500">TMH</span></div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span>{batches.length} viajes registrados en balanza</span>
          </div>
        </div>

        {/* Card 2: En Stockpiles / Canchas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">En Canchas de Acopio</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-900">{inStockpileTMH.toFixed(1)} <span className="text-sm font-bold text-slate-500">TMH</span></div>
          <div className="text-[11px] text-purple-700 mt-1 font-medium">
            <span>Listo para alimentación a tolva</span>
          </div>
        </div>

        {/* Card 3: En Molienda / Proceso */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">En Tratamiento / Tolva</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900">{inProcessTMH.toFixed(1)} <span className="text-sm font-bold text-slate-500">TMH</span></div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">
            <span>Chancado y molienda activa</span>
          </div>
        </div>

        {/* Card 4: Conformidad de Calidad */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Conformidad de Calidad</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900">{qualityRate}% <span className="text-sm font-bold text-emerald-600">Aprobado</span></div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            <span className="text-rose-600 font-bold">{observedCount} observados</span> / {optimalCount} conformes
          </div>
        </div>
      </div>

      {/* 3. Stage Tabs & Controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100 no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({batches.length})
          </button>
          <button
            onClick={() => setActiveTab('ingresado')}
            className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all ${
              activeTab === 'ingresado'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            1. En Balanza ({batches.filter(b => b.stage === 'ingresado').length})
          </button>
          <button
            onClick={() => setActiveTab('descargado')}
            className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all ${
              activeTab === 'descargado'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
            }`}
          >
            2. Descargados ({batches.filter(b => b.stage === 'descargado').length})
          </button>
          <button
            onClick={() => setActiveTab('acopio')}
            className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all ${
              activeTab === 'acopio'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            3. En Acopio ({batches.filter(b => b.stage === 'acopio').length})
          </button>
          <button
            onClick={() => setActiveTab('proceso')}
            className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all ${
              activeTab === 'proceso'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            4. En Molienda ({batches.filter(b => b.stage === 'proceso').length})
          </button>
          <button
            onClick={() => setActiveTab('terminado')}
            className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all ${
              activeTab === 'terminado'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            5. Procesados ({batches.filter(b => b.stage === 'terminado').length})
          </button>
        </div>

        {/* Filter Bar & View Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por lote, placa de volquete, chofer o labor de mina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-all"
            />
          </div>

          {/* Quality Filter */}
          <div className="flex items-center gap-2">
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:border-blue-600 focus:bg-white outline-none"
            >
              <option value="all">Todas las Calidades</option>
              <option value="optimo">🟢 Solo Óptimos (Bien)</option>
              <option value="regular">🟡 Solo Aceptables</option>
              <option value="observado">🔴 Solo Observados (Mal)</option>
              <option value="rechazado">🚫 Solo Rechazados</option>
            </select>

            {/* View Switcher */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista Trazabilidad Kanban"
              >
                <LayoutGrid size={15} />
                <span className="hidden sm:inline">Pipeline</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista Tabla Detallada"
              >
                <ListFilter size={15} />
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main Content: Kanban or Table */}
      {viewMode === 'kanban' ? (
        /* ==========================================
           KANBAN PIPELINE VIEW
           ========================================== */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {/* Column 1: Ingreso & Balanza */}
          <div className="bg-slate-100/70 p-3 rounded-3xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-1.5 font-black text-xs text-blue-900 uppercase tracking-tight">
                <Scale size={14} className="text-blue-600" />
                <span>1. En Balanza</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900 text-[10px] font-black">
                {batches.filter(b => b.stage === 'ingresado').length}
              </span>
            </div>

            <div className="space-y-3">
              {batches.filter(b => b.stage === 'ingresado').map(batch => (
                <div
                  key={batch.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-500 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{batch.batchCode}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{batch.receptionTime}</span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-800">{batch.truckPlate} - {batch.driverName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-slate-400" />
                      <span>{batch.originMine}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-slate-500">Masa Neta:</span>
                    <span className="font-black text-slate-900">{batch.netWeight.toFixed(2)} TMH</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {renderQualityBadge(batch.qualityStatus)}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedBatchForQuality(batch)}
                      className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors text-center"
                    >
                      Calificar
                    </button>
                    <button
                      onClick={() => setSelectedBatchForDischarge(batch)}
                      className="flex-1 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-[10px] font-black text-white transition-all shadow-sm text-center flex items-center justify-center gap-1"
                    >
                      <span>Descargar</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Descargado */}
          <div className="bg-slate-100/70 p-3 rounded-3xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-1.5 font-black text-xs text-teal-900 uppercase tracking-tight">
                <Truck size={14} className="text-teal-600" />
                <span>2. Descargado</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-200/80 text-teal-900 text-[10px] font-black">
                {batches.filter(b => b.stage === 'descargado').length}
              </span>
            </div>

            <div className="space-y-3">
              {batches.filter(b => b.stage === 'descargado').map(batch => (
                <div
                  key={batch.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-teal-500 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{batch.batchCode}</span>
                    <span className="text-[10px] font-semibold text-teal-700">Descargado</span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-800">{batch.truckPlate}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Ubicación: <strong className="text-slate-700">{batch.stockpile}</strong></div>
                  </div>

                  <div className="p-2.5 bg-teal-50/60 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-teal-700">Neto:</span>
                    <span className="font-black text-teal-950">{batch.netWeight.toFixed(2)} TMH</span>
                  </div>

                  <div>{renderQualityBadge(batch.qualityStatus)}</div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedBatchForQuality(batch)}
                      className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors"
                    >
                      Triaje
                    </button>
                    <button
                      onClick={() => handleAdvanceStage(batch.id)}
                      className="flex-1 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-[10px] font-black text-white transition-all text-center flex items-center justify-center gap-1"
                    >
                      <span>A Acopio</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: En Acopio / Stockpile */}
          <div className="bg-slate-100/70 p-3 rounded-3xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-1.5 font-black text-xs text-purple-900 uppercase tracking-tight">
                <Layers size={14} className="text-purple-600" />
                <span>3. En Acopio</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 text-[10px] font-black">
                {batches.filter(b => b.stage === 'acopio').length}
              </span>
            </div>

            <div className="space-y-3">
              {batches.filter(b => b.stage === 'acopio').map(batch => (
                <div
                  key={batch.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-purple-500 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{batch.batchCode}</span>
                    <span className="text-[10px] font-black text-purple-700">{batch.netWeight.toFixed(1)} TMH</span>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <p className="font-bold text-slate-800">{batch.mineralType}</p>
                    <p className="text-slate-500 mt-0.5">Cancha: {batch.stockpile}</p>
                  </div>

                  <div>{renderQualityBadge(batch.qualityStatus)}</div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleAdvanceStage(batch.id)}
                      className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-black text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20"
                    >
                      <Activity size={14} />
                      <span>Alimentar a Tolva / Molienda</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: En Proceso / Molienda */}
          <div className="bg-slate-100/70 p-3 rounded-3xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-1.5 font-black text-xs text-amber-900 uppercase tracking-tight">
                <Activity size={14} className="text-amber-600" />
                <span>4. En Molienda</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black">
                {batches.filter(b => b.stage === 'proceso').length}
              </span>
            </div>

            <div className="space-y-3">
              {batches.filter(b => b.stage === 'proceso').map(batch => (
                <div
                  key={batch.id}
                  className="bg-white p-4 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3 hover:border-amber-500 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{batch.batchCode}</span>
                    <span className="text-[10px] font-black text-amber-700 animate-pulse">⚙️ Tratamiento</span>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <p className="font-bold text-slate-800">{batch.mineralType}</p>
                    <p className="text-slate-500 mt-0.5">Inicio: {batch.processingStartTime || '09:10'}</p>
                  </div>

                  <div className="p-2 bg-amber-50 rounded-xl text-[11px] font-black text-amber-900 flex justify-between">
                    <span>Molienda:</span>
                    <span>{batch.netWeight.toFixed(2)} TMH</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleAdvanceStage(batch.id)}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 size={14} />
                      <span>Cerrar Tratamiento</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 5: Terminado / Procesado */}
          <div className="bg-slate-100/70 p-3 rounded-3xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-1.5 font-black text-xs text-emerald-900 uppercase tracking-tight">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>5. Procesados</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-black">
                {batches.filter(b => b.stage === 'terminado').length}
              </span>
            </div>

            <div className="space-y-3">
              {batches.filter(b => b.stage === 'terminado').map(batch => (
                <div
                  key={batch.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 opacity-90 hover:opacity-100 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{batch.batchCode}</span>
                    <span className="text-[10px] font-black text-emerald-700">Completado</span>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <p className="font-bold text-slate-800">{batch.originMine}</p>
                    <p className="text-slate-500">Masa: {batch.netWeight.toFixed(2)} TMH</p>
                  </div>

                  <div>{renderQualityBadge(batch.qualityStatus)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ==========================================
           TABULAR DETAILED VIEW
           ========================================== */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                  <th className="py-4 px-4">Lote / Guía</th>
                  <th className="py-4 px-4">Fecha / Hora</th>
                  <th className="py-4 px-4">Unidad & Chofer</th>
                  <th className="py-4 px-4">Labor de Mina</th>
                  <th className="py-4 px-4">Tipo Mineral</th>
                  <th className="py-4 px-4 text-right">Bruto (TMH)</th>
                  <th className="py-4 px-4 text-right">Tara (TMH)</th>
                  <th className="py-4 px-4 text-right">Neto (TMH)</th>
                  <th className="py-4 px-4 text-center">Calidad</th>
                  <th className="py-4 px-4">Cancha / Stockpile</th>
                  <th className="py-4 px-4">Etapa</th>
                  <th className="py-4 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map(batch => (
                  <tr key={batch.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      <div>{batch.batchCode}</div>
                      <div className="text-[10px] font-normal text-slate-400">{batch.guideNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{batch.receptionDate}</div>
                      <div className="text-[10px] text-slate-400">{batch.receptionTime}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div>{batch.truckPlate}</div>
                      <div className="text-[10px] font-normal text-slate-500">{batch.driverName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{batch.originMine}</td>
                    <td className="py-3.5 px-4 text-slate-600">{batch.mineralType}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-500">{batch.grossWeight.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-500">{batch.tareWeight.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">{batch.netWeight.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center">{renderQualityBadge(batch.qualityStatus)}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{batch.stockpile}</td>
                    <td className="py-3.5 px-4">{renderStageBadge(batch.stage)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBatchForQuality(batch)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors"
                        >
                          Triaje
                        </button>
                        {batch.stage === 'ingresado' && (
                          <button
                            onClick={() => setSelectedBatchForDischarge(batch)}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-[10px] font-black text-white transition-colors"
                          >
                            Descarga
                          </button>
                        )}
                        {batch.stage !== 'terminado' && (
                          <button
                            onClick={() => handleAdvanceStage(batch.id)}
                            className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Avanzar Etapa"
                          >
                            <ChevronRight size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <MineralReceptionModal
        isOpen={isReceptionModalOpen}
        onClose={() => setIsReceptionModalOpen(false)}
        onSubmit={handleAddBatch}
      />

      <DischargeCheckModal
        isOpen={!!selectedBatchForDischarge}
        batch={selectedBatchForDischarge}
        onClose={() => setSelectedBatchForDischarge(null)}
        onConfirm={handleDischargeConfirm}
      />

      <QualityEvaluationModal
        isOpen={!!selectedBatchForQuality}
        batch={selectedBatchForQuality}
        onClose={() => setSelectedBatchForQuality(null)}
        onSave={handleQualityUpdate}
      />

      <PlantShiftLogModal
        isOpen={isShiftLogModalOpen}
        currentChecklist={shiftChecklist}
        onClose={() => setIsShiftLogModalOpen(false)}
        onSave={(updated) => setShiftChecklist(updated)}
      />
    </div>
  )
}
