'use client'

import { useState, useEffect } from 'react'
import { 
  Hammer, Plus, Search, CheckCircle2, AlertTriangle, 
  Trash2, X, Pencil, ShieldAlert, Ban, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useRbac } from '@/components/providers/rbac-provider'
import {
  ToolRecord,
  createToolRecord,
  updateToolRecord,
  anularToolRecord,
  reactivarToolRecord,
  deleteToolRecord
} from '@/app/(main)/mecanica/actions'

export type ToolItem = ToolRecord

interface ToolsViewProps {
  companyId?: string | null
  initialItems?: ToolRecord[]
  persistToServer?: boolean
}

export function ToolsView({
  companyId = null,
  initialItems = [],
  persistToServer = false
}: ToolsViewProps) {
  const scopedKey = companyId ? `tools_${companyId}` : 'mecanica_tools'

  const { can } = useRbac()
  const canCreate = persistToServer ? can('mecanica', 'create') : true
  const canUpdate = persistToServer ? can('mecanica', 'update') : true
  const canDelete = persistToServer ? can('mecanica', 'delete') : true

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [items, setItems] = useState<ToolItem[]>(() => {
    if (persistToServer) {
      return initialItems || []
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(scopedKey)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('[MECANICA_TOOLS] Error parsing stored tools:', e)
        }
      }
    }
    return initialItems?.length ? initialItems : []
  })

  // Sincronizar si cambian initialItems desde servidor
  useEffect(() => {
    if (persistToServer) {
      setItems(initialItems || [])
    }
  }, [initialItems, persistToServer])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCondition, setFilterCondition] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ToolItem | null>(null)

  // Diálogo de confirmación de eliminación física
  const [itemToDelete, setItemToDelete] = useState<ToolItem | null>(null)

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

  // Preservar localStorage: solo escribir si no está conectado a servidor
  useEffect(() => {
    if (!persistToServer && typeof window !== 'undefined') {
      localStorage.setItem(scopedKey, JSON.stringify(items))
    }
  }, [items, scopedKey, persistToServer])

  // Abrir modal en modo creación
  const handleOpenCreate = () => {
    setEditingItem(null)
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
    setIsModalOpen(true)
  }

  // Abrir modal en modo edición
  const handleOpenEdit = (item: ToolItem) => {
    setEditingItem(item)
    setForm({
      code: item.code,
      name: item.name,
      category: item.category,
      brand: item.brand || '',
      condition: item.condition,
      assigned_to: item.assigned_to || '',
      location: item.location,
      last_inspection_date: item.last_inspection_date || new Date().toISOString().split('T')[0]
    })
    setIsModalOpen(true)
  }

  // Guardar (Crear o Editar in-situ sin duplicar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.code) {
      toast.error('Completa el código y nombre de la herramienta')
      return
    }

    if (persistToServer) {
      setIsSubmitting(true)
      try {
        if (editingItem) {
          const res = await updateToolRecord(editingItem.id, {
            code: form.code.toUpperCase(),
            name: form.name.trim(),
            category: form.category,
            brand: form.brand?.trim() || null,
            condition: form.condition,
            assigned_to: form.assigned_to?.trim() || null,
            location: form.location?.trim() || 'Taller',
            last_inspection_date: form.last_inspection_date || null
          })

          if (!res.success) {
            toast.error(res.error || 'Error al actualizar herramienta')
            return
          }

          setItems(prev => prev.map(item => item.id === editingItem.id ? (res.data as ToolItem) : item))
          toast.success('Herramienta actualizada con éxito en base de datos')
        } else {
          const res = await createToolRecord({
            code: form.code.toUpperCase(),
            name: form.name.trim(),
            category: form.category,
            brand: form.brand?.trim() || null,
            condition: form.condition,
            assigned_to: form.assigned_to?.trim() || null,
            location: form.location?.trim() || 'Taller',
            last_inspection_date: form.last_inspection_date || null
          })

          if (!res.success) {
            toast.error(res.error || 'Error al registrar herramienta')
            return
          }

          setItems(prev => [res.data as ToolItem, ...prev])
          toast.success('Herramienta registrada con éxito en base de datos')
        }

        setIsModalOpen(false)
        setEditingItem(null)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // Modo local heredado
    if (editingItem) {
      setItems(prev => prev.map(item => item.id === editingItem.id ? {
        ...item,
        code: form.code.toUpperCase(),
        name: form.name,
        category: form.category,
        brand: form.brand || 'Genérica',
        condition: form.condition,
        assigned_to: form.assigned_to || 'Taller Central',
        location: form.location || 'Taller de Mecánica',
        last_inspection_date: form.last_inspection_date
      } : item))
      toast.success('Herramienta actualizada con éxito')
    } else {
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
    }

    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleStatusChange = async (id: string, newCondition: 'operativo' | 'en_reparacion' | 'de_baja') => {
    if (persistToServer) {
      const res = await updateToolRecord(id, { condition: newCondition })
      if (!res.success) {
        toast.error(res.error || 'Error al actualizar condición')
        return
      }
    }
    setItems(prev => prev.map(item => item.id === id ? { ...item, condition: newCondition } : item))
    toast.success('Estado de herramienta actualizado')
  }

  const handleAnular = async (id: string) => {
    if (persistToServer) {
      const res = await anularToolRecord(id)
      if (!res.success) {
        toast.error(res.error || 'Error al anular herramienta')
        return
      }
    }
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'anulado' } : item))
    toast.info('Herramienta marcada como anulada (historial preservado)')
  }

  const handleReactivar = async (id: string) => {
    if (persistToServer) {
      const res = await reactivarToolRecord(id)
      if (!res.success) {
        toast.error(res.error || 'Error al reactivar herramienta')
        return
      }
    }
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'activo' } : item))
    toast.success('Herramienta reactivada a activa')
  }

  // Confirmar eliminación física
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    if (persistToServer) {
      const res = await deleteToolRecord(itemToDelete.id)
      if (!res.success) {
        toast.error(res.error || 'Error al eliminar herramienta físicamente')
        return
      }
    }
    setItems(prev => prev.filter(item => item.id !== itemToDelete.id))
    toast.success(`Herramienta [${itemToDelete.code}] eliminada permanentemente`)
    setItemToDelete(null)
  }

  const filteredItems = items.filter(item => {
    const matchSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.assigned_to || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchCondition = filterCondition === 'todos' || item.condition === filterCondition
    return matchSearch && matchCondition
  })

  const operativos = items.filter(i => i.condition === 'operativo').length
  const enReparacion = items.filter(i => i.condition === 'en_reparacion').length
  const deBaja = items.filter(i => i.condition === 'de_baja').length

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 bg-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 text-purple-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
            <Hammer size={26} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Control de Herramientas y Equipos Menores
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
              Inventario de taller, estado de operatividad, asignaciones y custodia.
            </p>
          </div>
        </div>

        {canCreate && (
          <button 
            onClick={handleOpenCreate}
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100 active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Registrar Herramienta</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Hammer size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Total Herramientas</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{items.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Operativas</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{operativos}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">En Reparación</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{enReparacion}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Dadas de Baja</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{deBaja}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Search & Condition Filter */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 bg-slate-50/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por código, nombre, marca o custodio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'operativo', label: '✅ Operativo' },
              { id: 'en_reparacion', label: '⏳ En Reparación' },
              { id: 'de_baja', label: '⛔ De Baja' }
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCondition(c.id)}
                className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterCondition === c.id 
                    ? 'bg-purple-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Código</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Herramienta / Equipo</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Categoría</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Marca</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Custodio / Resp.</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Ubicación</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Estado</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length > 0 ? filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-5 text-xs font-black text-purple-700 whitespace-nowrap">
                    <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {item.code}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <p className="text-xs sm:text-sm font-black text-slate-800">{item.name}</p>
                    <span className="text-[10px] text-slate-400">Última insp: {item.last_inspection_date}</span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-xs font-bold text-slate-700">
                    {item.brand || '—'}
                  </td>
                  <td className="py-4 px-5 text-xs font-bold text-slate-700 whitespace-nowrap">
                    {item.assigned_to || 'Taller Central'}
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-600">
                    {item.location}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                      item.condition === 'operativo' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : item.condition === 'en_reparacion'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {item.condition === 'operativo' ? '✅ Operativo' : item.condition === 'en_reparacion' ? '⏳ En Reparación' : '⛔ De Baja'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Botón Editar */}
                      {canUpdate && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all border border-transparent hover:border-purple-100 cursor-pointer"
                          title="Editar herramienta"
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      {/* Cambio rápido de estado */}
                      {canUpdate && item.condition !== 'operativo' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'operativo')}
                          className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-emerald-100 cursor-pointer"
                          title="Marcar como Operativo"
                        >
                          Operativo
                        </button>
                      )}
                      {canUpdate && item.condition !== 'en_reparacion' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'en_reparacion')}
                          className="px-2 py-1 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-amber-100 cursor-pointer"
                          title="Enviar a Reparación"
                        >
                          Reparar
                        </button>
                      )}
                      {canUpdate && item.condition !== 'de_baja' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'de_baja')}
                          className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-rose-100 cursor-pointer"
                          title="Dar de Baja"
                        >
                          De Baja
                        </button>
                      )}

                      {/* Botón Anular / Reactivar */}
                      {canUpdate && (item.status !== 'anulado' ? (
                        <button
                          onClick={() => handleAnular(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                          title="Anular herramienta (preservar historial)"
                        >
                          <Ban size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivar(item.id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100 cursor-pointer"
                          title="Reactivar herramienta"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      ))}

                      {/* Botón Eliminar Físico con confirmación */}
                      {canDelete && (
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <Hammer size={22} />
                      </div>
                      <p className="text-sm text-slate-600 font-semibold">No hay herramientas registradas para esta empresa.</p>
                      {canCreate && (
                        <button
                          onClick={handleOpenCreate}
                          className="mt-2 text-xs text-purple-600 font-bold hover:underline cursor-pointer"
                        >
                          Registrar primera herramienta
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CREAR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {editingItem ? 'Editar Herramienta' : 'Registrar Herramienta'}
                </h2>
                <p className="text-slate-400 text-xs font-bold tracking-tight">
                  {editingItem ? `Modificando herramienta [${editingItem.code}]` : 'Incorporación al inventario técnico de taller.'}
                </p>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingItem(null); }} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Código Único *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: HERR-001"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.code}
                    onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Categoría</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Eléctrica">Eléctrica</option>
                    <option value="Manual">Manual</option>
                    <option value="Hidráulica">Hidráulica</option>
                    <option value="Neumática">Neumática</option>
                    <option value="Medición">Medición / Diagnóstico</option>
                    <option value="Seguridad">Seguridad / Bloqueo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Descripción / Nombre de la Herramienta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Amoladora Angular 7 pulg, Llave de Impacto..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Marca / Fabricante</label>
                  <input
                    type="text"
                    placeholder="Ej: Bosch, DeWalt, Stanley..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.brand}
                    onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Estado Inicial</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.condition}
                    onChange={e => setForm(prev => ({ ...prev, condition: e.target.value as 'operativo' | 'en_reparacion' | 'de_baja' }))}
                  >
                    <option value="operativo">Operativo</option>
                    <option value="en_reparacion">En Reparación</option>
                    <option value="de_baja">De Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Custodio / Asignado a</label>
                  <input
                    type="text"
                    placeholder="Ej: Taller Central, Juan Pérez..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.assigned_to}
                    onChange={e => setForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Ubicación Física</label>
                  <input
                    type="text"
                    placeholder="Ej: Estante A, Maletín #2..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.location}
                    onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Fecha de Inspección</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                  value={form.last_inspection_date}
                  onChange={e => setForm(prev => ({ ...prev, last_inspection_date: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-100 text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    editingItem ? 'Guardar Cambios' : 'Registrar Herramienta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación Física */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmar Eliminación</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-700 border border-slate-100">
              <p><span className="font-bold">Código:</span> {itemToDelete.code}</p>
              <p><span className="font-bold">Herramienta:</span> {itemToDelete.name}</p>
              <p><span className="font-bold">Marca:</span> {itemToDelete.brand || '—'}</p>
              <p><span className="font-bold">Custodio:</span> {itemToDelete.assigned_to || 'Taller Central'}</p>
              <p><span className="font-bold">Ubicación:</span> {itemToDelete.location}</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
