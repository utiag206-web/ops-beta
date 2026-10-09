'use client'

import { useState, useEffect } from 'react'
import { 
  Fuel, Plus, Search, TrendingUp, Clock, X, BarChart3,
  Pencil, Trash2, Ban, CheckCircle2, ShieldAlert, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useOffline } from '@/components/providers/offline-provider'
import { addOperationToQueue, getPendingOperations } from '@/lib/offline-sync'
import { v4 as uuidv4 } from 'uuid'
import { useRbac } from '@/components/providers/rbac-provider'
import {
  FuelRecord,
  createFuelRecord,
  updateFuelRecord,
  anularFuelRecord,
  reactivarFuelRecord,
  deleteFuelRecord
} from '@/app/(main)/mecanica/actions'

export type { FuelRecord }

interface FuelViewProps {
  title: string
  subtitle: string
  defaultEquipmentName: string
  defaultEquipmentCode: string
  equipmentType?: string
  storageKey: string
  companyId?: string | null
  initialRecords?: FuelRecord[]
  persistToServer?: boolean
}

export function FuelView({
  title,
  subtitle,
  defaultEquipmentName,
  defaultEquipmentCode,
  equipmentType = 'generador',
  storageKey,
  companyId = null,
  initialRecords = [],
  persistToServer = false
}: FuelViewProps) {
  const scopedKey = companyId ? `fuel_${companyId}_${storageKey}` : `fuel_${storageKey}`

  const { can } = useRbac()
  const { isOnline, triggerSync } = useOffline()
  const canCreate = persistToServer ? can('mecanica', 'create') : true
  const canUpdate = persistToServer ? can('mecanica', 'update') : true
  const canDelete = persistToServer ? can('mecanica', 'delete') : true

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [records, setRecords] = useState<FuelRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(scopedKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch (e) {
          console.error('[MECANICA_FUEL] Error parsing stored records:', e)
        }
      }
    }
    return initialRecords?.length ? initialRecords : []
  })

  // Sincronizar si cambian initialRecords desde servidor y reanudar pendientes
  useEffect(() => {
    if (persistToServer && initialRecords && initialRecords.length > 0) {
      setRecords(initialRecords)
      if (typeof window !== 'undefined') {
        localStorage.setItem(scopedKey, JSON.stringify(initialRecords))
      }
    }
    const replayPending = async () => {
      try {
        const pending = await getPendingOperations()
        const fuelOps = pending.filter(p => p.entity === 'mecanica')
        if (fuelOps.length > 0) {
          setRecords(prev => {
            let updated = [...prev]
            for (const op of fuelOps) {
              if (op.action === 'create_fuel') {
                if (!updated.some(i => i.id === op.payload.id)) {
                  updated = [{ ...op.payload, isPending: true }, ...updated]
                }
              }
              if (op.action === 'update_fuel') {
                updated = updated.map(i => i.id === op.payload.id ? { ...i, ...op.payload.updates, isPending: true } : i)
              }
              if (op.action === 'anular_fuel') {
                updated = updated.map(i => i.id === op.payload.id ? { ...i, status: 'anulado', isPending: true } : i)
              }
            }
            return updated
          })
        }
      } catch (_) {}
    }
    replayPending()
  }, [initialRecords, persistToServer, scopedKey])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterTurn, setFilterTurn] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null)

  // Diálogo de confirmación de eliminación física
  const [recordToDelete, setRecordToDelete] = useState<FuelRecord | null>(null)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    gallons: 0,
    initial_hours: 0,
    final_hours: 0,
    operator: '',
    turn: 'dia' as 'dia' | 'noche',
    observation: ''
  })

  // Preservar localStorage: solo escribir si no está conectado a servidor
  useEffect(() => {
    if (!persistToServer && typeof window !== 'undefined') {
      localStorage.setItem(scopedKey, JSON.stringify(records))
    }
  }, [records, scopedKey, persistToServer])

  // Abrir modal en modo creación
  const handleOpenCreate = () => {
    setEditingRecord(null)
    setForm({
      date: new Date().toISOString().split('T')[0],
      gallons: 0,
      initial_hours: 0,
      final_hours: 0,
      operator: '',
      turn: 'dia',
      observation: ''
    })
    setIsModalOpen(true)
  }

  // Abrir modal en modo edición
  const handleOpenEdit = (record: FuelRecord) => {
    setEditingRecord(record)
    setForm({
      date: record.date,
      gallons: record.gallons,
      initial_hours: record.initial_hours,
      final_hours: record.final_hours,
      operator: record.operator,
      turn: record.turn,
      observation: record.observation || ''
    })
    setIsModalOpen(true)
  }

  // Guardar (Crear o Editar in-situ sin duplicar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.gallons <= 0 || !form.operator) {
      toast.error('Por favor ingresa los galones y el operador responsable')
      return
    }

    const hoursOp = form.final_hours >= form.initial_hours ? form.final_hours - form.initial_hours : 0
    const ratio = hoursOp > 0 ? Number((form.gallons / hoursOp).toFixed(2)) : 0

    if (persistToServer) {
      setIsSubmitting(true)
      try {
        if (editingRecord) {
          if (!isOnline) {
            const updatedRec = {
              ...editingRecord,
              date: form.date,
              gallons: Number(form.gallons),
              initial_hours: Number(form.initial_hours),
              final_hours: Number(form.final_hours),
              operator: form.operator,
              turn: form.turn,
              observation: form.observation || null,
              isPending: true
            }
            setRecords(prev => {
              const next = prev.map(r => r.id === editingRecord.id ? updatedRec : r)
              if (typeof window !== 'undefined') localStorage.setItem(scopedKey, JSON.stringify(next))
              return next
            })
            await addOperationToQueue({
              id: uuidv4(),
              entity: 'mecanica',
              action: 'update_fuel',
              payload: { id: editingRecord.id, updates: form },
              company_id: companyId || 'default'
            })
            toast.info('Sin conexión. Combustible actualizado localmente.')
            triggerSync()
            setIsModalOpen(false)
            setEditingRecord(null)
            return
          }

          const res = await updateFuelRecord(editingRecord.id, {
            date: form.date,
            gallons: Number(form.gallons),
            initial_hours: Number(form.initial_hours),
            final_hours: Number(form.final_hours),
            operator: form.operator,
            turn: form.turn,
            observation: form.observation || null
          })

          if (!res.success) {
            toast.error(res.error || 'Error al actualizar registro de combustible')
            return
          }

          setRecords(prev => {
            const next = prev.map(r => r.id === editingRecord.id ? (res.data as FuelRecord) : r)
            if (typeof window !== 'undefined') localStorage.setItem(scopedKey, JSON.stringify(next))
            return next
          })
          toast.success('Despacho de combustible actualizado con éxito en base de datos')
        } else {
          if (!isOnline) {
            const tempId = 'fuel-' + Date.now()
            const newRec = {
              id: tempId,
              equipment_name: defaultEquipmentName,
              equipment_code: defaultEquipmentCode,
              equipment_type: equipmentType,
              date: form.date,
              gallons: Number(form.gallons),
              initial_hours: Number(form.initial_hours),
              final_hours: Number(form.final_hours),
              hours_operated: hoursOp,
              ratio: ratio,
              operator: form.operator,
              turn: form.turn,
              observation: form.observation || null,
              created_at: new Date().toISOString(),
              isPending: true
            }
            setRecords(prev => {
              const next = [newRec as any, ...prev]
              if (typeof window !== 'undefined') localStorage.setItem(scopedKey, JSON.stringify(next))
              return next
            })
            await addOperationToQueue({
              id: uuidv4(),
              entity: 'mecanica',
              action: 'create_fuel',
              payload: { ...newRec, id: tempId },
              company_id: companyId || 'default'
            })
            toast.info('Sin conexión. Combustible registrado localmente.')
            triggerSync()
            setIsModalOpen(false)
            return
          }

          const res = await createFuelRecord({
            equipment_name: defaultEquipmentName,
            equipment_code: defaultEquipmentCode,
            equipment_type: equipmentType,
            date: form.date,
            gallons: Number(form.gallons),
            initial_hours: Number(form.initial_hours),
            final_hours: Number(form.final_hours),
            operator: form.operator,
            turn: form.turn,
            observation: form.observation || null
          })

          if (!res.success) {
            toast.error(res.error || 'Error al registrar combustible')
            return
          }

          setRecords(prev => {
            const next = [res.data as FuelRecord, ...prev]
            if (typeof window !== 'undefined') localStorage.setItem(scopedKey, JSON.stringify(next))
            return next
          })
          toast.success('Despacho de combustible registrado con éxito en base de datos')
        }

        setIsModalOpen(false)
        setEditingRecord(null)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // Modo local heredado
    if (editingRecord) {
      setRecords(prev => prev.map(r => r.id === editingRecord.id ? {
        ...r,
        date: form.date,
        gallons: Number(form.gallons),
        initial_hours: Number(form.initial_hours),
        final_hours: Number(form.final_hours),
        hours_operated: hoursOp,
        ratio,
        operator: form.operator,
        turn: form.turn,
        observation: form.observation
      } : r))
      toast.success('Despacho de combustible actualizado con éxito')
    } else {
      const newRecord: FuelRecord = {
        id: Date.now().toString(),
        equipment_name: defaultEquipmentName,
        equipment_code: defaultEquipmentCode,
        equipment_type: equipmentType,
        date: form.date,
        gallons: Number(form.gallons),
        initial_hours: Number(form.initial_hours),
        final_hours: Number(form.final_hours),
        hours_operated: hoursOp,
        ratio,
        operator: form.operator,
        turn: form.turn,
        status: 'activo',
        observation: form.observation
      }
      setRecords(prev => [newRecord, ...prev])
      toast.success('Despacho de combustible registrado con éxito')
    }

    setIsModalOpen(false)
    setEditingRecord(null)
  }

  // Anular registro (preserva auditoría sin sumar galones)
  const handleAnular = async (id: string) => {
    if (persistToServer) {
      const res = await anularFuelRecord(id)
      if (!res.success) {
        toast.error(res.error || 'Error al anular registro')
        return
      }
    }
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'anulado' } : r))
    toast.info('Registro de combustible marcado como anulado (no suma al consumo)')
  }

  // Reactivar registro anulado
  const handleReactivar = async (id: string) => {
    if (persistToServer) {
      const res = await reactivarFuelRecord(id)
      if (!res.success) {
        toast.error(res.error || 'Error al reactivar registro')
        return
      }
    }
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'activo' } : r))
    toast.success('Registro de combustible reactivado a activo')
  }

  // Confirmar eliminación física
  const handleConfirmDelete = async () => {
    if (!recordToDelete) return
    if (persistToServer) {
      const res = await deleteFuelRecord(recordToDelete.id)
      if (!res.success) {
        toast.error(res.error || 'Error al eliminar registro físicamente')
        return
      }
    }
    setRecords(prev => prev.filter(r => r.id !== recordToDelete.id))
    toast.success(`Despacho de combustible del ${recordToDelete.date} eliminado`)
    setRecordToDelete(null)
  }

  const filteredRecords = records.filter(r => {
    const matchSearch = 
      r.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.observation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.date.includes(searchTerm)
    
    const matchTurn = 
      filterTurn === 'todos' 
        ? true 
        : filterTurn === 'anulado'
        ? r.status === 'anulado'
        : r.turn === filterTurn && r.status !== 'anulado'

    return matchSearch && matchTurn
  })

  // KPIs excluyendo registros anulados
  const activeRecords = records.filter(r => r.status !== 'anulado')
  const totalGallons = activeRecords.reduce((acc, curr) => acc + curr.gallons, 0)
  const totalHours = activeRecords.reduce((acc, curr) => acc + curr.hours_operated, 0)
  const avgRatio = totalHours > 0 ? Number((totalGallons / totalHours).toFixed(2)) : 0
  const anuladosCount = records.filter(r => r.status === 'anulado').length

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 bg-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 text-amber-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
            <Fuel size={26} className="sm:w-8 sm:h-8" />
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
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100 active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Registrar Combustible</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Fuel size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Total Galones</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{totalGallons.toFixed(1)} <span className="text-xs font-normal text-slate-400">Gal</span></p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Horas Operadas</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span></p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Ratio Promedio</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{avgRatio} <span className="text-xs font-normal text-slate-400">Gal/h</span></p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <BarChart3 size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">Abastecimientos</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">{activeRecords.length}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Filter / Search Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 bg-slate-50/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por operador, fecha u observación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'dia', label: '☀️ Turno Día' },
              { id: 'noche', label: '🌙 Turno Noche' },
              { id: 'anulado', label: `Anulados (${anuladosCount})` }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterTurn(t.id)}
                className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterTurn === t.id 
                    ? 'bg-amber-500 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
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
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Galones</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Horóm. Inicial</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Horóm. Final</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Horas Operadas</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-center">Ratio</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Operador Resp.</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase">Observación</th>
                <th className="py-4 px-5 text-[10px] font-black tracking-wider text-slate-400 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length > 0 ? filteredRecords.map((r) => {
                const isAnulado = r.status === 'anulado'
                return (
                  <tr key={r.id} className={`transition-colors ${isAnulado ? 'bg-slate-50/70 opacity-65' : 'hover:bg-slate-50/50'}`}>
                    <td className="py-4 px-5 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        r.turn === 'dia' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {r.turn === 'dia' ? '☀️ Día' : '🌙 Noche'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`text-xs sm:text-sm font-black px-2.5 py-1 rounded-xl border ${
                        isAnulado
                          ? 'bg-slate-100 text-slate-500 border-slate-200 line-through'
                          : 'text-amber-600 bg-amber-50 border-amber-100'
                      }`}>
                        {r.gallons.toFixed(1)} Gal
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center text-xs font-bold text-slate-600">
                      {r.initial_hours.toFixed(1)}
                    </td>
                    <td className="py-4 px-5 text-center text-xs font-bold text-slate-600">
                      {r.final_hours.toFixed(1)}
                    </td>
                    <td className="py-4 px-5 text-center text-xs font-black text-slate-800">
                      {r.hours_operated.toFixed(1)} hrs
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        {r.ratio.toFixed(2)} Gal/h
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {r.operator}
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-500 max-w-xs truncate">
                      {r.observation || '—'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botón Editar */}
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-100 cursor-pointer"
                            title="Editar despacho (corregir galones/horas)"
                          >
                            <Pencil size={15} />
                          </button>
                        )}

                        {/* Botón Anular / Reactivar */}
                        {canUpdate && (!isAnulado ? (
                          <button
                            onClick={() => handleAnular(r.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                            title="Anular despacho (no suma a consumos)"
                          >
                            <Ban size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivar(r.id)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100 cursor-pointer"
                            title="Reactivar despacho"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        ))}

                        {/* Botón Eliminar Físico con confirmación */}
                        {canDelete && (
                          <button
                            onClick={() => setRecordToDelete(r)}
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
                  <td colSpan={10} className="py-16 text-center text-slate-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                        <Fuel size={22} />
                      </div>
                      <p className="text-sm text-slate-600 font-semibold">No hay registros de combustible para esta empresa.</p>
                      {canCreate && (
                        <button
                          onClick={handleOpenCreate}
                          className="mt-2 text-xs text-amber-600 font-bold hover:underline cursor-pointer"
                        >
                          Registrar primer despacho
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
                  {editingRecord ? 'Editar Despacho de Combustible' : 'Registro de Combustible'}
                </h2>
                <p className="text-slate-400 text-xs font-bold tracking-tight">
                  {defaultEquipmentName} ({defaultEquipmentCode})
                </p>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingRecord(null); }} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Fecha de Carga</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Turno</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.turn}
                    onChange={e => setForm(prev => ({ ...prev, turn: e.target.value as 'dia' | 'noche' }))}
                  >
                    <option value="dia">Turno Día (07:00 - 19:00)</option>
                    <option value="noche">Turno Noche (19:00 - 07:00)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-amber-700 uppercase">Cantidad de Galones Cargados (Gal) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="0.0"
                  className="w-full bg-amber-50/50 border border-amber-200 focus:border-amber-500 focus:bg-white rounded-xl p-3 text-sm font-black text-amber-800 outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    value={form.final_hours || ''}
                    onChange={e => setForm(prev => ({ ...prev, final_hours: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Operador / Despachador *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Nombre del operador responsable"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-2.5 text-xs font-bold outline-none"
                  value={form.operator}
                  onChange={e => setForm(prev => ({ ...prev, operator: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Observaciones Operativas</label>
                <textarea
                  rows={2}
                  placeholder="Nivel de carga, temperatura ambiente, anomalías observadas..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-2.5 text-xs font-medium outline-none resize-none"
                  value={form.observation}
                  onChange={e => setForm(prev => ({ ...prev, observation: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingRecord(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-100 text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    editingRecord ? 'Guardar Cambios' : 'Guardar Despacho'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación Física */}
      {recordToDelete && (
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
              <p><span className="font-bold">Fecha:</span> {recordToDelete.date}</p>
              <p><span className="font-bold">Galones:</span> {recordToDelete.gallons} Gal ({recordToDelete.turn === 'dia' ? 'Día' : 'Noche'})</p>
              <p><span className="font-bold">Operador:</span> {recordToDelete.operator}</p>
              <p><span className="font-bold">Horas Operadas:</span> {recordToDelete.hours_operated} hrs</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setRecordToDelete(null)}
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
