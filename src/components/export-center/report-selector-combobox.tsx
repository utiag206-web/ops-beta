'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { 
  Search, ChevronDown, Check, Sparkles, Layers, 
  X, Users, Pickaxe, Boxes, Coins, ShieldCheck, 
  FileSpreadsheet, ArrowRight, Command
} from 'lucide-react'
import { ReportDefinition, ReportCategory } from '@/lib/export-center/types'
import { REPORT_REGISTRY, REPORT_CATEGORIES } from '@/lib/export-center/registry'

interface ReportSelectorComboboxProps {
  currentReport: ReportDefinition
  onSelectReport: (reportId: string) => void
}

const CATEGORY_ICONS: Record<string, any> = {
  rrhh: Users,
  mina: Pickaxe,
  logistica: Boxes,
  finanzas: Coins,
  soma: ShieldCheck
}

export function ReportSelectorCombobox({
  currentReport,
  onSelectReport
}: ReportSelectorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filtered reports calculation
  const filteredReports = useMemo(() => {
    return REPORT_REGISTRY.filter(report => {
      // Category filter
      if (selectedCategory !== 'all' && report.category !== selectedCategory) {
        return false
      }

      // Text query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = report.title.toLowerCase().includes(q)
        const matchCode = report.code.toLowerCase().includes(q)
        const matchDesc = report.description.toLowerCase().includes(q)
        const matchCat = report.categoryLabel.toLowerCase().includes(q)
        return matchTitle || matchCode || matchDesc || matchCat
      }

      return true
    })
  }, [selectedCategory, searchQuery])

  // Group filtered reports by category
  const groupedReports = useMemo(() => {
    const groups: { category: ReportCategory; reports: ReportDefinition[] }[] = []
    
    REPORT_CATEGORIES.forEach(cat => {
      if (cat.id === 'all') return
      const reports = filteredReports.filter(r => r.category === cat.id)
      if (reports.length > 0) {
        groups.push({ category: cat, reports })
      }
    })

    return groups
  }, [filteredReports])

  const handleSelect = (reportId: string) => {
    onSelectReport(reportId)
    setIsOpen(false)
  }

  const CurrentIcon = CATEGORY_ICONS[currentReport.category] || FileSpreadsheet

  return (
    <div className="relative">
      
      {/* 1. Main Trigger Button — Clean, Professional Card */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 md:p-5 transition-all shadow-sm group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer focus:ring-2 focus:ring-blue-500/20"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <CurrentIcon size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200/60">
                {currentReport.code}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {currentReport.categoryLabel}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate group-hover:text-blue-600 transition-colors">
              {currentReport.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate max-w-xl">
              {currentReport.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-sm group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
          <Search size={14} />
          <span>Cambiar Reporte</span>
          <ChevronDown size={14} className="text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-y-0.5" />
        </div>
      </button>

      {/* 2. Spotlight / Command Popover Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
          
          {/* Backdrop Click */}
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

          {/* Modal Container */}
          <div 
            ref={popoverRef}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] relative z-10 animate-in zoom-in-95 duration-150"
          >
            
            {/* Popover Header with Search Bar */}
            <div className="p-4 sm:p-5 bg-white border-b border-slate-100 space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Escribe para buscar... (ej. Tareo, Caja Chica, Kardex, Combustible, EPP, Stock)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all placeholder:text-slate-400 placeholder:font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 bg-slate-200/60 hover:bg-slate-200 rounded-lg"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Quick Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {REPORT_CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Popover Report List */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {groupedReports.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Search size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No se encontraron reportes</h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Intenta con otra palabra clave como &ldquo;Tareo&rdquo;, &ldquo;Mina&rdquo; o &ldquo;Kardex&rdquo;.
                  </p>
                </div>
              ) : (
                groupedReports.map(({ category, reports }) => {
                  const CatIcon = CATEGORY_ICONS[category.id] || FileSpreadsheet

                  return (
                    <div key={category.id} className="space-y-2">
                      {/* Category Header */}
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                        <CatIcon size={14} className="text-slate-500" />
                        <span>{category.label}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                          {reports.length}
                        </span>
                      </div>

                      {/* Items in this Category */}
                      <div className="space-y-1.5">
                        {reports.map(report => {
                          const isSelected = report.id === currentReport.id

                          return (
                            <button
                              key={report.id}
                              type="button"
                              onClick={() => handleSelect(report.id)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                                isSelected
                                  ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-500/20 shadow-sm'
                                  : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {report.code}
                                </span>

                                <div className="min-w-0">
                                  <h5 className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                                    isSelected ? 'text-blue-900' : 'text-slate-800 group-hover:text-blue-600'
                                  }`}>
                                    {report.title}
                                  </h5>
                                  <p className="text-[11px] text-slate-400 font-medium truncate">
                                    {report.description}
                                  </p>
                                </div>
                              </div>

                              {isSelected ? (
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                  <Check size={14} strokeWidth={3} />
                                </div>
                              ) : (
                                <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Popover Footer Info */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium px-5 shrink-0">
              <span>{REPORT_REGISTRY.length} reportes parametrizados</span>
              <span className="hidden sm:inline">Presiona <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">ESC</kbd> para cerrar</span>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
