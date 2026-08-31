'use client'

import { useState, useEffect } from 'react'
import { 
  ClipboardCheck, Plus, Search, Filter, CheckCircle2, XCircle, 
  AlertCircle, Calendar, User, Truck, X, Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface ChecklistItem {
  id: string
  equipment_name: string
  equipment_code: string
  inspector: string
  date: string
  turn: 'dia' | 'noche'
  status: 'aprobado' | 'observado' | 'rechazado'
  checks: { name: string; status: 'ok' | 'fail' | 'na' }[]
  observations?: string
}

const DEFAULT_CHECKS = [
  'Nivel de Aceite de Motor',
  'Nivel de Refrigerante / Radiador',
  'Nivel de Líquido de Frenos / Embrague',
  'Presión y Estado de Neumáticos / Orugas',
  'Sistema de Luces y Circulina',
  'Alarma de Retroceso y Claxon',
  'Fugas Visibles de Aceite o Combustible',
  'Extintor y Botiquín de Emergencia',
  'Cinturón de Seguridad y Espejos',
  'Mandos y Controles Hidráulicos'
]

export function ChecklistView() {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mecanica_checklists')
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
        equipment_name: 'Camioneta Hilux 4x4',
        equipment_code: 'VH-01',
        inspector: 'Marco Huamán (Conductor)',
        date: new Date().toISOString().split('T')[0],
        turn: 'dia',
        status: 'aprobado',
        checks: DEFAULT_CHECKS.map(name => ({ name, status: 'ok' })),
        observations: 'Unidad en óptimas condiciones para subir a mina.'
      }
    ]
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem | null>(null)

  const [form, setForm] = useState({
    equipment_name: '',
    equipment_code: '',
    inspector: '',
    date: new Date().toISOString().split('T')[0],
    turn: 'dia' as 'dia' | 'noche',
    observations: '',
    checks: DEFAULT_CHECKS.map(name => ({ name, status: 'ok' as 'ok' | 'fail' | 'na' }))
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mecanica_checklists', JSON.stringify(items))
    }
  }, [items])

  const handleCheckToggle = (index: number, status: 'ok' | 'fail' | 'na') => {
    setForm(prev => {
      const newChecks = [...prev.checks]
      newChecks[index] = { ...newChecks[index], status }
      return { ...prev, checks: newChecks }
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.equipment_name || !form.equipment_code || !form.inspector) {
      toast.error('Completa los datos del equipo y del inspector')
      return
    }

    const fails = form.checks.filter(c => c.status === 'fail').length
    const calculatedStatus: 'aprobado' | 'observado' | 'rechazado' = 
      fails === 0 ? 'aprobado' : fails <= 2 ? 'observado' : 'rechazado'

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      equipment_name: form.equipment_name,
      equipment_code: form.equipment_code.toUpperCase(),
      inspector: form.inspector,
      date: form.date,
      turn: form.turn,
      status: calculatedStatus,
      checks: form.checks,
      observations: form.observations
    }

    setItems(prev => [newItem, ...prev])
    toast.success(`Checklist guardado con estado: ${calculatedStatus.toUpperCase()}`)
    setIsModalOpen(false)
    setForm({
      equipment_name: '',
      equipment_code: '',
      inspector: '',
      date: new Date().toISOString().split('T')[0],
      turn: 'dia',
      observations: '',
      checks: DEFAULT_CHECKS.map(name => ({ name, status: 'ok' }))
    })
  }

  const filteredItems = items.filter(item => {
    const matchSearch = 
      item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspector.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchStatus = filterStatus === 'todos' || item.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-left">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
            <ClipboardCheck size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Checklists de Verificación Pre-Operacional
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
              Inspección diaria de seguridad y operatividad mecánica de equipos y vehículos.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 text-xs sm:text-base"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Realizar Checklist</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex-1 max-w-sm">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por equipo, código o inspector..."
            className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <Filter size={16} className="text-slate-400" />
          <select 
            className="bg-transparent text-sm font-bold text-slate-600 outline-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="aprobado">Aprobados</option>
            <option value="observado">Observados</option>
            <option value="rechazado">Rechazados</option>
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
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Equipo Inspeccionado</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Inspector / Operador</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Puntos OK</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Resultado</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Observaciones</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length > 0 ? filteredItems.map((item) => {
                const okCount = item.checks.filter(c => c.status === 'ok').length
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 px-6 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {item.turn}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div>
                        <p className="text-sm font-black text-slate-800">{item.equipment_name}</p>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {item.equipment_code}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {item.inspector}
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className="text-xs font-bold text-slate-600">
                        {okCount} / {item.checks.length}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        item.status === 'aprobado' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : item.status === 'observado'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {item.status === 'aprobado' ? '✅ Apto' : item.status === 'observado' ? '⚠️ Observado' : '⛔ Rechazado'}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {item.observations || 'Sin observaciones'}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <button 
                        onClick={() => setSelectedChecklist(item)}
                        className="p-2 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-slate-100"
                        title="Ver Detalle de Inspección"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-bold">
                    No se encontraron checklists registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Checklist */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nuevo Checklist Pre-Operacional</h2>
                <p className="text-slate-400 text-[10px] font-bold tracking-tight">Inspección de 10 puntos críticos de seguridad.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Equipo / Vehículo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Camioneta Hilux 4x4, Scoop 1.5 yd..."
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.equipment_name}
                    onChange={e => setForm(prev => ({ ...prev, equipment_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Código / Placa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: VH-01, SC-02..."
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.equipment_code}
                    onChange={e => setForm(prev => ({ ...prev, equipment_code: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Inspector / Operador</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.inspector}
                    onChange={e => setForm(prev => ({ ...prev, inspector: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Turno</label>
                  <select
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.turn}
                    onChange={e => setForm(prev => ({ ...prev, turn: e.target.value as any }))}
                  >
                    <option value="dia">Día</option>
                    <option value="noche">Noche</option>
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 bg-slate-50/70 p-5 rounded-3xl border border-slate-100">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Puntos de Inspección</p>
                <div className="space-y-2">
                  {form.checks.map((check, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 gap-4">
                      <span className="text-xs font-bold text-slate-700">{idx + 1}. {check.name}</span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCheckToggle(idx, 'ok')}
                          className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                            check.status === 'ok' 
                              ? 'bg-emerald-500 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckToggle(idx, 'fail')}
                          className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                            check.status === 'fail' 
                              ? 'bg-rose-500 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          FALLA
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckToggle(idx, 'na')}
                          className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                            check.status === 'na' 
                              ? 'bg-slate-500 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Observaciones Adicionales</label>
                <textarea
                  rows={2}
                  placeholder="Detallar cualquier condición anormal observada durante la inspección..."
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none resize-none"
                  value={form.observations}
                  onChange={e => setForm(prev => ({ ...prev, observations: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-100 text-xs"
                >
                  Guardar y Aprobar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Checklist */}
      {selectedChecklist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Detalle de Inspección</h2>
                <p className="text-slate-400 text-[10px] font-bold tracking-tight">{selectedChecklist.equipment_name} ({selectedChecklist.equipment_code})</p>
              </div>
              <button onClick={() => setSelectedChecklist(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Inspector:</span>
                  <p className="font-bold text-slate-800">{selectedChecklist.inspector}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Fecha:</span>
                  <p className="font-bold text-slate-800">{selectedChecklist.date} ({selectedChecklist.turn.toUpperCase()})</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-slate-700 uppercase">Resultado de Puntos Evaluados</p>
                <div className="space-y-1.5">
                  {selectedChecklist.checks.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs">
                      <span className="font-medium text-slate-700">{c.name}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        c.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : c.status === 'fail' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {c.status === 'ok' ? 'Conforme' : c.status === 'fail' ? 'No Conforme' : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedChecklist.observations && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <span className="text-[10px] font-black text-amber-800 uppercase">Observación del Operador:</span>
                  <p className="text-xs text-amber-900 mt-1 font-medium">{selectedChecklist.observations}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
