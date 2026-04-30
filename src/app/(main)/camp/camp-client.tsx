'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bed, Plus, Users, Layout, Home, CheckCircle2, UserPlus, XCircle, AlertCircle } from 'lucide-react'
import { assignCampRoom, updateRoomAssignment, deleteCampRoom } from './actions'

interface Worker {
  id: string
  name: string
  last_name?: string
}

interface CampPageProps {
  initialRooms: any[]
  workers: Worker[]
  userRole: string
}

export default function CampClient({ initialRooms, workers, userRole }: CampPageProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    module: '',
    room_number: '',
    bed_number: '',
    worker_id: '' as string | null
  })

  const canManage = ['admin', 'gerente', 'operaciones'].includes(userRole)

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    try {
      if (editingId) {
        const result = await updateRoomAssignment(editingId, {
          ...formData,
          worker_id: formData.worker_id || null
        })
        if (result?.success === false) {
          setErrorMsg(result.error || 'Error al actualizar')
        } else {
          setEditingId(null)
          setShowForm(false)
          resetForm()
          router.refresh()
        }
      } else {
        const result = await assignCampRoom({
          ...formData,
          worker_id: formData.worker_id || null
        })
        if (result?.success === false) {
          setErrorMsg(result.error || 'Error al crear asignación')
        } else {
          setShowForm(false)
          resetForm()
          router.refresh()
        }
      }
    } catch (error: any) {
      setErrorMsg(error?.message || 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({ module: '', room_number: '', bed_number: '', worker_id: null })
  }

  const handleEdit = (room: any) => {
    setEditingId(room.id)
    setFormData({
      module: room.module,
      room_number: room.room_number,
      bed_number: room.bed_number,
      worker_id: room.worker_id
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿ELIMINAR esta habitación/cama permanentemente?')) {
      const result = await deleteCampRoom(id)
      if (result?.success === false) {
        alert(result.error || 'Error al eliminar')
      } else {
        router.refresh()
      }
    }
  }

  const handleRelease = async (id: string) => {
    if (confirm('¿Liberar esta cama?')) {
      const result = await updateRoomAssignment(id, { worker_id: null })
      if (result?.success === false) {
        alert(result.error || 'Error al liberar cama')
      } else {
        router.refresh()
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <Home size={28} />
            </div>
            Campamento y Alojamiento
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Gestión de módulos, habitaciones y asignación de camas.</p>
        </div>
        {canManage && (
          <button 
            onClick={() => {
              setEditingId(null)
              resetForm()
              setShowForm(!showForm)
            }}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Nueva Habitación / Cama</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-50 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              {editingId ? 'Editar Habitación' : 'Nueva Habitación'}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <XCircle size={20} className="text-slate-400" />
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-bold flex items-center gap-2">
              <AlertCircle size={18} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo</label>
              <input type="text" required placeholder="Ej. B-01" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
                value={formData.module} onChange={e => setFormData({...formData, module: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Habitación</label>
              <input type="text" required placeholder="Hab. 104" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
                value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cama</label>
              <input type="text" required placeholder="Cama A" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
                value={formData.bed_number} onChange={e => setFormData({...formData, bed_number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trabajador</label>
              <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
                value={formData.worker_id || ''} onChange={e => setFormData({...formData, worker_id: e.target.value || null})}>
                <option value="">Disponible / Libre</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name} {w.last_name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} className="bg-slate-900 text-white p-3.5 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 h-[52px]">
              {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Registrar')}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {initialRooms.map((room) => (
          <div key={room.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-full ${room.worker ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl ${room.worker ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <Bed size={24} />
              </div>
              
              <div className="flex gap-2">
                {canManage && (
                  <>
                    <button onClick={() => handleEdit(room)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <Layout size={18} />
                    </button>
                    <button onClick={() => handleDelete(room.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <XCircle size={18} />
                    </button>
                  </>
                )}
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                  room.worker ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                  {room.worker ? 'Ocupada' : 'Libre'}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Módulo</div>
                  <div className="text-xl font-black text-slate-800">{room.module}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Habitación</div>
                  <div className="text-xl font-black text-slate-800">{room.room_number || '—'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                  <Home size={20} />
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Cama Asignada</div>
                  <div className="text-lg font-black text-slate-800">{room.bed_number}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                {room.worker ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                        <Users size={18} />
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Huésped</div>
                        <div className="font-black text-slate-800 text-sm uppercase">
                          {Array.isArray(room.worker) 
                            ? room.worker[0]?.name 
                            : (room.worker?.name || 'Varios / Desconocido')}
                        </div>
                      </div>
                    </div>
                    {canManage && (
                      <button onClick={() => handleRelease(room.id)} className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-[9px] font-black uppercase rounded-lg transition-all shadow-md">
                        Liberar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-tight py-2">
                    <CheckCircle2 size={18} />
                    Disponible para asignar
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {initialRooms.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Bed size={40} />
             </div>
             <p className="text-slate-500 font-black text-xl">Sin habitaciones registradas</p>
             <p className="text-slate-400 font-medium text-sm mt-1">Haga clic en el botón superior para empezar la gestión.</p>
          </div>
        )}
      </div>
    </div>
  )
}
