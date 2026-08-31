'use client'

import { useState, useEffect } from 'react'
import { 
  Fuel, Plus, Search, Filter, Calendar, User, Gauge, 
  TrendingUp, Clock, X, BarChart3, ArrowUpRight
} from 'lucide-react'
import { toast } from 'sonner'

interface FuelRecord {
  id: string
  equipment_name: string
  equipment_code: string
  date: string
  gallons: number
  initial_hours: number
  final_hours: number
  hours_operated: number
  ratio: number // gallons per hour
  operator: string
  turn: 'dia' | 'noche'
  observation?: string
}

interface FuelViewProps {
  title: string
  subtitle: string
  defaultEquipmentName: string
  defaultEquipmentCode: string
  storageKey: string
}

export function FuelView({
  title,
  subtitle,
  defaultEquipmentName,
  defaultEquipmentCode,
  storageKey
}: FuelViewProps) {
  const [records, setRecords] = useState<FuelRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`fuel_${storageKey}`)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error(e)
        }
      }
    }
    return [
      {
        id: '1',
        equipment_name: defaultEquipmentName,
        equipment_code: defaultEquipmentCode,
        date: new Date().toISOString().split('T')[0],
        gallons: 25.5,
        initial_hours: 2450.0,
        final_hours: 2458.5,
        hours_operated: 8.5,
        ratio: 3.0,
        operator: 'Juan Quispe (Operador)',
        turn: 'dia',
        observation: 'Operación continua en turno diurno sin novedades.'
      }
    ]
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [filterTurn, setFilterTurn] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    gallons: 0,
    initial_hours: 0,
    final_hours: 0,
    operator: '',
    turn: 'dia' as 'dia' | 'noche',
    observation: ''
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`fuel_${storageKey}`, JSON.stringify(records))
    }
  }, [records, storageKey])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.gallons <= 0 || !form.operator) {
      toast.error('Por favor ingresa los galones y el operador responsable')
      return
    }

    const hoursOp = form.final_hours >= form.initial_hours ? form.final_hours - form.initial_hours : 0
    const ratio = hoursOp > 0 ? Number((form.gallons / hoursOp).toFixed(2)) : 0

    const newRecord: FuelRecord = {
      id: Date.now().toString(),
      equipment_name: defaultEquipmentName,
      equipment_code: defaultEquipmentCode,
      date: form.date,
      gallons: Number(form.gallons),
      initial_hours: Number(form.initial_hours),
      final_hours: Number(form.final_hours),
      hours_operated: hoursOp,
      ratio,
      operator: form.operator,
      turn: form.turn,
      observation: form.observation
    }

    setRecords(prev => [newRecord, ...prev])
    toast.success('Despacho de combustible registrado con éxito')
    setIsModalOpen(false)
    setForm({
      date: new Date().toISOString().split('T')[0],
      gallons: 0,
      initial_hours: 0,
      final_hours: 0,
      operator: '',
      turn: 'dia',
      observation: ''
    })
  }

  const filteredRecords = records.filter(r => {
    const matchSearch = 
      r.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.date.includes(searchTerm) ||
      (r.observation || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchTurn = filterTurn === 'todos' || r.turn === filterTurn
    return matchSearch && matchTurn
  })

  const totalGallons = records.reduce((acc, curr) => acc + curr.gallons, 0)
  const totalHours = records.reduce((acc, curr) => acc + curr.hours_operated, 0)
  const avgRatio = totalHours > 0 ? (totalGallons / totalHours).toFixed(2) : '0.00'

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-left">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 text-amber-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
            <Fuel size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                {title}
              </h1>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-md border border-amber-200 uppercase">
                {defaultEquipmentCode}
              </span>
            </div>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">{subtitle}</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100 active:scale-95 text-xs sm:text-base"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Registrar Despacho</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Fuel size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-tight text-slate-400">Total Galones Despachados</p>
            <p className="text-2xl font-black text-slate-800">{totalGallons.toFixed(1)} <span className="text-xs text-slate-400">GAL</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-tight text-slate-400">Horas Totales Operadas</p>
            <p className="text-2xl font-black text-slate-800">{totalHours.toFixed(1)} <span className="text-xs text-slate-400">HRS</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-tight text-slate-400">Rendimiento Promedio</p>
            <p className="text-2xl font-black text-slate-800">{avgRatio} <span className="text-xs text-slate-400">GAL/HR</span></p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex-1 max-w-sm">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por operador, fecha u observación..."
            className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <Filter size={16} className="text-slate-400" />
          <select 
            className="bg-transparent text-sm font-bold text-slate-600 outline-none"
            value={filterTurn}
            onChange={e => setFilterTurn(e.target.value)}
          >
            <option value="todos">Todos los turnos</option>
            <option value="dia">Turno Día</option>
            <option value="noche">Turno Noche</option>
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
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Turno</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Galones (Gal)</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Horóm. Inicial</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Horóm. Final</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Hrs Operadas</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Consumo (Gal/Hr)</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Operador Responsable</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Observación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length > 0 ? filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-6 text-xs font-bold text-slate-700 whitespace-nowrap">
                    {r.date}
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                      r.turn === 'dia' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {r.turn === 'dia' ? '☀️ Día' : '🌙 Noche'}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-sm font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-100">
                      {r.gallons.toFixed(1)} Gal
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center text-xs font-bold text-slate-600">
                    {r.initial_hours.toFixed(1)}
                  </td>
                  <td className="py-5 px-6 text-center text-xs font-bold text-slate-600">
                    {r.final_hours.toFixed(1)}
                  </td>
                  <td className="py-5 px-6 text-center text-xs font-black text-slate-800">
                    {r.hours_operated.toFixed(1)} hrs
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {r.ratio.toFixed(2)} Gal/h
                    </span>
                  </td>
                  <td className="py-5 px-6 text-xs font-bold text-slate-700 whitespace-nowrap">
                    {r.operator}
                  </td>
                  <td className="py-5 px-6 text-xs text-slate-500 max-w-xs">
                    {r.observation || '—'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-bold">
                    No se encontraron registros de combustible.
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
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Registro de Combustible</h2>
                <p className="text-slate-400 text-[10px] font-bold tracking-tight">{defaultEquipmentName} ({defaultEquipmentCode})</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Fecha de Carga</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Turno</label>
                  <select
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.turn}
                    onChange={e => setForm(prev => ({ ...prev, turn: e.target.value as any }))}
                  >
                    <option value="dia">Turno Día (07:00 - 19:00)</option>
                    <option value="noche">Turno Noche (19:00 - 07:00)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-amber-700 uppercase">Cantidad de Galones Cargados (Gal)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="0.0"
                  className="w-full bg-amber-50/50 border-2 border-amber-200 focus:border-amber-500 focus:bg-white rounded-2xl p-3.5 text-sm font-black text-amber-800 outline-none"
                  value={form.gallons || ''}
                  onChange={e => setForm(prev => ({ ...prev, gallons: Number(e.target.value) }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Horómetro Inicial</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.initial_hours || ''}
                    onChange={e => setForm(prev => ({ ...prev, initial_hours: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Horómetro Final</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.final_hours || ''}
                    onChange={e => setForm(prev => ({ ...prev, final_hours: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Operador / Despachador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Quispe (Operador de Generador)"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                  value={form.operator}
                  onChange={e => setForm(prev => ({ ...prev, operator: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Observaciones Operativas</label>
                <textarea
                  rows={2}
                  placeholder="Nivel de carga, temperatura ambiente, anomalías observadas..."
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none resize-none"
                  value={form.observation}
                  onChange={e => setForm(prev => ({ ...prev, observation: e.target.value }))}
                />
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
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-amber-100 text-xs"
                >
                  Guardar Despacho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
