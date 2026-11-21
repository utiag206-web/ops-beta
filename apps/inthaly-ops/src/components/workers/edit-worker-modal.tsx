'use client'

import { useState, useActionState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, UserCog, AlertCircle, Loader2 } from 'lucide-react'
import { updateWorker } from '@/app/(main)/workers/actions'

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close modal automatically on success
  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state?.success, onClose])

  if (!isOpen || !worker || !mounted) return null

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-slate-200 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-edit-worker-title"
      >
        {/* Cabecera Fija */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <h2 id="modal-edit-worker-title" className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
              <UserCog size={18} />
            </span>
            Editar Trabajador
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario con Scroll Interno */}
        <form id="edit-worker-form" action={formAction} className="flex flex-col flex-1 overflow-hidden">
          <input type="hidden" name="id" value={worker.id} />
          <input type="hidden" name="existing_photo_url" value={worker.photo_url || ''} />

          <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
            {state?.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Selector de Fotografía */}
            <div className="flex flex-col items-center gap-2.5 pb-2 border-b border-slate-100 mb-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                {previewUrl ? (
                  <img src={previewUrl} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-slate-400">{(worker.name || 'T').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1 px-3.5 rounded-full transition-colors font-medium border border-slate-200">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit_name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombres <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit_name"
                  name="name"
                  type="text"
                  required
                  defaultValue={worker.name}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm placeholder:text-slate-400"
                />
              </div>
              <div>
                <label htmlFor="edit_last_name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Apellidos <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit_last_name"
                  name="last_name"
                  type="text"
                  required
                  defaultValue={worker.last_name || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm placeholder:text-slate-400"
                  placeholder="Ej. Pérez Gómez"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit_dni" className="block text-xs font-semibold text-slate-700 mb-1">
                  DNI / Documento <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit_dni"
                  name="dni"
                  type="text"
                  required
                  defaultValue={worker.dni}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm font-mono"
                />
              </div>
              <div>
                <label htmlFor="edit_phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  id="edit_phone"
                  name="phone"
                  type="tel"
                  defaultValue={worker.phone || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit_position" className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo / Ocupación <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit_position"
                  name="position"
                  type="text"
                  required
                  defaultValue={worker.position}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="edit_status" className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado
                </label>
                <select 
                  id="edit_status" 
                  name="status"
                  defaultValue={worker.status} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="edit_hire_date" className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Contratación
              </label>
              <input
                id="edit_hire_date"
                name="hire_date"
                type="date"
                defaultValue={worker.hire_date || ''}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Pie Fijo Siempre Visible */}
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
