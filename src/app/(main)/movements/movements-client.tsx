'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Ship, Plus, ArrowUpRight, ArrowDownRight, 
  History, User, MoreVertical, Pencil, 
  Trash2, X, Calendar, MapPin, 
  MessageSquare, Loader2, AlertCircle
} from 'lucide-react'
import { registerMovement, updateMovement, deleteMovement } from './actions'
import { toast } from 'sonner'

interface Worker {
  id: string
  name: string
  last_name?: string
}

interface MovementsPageProps {
  initialMovements: any[]
  workers: Worker[]
  userRole: string
}

export default function MovementsClient({ initialMovements, workers, userRole }: MovementsPageProps) {
  const router = useRouter()
  const [hasMounted, setHasMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)


  // Helper para obtener la fecha local en formato YYYY-MM-DDTHH:mm
  const getLocalISOString = (date: Date = new Date()) => {
    const tzOffset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
  }

  const [formData, setFormData] = useState({
    worker_id: '',
    type: 'subida' as 'subida' | 'bajada',
    date: '',
    location: '',
    observations: ''
  })

  useEffect(() => {
    setHasMounted(true)
    setFormData(prev => ({ ...prev, date: getLocalISOString() }))
  }, [])

  const openEdit = (item: any) => {
    setEditingItem(item)
    const opDate = item.subida_date || item.bajada_date
    setFormData({
      worker_id: item.worker_id,
      type: item.subida_date ? 'subida' : 'bajada',
      date: getLocalISOString(new Date(opDate)),
      location: item.location || '',
      observations: item.observations || ''
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({
      worker_id: '',
      type: 'subida',
      date: getLocalISOString(),
      location: '',
      observations: ''
    })
    setErrorMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    try {
      // Convertir la fecha local del input a ISO real antes de enviar
      const submissionData = {
        ...formData,
        date: new Date(formData.date).toISOString()
      }

      let result
      if (editingItem) {
        result = await updateMovement(editingItem.id, submissionData)
      } else {
        result = await registerMovement(submissionData)
      }

      if (result?.success) {
        toast.success(editingItem ? 'Movimiento actualizado' : 'Movimiento registrado')
        closeModal()
        router.refresh()
      } else {
        setErrorMsg(result?.error || 'Ocurrió un error')
      }
    } catch (error: any) {
      setErrorMsg(error?.message || 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro logístico? Esta acción no se puede deshacer.')) return
    
    try {
      const result = await deleteMovement(id)
      if (result.success) {
        toast.success('Registro eliminado')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error: any) {
      toast.error('Error al eliminar')
    }
  }

  const isManager = !!(userRole && !['trabajador', 'worker'].includes(userRole.toLowerCase()))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <Ship size={28} />
            </div>
            Gestión de Personal
          </h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px] opacity-70">Control de Subidas y Bajadas de Mina</p>
        </div>
        {isManager && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            Nuevo Registro
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-blue-500" />
            <h2 className="font-black text-slate-700 uppercase tracking-widest text-xs">Historial Logístico Operativo</h2>
          </div>
          <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black">
            {initialMovements.length} REGISTROS
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trabajador</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Movimiento</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Operativa</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {initialMovements.map((item) => {
                const isSubida = item.subida_date !== null
                const opDate = item.subida_date || item.bajada_date
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <User size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 leading-tight">{item.worker?.name || 'N/A'}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Personal</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-300" />
                        <span className="font-bold text-slate-700 text-sm">{item.location || '-'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className={`flex items-center gap-2 font-bold text-xs ${isSubida ? 'text-blue-600' : 'text-slate-600'}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSubida ? 'bg-blue-50' : 'bg-slate-100'}`}>
                          {isSubida ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        {isSubida ? 'SUBIDA' : 'BAJADA'}
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-sm">
                          {opDate ? new Date(opDate).toLocaleString('es-PE', { hour12: true }) : 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">Fecha Real</span>
                      </div>
                    </td>
                    <td className="px-10 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        item.status === 'En mina' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : 'bg-slate-50 text-slate-600 border border-slate-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'En mina' ? 'bg-blue-500' : 'bg-slate-400'} animate-pulse`} />
                        {item.status || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-10 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEdit(item)}
                          className="p-2.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                          title="Editar Registro"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                          title="Eliminar Registro"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {initialMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <History size={32} />
                      </div>
                      <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Sin registros operativos</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE REGISTRO / EDICIÓN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  {editingItem ? <Pencil size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editingItem ? 'Editar Registro Logístico' : 'Nuevo Registro de Movimiento'}
                  </h3>
                  <p className="text-slate-500 font-medium text-sm">Ingresa los datos reales del operativo.</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-3">
                  <AlertCircle size={20} />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <User size={12} /> Trabajador
                  </label>
                  <select 
                    required
                    disabled={!!editingItem}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-blue-600 transition-all disabled:opacity-60"
                    value={formData.worker_id}
                    onChange={e => setFormData({...formData, worker_id: e.target.value})}
                  >
                    <option value="">Seleccionar trabajador...</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name} {w.last_name || ''}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Ship size={12} /> Tipo de Movimiento
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, type: 'subida'})}
                      className={`py-4 rounded-2xl font-black text-xs transition-all border-2 ${
                        formData.type === 'subida' 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      SUBIDA
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, type: 'bajada'})}
                      className={`py-4 rounded-2xl font-black text-xs transition-all border-2 ${
                        formData.type === 'bajada' 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      BAJADA
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Calendar size={12} /> Fecha / Hora Operativa
                  </label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-blue-600 transition-all"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MapPin size={12} /> Ubicación / Proyecto
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: Campamento Central"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-blue-600 transition-all"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MessageSquare size={12} /> Observaciones Logísticas
                </label>
                <textarea 
                  placeholder="Detalles adicionales del movimiento..."
                  rows={3}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 font-bold outline-none focus:border-blue-600 transition-all resize-none"
                  value={formData.observations}
                  onChange={e => setFormData({...formData, observations: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-[1.5rem] font-black text-sm hover:bg-slate-200 transition-all uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-[2] bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : null}
                  {editingItem ? 'Actualizar Registro' : 'Confirmar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
