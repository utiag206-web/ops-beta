'use client'

import { useState, useEffect } from 'react'
import { 
  Wrench, Plus, Search, CheckCircle2, Clock, 
  DollarSign, X, Pencil, Trash2, Ban, ShieldAlert, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useRbac } from '@/components/providers/rbac-provider'
import { 
  createMaintenanceRecord, 
  updateMaintenanceRecord, 
  anularMaintenanceRecord, 
  reactivarMaintenanceRecord, 
  deleteMaintenanceRecord 
} from '@/app/(main)/mecanica/actions'

export interface MaintenanceItem {
  id: string
  equipment_name: string
  equipment_code: string
  maintenance_type: 'preventivo' | 'correctivo' | 'predictivo'
  description: string
  technician: string
  date: string
  hours_or_km: number
  status: 'completado' | 'en_progreso' | 'programado' | 'anulado' | 'archivado'
  cost?: number
  next_service?: string | null
  observations?: string | null
  equipment_type?: string
  equipment_asset_id?: string | null
  technician_worker_id?: string | null
  created_at?: string
  updated_at?: string
}

interface MaintenanceViewProps {
  title: string
  subtitle: string
  equipmentType: string
  defaultEquipmentName?: string
  defaultEquipmentCode?: string
  storageKey: string
  companyId?: string | null
  initialItems?: MaintenanceItem[]
  persistToServer?: boolean
}

