'use client'

import { useState, useEffect } from 'react'
import { 
  ClipboardCheck, Plus, Search, CheckCircle2, XCircle, 
  AlertCircle, X, Eye, Pencil, Trash2, Ban, ShieldAlert, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useRbac } from '@/components/providers/rbac-provider'
import {
  ChecklistRecord,
  createChecklistRecord,
  updateChecklistRecord,
  anularChecklistRecord,
  reactivarChecklistRecord,
  deleteChecklistRecord
} from '@/app/(main)/mecanica/actions'

export type ChecklistItem = ChecklistRecord

export const DEFAULT_CHECKS = [
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

interface ChecklistViewProps {
  companyId?: string | null
  initialItems?: ChecklistRecord[]
  persistToServer?: boolean
  equipmentType?: string
}

export function ChecklistView({
  companyId = null,
  initialItems = [],
  persistToServer = false,
  equipmentType = 'vehiculo'
}: ChecklistViewProps) {
  const scopedKey = companyId ? `checklists_${companyId}` : 'mecanica_checklists'

  const { can } = useRbac()
  const canCreate = persistToServer ? can('mecanica', 'create') : true
  const canUpdate = persistToServer ? can('mecanica', 'update') : true
  const canDelete = persistToServer ? can('mecanica', 'delete') : true

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [items, setItems] = useState<ChecklistItem[]>(() => {
    if (persistToServer) {
      return initialItems || []
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(scopedKey)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('[MECANICA_CHECKLISTS] Error parsing stored checklists:', e)
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
  const [filterStatus, setFilterStatus] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null)
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem | null>(null)

  // Diálogo de confirmación de eliminación física
  const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null)

  const [form, setForm] = useState({
    equipment_name: '',
    equipment_code: '',
    inspector: '',
    date: new Date().toISOString().split('T')[0],
    turn: 'dia' as 'dia' | 'noche',
    observations: '',
    checks: DEFAULT_CHECKS.map(name => ({ name, status: 'ok' as 'ok' | 'fail' | 'na' }))
  })

  // Preservar localStorage: solo escribir si no está conectado a servidor
  useEffect(() => {
    if (!persistToServer && typeof window !== 'undefined') {
      localStorage.setItem(scopedKey, JSON.stringify(items))
    }
  }, [items, scopedKey, persistToServer])

  const handleCheckToggle = (index: number, status: 'ok' | 'fail' | 'na') => {
    setForm(prev => {
      const newChecks = [...prev.checks]
      newChecks[index] = { ...newChecks[index], status }
      return { ...prev, checks: newChecks }
    })
  }

  // Abrir modal en modo creación
  const handleOpenCreate = () => {
    setEditingItem(null)
    setForm({
      equipment_name: '',
      equipment_code: '',
      inspector: '',
      date: new Date().toISOString().split('T')[0],
      turn: 'dia',
      observations: '',
      checks: DEFAULT_CHECKS.map(name => ({ name, status: 'ok' }))
    })
    setIsModalOpen(true)
  }

  // Abrir modal en modo edición
  const handleOpenEdit = (item: ChecklistItem) => {
    setEditingItem(item)
    setForm({
      equipment_name: item.equipment_name,
      equipment_code: item.equipment_code,
      inspector: item.inspector,
      date: item.date,
      turn: item.turn,
      observations: item.observations || '',
      checks: item.checks.length > 0 ? item.checks : DEFAULT_CHECKS.map(name => ({ name, status: 'ok' }))
    })
    setIsModalOpen(true)
  }

  // Guardar (Crear o Editar in-situ sin duplicar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.equipment_name || !form.equipment_code || !form.inspector) {
      toast.error('Completa los datos del equipo y del inspector')
      return
    }

    const fails = form.checks.filter(c => c.status === 'fail').length
    const calculatedStatus: 'aprobado' | 'observado' | 'rechazado' = 
      fails === 0 ? 'aprobado' : fails <= 2 ? 'observado' : 'rechazado'

    if (persistToServer) {
      setIsSubmitting(true)
      try {
        if (editingItem) {
          const res = await updateChecklistRecord(editingItem.id, {
            equipment_name: form.equipment_name,
            equipment_code: form.equipment_code.toUpperCase(),
            equipment_type: editingItem.equipment_type || equipmentType,
            inspector: form.inspector,
            date: form.date,
            turn: form.turn,
            status: editingItem.status === 'anulado' ? 'anulado' : calculatedStatus,
            checks: form.checks,
            observations: form.observations || null
          })

          if (!res.success) {
            toast.error(res.error || 'Error al actualizar checklist')
            return
          }

          setItems(prev => prev.map(item => item.id === editingItem.id ? (res.data as ChecklistItem) : item))
          toast.success('Checklist actualizado correctamente en base de datos')
        } else {
          const res = await createChecklistRecord({
            equipment_name: form.equipment_name,
            equipment_code: form.equipment_code.toUpperCase(),
            equipment_type: equipmentType,
            inspector: form.inspector,
            date: form.date,
            turn: form.turn,
            status: calculatedStatus,
            checks: form.checks,
            observations: form.observations || null
          })

          if (!res.success) {
            toast.error(res.error || 'Error al registrar checklist')
            return
          }

          setItems(prev => [res.data as ChecklistItem, ...prev])
          toast.success(`Checklist guardado con resultado: ${calculatedStatus.toUpperCase()}`)
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
        equipment_name: form.equipment_name,
        equipment_code: form.equipment_code.toUpperCase(),
        inspector: form.inspector,
        date: form.date,
        turn: form.turn,
        status: item.status === 'anulado' ? 'anulado' : calculatedStatus,
        checks: form.checks,
        observations: form.observations
      } : item))
      toast.success('Checklist actualizado correctamente')
    } else {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        equipment_name: form.equipment_name,
        equipment_code: form.equipment_code.toUpperCase(),
        equipment_type: equipmentType,
        inspector: form.inspector,
        date: form.date,
        turn: form.turn,
        status: calculatedStatus,
        checks: form.checks,
        observations: form.observations
      }
      setItems(prev => [newItem, ...prev])
      toast.success(`Checklist guardado con resultado: ${calculatedStatus.toUpperCase()}`)
    }

    setIsModalOpen(false)
    setEditingItem(null)
  }

  // Anular registro (preserva historial)
  const handleAnular = async (id: string) => {
    if (persistToServer) {
      const res = await anularChecklistRecord(id)
      if (!res.success) {
        toast.error(res.error || 'Error al anular checklist')
        return
      }
    }
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'anulado' } : item))
    toast.info('Checklist marcado como anulado (historial preservado)')
  }

  // Reactivar registro anulado
  const handleReactivar = async (item: ChecklistItem) => {
    if (persistToServer) {
      const res = await reactivarChecklistRecord(item.id)
      if (!res.success) {
        toast.error(res.error || 'Error al reactivar checklist')
        return
      }
    }
    const fails = item.checks.filter(c => c.status === 'fail').length
    const recStatus: 'aprobado' | 'observado' | 'rechazado' = 
      fails === 0 ? 'aprobado' : fails <= 2 ? 'observado' : 'rechazado'
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: recStatus } : i))
    toast.success('Checklist reactivado')
  }

  // Confirmar eliminación física
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    if (persistToServer) {
      const res = await deleteChecklistRecord(itemToDelete.id)
      if (!res.success) {
        toast.error(res.error || 'Error al eliminar checklist físicamente')
        return
      }
    }
    setItems(prev => prev.filter(i => i.id !== itemToDelete.id))
    toast.success(`Checklist [${itemToDelete.equipment_code} - ${itemToDelete.date}] eliminado`)
    setItemToDelete(null)
  }

  const filteredItems = items.filter(item => {
    const matchSearch = 
      item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.observations || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchStatus = 
      filterStatus === 'todos' 
        ? true 
        : filterStatus === 'anulado'
        ? item.status === 'anulado'
        : item.status === filterStatus

    return matchSearch && matchStatus
  })

  // KPIs
  const activeItems = items.filter(i => i.status !== 'anulado')
  const totalChecks = activeItems.length
  const aprobados = activeItems.filter(i => i.status === 'aprobado').length
  const observados = activeItems.filter(i => i.status === 'observado').length
  const rechazados = activeItems.filter(i => i.status === 'rechazado').length
  const anuladosCount = items.filter(i => i.status === 'anulado').length

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 bg-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-100 text-teal-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
            <ClipboardCheck size={26} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Checklists Pre-Operacionales
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
              Inspecciones diarias obligatorias de 10 puntos críticos antes del inicio de turno de cada equipo.
            </p>
          </div>
        </div>

        {canCreate && (
          <button 
            onClick={handleOpenCreate}
            className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-100 active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Nuevo Checklist</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ClipboardCheck size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Total Inspecciones</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{totalChecks}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Aptos / Operativos</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{aprobados}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Observados</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{observados}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Rechazados</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{rechazados}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Search & Status Filter */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 bg-slate-50/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por equipo, placa, inspector u observaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'aprobado', label: '✅ Apto' },
              { id: 'observado', label: '⚠️ Observado' },
              { id: 'rechazado', label: '⛔ Rechazado' },
              { id: 'anulado', label: `Anulados (${anuladosCount})` }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterStatus === s.id 
                    ? 'bg-teal-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Fecha</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Turno</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Equipo Inspeccionado</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Inspector / Operador</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Puntos OK</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Resultado</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Observaciones</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length > 0 ? filteredItems.map((item) => {
                const okCount = item.checks.filter(c => c.status === 'ok').length
                const isAnulado = item.status === 'anulado'
                return (
                  <tr key={item.id} className={`transition-colors ${isAnulado ? 'bg-slate-50/70 opacity-65' : 'hover:bg-slate-50/50'}`}>
                    <td className="py-4 px-5 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {item.turn}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div>
                        <p className={`text-xs sm:text-sm font-black text-slate-800 ${isAnulado ? 'line-through text-slate-500' : ''}`}>
                          {item.equipment_name}
                        </p>
                        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {item.equipment_code}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {item.inspector}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-xs font-bold text-slate-600">
                        {okCount} / {item.checks.length}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                        isAnulado
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : item.status === 'aprobado' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : item.status === 'observado'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {isAnulado ? '🚫 Anulado' : item.status === 'aprobado' ? '✅ Apto' : item.status === 'observado' ? '⚠️ Observado' : '⛔ Rechazado'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-500 max-w-xs truncate">
                      {item.observations || 'Sin observaciones'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver Detalle */}
                        <button 
                          onClick={() => setSelectedChecklist(item)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all border border-transparent hover:border-teal-100 cursor-pointer"
                          title="Ver Detalle de Inspección"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Editar */}
                        {canUpdate && (
                          <button 
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 cursor-pointer"
                            title="Editar checklist (corregir datos)"
                          >
                            <Pencil size={15} />
                          </button>
                        )}

                        {/* Anular / Reactivar */}
                        {canUpdate && (!isAnulado ? (
                          <button 
                            onClick={() => handleAnular(item.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-100 cursor-pointer"
                            title="Anular checklist (preservar historial)"
                          >
                            <Ban size={15} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleReactivar(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100 cursor-pointer"
                            title="Reactivar checklist"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        ))}

                        {/* Eliminar Físico con confirmación */}
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
                )
              }) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                        <ClipboardCheck size={22} />
                      </div>
                      <p className="text-sm text-slate-600 font-semibold">No hay checklists registrados para esta empresa.</p>
                      {canCreate && (
                        <button
                          onClick={handleOpenCreate}
                          className="mt-2 text-xs text-teal-600 font-bold hover:underline cursor-pointer"
                        >
                          Registrar primer checklist
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
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {editingItem ? 'Editar Checklist Pre-Operacional' : 'Nuevo Checklist Pre-Operacional'}
                </h2>
                <p className="text-slate-400 text-xs font-bold tracking-tight">
                  {editingItem ? `Modificando inspección de [${editingItem.equipment_code}]` : 'Inspección de 10 puntos críticos de seguridad.'}
                </p>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingItem(null); }} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-4 sm:space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Equipo / Vehículo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Camioneta, Tractor, Generador..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.equipment_name}
                    onChange={e => setForm(prev => ({ ...prev, equipment_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Código / Placa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: VH-01, SC-02..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.equipment_code}
                    onChange={e => setForm(prev => ({ ...prev, equipment_code: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Inspector / Operador *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.inspector}
                    onChange={e => setForm(prev => ({ ...prev, inspector: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Fecha</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Turno</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.turn}
                    onChange={e => setForm(prev => ({ ...prev, turn: e.target.value as 'dia' | 'noche' }))}
                  >
                    <option value="dia">Turno Día</option>
                    <option value="noche">Turno Noche</option>
                  </select>
                </div>
              </div>

              {/* Puntos de Inspección */}
              <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Puntos de Inspección (10 Puntos Críticos)</p>
                <div className="space-y-1.5">
                  {form.checks.map((check, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 gap-3">
                      <span className="text-xs font-bold text-slate-700">{idx + 1}. {check.name}</span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCheckToggle(idx, 'ok')}
                          className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
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
                          className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
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
                          className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl p-2.5 text-xs font-medium outline-none resize-none"
                  value={form.observations}
                  onChange={e => setForm(prev => ({ ...prev, observations: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
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
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-100 text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    editingItem ? 'Guardar Cambios' : 'Guardar Checklist'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Checklist (Ver) */}
      {selectedChecklist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Detalle de Inspección</h2>
                <p className="text-slate-400 text-xs font-bold tracking-tight">{selectedChecklist.equipment_name} ({selectedChecklist.equipment_code})</p>
              </div>
              <button 
                onClick={() => setSelectedChecklist(null)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium">Inspector:</span>
                  <p className="font-bold text-slate-800">{selectedChecklist.inspector}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Fecha y Turno:</span>
                  <p className="font-bold text-slate-800">{selectedChecklist.date} ({selectedChecklist.turn.toUpperCase()})</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-slate-700 uppercase">Resultado de Puntos Evaluados</p>
                <div className="space-y-1.5">
                  {selectedChecklist.checks.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                      <span className="font-medium text-slate-700">{i + 1}. {c.name}</span>
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
              <p><span className="font-bold">Equipo:</span> {itemToDelete.equipment_name} ({itemToDelete.equipment_code})</p>
              <p><span className="font-bold">Fecha:</span> {itemToDelete.date}</p>
              <p><span className="font-bold">Inspector:</span> {itemToDelete.inspector}</p>
              <p><span className="font-bold">Estado:</span> {itemToDelete.status.toUpperCase()}</p>
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
