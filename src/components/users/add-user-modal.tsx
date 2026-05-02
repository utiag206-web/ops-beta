'use client'

import { useState, useActionState, useEffect } from 'react'
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react'
import { createUser } from '@/app/(dashboard)/users/actions'
import { useRouter } from 'next/navigation'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  availableWorkers: any[]
}

const initialState = {
  error: null as string | null,
  success: false as boolean,
}

export function AddUserModal({ isOpen, onClose, availableWorkers }: AddUserModalProps) {
  const [state, formAction, isPending] = useActionState(createUser, initialState)
  const router = useRouter()
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [workerName, setWorkerName] = useState('')

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onClose()
    }
  }, [state?.success, onClose, router])

  const handleWorkerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedWorkerId(id)
    const worker = availableWorkers.find(w => w.id === id)
    if (worker) {
      setWorkerName(worker.name)
    } else {
      setWorkerName('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" />
            Invitar Usuario
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form action={formAction} className="p-6 space-y-4 overflow-y-auto">
          {state?.error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              <span>{state.error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vincular Trabajador (Opcional)</label>
            <select
              value={selectedWorkerId}
              onChange={handleWorkerSelect}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 bg-white"
            >
              <option value="">-- Seleccionar un trabajador existente --</option>
              {availableWorkers.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.position})</option>
              ))}
            </select>
            <input type="hidden" name="worker_id" value={selectedWorkerId} />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo *</label>
            <input
              name="name"
              type="text"
              required
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 bg-white"
              placeholder="Ej. Maria Lopez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electr&oacute;nico *</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 bg-white"
              placeholder="usuario@empresa.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contrase&ntilde;a Temporal *</label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 bg-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rol *</label>
              <select
                name="role_id"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 bg-white"
              >
                <option value="admin">Administrador</option>
                <option value="gerente">Gerente</option>
                <option value="jefe_area">Jefe de Área</option>
                <option value="almacen">Almacén</option>
                <option value="operaciones">Operaciones</option>
                <option value="trabajador">Trabajador</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Área / Departamento *</label>
            <select
              name="area"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 bg-white font-medium"
            >
              <option value="">-- Seleccionar Área --</option>
              <option value="Gerencia General">Gerencia General</option>
              <option value="Administración">Administración</option>
              <option value="Operaciones">Operaciones</option>
              <option value="Almacén y Mantenimiento">Almacén y Mantenimiento</option>
              <option value="Seguridad SOMA">Seguridad SOMA</option>
              <option value="Cocina">Cocina</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center shadow-sm"
            >
              {isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
