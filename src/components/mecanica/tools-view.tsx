'use client'

import { useState, useEffect } from 'react'
import { 
  Hammer, Plus, Search, Filter, CheckCircle2, AlertTriangle, 
  Trash2, User, MapPin, X, Pencil, ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'

interface ToolItem {
  id: string
  code: string
  name: string
  category: string
  brand: string
  condition: 'operativo' | 'en_reparacion' | 'de_baja'
  assigned_to?: string
  location: string
  last_inspection_date: string
}

export function ToolsView() {
  const [items, setItems] = useState<ToolItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mecanica_tools')
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
        code: 'HERR-001',
        name: 'Amoladora Angular 7 pulg 2200W',
        category: 'Eléctrica',
        brand: 'Bosch',
        condition: 'operativo',
        assigned_to: 'Taller Central (Uso Común)',
        location: 'Taller de Mecánica - Estante A',
        last_inspection_date: new Date().toISOString().split('T')[0]
      },
      {
        id: '2',
        code: 'HERR-002',
        name: 'Taladro Percutor Industrial 1/2',
        category: 'Eléctrica',
        brand: 'DeWalt',
        condition: 'operativo',
        assigned_to: 'Carlos Ramos',
        location: 'Mina Nivel 1',
        last_inspection_date: new Date().toISOString().split('T')[0]
      },
      {
        id: '3',
        code: 'HERR-003',
        name: 'Juego de Llaves Mixtas 6-32mm (24 Pzas)',
        category: 'Manual',
        brand: 'Stanley',
        condition: 'operativo',
        assigned_to: 'Taller Mecánico',
        location: 'Caja de Herramientas #1',
        last_inspection_date: new Date().toISOString().split('T')[0]
      },
      {
        id: '4',
        code: 'HERR-004',
        name: 'Gata Hidráulica Tipo Botella 20T',
        category: 'Hidráulica',
        brand: 'Mega',
        condition: 'en_reparacion',
        assigned_to: 'Taller Central',
        location: 'Área de Reparación',
        last_inspection_date: new Date().toISOString().split('T')[0]
      }
    ]
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCondition, setFilterCondition] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'Eléctrica',
    brand: '',
    condition: 'operativo' as 'operativo' | 'en_reparacion' | 'de_baja',
    assigned_to: '',
    location: '',
    last_inspection_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mecanica_tools', JSON.stringify(items))
    }
  }, [items])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.code) {
      toast.error('Completa el código y nombre de la herramienta')
      return
    }

    const newItem: ToolItem = {
      id: Date.now().toString(),
      code: form.code.toUpperCase(),
      name: form.name,
      category: form.category,
      brand: form.brand || 'Genérica',
      condition: form.condition,
      assigned_to: form.assigned_to || 'Taller Central',
      location: form.location || 'Taller de Mecánica',
      last_inspection_date: form.last_inspection_date
    }

    setItems(prev => [newItem, ...prev])
    toast.success('Herramienta registrada con éxito')
    setIsModalOpen(false)
    setForm({
      code: '',
      name: '',
      category: 'Eléctrica',
      brand: '',
      condition: 'operativo',
      assigned_to: '',
      location: '',
      last_inspection_date: new Date().toISOString().split('T')[0]
    })
  }

  const handleStatusChange = (id: string, newCondition: 'operativo' | 'en_reparacion' | 'de_baja') => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, condition: newCondition } : item))
    toast.success('Estado de herramienta actualizado')
  }

  const filteredItems = items.filter(item => {
    const matchSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.assigned_to || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchCondition = filterCondition === 'todos' || item.condition === filterCondition
    return matchSearch && matchCondition
  })

  const operativos = items.filter(i => i.condition === 'operativo').length
  const enReparacion = items.filter(i => i.condition === 'en_reparacion').length
  const deBaja = items.filter(i => i.condition === 'de_baja').length

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-left">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 text-purple-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
            <Hammer size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Control de Herramientas y Equipos Menores
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
              Inventario de taller, estado de operatividad, asignaciones y custodia.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100 active:scale-95 text-xs sm:text-base"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Registrar Herramienta</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-tight text-slate-400">Operativas</p>
            <p className="text-2xl font-black text-slate-800">{operativos}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-tight text-slate-400">En Reparación</p>
            <p className="text-2xl font-black text-slate-800">{enReparacion}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-tight text-slate-400">De Baja</p>
            <p className="text-2xl font-black text-slate-800">{deBaja}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex-1 max-w-sm">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar herramienta, marca, código o custodio..."
            className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <Filter size={16} className="text-slate-400" />
          <select 
            className="bg-transparent text-sm font-bold text-slate-600 outline-none"
            value={filterCondition}
            onChange={e => setFilterCondition(e.target.value)}
          >
            <option value="todos">Todas las condiciones</option>
            <option value="operativo">Operativas</option>
            <option value="en_reparacion">En Reparación</option>
            <option value="de_baja">De Baja</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Código</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Herramienta / Descripción</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Categoría</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Marca</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Custodio / Asignado</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-left">Ubicación</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-center">Estado</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 text-right">Cambiar Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length > 0 ? filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-6 text-xs font-black text-purple-700 whitespace-nowrap">
                    <span className="bg-purple-50 px-2 py-1 rounded border border-purple-100">
                      {item.code}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <p className="text-sm font-black text-slate-800">{item.name}</p>
                    <span className="text-[10px] text-slate-400">Insp: {item.last_inspection_date}</span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-xs font-bold text-slate-700">
                    {item.brand}
                  </td>
                  <td className="py-5 px-6 text-xs font-bold text-slate-700">
                    {item.assigned_to || 'Taller Central'}
                  </td>
                  <td className="py-5 px-6 text-xs text-slate-600">
                    {item.location}
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      item.condition === 'operativo' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : item.condition === 'en_reparacion'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {item.condition === 'operativo' ? '✅ Operativo' : item.condition === 'en_reparacion' ? '⏳ En Reparación' : '⛔ De Baja'}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.condition !== 'operativo' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'operativo')}
                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-emerald-100"
                          title="Marcar Operativo"
                        >
                          Operativo
                        </button>
                      )}
                      {item.condition !== 'en_reparacion' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'en_reparacion')}
                          className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-amber-100"
                          title="Enviar a Reparación"
                        >
                          Reparar
                        </button>
                      )}
                      {item.condition !== 'de_baja' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'de_baja')}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-rose-100"
                          title="Dar de Baja"
                        >
                          De Baja
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-bold">
                    No se encontraron herramientas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Herramienta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Registrar Herramienta</h2>
                <p className="text-slate-400 text-[10px] font-bold tracking-tight">Control patrimonial y operativo de taller.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Código / Placa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: HERR-005"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.code}
                    onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Categoría</label>
                  <select
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Eléctrica">Eléctrica / A Batería</option>
                    <option value="Manual">Manual</option>
                    <option value="Hidráulica">Hidráulica / Neumática</option>
                    <option value="Medición">Medición / Calibración</option>
                    <option value="Soldadura">Soldadura / Corte</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Nombre / Descripción de Herramienta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pistola de Impacto Neumática 3/4"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Marca / Modelo</label>
                  <input
                    type="text"
                    placeholder="Ej: Milwaukee / Ingersoll Rand"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.brand}
                    onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Estado Inicial</label>
                  <select
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.condition}
                    onChange={e => setForm(prev => ({ ...prev, condition: e.target.value as any }))}
                  >
                    <option value="operativo">Operativo</option>
                    <option value="en_reparacion">En Reparación</option>
                    <option value="de_baja">De Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Responsable / Custodio</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Ramos / Uso Común"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.assigned_to}
                    onChange={e => setForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Ubicación de Almacenamiento</label>
                  <input
                    type="text"
                    placeholder="Ej: Taller Mecánico - Estante B"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-2xl p-3 text-xs font-bold outline-none"
                    value={form.location}
                    onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
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
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-purple-100 text-xs"
                >
                  Guardar Herramienta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