export function MaintenanceView({
  title,
  subtitle,
  equipmentType,
  defaultEquipmentName = '',
  defaultEquipmentCode = '',
  storageKey,
  companyId = null,
  initialItems = [],
  persistToServer = false
}: MaintenanceViewProps) {
  const scopedKey = companyId ? `mecanica_${companyId}_${storageKey}` : `mecanica_${storageKey}`

  const { can } = useRbac()
  const canCreate = persistToServer ? can('mecanica', 'create') : true
  const canUpdate = persistToServer ? can('mecanica', 'update') : true
  const canDelete = persistToServer ? can('mecanica', 'delete') : true

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [items, setItems] = useState<MaintenanceItem[]>(() => {
    if (persistToServer) {
      return initialItems
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(scopedKey)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('[MECANICA_MAINTENANCE] Error parsing stored items:', e)
        }
      }
    }
    return initialItems.length > 0 ? initialItems : []
  })

  // Sincronizar si cambian initialItems desde el servidor
  useEffect(() => {
    if (persistToServer) {
      setItems(initialItems)
    }
  }, [initialItems, persistToServer])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MaintenanceItem | null>(null)

  // Diálogo de confirmación de eliminación física
  const [itemToDelete, setItemToDelete] = useState<MaintenanceItem | null>(null)

  const [form, setForm] = useState({
    equipment_name: defaultEquipmentName || '',
    equipment_code: defaultEquipmentCode || '',
    maintenance_type: 'preventivo' as 'preventivo' | 'correctivo' | 'predictivo',
    description: '',
    technician: '',
    date: new Date().toISOString().split('T')[0],
    hours_or_km: 0,
    status: 'completado' as 'completado' | 'en_progreso' | 'programado' | 'anulado' | 'archivado',
    cost: 0,
    next_service: ''
  })

  // Sincronizar persistencia local scoped por company_id (solo si no persiste en servidor para preservar datos)
  useEffect(() => {
    if (!persistToServer && typeof window !== 'undefined') {
      localStorage.setItem(scopedKey, JSON.stringify(items))
    }
  }, [items, scopedKey, persistToServer])

  // Abrir modal en modo creación
  const handleOpenCreate = () => {
    setEditingItem(null)
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
    setIsModalOpen(true)
  }

  // Abrir modal en modo edición
  const handleOpenEdit = (item: MaintenanceItem) => {
    setEditingItem(item)
    setForm({
      equipment_name: item.equipment_name,
      equipment_code: item.equipment_code,
      maintenance_type: item.maintenance_type,
      description: item.description,
      technician: item.technician,
      date: item.date,
      hours_or_km: item.hours_or_km || 0,
      status: item.status,
      cost: item.cost || 0,
      next_service: item.next_service || ''
    })
    setIsModalOpen(true)
  }

  // Guardar (Crear o Editar in-situ con soporte Servidor / Local)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description || !form.technician || !form.equipment_name) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    if (persistToServer) {
      setIsSubmitting(true)
      try {
        if (editingItem) {
          const res = await updateMaintenanceRecord(editingItem.id, {
            equipment_name: form.equipment_name,
            equipment_code: form.equipment_code.toUpperCase(),
            equipment_type: equipmentType,
            maintenance_type: form.maintenance_type,
            description: form.description,
            technician: form.technician,
            date: form.date,
            hours_or_km: form.hours_or_km,
            status: form.status,
            cost: form.cost,
            next_service: form.next_service || null
          })

          if (!res.success) {
            toast.error(res.error || 'Error al actualizar mantenimiento')
            return
          }

          setItems(prev => prev.map(item => item.id === editingItem.id ? (res.data as any) : item))
          toast.success('Mantenimiento actualizado exitosamente en servidor')
        } else {
          const res = await createMaintenanceRecord({
            equipment_name: form.equipment_name,
            equipment_code: form.equipment_code.toUpperCase(),
            equipment_type: equipmentType,
            maintenance_type: form.maintenance_type,
            description: form.description,
            technician: form.technician,
            date: form.date,
            hours_or_km: form.hours_or_km,
            status: form.status,
            cost: form.cost,
            next_service: form.next_service || null
          })

          if (!res.success) {
            toast.error(res.error || 'Error al registrar mantenimiento')
            return
          }

          setItems(prev => [res.data as any, ...prev])
          toast.success('Mantenimiento registrado con éxito en base de datos')
        }

        setIsModalOpen(false)
        setEditingItem(null)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // Modo local heredado (fallback para submódulos aún no conectados)
    if (editingItem) {
      setItems(prev => prev.map(item => item.id === editingItem.id ? {
        ...item,
        equipment_name: form.equipment_name,
        equipment_code: form.equipment_code.toUpperCase(),
        maintenance_type: form.maintenance_type,
        description: form.description,
        technician: form.technician,
        date: form.date,
        hours_or_km: form.hours_or_km,
        status: form.status,
        cost: form.cost,
        next_service: form.next_service
      } : item))
      toast.success('Registro de mantenimiento actualizado exitosamente')
    } else {
      const newItem: MaintenanceItem = {
        id: Date.now().toString(),
        equipment_name: form.equipment_name,
        equipment_code: form.equipment_code.toUpperCase(),
        maintenance_type: form.maintenance_type,
        description: form.description,
        technician: form.technician,
        date: form.date,
        hours_or_km: form.hours_or_km,
        status: form.status,
        cost: form.cost,
        next_service: form.next_service
      }
      setItems(prev => [newItem, ...prev])
      toast.success('Mantenimiento registrado con éxito')
    }

    setIsModalOpen(false)
    setEditingItem(null)
  }

  // Anular registro (preserva historial técnico)
  const handleAnular = async (id: string) => {
    if (persistToServer) {
      const res = await anularMaintenanceRecord(id)
      if (!res.success) {
        toast.error(res.error || 'Error al anular mantenimiento')
        return
      }
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'anulado' } : item))
      toast.info('Mantenimiento marcado como anulado (historial preservado en DB)')
      return
    }

    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'anulado' } : item))
    toast.info('Mantenimiento marcado como anulado (historial preservado)')
  }

  // Reactivar registro anulado
  const handleReactivar = async (id: string) => {
    if (persistToServer) {
      const res = await reactivarMaintenanceRecord(id)
      if (!res.success) {
        toast.error(res.error || 'Error al reactivar mantenimiento')
        return
      }
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'completado' } : item))
      toast.success('Mantenimiento reactivado a completado en servidor')
      return
    }

    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'completado' } : item))
    toast.success('Mantenimiento reactivado a completado')
  }

  // Confirmar eliminación física
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    if (persistToServer) {
      const res = await deleteMaintenanceRecord(itemToDelete.id)
      if (!res.success) {
        toast.error(res.error || 'Error al eliminar mantenimiento')
        return
      }
      setItems(prev => prev.filter(item => item.id !== itemToDelete.id))
      toast.success(`Mantenimiento [${itemToDelete.equipment_code}] eliminado permanentemente de DB`)
      setItemToDelete(null)
      return
    }

    setItems(prev => prev.filter(item => item.id !== itemToDelete.id))
    toast.success(`Mantenimiento [${itemToDelete.equipment_code}] eliminado permanentemente`)
    setItemToDelete(null)
  }

  const filteredItems = items.filter(item => {
    const matchSearch = 
      item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchType = 
      filterType === 'todos' 
        ? true 
        : filterType === 'anulado'
        ? item.status === 'anulado'
        : item.maintenance_type === filterType && item.status !== 'anulado'

    return matchSearch && matchType
  })

  // KPIs excluyendo registros anulados de los costos reales
  const activeItems = items.filter(i => i.status !== 'anulado')
  const totalCost = activeItems.reduce((acc, curr) => acc + (curr.cost || 0), 0)
  const completedCount = activeItems.filter(i => i.status === 'completado').length
  const pendingCount = activeItems.filter(i => i.status !== 'completado').length
  const anuladosCount = items.filter(i => i.status === 'anulado').length

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 bg-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
            <Wrench size={26} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        {canCreate && (
          <button 
            onClick={handleOpenCreate}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Registrar Mantenimiento</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wrench size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Total Órdenes</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{activeItems.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Completados</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{completedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">En Proceso / Pend.</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Costo Acumulado</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">S/ {totalCost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 bg-slate-50/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por equipo, placa, técnico o detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['todos', 'preventivo', 'correctivo', 'predictivo', 'anulado'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                  filterType === type 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {type === 'anulado' ? `Anulados (${anuladosCount})` : type}
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
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Equipo / Código</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Tipo</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Descripción de Trabajos</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Técnico Resp.</th>
                <th className="py-4 px-4 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Horóm./KM</th>
                <th className="py-4 px-4 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Costo</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Estado</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length > 0 ? filteredItems.map((item) => {
                const isAnulado = item.status === 'anulado'
                return (
                  <tr key={item.id} className={`transition-colors ${isAnulado ? 'bg-slate-50/70 opacity-65' : 'hover:bg-slate-50/50'}`}>
                    <td className="py-4 px-5 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-4 px-5">
                      <div>
                        <p className={`text-xs sm:text-sm font-black text-slate-800 ${isAnulado ? 'line-through text-slate-500' : ''}`}>
                          {item.equipment_name}
                        </p>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {item.equipment_code}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        item.maintenance_type === 'preventivo' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : item.maintenance_type === 'correctivo'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {item.maintenance_type}
                      </span>
                    </td>
                    <td className="py-4 px-5 max-w-xs">
                      <p className="text-xs font-semibold text-slate-600 leading-snug line-clamp-2">
                        {item.description}
                      </p>
                    </td>
                    <td className="py-4 px-5 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {item.technician}
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-bold text-slate-800">
                      {item.hours_or_km || 0}
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-black text-slate-700 whitespace-nowrap">
                      {item.cost ? `S/ ${item.cost.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        isAnulado
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : item.status === 'completado' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isAnulado ? '🚫 Anulado' : item.status === 'completado' ? '✅ Completado' : '⏳ ' + item.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botón Editar */}
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 cursor-pointer"
                            title="Editar registro (corregir digitación)"
                          >
                            <Pencil size={15} />
                          </button>
                        )}

                        {/* Botón Anular / Reactivar */}
                        {canUpdate && (!isAnulado ? (
                          <button
                            onClick={() => handleAnular(item.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-100 cursor-pointer"
                            title="Anular registro (preservar historial)"
                          >
                            <Ban size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivar(item.id)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100 cursor-pointer"
                            title="Reactivar registro"
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
                )
              }) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Wrench size={22} />
                      </div>
                      <p className="text-sm text-slate-600 font-semibold">No hay registros de mantenimiento para esta empresa.</p>
                      <button
                        onClick={handleOpenCreate}
                        className="mt-2 text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Registrar primer mantenimiento
                      </button>
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
                  {editingItem ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
                </h2>
                <p className="text-slate-400 text-xs font-bold tracking-tight">
                  {editingItem ? `Modificando registro [${editingItem.equipment_code}]` : 'Registro de orden de trabajo o intervención técnica.'}
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
                  <label className="text-[10px] font-black text-slate-400 uppercase">Nombre de Equipo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Camioneta, Compresora..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.equipment_name}
                    onChange={e => setForm(prev => ({ ...prev, equipment_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Código / Placa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: VH-01, EQ-01..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.equipment_code}
                    onChange={e => setForm(prev => ({ ...prev, equipment_code: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Mantenimiento</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.maintenance_type}
                    onChange={e => setForm(prev => ({ ...prev, maintenance_type: e.target.value as 'preventivo' | 'correctivo' | 'predictivo' }))}
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Horómetro / KM</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.cost || ''}
                    onChange={e => setForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Mecánico / Responsable Técnico *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Nombre del mecánico responsable"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                  value={form.technician}
                  onChange={e => setForm(prev => ({ ...prev, technician: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Descripción de los Trabajos *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detallar repuestos, cambio de fluidos, filtros o componentes reemplazados..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-medium outline-none resize-none"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Estado de la Orden</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value as 'completado' | 'en_progreso' | 'programado' | 'anulado' }))}
                  >
                    <option value="completado">Completado</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="programado">Programado</option>
                    <option value="anulado">Anulado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Próximo Servicio Recomendado</label>
                  <input
                    type="text"
                    placeholder="Ej: 3000 Horas / 30 días"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.next_service}
                    onChange={e => setForm(prev => ({ ...prev, next_service: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 text-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                  <span>{editingItem ? 'Guardar Cambios' : 'Registrar Mantenimiento'}</span>
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
              <p><span className="font-bold">Equipo:</span> {itemToDelete.equipment_name} ({itemToDelete.equipment_code})</p>
              <p><span className="font-bold">Fecha:</span> {itemToDelete.date}</p>
              <p><span className="font-bold">Técnico:</span> {itemToDelete.technician}</p>
              <p className="text-slate-500 truncate"><span className="font-bold">Detalle:</span> {itemToDelete.description}</p>
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
