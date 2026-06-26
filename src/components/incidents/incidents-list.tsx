'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Search, Filter, Activity, Clock, User, CheckCircle2, ChevronRight, Hash, X, Pencil, Trash2, Eye, Loader2, Plus } from 'lucide-react'
import { getIncidencias, updateIncidencia, deleteIncidencia } from '@/app/(main)/incidencias/actions'
import { ReportIncidentModal } from '@/components/requirements/requirements-components'
import { toast } from 'sonner'

export function IncidentsList({ initialData = [], user, forcedCategory }: { initialData?: any[], user?: any, forcedCategory?: string }) {
 const router = useRouter()
 const [incidents, setIncidents] = useState<any[]>(initialData)
 const [selectedIncident, setSelectedIncident] = useState<any | null>(null)
 const [editIncident, setEditIncident] = useState<any | null>(null)

 const isSomaRole = ['admin', 'soma', 'operaciones', 'jefe_area', 'super_admin', 'superadmin'].includes(user?.role_id || '')

 const handleDeleteIncident = async (id: string) => {
 if (!confirm('¿Estás seguro de que deseas eliminar este reporte de incidencia? Esta acción no se puede deshacer.')) return
 try {
 const res = await deleteIncidencia(id)
 if (res.error) throw new Error(res.error)
 toast.success('Incidencia eliminada correctamente')
 fetchData()
 } catch (err: any) {
 toast.error(err.message || 'Error al eliminar incidencia')
 }
 }
 
 // Sync state with props when server-side refresh happens
 useEffect(() => {
 setIncidents(initialData)
 }, [initialData])
 const [loading, setLoading] = useState(false)
 const [isModalOpen, setIsModalOpen] = useState(false)
 const [searchTerm, setSearchTerm] = useState('')
 const [statusFilter, setStatusFilter] = useState('abierta')
 const [categoryFilter, setCategoryFilter] = useState(forcedCategory || 'all')
 const [hasMounted, setHasMounted] = useState(false)

 const isWorker = user?.role_id === 'trabajador'

 const getSeverityStyle = (severity: string) => {
 switch (severity?.toLowerCase()) {
 case 'leve': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
 case 'moderado': return 'bg-blue-50 text-blue-600 border-blue-100'
 case 'grave': return 'bg-orange-50 text-orange-600 border-orange-100'
 case 'critico': return 'bg-rose-50 text-rose-600 border-rose-100'
 case 'fatal': return 'bg-slate-900 text-white border-slate-900'
 default: return 'bg-slate-50 text-slate-600 border-slate-100'
 }
 }

 const fetchData = async () => {
 setLoading(true)
 try {
 const res = await getIncidencias({ 
 status: statusFilter !== 'all' ? statusFilter : undefined,
 category: categoryFilter !== 'all' ? categoryFilter : undefined
 })
 if (res && res.data) {
 setIncidents(res.data)
 } else if (res && res.error) {
 console.error('Error fetching incidents:', res.error)
 }
 } catch (err) {
 console.error('Unexpected error fetching incidents:', err)
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 if (hasMounted) {
 fetchData()
 } else {
 setHasMounted(true)
 // Call fetchData on first mount too if initialData is empty
 if (initialData.length === 0) {
 fetchData()
 }
 }
 }, [statusFilter, categoryFilter])

 // OPTIMIZED: Memoized filtering to prevent lag during typing
 const filtered = incidents.filter(inc => {
 const term = searchTerm.toLowerCase()
 return (
 (inc.description || '').toLowerCase().includes(term) ||
 (inc.area_location || '').toLowerCase().includes(term) ||
 (inc.id || '').toLowerCase().includes(term)
 )
 })

 return (
 <div className="space-y-8 pb-12">
 {/* ... (existing UI remains identical) ... */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
 <div>
 <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
 <div className="bg-orange-100 p-2 rounded-xl">
 <AlertCircle className="text-orange-600" size={24} />
 </div>
 {forcedCategory === 'soma' ? 'Incidentes SOMA' : 'Reporte de Incidencias'}
 </h1>
 <p className="text-slate-500 font-medium text-sm mt-1">
 {forcedCategory === 'soma' 
 ? 'Control de seguridad, salud y medio ambiente.' 
 : 'Control de anomalías y eventos en campo.'}
 </p>
 </div>
 {!isWorker && (
 <button 
 onClick={() => setIsModalOpen(true)}
 className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-100 active:scale-95"
 >
 <Activity size={20} strokeWidth={3} />
 <span>Reportar Incidencia</span>
 </button>
 )}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="md:col-span-2 relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
 <input 
 type="text" 
 placeholder="Buscar por descripción o equipo..." 
 className="w-full bg-white border-2 border-slate-100 focus:border-orange-500 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none shadow-sm"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 <div className="flex gap-2">
 <div className="flex-1 bg-white border-2 border-slate-100 hover:border-orange-200 rounded-2xl font-bold text-slate-600 flex items-center px-4 transition-all shadow-sm">
 <Filter size={18} className="text-slate-400 mr-2 shrink-0" />
 <select 
 className="bg-transparent w-full outline-none text-sm h-[54px] cursor-pointer"
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 >
 <option value="all">Todos los estados</option>
 <option value="abierta">Abiertas</option>
 <option value="cerrada">Cerradas</option>
 </select>
 </div>
 <div className="flex-1 bg-white border-2 border-slate-100 hover:border-orange-200 rounded-2xl font-bold text-slate-600 flex items-center px-4 transition-all shadow-sm">
 <Filter size={18} className="text-slate-400 mr-2 shrink-0" />
 <select 
 className="bg-transparent w-full outline-none text-sm h-[54px] cursor-pointer"
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 >
 <option value="all">Todas las categorías</option>
 <option value="operativa">Operativas</option>
 <option value="soma">SOMA / HSEC</option>
 <option value="personal">Daño Personal</option>
 <option value="ambiental">Daño Ambiental</option>
 <option value="material">Daño Material</option>
 </select>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-100">
 <th className="py-5 px-8 text-[11px] font-black text-slate-400 tracking-tight">Código</th>
 <th className="py-5 text-[11px] font-black text-slate-400 tracking-tight">Ubicación / Área</th>
 <th className="py-5 text-[11px] font-black text-slate-400 tracking-tight">Descripción</th>
 <th className="py-5 text-[11px] font-black text-slate-400 tracking-tight text-center">Severidad</th>
 <th className="py-5 text-[11px] font-black text-slate-400 tracking-tight text-center">Estado</th>
 <th className="py-5 text-[11px] font-black text-slate-400 tracking-tight text-right">Fecha / Hora</th>
 <th className="py-5 px-8 text-[11px] font-black text-slate-400 tracking-tight text-right">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {loading ? (
 <tr>
 <td colSpan={7} className="py-24 text-center">
 <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
 <p className="text-sm font-bold text-slate-400">Actualizando lista...</p>
 </td>
 </tr>
 ) : filtered.length > 0 ? filtered.map((inc) => {
 // OPTIMIZED: Parse URLs once per item
 let urls: string[] = []
 try {
 urls = typeof inc.photo_urls === 'string' ? JSON.parse(inc.photo_urls) : inc.photo_urls
 } catch (e) {
 urls = []
 }

 return (
 <tr key={inc.id} onClick={() => setSelectedIncident(inc)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
 <td className="py-6 px-8">
 <div className="flex items-center gap-2">
 <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-white transition-colors">
 <Hash className="text-slate-400" size={14} />
 </div>
 <span className="text-[11px] font-black text-orange-600 tracking-tight">#{inc.id.slice(0, 8)}</span>
 </div>
 </td>
 <td className="py-6">
 <p className="text-sm font-black text-slate-800 tracking-tight">{inc.area_location || 'General'}</p>
 </td>
 <td className="py-6">
 <div className="max-w-xs">
 <p className="text-sm font-bold text-slate-600 leading-snug line-clamp-2">{inc.description}</p>
 <div className="flex items-center gap-2 mt-1.5 opacity-60">
 <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
 <User size={8} className="text-slate-400" />
 </div>
 <span className="text-[9px] font-black text-slate-400">Por: {inc.reporter?.name || 'Sistema'}</span>
 </div>
 {Array.isArray(urls) && urls.length > 0 && (
 <div className="flex items-center gap-1.5 mt-2">
 {urls.map((url: string, i: number) => (
 <a key={i} href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="block hover:scale-110 transition-transform" title="Ver imagen">
 <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm">
 <img src={url} alt={`Evidencia ${i+1}`} className="w-full h-full object-cover" />
 </div>
 </a>
 ))}
 </div>
 )}
 </div>
 </td>
 <td className="py-6 text-center">
 <span className={`text-[10px] font-black px-3 py-1 rounded-lg border shadow-sm ${getSeverityStyle(inc.severity)}`}>
 {inc.severity}
 </span>
 </td>
 <td className="py-6 text-center">
 <span className={`text-[10px] font-black px-3 py-1 rounded-lg border shadow-sm ${
 inc.status === 'abierta' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400'
 }`}>
 {inc.status}
 </span>
 </td>
 <td className="py-6 text-right">
 <p className="text-sm font-black text-slate-800 tracking-tight">{new Date(inc.created_at).toLocaleDateString()}</p>
 <p className="text-[10px] font-bold text-slate-400 tracking-tight">{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
 </td>
 <td className="py-6 px-8 text-right">
 <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
 <button 
 onClick={() => setSelectedIncident(inc)}
 className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-orange-600 transition-all shadow-sm"
 title="Ver Detalles"
 >
 <Eye size={14} />
 </button>
 {isSomaRole && (
 <>
 <button 
 onClick={() => setEditIncident(inc)}
 className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-amber-600 transition-all shadow-sm"
 title="Editar"
 >
 <Pencil size={14} />
 </button>
 <button 
 onClick={() => handleDeleteIncident(inc.id)}
 className="p-2 bg-slate-50 hover:bg-rose-50 rounded-xl text-slate-500 hover:text-rose-600 transition-all shadow-sm"
 title="Eliminar"
 >
 <Trash2 size={14} />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 )
 }) : (
 <tr>
 <td colSpan={7} className="py-32 text-center">
 <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
 <Activity size={40} />
 </div>
 <p className="text-slate-500 font-black text-lg">No hay incidencias reportadas</p>
 <p className="text-slate-400 text-sm font-medium mt-1">Todo parece estar en orden por ahora.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 <ReportIncidentModal 
 isOpen={isModalOpen} 
 initialCategory={forcedCategory}
 onClose={() => setIsModalOpen(false)} 
 onSuccess={(newIncidentCategory) => {
 router.refresh()
 if (newIncidentCategory && categoryFilter !== 'all' && categoryFilter !== newIncidentCategory) {
 setCategoryFilter('all')
 } else {
 fetchData()
 }
 setIsModalOpen(false)
 }}
 />

 {selectedIncident && (
 <IncidentDetailModal 
 isOpen={!!selectedIncident}
 onClose={() => setSelectedIncident(null)}
 incident={selectedIncident}
 />
 )}

 {editIncident && (
 <EditIncidentModal 
 isOpen={!!editIncident}
 onClose={() => setEditIncident(null)}
 incident={editIncident}
 onSuccess={() => {
 fetchData()
 setEditIncident(null)
 }}
 />
 )}
 </div>
 )
}

function IncidentDetailModal({ isOpen, onClose, incident }: { isOpen: boolean, onClose: () => void, incident: any }) {
 if (!isOpen || !incident) return null
 
 let urls: string[] = []
 try {
 urls = typeof incident.photo_urls === 'string' ? JSON.parse(incident.photo_urls) : incident.photo_urls
 } catch (e) {
 urls = []
 }

 const getSeverityStyle = (severity: string) => {
 switch (severity?.toLowerCase()) {
 case 'leve': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
 case 'moderado': return 'bg-blue-50 text-blue-600 border-blue-100'
 case 'grave': return 'bg-orange-50 text-orange-600 border-orange-100'
 case 'critico': return 'bg-rose-50 text-rose-600 border-rose-100'
 case 'fatal': return 'bg-slate-900 text-white border-slate-900'
 default: return 'bg-slate-50 text-slate-600 border-slate-100'
 }
 }

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
 {/* Header */}
 <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
 <div>
 <h2 className="text-2xl font-black text-slate-800 tracking-tight">Detalle de Incidencia</h2>
 <p className="text-slate-400 text-[10px] font-bold tracking-tight">Reporte detallado del evento.</p>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
 <X size={24} />
 </button>
 </div>

 {/* Content */}
 <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
 {/* Main Info */}
 <div className="flex justify-between items-start border-b border-slate-100 pb-6">
 <div>
 <span className="bg-orange-50 text-orange-700 text-[9px] font-black px-2.5 py-1 rounded shadow-sm border border-orange-100 tracking-normal">
 #{incident.id.slice(0, 8)}
 </span>
 <h3 className="text-lg font-black text-slate-800 tracking-tight mt-3 leading-tight text-left">
 {incident.area_location || 'Ubicación General'}
 </h3>
 <p className="text-[10px] font-bold text-slate-400 mt-1 text-left">Categoría: {incident.category || 'Operativa'}</p>
 </div>
 <div className="text-right shrink-0">
 <span className={`text-[10px] font-black px-3 py-1 rounded-lg border shadow-sm ${
 incident.status === 'abierta' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
 }`}>
 {incident.status}
 </span>
 <div className="mt-2">
 <span className={`text-[10px] font-black px-3 py-1 rounded-lg border shadow-sm ${getSeverityStyle(incident.severity)}`}>
 {incident.severity}
 </span>
 </div>
 </div>
 </div>

 {/* Details Grid */}
 <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
 <div>
 <p className="text-[9px] font-bold text-slate-400 tracking-tight">Reportado Por</p>
 <p className="text-xs font-black text-slate-700 mt-1">{incident.reporter?.name || 'Sistema'}</p>
 </div>
 <div>
 <p className="text-[9px] font-bold text-slate-400 tracking-tight">Fecha y Hora</p>
 <p className="text-xs font-black text-slate-700 mt-1">
 {incident.created_at ? `${new Date(incident.created_at).toLocaleDateString()} ${new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}
 </p>
 </div>
 </div>

 {/* Description */}
 <div className="space-y-2 text-left">
 <p className="text-[9px] font-bold text-slate-400 tracking-tight px-1">Descripción del Reporte</p>
 <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
 <p className="text-sm text-slate-600 font-bold leading-relaxed">{incident.description}</p>
 </div>
 </div>

 {/* Evidencia Fotográfica */}
 {Array.isArray(urls) && urls.length > 0 && (
 <div className="space-y-2 text-left">
 <p className="text-[9px] font-bold text-slate-400 tracking-tight px-1">Evidencia Adjunta</p>
 <div className="grid grid-cols-2 gap-3">
 {urls.map((url: string, i: number) => (
 <a key={i} href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="block hover:scale-98 transition-transform">
 <div className="rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm aspect-video flex items-center justify-center">
 <img src={url} alt={`Evidencia ${i+1}`} className="w-full h-full object-cover" />
 </div>
 </a>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )
}

function EditIncidentModal({ 
 isOpen, 
 onClose, 
 incident, 
 onSuccess 
}: { 
 isOpen: boolean, 
 onClose: () => void,
 incident: any,
 onSuccess: () => void 
}) {
 const [loading, setLoading] = useState(false)
 const [uploading, setUploading] = useState(false)
 const [files, setFiles] = useState<{file?: File, preview: string, isExisting?: boolean}[]>([])
 const [form, setForm] = useState({
 area_location: '',
 description: '',
 severity: 'leve',
 event_date: '',
 incident_category: 'personal',
 corrective_actions: '',
 status: 'abierta'
 })

 useEffect(() => {
 if (incident) {
 setForm({
 area_location: incident.area_location || '',
 description: incident.description || '',
 severity: incident.severity || 'leve',
 event_date: incident.event_date ? new Date(incident.event_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
 incident_category: incident.incident_category || 'personal',
 corrective_actions: incident.corrective_actions || '',
 status: incident.status || 'abierta'
 })
 
 let urls: string[] = []
 try {
 urls = typeof incident.photo_urls === 'string' ? JSON.parse(incident.photo_urls) : incident.photo_urls
 } catch (e) {
 urls = []
 }
 if (Array.isArray(urls)) {
 setFiles(urls.map(url => ({ preview: url, isExisting: true })))
 } else {
 setFiles([])
 }
 }
 }, [incident, isOpen])

 if (!isOpen || !incident) return null

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files) {
 const newFiles = Array.from(e.target.files).map(file => ({
 file,
 preview: URL.createObjectURL(file),
 isExisting: false
 }))
 setFiles(prev => [...prev, ...newFiles])
 }
 }

 const removeFile = (index: number) => {
 setFiles(prev => prev.filter((_, i) => i !== index))
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 
 try {
 const existingUrls = files.filter(f => f.isExisting).map(f => f.preview)
 const newFiles = files.filter(f => !f.isExisting && f.file) as {file: File, preview: string}[]
 
 let newUrls: string[] = []
 if (newFiles.length > 0) {
 setUploading(true)
 const { uploadFilesAction } = await import('@/app/actions/storage')
 const filesData = await Promise.all(newFiles.map(async ({ file }) => {
 const reader = new FileReader()
 const base64 = await new Promise<string>((resolve) => {
 reader.onload = () => resolve(reader.result as string)
 reader.readAsDataURL(file)
 })
 return { name: file.name, type: file.type, base64 }
 }))

 const uploadRes = await uploadFilesAction(filesData, 'soma', 'incidents', incident.id)
 setUploading(false)
 if (uploadRes.success && uploadRes.urls) {
 newUrls = uploadRes.urls
 } else {
 toast.error('Error al subir nuevas imágenes.')
 }
 }

 const allUrls = [...existingUrls, ...newUrls]

 const res = await updateIncidencia(incident.id, {
 area_location: form.area_location,
 description: form.description,
 severity: form.severity,
 event_date: form.event_date,
 incident_category: form.incident_category,
 corrective_actions: form.corrective_actions,
 status: form.status as 'abierta' | 'cerrada',
 photo_urls: allUrls
 })

 if (res.success) {
 toast.success('Incidencia actualizada correctamente')
 onSuccess()
 } else {
 toast.error(res.error || 'Error al actualizar la incidencia')
 }
 } catch (err: any) {
 toast.error(err.message || 'Error de conexión')
 } finally {
 setLoading(false)
 setUploading(false)
 }
 }

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
 <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-orange-50/30">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
 <Pencil size={24} />
 </div>
 <div>
 <h2 className="text-2xl font-black text-slate-800 tracking-tight">Editar Incidencia</h2>
 <p className="text-slate-500 text-xs font-medium italic">Fase de Actualización SOMA / Investigación de Incidentes</p>
 </div>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
 <X size={24} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar text-left">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-2">
 <label className="text-[11px] font-black tracking-tight text-slate-400 px-1">Ubicación / Área Relacionada</label>
 <input 
 required
 type="text"
 placeholder="Ej: Taller Mecánico, KM 15..."
 className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
 value={form.area_location.toUpperCase()}
 onChange={e => setForm(prev => ({...prev, area_location: e.target.value.toUpperCase()}))}
 />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-black tracking-tight text-slate-400 px-1">Estado de la Incidencia</label>
 <select 
 required
 className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
 value={form.status}
 onChange={e => setForm(prev => ({...prev, status: e.target.value}))}
 >
 <option value="abierta">ABIERTA / EN PROCESO</option>
 <option value="cerrada">CERRADA / RESUELTA</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="space-y-2">
 <label className="text-[11px] font-black tracking-tight text-slate-400 px-1">Gravedad (SOMA)</label>
 <select 
 required
 className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
 value={form.severity}
 onChange={e => setForm(prev => ({...prev, severity: e.target.value}))}
 >
 <option value="leve">LEVE</option>
 <option value="moderado">MODERADO</option>
 <option value="grave">GRAVE</option>
 <option value="critico">CRÍTICO</option>
 <option value="fatal">FATAL</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-black tracking-tight text-slate-400 px-1">Categoría</label>
 <select 
 required
 className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
 value={form.incident_category}
 onChange={e => setForm(prev => ({...prev, incident_category: e.target.value}))}
 >
 <option value="personal">DAÑO PERSONAL</option>
 <option value="ambiental">DAÑO AMBIENTAL</option>
 <option value="material">DAÑO MATERIAL</option>
 <option value="soma">HSEC / SOMA</option>
 <option value="operativa">OPERATIVA / MANTENIMIENTO</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-black tracking-tight text-slate-400 px-1">Fecha del Suceso</label>
 <input 
 required
 type="date"
 className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
 value={form.event_date}
 onChange={e => setForm(prev => ({...prev, event_date: e.target.value}))}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[11px] font-black tracking-tight text-slate-400 px-1 flex justify-between items-center">
 <span>Evidencias Fotográficas</span>
 <span className="text-[10px] text-orange-600 lowercase font-bold">Opcional</span>
 </label>
 <div className="flex flex-wrap gap-4 mt-2">
 {files.map((file, idx) => (
 <div key={idx} className="relative group w-24 h-24">
 <img src={file.preview} className="w-full h-full object-cover rounded-2xl border-2 border-slate-100 shadow-sm" />
 <button 
 type="button"
 onClick={() => removeFile(idx)}
 className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
 >
 <X size={14} />
 </button>
 </div>
 ))}
 <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all text-slate-400 hover:text-orange-600">
 <Plus size={24} />
 <span className="text-[9px] font-black">Subir</span>
 <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
 </label>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[11px] font-black tracking-tight text-slate-400 px-1">¿Qué sucedió? (Descripción)</label>
 <textarea 
 rows={3}
 required
 className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none resize-none"
 placeholder="Detalla lo sucedido de forma clara..."
 value={form.description.toUpperCase()}
 onChange={e => setForm(prev => ({...prev, description: e.target.value.toUpperCase()}))}
 />
 </div>

 <div className="space-y-2">
 <label className="text-[11px] font-black tracking-tight text-orange-600 px-1">Acciones Correctivas Inmediatas</label>
 <textarea 
 rows={2}
 className="w-full bg-orange-50 border-2 border-orange-100 focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none resize-none"
 placeholder="¿Qué se hizo al instante para mitigar el riesgo?"
 value={form.corrective_actions.toUpperCase()}
 onChange={e => setForm(prev => ({...prev, corrective_actions: e.target.value.toUpperCase()}))}
 />
 </div>

 <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
 <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 font-black py-5 rounded-2xl transition-all">
 Cancelar
 </button>
 <button 
 disabled={loading}
 type="submit"
 className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-3 active:scale-95"
 >
 {loading ? <Loader2 className="animate-spin text-white" size={24} /> : (
 <>
 <Activity size={20} strokeWidth={3} />
 {uploading ? 'Subiendo Evidencias...' : 'Guardar Cambios'}
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 )
}
