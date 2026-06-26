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
 userArea?: string | null
}

export default function CampClient({ initialRooms, workers, userRole, userArea }: CampPageProps) {
 const router = useRouter()
 const [showForm, setShowForm] = useState(false)
 const [saving, setSaving] = useState(false)
 const [editingId, setEditingId] = useState<string | null>(null)
 const [errorMsg, setErrorMsg] = useState<string | null>(null)
 const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
 const [formData, setFormData] = useState({
 module: '',
 room_number: '',
 bed_number: '',
 worker_id: '' as string | null
 })

 const canManage = ['admin', 'gerente', 'operaciones', 'super_admin', 'superadmin'].includes(userRole) || 
 (userRole === 'jefe_area' && userArea === 'Operaciones')

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
 setFormData(prev => ({ ...prev, module: '', room_number: '', bed_number: '', worker_id: null }))
 }

 const handleEdit = (room: any) => {
 setEditingId(room.id)
 setFormData(prev => ({
 ...prev,
 module: room.module,
 room_number: room.room_number,
 bed_number: room.bed_number,
 worker_id: room.worker_id
 }))
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
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-50">
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-left w-full md:w-auto">
 <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
 <Home size={24} className="sm:w-8 sm:h-8" />
 </div>
 <div>
 <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
 Campamento y Alojamiento
 </h1>
 <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">Gestión de módulos, habitaciones y asignación de camas.</p>
 </div>
 </div>
 {canManage && (
 <button 
 onClick={() => {
 setEditingId(null)
 resetForm()
 setShowForm(!showForm)
 }}
 className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl sm:rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100 active:scale-95 text-xs sm:text-base"
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
 <label className="text-[10px] font-black text-slate-400 tracking-tight ml-1">Módulo</label>
 <input type="text" required placeholder="Ej. B-01" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
 value={formData.module} onChange={e => setFormData(prev => ({...prev, module: e.target.value}))} />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-slate-400 tracking-tight ml-1">Habitación</label>
 <input type="text" required placeholder="Hab. 104" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
 value={formData.room_number} onChange={e => setFormData(prev => ({...prev, room_number: e.target.value}))} />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-slate-400 tracking-tight ml-1">Cama</label>
 <input type="text" required placeholder="Cama A" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
 value={formData.bed_number} onChange={e => setFormData(prev => ({...prev, bed_number: e.target.value}))} />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-slate-400 tracking-tight ml-1">Trabajador</label>
 <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
 value={formData.worker_id || ''} onChange={e => setFormData(prev => ({...prev, worker_id: e.target.value || null}))}>
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
 <div key={room.id} onClick={() => setSelectedRoom(room)} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden cursor-pointer text-left">
 <div className={`absolute top-0 left-0 w-2 h-full ${room.worker ? 'bg-amber-400' : 'bg-emerald-400'}`} />
 
 <div className="flex justify-between items-start mb-6">
 <div className={`p-3 rounded-2xl ${room.worker ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
 <Bed size={24} />
 </div>
 
 <div className="flex gap-2">
 {canManage && (
 <>
 <button onClick={(e) => { e.stopPropagation(); handleEdit(room); }} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
 <Layout size={18} />
 </button>
 <button onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
 <XCircle size={18} />
 </button>
 </>
 )}
 <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-sm border ${
 room.worker ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
 }`}>
 {room.worker ? 'Ocupada' : 'Libre'}
 </div>
 </div>
 </div>

 <div className="space-y-5">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <div className="text-[10px] font-black text-slate-400 tracking-tight leading-none">Módulo</div>
 <div className="text-xl font-black text-slate-800">{room.module}</div>
 </div>
 <div className="space-y-1">
 <div className="text-[10px] font-black text-slate-400 tracking-tight leading-none">Habitación</div>
 <div className="text-xl font-black text-slate-800">{room.room_number || '—'}</div>
 </div>
 </div>

 <div className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
 <Home size={20} />
 </div>
 <div>
 <div className="text-[9px] font-black text-slate-400 tracking-tight leading-none">Cama Asignada</div>
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
 <div className="text-[9px] font-black text-slate-400 tracking-tight leading-none">Huésped</div>
 <div className="font-black text-slate-800 text-sm">
 {Array.isArray(room.worker) 
 ? room.worker[0]?.name 
 : (room.worker?.name || 'Varios / Desconocido')}
 </div>
 </div>
 </div>
 {canManage && (
 <button onClick={(e) => { e.stopPropagation(); handleRelease(room.id); }} className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-[9px] font-black rounded-lg transition-all shadow-md">
 Liberar
 </button>
 )}
 </div>
 ) : (
 <div className="flex items-center gap-2 text-emerald-600 font-black text-sm tracking-tight py-2">
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

 {selectedRoom && (
 <ViewRoomDetailsModal 
 room={selectedRoom} 
 onClose={() => setSelectedRoom(null)} 
 />
 )}
 </div>
 )
}

function ViewRoomDetailsModal({ room, onClose }: { room: any; onClose: () => void }) {
 if (!room) return null

 const workerName = Array.isArray(room.worker) 
 ? `${room.worker[0]?.name} ${room.worker[0]?.last_name || ''}`
 : room.worker ? `${room.worker.name} ${room.worker.last_name || ''}` : null

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
 <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 p-8 space-y-6">
 <div className="flex justify-between items-center pb-4 border-b border-slate-100">
 <div className="flex items-center gap-3">
 <div className={`p-3 rounded-2xl ${room.worker ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
 <Bed size={24} />
 </div>
 <div>
 <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Detalles de Alojamiento</h2>
 <p className="text-[10px] font-black tracking-tight text-slate-400 mt-1.5">Control de Camas</p>
 </div>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
 <XCircle size={24} className="text-slate-400" />
 </button>
 </div>

 <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight">Módulo</p>
 <p className="text-lg font-black text-slate-800 mt-1">{room.module}</p>
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight">Habitación</p>
 <p className="text-lg font-black text-slate-800 mt-1">{room.room_number || '—'}</p>
 </div>
 <div className="col-span-2">
 <p className="text-[10px] font-black text-slate-400 tracking-tight">Cama Asignada</p>
 <p className="text-lg font-black text-slate-800 mt-1">{room.bed_number}</p>
 </div>
 </div>

 <div className="text-left space-y-2">
 <p className="text-[10px] font-black text-slate-400 tracking-tight px-1">Huésped Asignado</p>
 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
 room.worker ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
 }`}>
 {room.worker ? 'H' : 'L'}
 </div>
 <div>
 <p className="text-[9px] font-black text-slate-400 tracking-tight leading-none">Estado de Ocupación</p>
 <p className="text-sm font-black text-slate-700 mt-1">
 {workerName || 'Disponible / Libre'}
 </p>
 </div>
 </div>
 </div>

 <div className="flex justify-end pt-4 border-t border-slate-100">
 <button 
 onClick={onClose}
 className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 tracking-normal"
 >
 Cerrar Detalles
 </button>
 </div>
 </div>
 </div>
 )
}
