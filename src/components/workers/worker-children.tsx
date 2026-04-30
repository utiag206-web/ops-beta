'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Baby } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { upsertWorkerChild, deleteWorkerChild } from '@/app/(dashboard)/workers/actions'

interface WorkerChild {
  id: string
  company_id: string
  worker_id: string
  nombre: string
  fecha_nacimiento: string
  genero: string
  created_at: string
}

export function WorkerChildren({ workerId, initialChildren, canManage = false }: { workerId: string, initialChildren: WorkerChild[], canManage?: boolean }) {
  const [children, setChildren] = useState<WorkerChild[]>(initialChildren)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingChild, setEditingChild] = useState<WorkerChild | null>(null)
  const router = useRouter()

  useEffect(() => {
    setChildren(initialChildren)
  }, [initialChildren])

  const [formData, setFormData] = useState({
    nombre: '',
    fecha_nacimiento: '',
    genero: 'M'
  })

  const calculateAge = (birthDate: string) => {
    const diffMs = Date.now() - new Date(birthDate).getTime()
    const ageDt = new Date(diffMs)
    return Math.abs(ageDt.getUTCFullYear() - 1970)
  }

  const handleOpenModal = (child?: WorkerChild) => {
    if (child) {
      setEditingChild(child)
      setFormData({
        nombre: child.nombre,
        fecha_nacimiento: child.fecha_nacimiento,
        genero: child.genero || 'M'
      })
    } else {
      setEditingChild(null)
      setFormData({
        nombre: '',
        fecha_nacimiento: '',
        genero: 'M'
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const data = new FormData()
    data.append('worker_id', workerId)
    data.append('nombre', formData.nombre)
    data.append('fecha_nacimiento', formData.fecha_nacimiento)
    data.append('genero', formData.genero)

    if (editingChild) {
      data.append('id', editingChild.id)
    }

    const result = await upsertWorkerChild(data)

    if (result.success) {
      setIsModalOpen(false)
      router.refresh()
    } else {
      alert(result.error)
    }

    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return
    
    const result = await deleteWorkerChild(id, workerId)
    if (!result.success) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between p-6 bg-slate-50/50 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
          Total devuelto: {children.length} {children.length === 1 ? 'registro' : 'registros'}
        </h3>
        {canManage && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> <span>Agregar Hijo</span>
          </button>
        )}
      </div>

      {children.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
          No hay hijos registrados para este trabajador.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-slate-500 font-bold w-1/2">Nombre Completo</th>
                <th className="py-3 px-4 text-slate-500 font-bold text-center">Edad</th>
                <th className="py-3 px-4 text-slate-500 font-bold text-center">Género</th>
                <th className="py-3 px-4 text-slate-500 font-bold text-center">Nacimiento</th>
                <th className="py-3 px-4 text-slate-500 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {children.map(child => (
                <tr key={child.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700">{child.nombre}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold">
                      {calculateAge(child.fecha_nacimiento)} años
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 font-medium">
                    {child.genero === 'M' ? 'Hombre' : child.genero === 'F' ? 'Mujer' : child.genero}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    {new Date(child.fecha_nacimiento).toLocaleDateString()}
                  </td>
                  {canManage && (
                    <td className="py-3 px-4 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(child)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(child.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL AGREGAR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">
                {editingChild ? 'Editar Hijo' : 'Agregar Hijo'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-medium text-slate-700" 
                  required 
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fecha de Nacimiento</label>
                  <input 
                    type="date" 
                    value={formData.fecha_nacimiento}
                    onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-medium text-slate-700" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Género</label>
                  <select 
                    value={formData.genero}
                    onChange={e => setFormData({...formData, genero: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-medium text-slate-700" 
                  >
                    <option value="M">Hombre</option>
                    <option value="F">Mujer</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : 'Guardar Información'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
