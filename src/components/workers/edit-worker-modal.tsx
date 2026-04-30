'use client'

import { useState, useActionState, useEffect } from 'react'
import { X, UserCog, AlertCircle, Loader2 } from 'lucide-react'
import { updateWorker } from '@/app/(dashboard)/workers/actions'

interface EditWorkerModalProps {
  isOpen: boolean
  onClose: () => void
  worker: any
}

const initialState = {
  error: null as string | null,
  success: false as boolean,
}

export function EditWorkerModal({ isOpen, onClose, worker }: EditWorkerModalProps) {
  const [state, formAction, isPending] = useActionState(updateWorker, initialState)
  const [previewUrl, setPreviewUrl] = useState<string | null>(worker?.photo_url || null)

  // Close modal automatically on success
  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state?.success, onClose])

  if (!isOpen || !worker) return null

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCog size={20} className="text-blue-600" />
            Editar Trabajador
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="edit-worker-form" action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={worker.id} />
            <input type="hidden" name="existing_photo_url" value={worker.photo_url || ''} />

            {state?.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle size={18} />
                <span>{state.error}</span>
              </div>
            )}

            <div className="flex flex-col items-center gap-3 pb-2 border-b border-slate-100 mb-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-slate-400">{worker.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm py-1.5 px-4 rounded-full transition-colors font-medium">
                Cambiar Fotografía
                <input 
                  type="file" 
                  name="photo" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoChange} 
                />
              </label>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo *</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={worker.name}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dni" className="block text-sm font-medium text-slate-700 mb-1">DNI / Documento *</label>
                <input
                  id="dni"
                  name="dni"
                  type="text"
                  required
                  defaultValue={worker.dni}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={worker.phone || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-1">Cargo *</label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  required
                  defaultValue={worker.position}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select 
                  id="status" 
                  name="status"
                  defaultValue={worker.status} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="hire_date" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Contratación</label>
              <input
                id="hire_date"
                name="hire_date"
                type="date"
                defaultValue={worker.hire_date || ''}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
              />
            </div>
            
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg transition-colors shadow-sm flex items-center justify-center"
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
