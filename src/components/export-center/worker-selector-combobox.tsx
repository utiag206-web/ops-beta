'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, ChevronDown, Check, Users, User, X, Sparkles, Building2 } from 'lucide-react'

interface WorkerItem {
  id: string
  fullName: string
  dni: string
  position: string
  area: string
  status?: string
}

interface WorkerSelectorComboboxProps {
  workers: WorkerItem[]
  value: string
  onChange: (workerId: string) => void
  label?: string
}

export function WorkerSelectorCombobox({
  workers = [],
  value = 'all',
  onChange,
  label = 'Trabajador Específico'
}: WorkerSelectorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Find currently selected worker
  const selectedWorker = useMemo(() => {
    if (!value || value === 'all') return null
    return workers.find(w => w.id === value) || null
  }, [workers, value])

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filtered workers calculation
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return workers
    const q = searchQuery.toLowerCase().trim()
    return workers.filter(w => 
      w.fullName.toLowerCase().includes(q) ||
      w.dni.toLowerCase().includes(q) ||
      (w.area && w.area.toLowerCase().includes(q)) ||
      (w.position && w.position.toLowerCase().includes(q))
    )
  }, [workers, searchQuery])

  const handleSelect = (workerId: string) => {
    onChange(workerId)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('all')
  }

  return (
    <div className="space-y-1.5 col-span-full">
      {/* Label and Count */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Users size={14} className="text-blue-600" />
          <span>{label}</span>
        </label>
        <span className="text-[11px] font-bold text-slate-400">
          {workers.length} Colaboradores Registrados
        </span>
      </div>

      {/* 1. Main Trigger Button — Clean Card Style */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full text-left bg-slate-50 hover:bg-slate-100/80 border rounded-2xl p-3.5 transition-all flex items-center justify-between gap-3 group cursor-pointer ${
          selectedWorker 
            ? 'border-blue-300 bg-blue-50/40 shadow-sm ring-1 ring-blue-500/10' 
            : 'border-slate-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
            selectedWorker
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-500'
          }`}>
            {selectedWorker ? selectedWorker.fullName.charAt(0).toUpperCase() : <Users size={16} />}
          </div>

          <div className="min-w-0">
            {selectedWorker ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {selectedWorker.fullName}
                </span>
                {selectedWorker.dni && selectedWorker.dni !== '-' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                    DNI: {selectedWorker.dni}
                  </span>
                )}
                {selectedWorker.area && (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                    {selectedWorker.area}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-700">
                👥 Todos los Colaboradores ({workers.length})
              </span>
            )}
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {selectedWorker ? (selectedWorker.position || 'Colaborador') : 'Filtrar por toda la empresa o haz clic para elegir a alguien'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedWorker && (
            <span
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-lg transition-all"
              title="Quitar filtro y ver todos"
            >
              <X size={14} />
            </span>
          )}
          <div className="p-1.5 text-slate-400 group-hover:text-blue-600 rounded-lg">
            <Search size={15} />
          </div>
        </div>
      </button>

      {/* 2. Spotlight Popover Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
          
          {/* Backdrop Click */}
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

          {/* Modal Container */}
          <div 
            ref={popoverRef}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh] relative z-10 animate-in zoom-in-95 duration-150"
          >
            
            {/* Popover Header with Search */}
            <div className="p-4 bg-white border-b border-slate-100 space-y-2 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" />
                  <span>Seleccionar Colaborador</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {filteredWorkers.length} resultados
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Escribe nombre, apellido o DNI para filtrar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Popover List */}
            <div className="p-3 sm:p-4 overflow-y-auto custom-scrollbar flex-1 space-y-1.5">
              
              {/* Option: Todos los Trabajadores */}
              <button
                type="button"
                onClick={() => handleSelect('all')}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  !selectedWorker
                    ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm ring-1 ring-blue-500/20'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    !selectedWorker ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500'
                  }`}>
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">👥 Todos los Trabajadores</p>
                    <p className="text-[11px] opacity-70 font-medium">Exportar datos de toda la empresa ({workers.length} colaboradores)</p>
                  </div>
                </div>

                {!selectedWorker && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Worker Items */}
              {filteredWorkers.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-slate-400">
                  No se encontró ningún trabajador que coincida con &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredWorkers.map(w => {
                  const isSelected = selectedWorker?.id === w.id

                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSelect(w.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-500/20 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                        }`}>
                          {w.fullName.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold truncate ${
                              isSelected ? 'text-blue-900' : 'text-slate-800 group-hover:text-blue-600'
                            }`}>
                              {w.fullName}
                            </span>
                            {w.dni && w.dni !== '-' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                DNI: {w.dni}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium truncate">
                            {w.position || 'Colaborador'} • <strong className="text-slate-500">{w.area || 'General'}</strong>
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium px-4 shrink-0">
              <span>{workers.length} colaboradores disponibles</span>
              <span>Presiona <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">ESC</kbd> para cerrar</span>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
