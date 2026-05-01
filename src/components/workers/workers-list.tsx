'use client'

import { useState } from 'react'
import { AddWorkerModal } from '@/components/workers/add-worker-modal'
import { EditWorkerModal } from '@/components/workers/edit-worker-modal'
import { deleteWorker } from '@/app/(dashboard)/workers/actions'
import { Search, UserMinus, MoreVertical, Edit2, Trash2, Loader2, User, Folder, Upload, Plus, Filter } from 'lucide-react'
import Link from 'next/link'

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null) // the worker id currently being deleted

  const filteredWorkers = workers.filter(worker => {
    const nameMatch = (worker.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const dniMatch = (worker.dni || '').includes(searchTerm)
    const positionMatch = (worker.position || '').toLowerCase().includes(searchTerm.toLowerCase())
    return nameMatch || dniMatch || positionMatch
  })

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro que deseas eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      setIsDeleting(id)
      await deleteWorker(id)
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-50">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Gestión de Personal</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Listado maestro de trabajadores y colaboradores.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-3">
            <Link 
              href="/workers/import"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-600 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Upload size={18} />
              <span className="text-sm md:text-base">Importar</span>
            </Link>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
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
      
      <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {filteredWorkers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                    <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Documento</th>
                    <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Puesto / Cargo</th>
                    <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
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
                            <p className="text-base font-black text-slate-800 uppercase tracking-tight">{worker.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{worker.hire_date ? `Ingreso: ${new Date(worker.hire_date).toLocaleDateString()}` : 'Sin fecha de ingreso'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">DNI / CE</span>
                          <span className="text-sm font-bold text-slate-700">{worker.dni}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 capitalize">{worker.position}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase border shadow-sm ${
                          worker.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                          {worker.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
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
                              <button 
                                onClick={() => handleDelete(worker.id, worker.name)}
                                disabled={isDeleting === worker.id}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                                title="Eliminar"
                              >
                                {isDeleting === worker.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
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
                        <p className="text-base font-black text-slate-800 uppercase tracking-tight leading-tight mb-1">{worker.name}</p>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${
                          worker.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                          {worker.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
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
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DNI / Documento</p>
                      <p className="text-sm font-bold text-slate-700">{worker.dni}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cargo / Puesto</p>
                      <p className="text-sm font-bold text-slate-700 uppercase truncate">{worker.position}</p>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex gap-3 pt-1">
                      <button 
                        onClick={() => setEditingWorker(worker)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                      >
                        <Edit2 size={14} />
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(worker.id, worker.name)}
                        disabled={isDeleting === worker.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                      >
                        {isDeleting === worker.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Eliminar
                      </button>
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
              <p className="text-slate-500 font-black text-lg">No se encontraron colaboradores</p>
              <p className="text-slate-400 text-sm font-medium mt-1">Intenta con otros términos de búsqueda.</p>
            </div>
          )}
        </div>
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
