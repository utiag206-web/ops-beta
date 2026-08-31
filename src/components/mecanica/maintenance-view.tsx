'use client'

import { useState, useEffect } from 'react'
import { 
  Wrench, Plus, Search, Filter, CheckCircle2, Clock, 
  AlertTriangle, Calendar, User, Gauge, DollarSign, X, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface MaintenanceItem {
  id: string
  equipment_name: string
  equipment_code: string
  maintenance_type: 'preventivo' | 'correctivo' | 'predictivo'
  description: string
  technician: string
  date: string
  hours_or_km: number
  status: 'completado' | 'en_progreso' | 'programado'
  cost?: number
  next_service?: string
}

interface MaintenanceViewProps {
  title: string
  subtitle: string
  equipmentType: string
  defaultEquipmentName?: string
  defaultEquipmentCode?: string
  storageKey: string
  initialItems?: MaintenanceItem[]
}

export function MaintenanceView({
  title,
  subtitle,
  equipmentType,
  defaultEquipmentName = '',
  defaultEquipmentCode = '',
  storageKey,
  initialItems = []
}: MaintenanceViewProps) {
  const [items, setItems] = useState<MaintenanceItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`mecanica_${storageKey}`)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error(e)
        }
      }
    }
    return initialItems.length > 0 ? initialItems : [
      {
        id: '1',
        equipment_name: defaultEquipmentName || 'Equipo Principal',
        equipment_code: defaultEquipmentCode || 'EQ-01',
        maintenance_type: 'preventivo',
        description: 'Cambio de aceite de motor, filtro de combustible y revisión general de mangueras hidráulicas.',
        technician: 'Carlos Ramos (Mecánico)',
        date: new Date().toISOString().split('T')[0],
        hours_or_km: 2450,
        status: 'completado',
        cost: 450,
        next_service: '2700 Horas / 1 mes'
      }
    ]
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [form, setForm] = useState({
    equipment_name: defaultEquipmentName || '',
    equipment_code: defaultEquipmentCode || '',
    maintenance_type: 'preventivo' as 'preventivo' | 'correctivo' | 'predictivo',
    description: '',
    technician: '',
    date: new Date().toISOString().split('T')[0],
    hours_or_km: 0,
    status: 'completado' as 'completado' | 'en_progreso' | 'programado',
    cost: 0,
    next_service: ''
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mecanica_${storageKey}`, JSON.stringify(items))
    }
  }, [items, storageKey])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description || !form.technician) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    const newItem: MaintenanceItem = {
      id: Date.now().toString(),
      ...form
    }

    setItems(prev => [newItem, ...prev])
    toast.success('Mantenimiento registrado con éxito')
    setIsModalOpen(false)
    setForm({
      equipment_name: defaultEquipmentName || '',
      equipment_code: defaultEquipmentCode || '',
      maintenance_type: 'preventivo',
      description: '',
      technician: '',
      date: new Date().toISOString().split('T')[0],
      hours_or_km: 0,
      status: 'completado',
      cost: 0,
      next_service: ''
    })
  }

  const filteredItems = items.filter(item => {
    const matchSearch = 
      item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchType = filterType === 'todos' || item.maintenance_type === filterType
    return matchSearch && matchType
  })

  const totalCost = items.reduce((acc, curr) => acc + (curr.cost || 0), 0)
  const completedCount = items.filter(i => i.status === 'completado').length
  const pendingCount = items.filter(i => i.status !== 'completado').length

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-left">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
            <Wrench size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/requerimientos"
            className="px-5 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm border border-slate-200"
          >
            <FileText size={18} />
            <span>Requerir Repuestos</span>
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 text-xs sm:text-sm"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Nuevo Mantenimiento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-tight text-slate-400">Completados</p>
            <p className="text-2xl font-black text-slate-800">{completedCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-tight text-slate-400">En Progreso / Prog.</p>
            <p className="text-2xl font-black text-slate-800">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-tight text-slate-400">Inversión Total (S/)</p>
            <p className="text-2xl font-black text-slate-800">S/ {totalCost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex-1 max-w-sm">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por equipo, código, técnico..."
            className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <Filter size={16} className="text-slate-400" />
          <select 
            className="bg-transparent text-sm font-bold text-slate-600 outline-none"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="todos">Todos los tipos</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
            <option value="predictivo">Predictivo</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Fecha</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Equipo</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Tipo</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Trabajo Realizado</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Técnico Resp.</th>
                <th className="py-5 px-4 text-[11px] font-bold text-slate-400 text-center">Horóm./KM</th>
                <th className="py-5 px-4 text-[11px] font-bold text-slate-400 text-center">Costo (S/)</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Estado</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Próx. Servicio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length > 0 ? filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-6 text-xs font-bold text-slate-700 whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-5 px-6">
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.equipment_name}</p>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {item.equipment_code}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                      item.maintenance_type === 'preventivo' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : item.maintenance_type === 'correctivo'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {item.maintenance_type}
                    </span>
                  </td>
                  <td className="py-5 px-6 max-w-xs">
                    <p className="text-xs font-semibold text-slate-600 leading-snug">
                      {item.description}
                    </p>
                  </td>
                  <td className="py-5 px-6 text-xs font-bold text-slate-700 whitespace-nowrap">
                    {item.technician}
                  </td>
                  <td className="py-5 px-4 text-center text-xs font-bold text-slate-800">
                    {item.hours_or_km} {item.equipment_name.toLowerCase().includes('camioneta') ? 'KM' : 'HRS'}
                  </td>
                  <td className="py-5 px-4 text-center text-xs font-black text-slate-700">
                    {item.cost ? `S/ ${item.cost.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      item.status === 'completado' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.status === 'completado' ? '✅ Completado' : '⏳ ' + item.status}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center text-xs font-bold text-slate-500 whitespace-nowrap">
                    {item.next_service || '—'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-bold">
                    No se encontraron registros de mantenimiento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nuevo Mantenimiento</h2>
                <p className="text-slate-400 text-[10px] font-bold tracking-tight">Registro de orden de trabajo o intervención.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Nombre de Equipo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Camioneta Hilux 4x4, Compresor Sullair..."
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.equipment_name}
                    onChange={e => setForm(prev => ({ ...prev, equipment_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Código / Placa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: VH-01, GEN-01..."
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.equipment_code}
                    onChange={e => setForm(prev => ({ ...prev, equipment_code: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Mantenimiento</label>
                  <select
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.maintenance_type}
                    onChange={e => setForm(prev => ({ ...prev, maintenance_type: e.target.value as any }))}
                  >
                    <option value="preventivo">Preventivo</option>
                    <option value="correctivo">Correctivo</option>
                    <option value="predictivo">Predictivo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Fecha de Intervención</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Horómetro / Kilometraje</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.hours_or_km || ''}
                    onChange={e => setForm(prev => ({ ...prev, hours_or_km: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Costo Incurrido (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.cost || ''}
                    onChange={e => setForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Mecánico / Responsable Técnico</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Ramos (Técnico Mecánico)"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                  value={form.technician}
                  onChange={e => setForm(prev => ({ ...prev, technician: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Descripción de los Trabajos y Repuestos</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detallar cambio de fluidos, filtros, componentes reemplazados..."
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none resize-none"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Estado de la Orden</label>
                  <select
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <option value="completado">Completado</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="programado">Programado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Próximo Servicio Recomendado</label>
                  <input
                    type="text"
                    placeholder="Ej: 3000 Horas / 30 días"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.next_service}
                    onChange={e => setForm(prev => ({ ...prev, next_service: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-100 text-xs"
                >
                  Guardar Mantenimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
