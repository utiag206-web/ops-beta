'use client'

import { useState } from 'react'
import { AddWorkerModal } from '@/components/workers/add-worker-modal'
import { EditWorkerModal } from '@/components/workers/edit-worker-modal'
import { deleteWorker, reactivateWorker, getWorkers, exportWorkersAllData } from '@/app/(main)/workers/actions'
import { Search, UserMinus, UserCheck, Edit2, Trash2, Loader2, User, Folder, Upload, Plus, Filter, Download } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

type Worker = {
 id: string
 name: string
 dni: string
 position: string
 status: string
 phone: string | null
 hire_date: string | null
 photo_url: string | null
 created_at: string
}

export function WorkersList({ workers, canManage = false }: { workers: Worker[], canManage?: boolean }) {
 const router = useRouter()
 const [isAddModalOpen, setIsAddModalOpen] = useState(false)
 const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
 const [searchTerm, setSearchTerm] = useState('')
 const [isDeleting, setIsDeleting] = useState<string | null>(null) // the worker id currently being deleted
 const [activeTab, setActiveTab] = useState<'activo' | 'inactivo'>('activo')
 const [isExporting, setIsExporting] = useState(false)

 const handleExportExcel = async () => {
   setIsExporting(true)
   try {
     const realWorkers = await exportWorkersAllData()
     
     if (!realWorkers || realWorkers.length === 0) {
       toast.error('No hay trabajadores para exportar')
       return
     }

     const samples = realWorkers.map((w: any) => ({
       codigo: w.cod || w.codigo || '',
       nombres: w.name || '',
       apellidos: w.last_name || '',
       dni: w.document_number || w.dni || '',
       cargo: w.position || '',
       telefono: w.phone || w.personal?.phone_number || '',
       fecha_ingreso: w.hire_date ? new Date(w.hire_date).toISOString().split('T')[0] : '',
       fecha_cese: w.termination_date ? new Date(w.termination_date).toISOString().split('T')[0] : '',
       estado: (w.status?.toLowerCase() === 'active' || w.status?.toLowerCase() === 'activo') ? 'Activo' : 'Inactivo',
       
       // Datos Personales
       fecha_nacimiento: w.personal?.birth_date ? new Date(w.personal.birth_date).toISOString().split('T')[0] : '',
       genero: w.personal?.gender || '',
       estado_civil: w.personal?.marital_status || '',
       hijos: w.personal?.children_count || 0,
       direccion: w.personal?.address || '',
       distrito: w.personal?.district || '',
       provincia: w.personal?.province || '',
       departamento: w.personal?.department || '',
       contacto_emergencia: w.personal?.emergency_contact_name || '',
       tel_emergencia: w.personal?.emergency_contact_phone || '',
       relacion_emergencia: w.personal?.emergency_contact_relation || '',
       licencia_conducir: w.personal?.driver_license || '',
       categoria_trabajador: w.personal?.worker_category || '',
       
       // Datos Financieros
       sueldo_mensual: w.financial?.monthly_salary || 0,
       tarifa_diaria: w.financial?.daily_rate || 0,
       banco: w.financial?.bank_name || '',
       cuenta_bancaria: w.financial?.account_number || '',
       cci: w.financial?.cci || '',
       sistema_pension: w.financial?.pension_system || '',
       cuspp: w.financial?.cuspp || '',
       banco_cts: w.financial?.cts_bank || '',
       cuenta_cts: w.financial?.cts_account || '',
     }))

     const ws = XLSX.utils.json_to_sheet(samples)
     const wb = XLSX.utils.book_new()
     XLSX.utils.book_append_sheet(wb, ws, 'Trabajadores')
     XLSX.writeFile(wb, 'Listado_Trabajadores.xlsx')
     toast.success('Excel exportado correctamente')
   } catch (error) {
     console.error(error)
     toast.error('Error al exportar a Excel')
   } finally {
     setIsExporting(false)
   }
 }

 const filteredWorkers = workers.filter(worker => {
 const isWorkerActive = worker.status?.toUpperCase() === 'ACTIVO' || worker.status?.toUpperCase() === 'ACTIVE'
 const statusMatch = activeTab === 'activo' ? isWorkerActive : !isWorkerActive

 const nameMatch = (worker.name || '').toLowerCase().includes(searchTerm.toLowerCase())
 const dniMatch = (worker.dni || '').includes(searchTerm)
 const positionMatch = (worker.position || '').toLowerCase().includes(searchTerm.toLowerCase())
 return statusMatch && (nameMatch || dniMatch || positionMatch)
 })

 const handleDelete = async (id: string, name: string) => {
 if (confirm(`¿Estás seguro que deseas desactivar a ${name}? Mantendrá su historial pero ya no figurará en la lista de colaboradores activos.`)) {
 setIsDeleting(id)
 try {
 const res = await deleteWorker(id)
 if (res.success) {
 toast.success('Colaborador desactivado correctamente')
 router.refresh()
 } else {
 toast.error(res.error || 'Error al desactivar el colaborador')
 }
 } catch (err: any) {
 toast.error('Error al desactivar: ' + err.message)
 } finally {
 setIsDeleting(null)
 }
 }
 }

 const handleReactivate = async (id: string, name: string) => {
 if (confirm(`¿Deseas reactivar a ${name}? Volverá a figurar en la lista de colaboradores activos.`)) {
 setIsDeleting(id)
 try {
 const res = await reactivateWorker(id)
 if (res.success) {
 toast.success('Colaborador reactivado correctamente')
 router.refresh()
 } else {
 toast.error(res.error || 'Error al reactivar el colaborador')
 }
 } catch (err: any) {
 toast.error('Error al reactivar: ' + err.message)
 } finally {
 setIsDeleting(null)
 }
 }
 }

 return (
 <div className="space-y-4 md:space-y-6">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-50">
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Gestión de Personal</h1>
 <p className="text-xs md:text-sm text-slate-500 font-medium">Listado maestro de trabajadores y colaboradores.</p>
 </div>
 {canManage && (
 <div className="flex items-center gap-3">
 <button 
 onClick={handleExportExcel}
 disabled={isExporting}
 className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-600 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
 >
 {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
 <span className="text-sm md:text-base">Exportar</span>
 </button>
 <Link 
 href="/workers/import"
 className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-600 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
 >
 <Upload size={18} />
 <span className="text-sm md:text-base">Importar</span>
 </Link>
 <button 
 onClick={() => setIsAddModalOpen(true)}
 className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
 >
 <Plus size={18} />
 <span className="text-sm md:text-base">Nuevo</span>
 </button>
 </div>
 )}
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="md:col-span-2 relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
 <input 
 type="text" 
 placeholder="Buscar por nombre, DNI o cargo..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl md:rounded-2xl py-3 md:py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none shadow-sm"
 />
 </div>
 <div className="flex gap-2">
 <button className="flex-1 bg-white border-2 border-slate-100 hover:bg-slate-50 rounded-xl md:rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2 transition-all shadow-sm py-3 md:py-0">
 <Filter size={18} />
 Filtrar
 </button>
 </div>
 </div>
 
 <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
 {/* Pestañas de Estado */}
 <div className="flex border-b border-slate-100 bg-slate-50/30 px-6 pt-4">
 <button
 onClick={() => setActiveTab('activo')}
 className={`pb-4 px-6 text-xs font-black tracking-wider border-b-2 transition-all cursor-pointer ${
 activeTab === 'activo' 
 ? 'border-blue-600 text-blue-600' 
 : 'border-transparent text-slate-400 hover:text-slate-600'
 }`}
 >
 Activos ({workers.filter(w => w.status?.toUpperCase() === 'ACTIVO' || w.status?.toUpperCase() === 'ACTIVE').length})
 </button>
 <button
 onClick={() => setActiveTab('inactivo')}
 className={`pb-4 px-6 text-xs font-black tracking-wider border-b-2 transition-all cursor-pointer ${
 activeTab === 'inactivo' 
 ? 'border-blue-600 text-blue-600' 
 : 'border-transparent text-slate-400 hover:text-slate-600'
 }`}
 >
 Inactivos ({workers.filter(w => w.status?.toUpperCase() !== 'ACTIVO' && w.status?.toUpperCase() !== 'ACTIVE').length})
 </button>
 </div>
 {filteredWorkers.length > 0 ? (
 <>
 {/* Desktop Table View */}
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-100">
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Colaborador</th>
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Documento</th>
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Puesto / Cargo</th>
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight text-center">Estado</th>
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight text-right">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {filteredWorkers.map((worker) => (
 <tr key={worker.id} className="hover:bg-slate-50/50 transition-colors group">
 <td className="py-5 px-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-110">
 {worker.photo_url ? (
 <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
 ) : (
 <User size={20} className="text-slate-400" />
 )}
 </div>
 <div>
 <p className="text-base font-bold text-slate-800 tracking-tight">{worker.name}</p>
 <p className="text-[10px] font-bold text-slate-400 mt-0.5">{worker.hire_date ? `Ingreso: ${new Date(worker.hire_date).toLocaleDateString()}` : 'Sin fecha de ingreso'}</p>
 </div>
 </div>
 </td>
 <td className="py-5 px-6">
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-blue-600 tracking-tight">DNI / CE</span>
 <span className="text-sm font-bold text-slate-700">{worker.dni}</span>
 </div>
 </td>
 <td className="py-5 px-6">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-700 capitalize">{worker.position}</span>
 </div>
 </td>
 <td className="py-5 px-6 text-center">
 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm ${
 (worker.status?.toLowerCase() === 'active' || worker.status?.toLowerCase() === 'activo') 
 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
 : 'bg-slate-100 text-slate-600 border-slate-200'
 }`}>
 <div className={`w-2 h-2 rounded-full ${
 (worker.status?.toLowerCase() === 'active' || worker.status?.toLowerCase() === 'activo') 
 ? 'bg-emerald-500 animate-pulse' 
 : 'bg-slate-400'
 }`} />
 <span className="text-[10px] font-black uppercase tracking-wider">
 {(worker.status?.toLowerCase() === 'active' || worker.status?.toLowerCase() === 'activo') ? 'Activo' : 'Inactivo'}
 </span>
 </div>
 </td>
 <td className="py-5 px-6 text-right">
 <div className="flex items-center justify-end gap-2 transition-all">
 <Link
 href={`/workers/${worker.id}`}
 className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
 title="Ver Perfil"
 >
 <Folder size={16} />
 </Link>
 {canManage && (
 <>
 <button 
 onClick={() => setEditingWorker(worker)}
 className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
 title="Editar"
 >
 <Edit2 size={16} />
 </button>
 {activeTab === 'activo' ? (
 <button 
 onClick={() => handleDelete(worker.id, worker.name)}
 disabled={isDeleting === worker.id}
 className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
 title="Desactivar Colaborador"
 >
 {isDeleting === worker.id ? (
 <Loader2 size={16} className="animate-spin" />
 ) : (
 <UserMinus size={16} />
 )}
 </button>
 ) : (
 <button 
 onClick={() => handleReactivate(worker.id, worker.name)}
 disabled={isDeleting === worker.id}
 className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50"
 title="Reactivar Colaborador"
 >
 {isDeleting === worker.id ? (
 <Loader2 size={16} className="animate-spin" />
 ) : (
 <UserCheck size={16} />
 )}
 </button>
 )}
 </>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Mobile Card View */}
 <div className="md:hidden divide-y divide-slate-100">
 {filteredWorkers.map((worker) => (
 <div key={worker.id} className="p-6 space-y-4">
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
 {worker.photo_url ? (
 <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
 ) : (
 <User size={24} className="text-slate-400" />
 )}
 </div>
 <div>
 <p className="text-base font-bold text-slate-800 tracking-tight leading-tight mb-1">{worker.name}</p>
 <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${
 (worker.status?.toLowerCase() === 'active' || worker.status?.toLowerCase() === 'activo') 
 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
 : 'bg-slate-100 text-slate-600 border-slate-200'
 }`}>
 <div className={`w-1.5 h-1.5 rounded-full ${
 (worker.status?.toLowerCase() === 'active' || worker.status?.toLowerCase() === 'activo') 
 ? 'bg-emerald-500 animate-pulse' 
 : 'bg-slate-400'
 }`} />
 <span className="text-[9px] font-black uppercase tracking-wider">
 {(worker.status?.toLowerCase() === 'active' || worker.status?.toLowerCase() === 'activo') ? 'Activo' : 'Inactivo'}
 </span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <Link
 href={`/workers/${worker.id}`}
 className="p-2.5 bg-slate-50 text-slate-400 rounded-xl border border-slate-100"
 >
 <Folder size={18} />
 </Link>
 </div>
 </div>

 <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100/50">
 <div>
 <p className="text-[10px] font-bold text-slate-400 tracking-tight mb-1">DNI / Documento</p>
 <p className="text-sm font-bold text-slate-700">{worker.dni}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-bold text-slate-400 tracking-tight mb-1">Cargo / Puesto</p>
 <p className="text-sm font-bold text-slate-700 truncate">{worker.position}</p>
 </div>
 </div>

 {canManage && (
 <div className="flex gap-3 pt-1">
 <button 
 onClick={() => setEditingWorker(worker)}
 className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-[10px] font-bold tracking-tight transition-all active:scale-95 shadow-sm"
 >
 <Edit2 size={14} />
 Editar
 </button>
 {activeTab === 'activo' ? (
 <button 
 onClick={() => handleDelete(worker.id, worker.name)}
 disabled={isDeleting === worker.id}
 className="flex-1 flex items-center justify-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 py-2.5 rounded-xl text-[10px] font-bold tracking-tight transition-all active:scale-95 shadow-sm"
 >
 {isDeleting === worker.id ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
 Desactivar
 </button>
 ) : (
 <button 
 onClick={() => handleReactivate(worker.id, worker.name)}
 disabled={isDeleting === worker.id}
 className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 py-2.5 rounded-xl text-[10px] font-bold tracking-tight transition-all active:scale-95 shadow-sm"
 >
 {isDeleting === worker.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
 Reactivar
 </button>
 )}
 </div>
 )}
 </div>
 ))}
 </div>
 </>
 ) : (
 <div className="py-24 text-center">
 <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
 <UserMinus size={40} />
 </div>
 <p className="text-slate-500 font-bold text-lg">No se encontraron colaboradores</p>
 <p className="text-slate-400 text-sm font-medium mt-1">Intenta con otros términos de búsqueda.</p>
 </div>
 )}
 </div>

 {isAddModalOpen && (
 <AddWorkerModal 
 isOpen={isAddModalOpen} 
 onClose={() => setIsAddModalOpen(false)} 
 />
 )}

 {editingWorker && (
 <EditWorkerModal
 isOpen={!!editingWorker}
 onClose={() => setEditingWorker(null)}
 worker={editingWorker}
 />
 )}
 </div>
 )
}
