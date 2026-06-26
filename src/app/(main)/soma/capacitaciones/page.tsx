'use client'

import { useState, useEffect } from 'react'
import { 
 GraduationCap, Plus, Search, Calendar, Users, 
 AlertTriangle, CheckCircle2, FileVideo, FileText, ChevronRight,
 Clock, X, Loader2, Eye, Pencil, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { getSomaTrainings, createSomaTraining, updateSomaTraining, deleteSomaTraining, completeTrainingParticipant } from '../actions'
import { getWorkers } from '@/app/(main)/workers/actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRbac } from '@/components/providers/rbac-provider'

export default function CapacitacionesSomaPage() {
 const { role_id, user: rbacUser } = useRbac()
 const [trainings, setTrainings] = useState<any[]>([])
 const [workers, setWorkers] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [isModalOpen, setIsModalOpen] = useState(false)
 const [searchTerm, setSearchTerm] = useState('')
 const [selectedTraining, setSelectedTraining] = useState<any | null>(null)
 const [editTraining, setEditTraining] = useState<any | null>(null)

 const isSomaRole = ['admin', 'soma', 'operaciones', 'jefe_area', 'super_admin', 'superadmin'].includes(role_id || '')

 const handleDelete = async (id: string) => {
 if (!confirm('¿Estás seguro de que deseas eliminar este registro de capacitación? Esta acción no se puede deshacer.')) return
 try {
 const res = await deleteSomaTraining(id)
 if (res.error) throw new Error(res.error)
 toast.success('Capacitación eliminada correctamente')
 loadData()
 } catch (err: any) {
 toast.error(err.message || 'Error al eliminar capacitación')
 }
 }

 useEffect(() => {
 loadData()
 }, [])

 async function loadData() {
 setLoading(true)
 try {
 const [tData, wData] = await Promise.all([
 getSomaTrainings(),
 getWorkers('active')
 ])
 setTrainings(tData)
 setWorkers(wData)
 setSelectedTraining((prev: any) => {
 if (!prev) return null
 return tData.find((t: any) => t.id === prev.id) || null
 })
 } catch (error) {
 toast.error('Error al cargar datos')
 } finally {
 setLoading(false)
 }
 }

 const filteredTrainings = trainings.filter(t => 
 t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
 t.trainer?.toLowerCase().includes(searchTerm.toLowerCase())
 )

 const stats = {
 total: trainings.length,
 vencidos: trainings.filter(t => t.expiry_date && new Date(t.expiry_date) < new Date()).length,
 proximos: trainings.filter(t => {
 if (!t.expiry_date) return false
 const days = Math.floor((new Date(t.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
 return days > 0 && days <= 30
 }).length
 }

 return (
 <div className="space-y-8 animate-in fade-in duration-700">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-left">
 <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 text-white rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 shrink-0">
 <GraduationCap size={24} className="sm:w-8 sm:h-8" />
 </div>
 <div>
 <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 tracking-tight leading-tight">Capacitaciones SOMA</h1>
 <p className="text-slate-500 font-bold text-sm sm:text-lg mt-0.5 sm:mt-1">Registro de cursos, certificaciones y vencimientos</p>
 </div>
 </div>
 {['admin', 'soma', 'operaciones', 'jefe_area', 'super_admin', 'superadmin'].includes(role_id || '') && (
 <button 
 onClick={() => setIsModalOpen(true)}
 className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl sm:rounded-[2rem] shadow-xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95 text-xs sm:text-base"
 >
 <Plus size={20} />
 Registrar Curso
 </button>
 )}
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6">
 <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><FileVideo size={28} /></div>
 <div>
 <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
 <div className="text-slate-400 font-bold text-sm tracking-normal">Total Cursos</div>
 </div>
 </div>
 <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6">
 <div className="bg-amber-50 p-4 rounded-2xl text-amber-600"><Clock size={28} /></div>
 <div>
 <div className="text-3xl font-bold text-slate-800">{stats.proximos}</div>
 <div className="text-slate-400 font-bold text-sm tracking-normal">Prox. Vencimientos</div>
 </div>
 </div>
 <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6">
 <div className="bg-rose-50 p-4 rounded-2xl text-rose-600"><AlertTriangle size={28} /></div>
 <div>
 <div className="text-3xl font-bold text-slate-800">{stats.vencidos}</div>
 <div className="text-slate-400 font-bold text-sm tracking-normal">Cursos Vencidos</div>
 </div>
 </div>
 </div>

 {/* Search & List */}
 <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
 <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
 <input 
 type="text" 
 placeholder="Buscar por título o instructor..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-14 pr-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600 transition-all"
 />
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full border-collapse">
 <thead>
 <tr className="bg-slate-50/50">
 <th className="px-10 py-6 text-left text-[10px] font-bold text-slate-400 tracking-[0.2em]">Capacitación</th>
 <th className="px-10 py-6 text-left text-[10px] font-bold text-slate-400 tracking-[0.2em]">Instructor</th>
 <th className="px-10 py-6 text-left text-[10px] font-bold text-slate-400 tracking-[0.2em]">Fecha / Exp</th>
 <th className="px-10 py-6 text-left text-[10px] font-bold text-slate-400 tracking-[0.2em]">Participantes</th>
 <th className="px-10 py-6 text-left text-[10px] font-bold text-slate-400 tracking-[0.2em]">Estado</th>
 <th className="px-10 py-6 text-right text-[10px] font-bold text-slate-400 tracking-[0.2em]">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {loading ? (
 <tr>
 <td colSpan={6} className="px-10 py-20 text-center">
 <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
 </td>
 </tr>
 ) : filteredTrainings.length === 0 ? (
 <tr>
 <td colSpan={6} className="px-10 py-20 text-center text-slate-400 font-bold">
 No se encontraron registros de capacitación.
 </td>
 </tr>
 ) : filteredTrainings.map((t) => {
 const isExpired = t.expiry_date && new Date(t.expiry_date) < new Date()
 const daysToExpiry = t.expiry_date ? Math.floor((new Date(t.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null
 
 let expiryStatus = 'Vigente'
 let statusColor = 'bg-emerald-50 text-emerald-600'
 
 if (isExpired) {
 expiryStatus = 'Vencido'
 statusColor = 'bg-rose-50 text-rose-600'
 } else if (daysToExpiry !== null && daysToExpiry <= 30) {
 expiryStatus = `Vence en ${daysToExpiry} días`
 statusColor = 'bg-amber-50 text-amber-600'
 }

 return (
 <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
 <td className="px-10 py-8">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
 <FileText size={20} />
 </div>
 <div>
 <div className="font-bold text-slate-800 text-lg tracking-tight">{t.title}</div>
 <div className="text-slate-400 font-bold text-xs">{t.description || 'Sin descripción'}</div>
 </div>
 </div>
 </td>
 <td className="px-10 py-8 whitespace-nowrap">
 <div className="font-bold text-slate-600">{t.trainer || 'N/A'}</div>
 </td>
 <td className="px-10 py-8 whitespace-nowrap">
 <div className="space-y-1">
 <div className="flex items-center gap-2 font-bold text-slate-700">
 <Calendar size={14} className="text-slate-400" />
 {format(new Date(t.date), 'dd MMM, yyyy', { locale: es })}
 </div>
 {t.expiry_date && (
 <div className="text-[10px] font-bold text-slate-400 tracking-tight pl-5">
 EXP: {format(new Date(t.expiry_date), 'dd MMM, yyyy', { locale: es })}
 </div>
 )}
 </div>
 </td>
 <td className="px-10 py-8 whitespace-nowrap">
 <div className="flex items-center gap-2 font-bold text-slate-600 bg-slate-100 self-start px-3 py-1 rounded-lg w-max">
 <Users size={14} />
 {t.participants?.length || 0}
 </div>
 </td>
 <td className="px-10 py-8 whitespace-nowrap">
 <span className={`inline-block px-4 py-2 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap ${statusColor}`}>
 {expiryStatus}
 </span>
 </td>
 <td className="px-10 py-8 text-right flex justify-end gap-2 items-center whitespace-nowrap">
 {t.material_url && (
 <a 
 href={t.material_url} 
 target="_blank" 
 rel="noopener noreferrer"
 onClick={(e) => e.stopPropagation()}
 className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-indigo-600 transition-all text-xs font-bold tracking-tight flex items-center gap-1 shadow-sm border border-indigo-100"
 title="Ver Material de Apoyo"
 >
 Material
 </a>
 )}
 <button 
 onClick={() => setSelectedTraining(t)}
 className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
 title="Ver Detalles"
 >
 <Eye size={18} />
 </button>
 {isSomaRole && (
 <>
 <button 
 onClick={() => setEditTraining(t)}
 className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-amber-600 transition-all shadow-sm"
 title="Editar"
 >
 <Pencil size={18} />
 </button>
 <button 
 onClick={() => handleDelete(t.id)}
 className="p-3 bg-slate-50 hover:bg-rose-50 rounded-xl text-slate-500 hover:text-rose-600 transition-all shadow-sm"
 title="Eliminar"
 >
 <Trash2 size={18} />
 </button>
 </>
 )}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </div>

 {isModalOpen && (
 <AddTrainingModal 
 isOpen={isModalOpen} 
 onClose={() => setIsModalOpen(false)} 
 workers={workers}
 onSuccess={loadData}
 />
 )}

 {selectedTraining && (
 <ViewTrainingDetailsModal 
 training={selectedTraining} 
 onClose={() => setSelectedTraining(null)} 
 onUpdate={loadData}
 />
 )}

 {editTraining && (
 <EditTrainingModal 
 isOpen={!!editTraining} 
 onClose={() => setEditTraining(null)} 
 workers={workers}
 training={editTraining}
 onSuccess={loadData}
 />
 )}
 </div>
 )
}

function AddTrainingModal({ isOpen, onClose, workers, onSuccess }: any) {
 const [loading, setLoading] = useState(false)
 if (!isOpen) return null
 const [formData, setFormData] = useState({
 title: '',
 description: '',
 trainer: '',
 date: new Date().toISOString().split('T')[0],
 expiry_date: '',
 material_url: '',
 participants: [] as string[]
 })

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 setLoading(true)
 try {
 const res = await createSomaTraining(formData)
 if (res.error) throw new Error(res.error)
 toast.success('Capacitación registrada')
 onSuccess()
 onClose()
 } catch (error: any) {
 toast.error(error.message)
 } finally {
 setLoading(false)
 }
 }

 const toggleParticipant = (id: string) => {
 setFormData(prev => ({
 ...prev,
 participants: prev.participants.includes(id)
 ? prev.participants.filter(p => p !== id)
 : [...prev.participants, id]
 }))
 }

 const selectAll = () => {
 setFormData(prev => ({
 ...prev,
 participants: prev.participants.length === workers.length ? [] : workers.map((w: any) => w.id)
 }))
 }

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
 <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
 <Plus size={24} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nueva Capacitación</h2>
 <p className="text-slate-400 font-bold text-sm tracking-tight text-indigo-400">FASE SEGURIDADES SOMA</p>
 </div>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
 <X size={24} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
 {/* Left side: Basic Info */}
 <div className="space-y-6">
 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Título del Curso</label>
 <input 
 required
 type="text" 
 value={formData.title.toUpperCase()}
 onChange={e => setFormData(prev => ({...prev, title: e.target.value.toUpperCase()}))}
 placeholder="EJ: INDUCCIÓN GENERAL DE SEGURIDAD"
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
 />
 </div>

 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Instructor / Entrenador</label>
 <input 
 type="text" 
 value={formData.trainer.toUpperCase()}
 onChange={e => setFormData(prev => ({...prev, trainer: e.target.value.toUpperCase()}))}
 placeholder="EJ: JUAN PEREZ"
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
 />
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Fecha Realización</label>
 <input 
 required
 type="date" 
 value={formData.date}
 onChange={e => setFormData(prev => ({...prev, date: e.target.value}))}
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
 />
 </div>
 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Vencimiento</label>
 <input 
 type="date" 
 value={formData.expiry_date}
 onChange={e => setFormData(prev => ({...prev, expiry_date: e.target.value}))}
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
 />
 </div>
 </div>
 
 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Material de Apoyo / Enlace</label>
 <input 
 type="url" 
 value={formData.material_url}
 onChange={e => setFormData(prev => ({...prev, material_url: e.target.value}))}
 placeholder="https://ejemplo.com/recurso"
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
 />
 </div>

 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Descripción</label>
 <textarea 
 value={formData.description.toUpperCase()}
 onChange={e => setFormData(prev => ({...prev, description: e.target.value.toUpperCase()}))}
 placeholder="DETALLES DEL CONTENIDO DEL CURSO..."
 rows={4}
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
 />
 </div>
 </div>

 {/* Right side: Participant Selection */}
 <div className="flex flex-col bg-slate-50/50 rounded-[2rem] p-6 md:p-8 border border-slate-100/50 h-[380px] max-h-[380px]">
 <div className="flex items-center justify-between mb-6">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
 <Users size={14} /> Asistentes ({formData.participants.length})
 </label>
 <button 
 type="button" 
 onClick={selectAll}
 className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 tracking-tight bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
 >
 {formData.participants.length === workers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
 </button>
 </div>
 
 <div className="flex-1 overflow-y-auto space-y-2 pr-4 custom-scrollbar h-[250px] max-h-[250px]">
 {workers.map((w: any) => (
 <button
 key={w.id}
 type="button"
 onClick={() => toggleParticipant(w.id)}
 className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
 formData.participants.includes(w.id) 
 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 translate-x-1' 
 : 'bg-white text-slate-600 hover:bg-indigo-50'
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
 formData.participants.includes(w.id) ? 'bg-white/20' : 'bg-slate-100'
 }`}>
 {w.name.charAt(0)}
 </div>
 <div className="text-left">
 <div className="font-bold text-sm tracking-tight">{w.name}</div>
 <div className={`text-[10px] ${formData.participants.includes(w.id) ? 'text-white/60' : 'text-slate-400'}`}>
 {w.position}
 </div>
 </div>
 </div>
 {formData.participants.includes(w.id) && <CheckCircle2 size={16} />}
 </button>
 ))}
 </div>
 </div>
 </div>

 <div className="mt-12 flex justify-end gap-6 pt-10 border-t border-slate-50">
 <button
 type="button"
 onClick={onClose}
 className="px-10 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors"
 >
 Cancelar
 </button>
 <button
 disabled={loading}
 type="submit"
 className="flex items-center gap-3 px-12 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
 >
 {loading && <Loader2 className="w-5 h-5 animate-spin" />}
 Guardar Registro
 </button>
 </div>
 </form>
 </div>
 </div>
 )
}

function ViewTrainingDetailsModal({ training, onClose, onUpdate }: { training: any; onClose: () => void; onUpdate?: () => void }) {
 const [confirmingId, setConfirmingId] = useState<string | null>(null)
 
 if (!training) return null

 const isExpired = training.expiry_date && new Date(training.expiry_date) < new Date()
 const daysToExpiry = training.expiry_date ? Math.floor((new Date(training.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null

 let expiryStatus = 'Vigente'
 let statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100'

 if (isExpired) {
 expiryStatus = 'Vencido'
 statusColor = 'bg-rose-50 text-rose-600 border border-rose-100'
 } else if (daysToExpiry !== null && daysToExpiry <= 30) {
 expiryStatus = `Vence en ${daysToExpiry} días`
 statusColor = 'bg-amber-50 text-amber-600 border border-amber-100'
 }

 const handleConfirmParticipant = async (participantId: string) => {
 setConfirmingId(participantId)
 try {
 const res = await completeTrainingParticipant(participantId)
 if (res.error) {
 toast.error(res.error)
 } else {
 toast.success('Asistencia confirmada con éxito')
 if (onUpdate) onUpdate()
 }
 } catch (err: any) {
 toast.error(err.message || 'Error al confirmar asistencia')
 } finally {
 setConfirmingId(null)
 }
 }

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
 
 {/* Header */}
 <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
 <GraduationCap size={22} />
 </div>
 <div>
 <h2 className="text-xl font-black text-slate-800 tracking-tight">Detalles de Capacitación</h2>
 <p className="text-[10px] font-black text-indigo-600 tracking-tight mt-0.5">Seguridad y Salud Ocupacional (SOMA)</p>
 </div>
 </div>
 <button 
 onClick={onClose} 
 className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm border border-transparent hover:border-slate-100"
 >
 <X size={20} />
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar text-left">
 {/* Main Info Card */}
 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
 <div className="flex justify-between items-start gap-4">
 <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">{training.title}</h3>
 <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-sm shrink-0 ${statusColor}`}>
 {expiryStatus}
 </span>
 </div>
 
 <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-slate-600">
 <div className="flex items-center gap-2">
 <Calendar size={16} className="text-slate-400" />
 <span>Fecha Realización: <span className="text-slate-800 font-bold">{format(new Date(training.date), 'dd/MM/yyyy')}</span></span>
 </div>
 {training.expiry_date && (
 <div className="flex items-center gap-2">
 <Clock size={16} className="text-slate-400" />
 <span>Vencimiento: <span className="text-slate-800 font-bold">{format(new Date(training.expiry_date), 'dd/MM/yyyy')}</span></span>
 </div>
 )}
 <div className="flex items-center gap-2">
 <Users size={16} className="text-slate-400" />
 <span>Instructor: <span className="text-slate-800 font-bold">{training.trainer || 'N/A'}</span></span>
 </div>
 </div>
 </div>

 {/* Description */}
 <div className="space-y-2">
 <h4 className="text-xs font-black text-slate-400 tracking-tight px-1">Descripción</h4>
 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm text-slate-600 font-medium whitespace-pre-wrap">
 {training.description || 'Sin descripción.'}
 </div>
 </div>

 {/* Material de Apoyo */}
 {training.material_url && (
 <div className="space-y-2">
 <h4 className="text-xs font-black text-slate-400 tracking-tight px-1">Material de Apoyo</h4>
 <a 
 href={training.material_url}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-2xl text-indigo-600 font-bold transition-all border border-indigo-100 shadow-sm"
 >
 <FileText size={18} />
 <span className="text-sm">Ver Recurso Adjunto</span>
 </a>
 </div>
 )}

 {/* Participants List */}
 <div className="space-y-3">
 <h4 className="text-xs font-black text-slate-400 tracking-tight px-1">
 Participantes Asignados ({training.participants?.length || 0})
 </h4>
 
 <div className="border border-slate-100 rounded-3xl overflow-hidden divide-y divide-slate-50 max-h-60 overflow-y-auto custom-scrollbar shadow-inner bg-slate-50/50">
 {(!training.participants || training.participants.length === 0) ? (
 <div className="p-6 text-center text-sm font-bold text-slate-400">
 Ningún participante registrado en este curso.
 </div>
 ) : (
 training.participants.map((p: any) => {
 const worker = p.worker || p
 const isCompleted = p.status === 'completado'
 return (
 <div key={p.id} className="p-4 bg-white flex items-center justify-between transition-colors hover:bg-slate-50/40">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
 {worker?.name?.charAt(0) || 'T'}
 </div>
 <div>
 <div className="text-sm font-bold text-slate-800 leading-tight">
 {worker?.name} {worker?.last_name || ''}
 </div>
 <div className="text-[10px] font-black text-slate-400 tracking-normal mt-0.5">
 {worker?.position || 'Trabajador'}
 </div>
 </div>
 </div>
 
 {isCompleted ? (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tight bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
 <CheckCircle2 size={12} className="stroke-[3]" />
 <span>Completado</span>
 </span>
 ) : (
 <div className="flex items-center gap-2">
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tight bg-amber-50 text-amber-600 shadow-sm border border-amber-100">
 <Clock size={12} className="stroke-[3]" />
 <span>Pendiente</span>
 </span>
 <button
 disabled={confirmingId !== null}
 onClick={() => handleConfirmParticipant(p.id)}
 className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold tracking-normal transition-all flex items-center gap-1 disabled:opacity-50 active:scale-95"
 >
 {confirmingId === p.id && <Loader2 size={10} className="animate-spin" />}
 <span>Confirmar</span>
 </button>
 </div>
 )}
 </div>
 )
 })
 )}
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
 <button 
 onClick={onClose}
 className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-2xl transition-all shadow-md active:scale-95"
 >
 Cerrar Detalles
 </button>
 </div>

 </div>
 </div>
 )
}

function EditTrainingModal({ isOpen, onClose, workers, training, onSuccess }: any) {
 const [loading, setLoading] = useState(false)
 const [formData, setFormData] = useState({
 title: training?.title || '',
 description: training?.description || '',
 trainer: training?.trainer || '',
 date: training?.date || '',
 expiry_date: training?.expiry_date || '',
 material_url: training?.material_url || '',
 participants: (training?.participants || []).map((p: any) => p.worker?.id || p.worker_id || p.id) as string[]
 })

 useEffect(() => {
 if (training) {
 setFormData({
 title: training.title || '',
 description: training.description || '',
 trainer: training.trainer || '',
 date: training.date ? new Date(training.date).toISOString().split('T')[0] : '',
 expiry_date: training.expiry_date ? new Date(training.expiry_date).toISOString().split('T')[0] : '',
 material_url: training.material_url || '',
 participants: (training.participants || []).map((p: any) => p.worker?.id || p.worker_id || p.id)
 })
 }
 }, [training])

 if (!isOpen) return null

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 setLoading(true)
 try {
 const res = await updateSomaTraining(training.id, formData)
 if (res.error) throw new Error(res.error)
 toast.success('Capacitación actualizada exitosamente')
 onSuccess()
 onClose()
 } catch (error: any) {
 toast.error(error.message)
 } finally {
 setLoading(false)
 }
 }

 const toggleParticipant = (id: string) => {
 setFormData(prev => ({
 ...prev,
 participants: prev.participants.includes(id)
 ? prev.participants.filter(p => p !== id)
 : [...prev.participants, id]
 }))
 }

 const selectAll = () => {
 setFormData(prev => ({
 ...prev,
 participants: prev.participants.length === workers.length ? [] : workers.map((w: any) => w.id)
 }))
 }

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
 <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-amber-50/30">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
 <Pencil size={24} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-slate-800 tracking-tight">Editar Capacitación</h2>
 <p className="text-slate-400 font-bold text-sm tracking-tight text-amber-500">Modificar Registro SOMA</p>
 </div>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
 <X size={24} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 text-left">
 {/* Left side: Basic Info */}
 <div className="space-y-6">
 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Título del Curso</label>
 <input 
 required
 type="text" 
 value={formData.title.toUpperCase()}
 onChange={e => setFormData(prev => ({...prev, title: e.target.value.toUpperCase()}))}
 placeholder="EJ: INDUCCIÓN GENERAL DE SEGURIDAD"
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
 />
 </div>

 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Instructor / Entrenador</label>
 <input 
 type="text" 
 value={formData.trainer.toUpperCase()}
 onChange={e => setFormData(prev => ({...prev, trainer: e.target.value.toUpperCase()}))}
 placeholder="EJ: JUAN PEREZ"
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
 />
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Fecha Realización</label>
 <input 
 required
 type="date" 
 value={formData.date}
 onChange={e => setFormData(prev => ({...prev, date: e.target.value}))}
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
 />
 </div>
 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Vencimiento</label>
 <input 
 type="date" 
 value={formData.expiry_date}
 onChange={e => setFormData(prev => ({...prev, expiry_date: e.target.value}))}
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
 />
 </div>
 </div>

 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Material de Apoyo / Enlace</label>
 <input 
 type="url" 
 value={formData.material_url}
 onChange={e => setFormData(prev => ({...prev, material_url: e.target.value}))}
 placeholder="https://ejemplo.com/recurso"
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
 />
 </div>

 <div className="space-y-3">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] ml-2">Descripción</label>
 <textarea 
 value={formData.description.toUpperCase()}
 onChange={e => setFormData(prev => ({...prev, description: e.target.value.toUpperCase()}))}
 placeholder="DETALLES DEL CONTENIDO DEL CURSO..."
 rows={4}
 className="w-full px-6 md:px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
 />
 </div>
 </div>

 {/* Right side: Participant Selection */}
 <div className="flex flex-col bg-slate-50/50 rounded-[2rem] p-6 md:p-8 border border-slate-100/50 h-[380px] max-h-[380px]">
 <div className="flex items-center justify-between mb-6">
 <label className="text-[10px] font-bold text-slate-400 tracking-[0.2em] flex items-center gap-2">
 <Users size={14} /> Asistentes ({formData.participants.length})
 </label>
 <button 
 type="button" 
 onClick={selectAll}
 className="text-[10px] font-bold text-amber-600 hover:text-amber-700 tracking-tight bg-amber-50 px-3 py-1.5 rounded-lg transition-all"
 >
 {formData.participants.length === workers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
 </button>
 </div>
 
 <div className="flex-1 overflow-y-auto space-y-2 pr-4 custom-scrollbar h-[250px] max-h-[250px]">
 {workers.map((w: any) => (
 <button
 key={w.id}
 type="button"
 onClick={() => toggleParticipant(w.id)}
 className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
 formData.participants.includes(w.id) 
 ? 'bg-amber-500 text-white shadow-lg shadow-amber-100 translate-x-1' 
 : 'bg-white text-slate-600 hover:bg-amber-50'
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
 formData.participants.includes(w.id) ? 'bg-white/20' : 'bg-slate-100'
 }`}>
 {w.name.charAt(0)}
 </div>
 <div className="text-left">
 <div className="font-bold text-sm tracking-tight">{w.name}</div>
 <div className={`text-[10px] ${formData.participants.includes(w.id) ? 'text-white/60' : 'text-slate-400'}`}>
 {w.position}
 </div>
 </div>
 </div>
 {formData.participants.includes(w.id) && <CheckCircle2 size={16} />}
 </button>
 ))}
 </div>
 </div>
 </div>

 <div className="mt-12 flex justify-end gap-6 pt-10 border-t border-slate-50">
 <button
 type="button"
 onClick={onClose}
 className="px-10 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors"
 >
 Cancelar
 </button>
 <button
 disabled={loading}
 type="submit"
 className="flex items-center gap-3 px-12 py-4 bg-amber-500 text-white font-bold rounded-2xl shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all disabled:opacity-50"
 >
 {loading && <Loader2 className="w-5 h-5 animate-spin" />}
 Actualizar Registro
 </button>
 </div>
 </form>
 </div>
 </div>
 )
}
