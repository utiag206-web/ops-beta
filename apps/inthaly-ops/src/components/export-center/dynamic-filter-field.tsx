'use client'

import { useState, useEffect } from 'react'
import { Calendar, Search, Users, MapPin, Layers, CheckSquare } from 'lucide-react'
import { FilterFieldSchema, AuxiliaryExportData } from '@/lib/export-center/types'
import { SYSTEM_AREAS } from '@/lib/constants'
import { WorkerSelectorCombobox } from './worker-selector-combobox'

function DebouncedTextInput({ 
  schema, 
  value, 
  onChange 
}: { 
  schema: FilterFieldSchema; 
  value: string; 
  onChange: (key: string, val: string) => void 
}) {
  const [localValue, setLocalValue] = useState(value || '')

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== (value || '')) {
        onChange(schema.key, localValue)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [localValue, schema.key, value, onChange])

  return (
    <div className="space-y-1 col-span-full">
      <label className="text-xs font-black uppercase tracking-tight text-slate-700 flex items-center gap-2">
        <Search size={14} className="text-blue-600" />
        {schema.label}
      </label>
      <input
        type="text"
        placeholder={schema.placeholder || 'Escribe para filtrar predictivamente...'}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
      />
    </div>
  )
}

interface DynamicFilterFieldProps {
  schema: FilterFieldSchema
  value: any
  onChange: (key: string, value: any) => void
  auxData: AuxiliaryExportData
  datePreset?: string
  onPresetChange?: (preset: 'today' | 'week' | 'month' | 'last_month' | 'quarter' | 'custom') => void
  startDate?: string
  endDate?: string
}

export function DynamicFilterField({
  schema,
  value,
  onChange,
  auxData,
  datePreset = 'month',
  onPresetChange,
  startDate,
  endDate
}: DynamicFilterFieldProps) {
  const [workerSearch, setWorkerSearch] = useState('')

  switch (schema.type) {
    // ==========================================
    // 1. RANGO DE FECHAS / PERIODO
    // ==========================================
    case 'date_range':
    case 'month_year':
      return (
        <div className="space-y-3 col-span-full pt-1">
          <label className="text-xs font-black uppercase tracking-tight text-slate-700 flex items-center gap-2">
            <Calendar size={14} className="text-blue-600" />
            {schema.label || 'Periodo / Rango de Fechas'}
          </label>

          {/* Quick Period Presets */}
          {onPresetChange && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'today', label: 'Hoy' },
                { id: 'week', label: '7 Días' },
                { id: 'month', label: 'Este Mes' },
                { id: 'last_month', label: 'Mes Ant.' },
                { id: 'custom', label: 'Manual' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPresetChange(p.id as any)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition-all border ${
                    datePreset === p.id 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] font-bold text-slate-500">Fecha Desde</span>
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => onChange('startDate', e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500">Fecha Hasta</span>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => onChange('endDate', e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>
      )

    // ==========================================
    // 2. TEXTO LIBRE / BÚSQUEDA PREDICTIVA (DEBOUNCED)
    // ==========================================
    case 'text':
      return (
        <DebouncedTextInput
          schema={schema}
          value={value || ''}
          onChange={onChange}
        />
      )

    // ==========================================
    // 3. SELECT DINÁMICO
    // ==========================================
    case 'select':
      return (
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500">{schema.label}</label>
          <select
            value={value || 'all'}
            onChange={(e) => onChange(schema.key, e.target.value)}
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
          >
            {(schema.options || [{ label: 'Todos', value: 'all' }]).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )

    // ==========================================
    // 4. ÁREA / DEPARTAMENTO
    // ==========================================
    case 'area':
      return (
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Layers size={13} className="text-blue-600" />
            <span>{schema.label || 'Área / Departamento'}</span>
          </label>
          <select
            value={value || 'all'}
            onChange={(e) => onChange(schema.key || 'area', e.target.value)}
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
          >
            <option value="all">Todas las Áreas</option>
            {SYSTEM_AREAS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      )

    // ==========================================
    // 5. ALMACÉN / DEPÓSITO
    // ==========================================
    case 'warehouse':
      return (
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <MapPin size={13} className="text-emerald-600" />
            <span>{schema.label || 'Almacén / Depósito'}</span>
          </label>
          <select
            value={value || 'all'}
            onChange={(e) => onChange(schema.key || 'warehouseId', e.target.value)}
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
          >
            <option value="all">Todos los Almacenes ({auxData.warehouses.length})</option>
            {auxData.warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      )

    // ==========================================
    // 6. TRABAJADOR ESPECÍFICO (SPOTLIGHT COMBOBOX)
    // ==========================================
    case 'worker':
      return (
        <WorkerSelectorCombobox
          workers={auxData.workers}
          value={value || 'all'}
          onChange={(val) => onChange(schema.key || 'workerId', val)}
          label={schema.label}
        />
      )

    // ==========================================
    // 7. BOOLEANO / CHECKBOX
    // ==========================================
    case 'boolean':
      return (
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id={`field-${schema.key}`}
            checked={!!value}
            onChange={(e) => onChange(schema.key, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor={`field-${schema.key}`} className="text-xs font-bold text-slate-700 cursor-pointer">
            {schema.label}
          </label>
        </div>
      )

    default:
      return null
  }
}
