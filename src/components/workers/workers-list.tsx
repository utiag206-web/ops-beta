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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Personal</h1>
          <p className="text-slate-500 font-medium">Listado maestro de trabajadores y colaboradores.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-3">
            <Link 
              href="/workers/import"
              className="flex items-center gap-2 bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Upload size={20} />
              <span>Importar Excel</span>
            </Link>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              <Plus size={20} />
              <span>Nuevo Trabajador</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar trabajador por nombre, DNI o cargo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 focus:border-blue-500 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex-1 bg-white border-2 border-slate-100 hover:bg-slate-50 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2 transition-all shadow-sm">
            <Filter size={18} />
            Filtrar
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredWorkers.length > 0 ? (
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
