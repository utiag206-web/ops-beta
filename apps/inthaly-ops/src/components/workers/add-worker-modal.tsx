'use client'

import { useState, useActionState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react'
import { createWorker } from '@/app/(main)/workers/actions'
import { addOperationToQueue, addOfflineWorkerToCache } from '@/lib/offline-sync'
import { useOperationalContext } from '@/hooks'
import { useOffline } from '@/components/providers/offline-provider'
import { toast } from 'sonner'

interface AddWorkerModalProps {
  isOpen: boolean
  onClose: () => void
  onWorkerCreatedOffline?: (worker: any) => void
}

const initialState = {
  error: null as string | null,
  success: false as boolean,
}

export function AddWorkerModal({ isOpen, onClose, onWorkerCreatedOffline }: AddWorkerModalProps) {
  const [state, formAction, isPending] = useActionState(createWorker, initialState)
  const [mounted, setMounted] = useState(false)
  const { companyId } = useOperationalContext()
  const { isOnline, triggerSync } = useOffline()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close modal automatically on success
  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state?.success, onClose])

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : isOnline
    if (!online) {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const lastName = formData.get('last_name') as string
      const dni = formData.get('dni') as string
      const position = formData.get('position') as string
      const phone = (formData.get('phone') as string) || null
      const hireDate = (formData.get('hire_date') as string) || null
      const cod = (formData.get('cod') as string) || null

      if (!name || !dni || !position) {
        toast.error('Nombre, DNI y Cargo son obligatorios.')
        return
      }

      const tempId = `temp-${crypto.randomUUID()}`
      const offlineWorker = {
        id: tempId,
        name: name.toUpperCase(),
        last_name: lastName ? lastName.toUpperCase() : '',
        dni,
        position: position.toUpperCase(),
        phone,
        hire_date: hireDate || new Date().toISOString().split('T')[0],
        status: 'ACTIVO',
        created_at: new Date().toISOString(),
        company_id: companyId || 'local'
      }

      try {
        await addOperationToQueue({
          id: tempId,
          entity: 'workers',
          action: 'create_worker',
          payload: {
            name,
            last_name: lastName,
            dni,
            position,
            phone,
            hire_date: hireDate,
            cod
          },
          company_id: companyId || 'local'
        })

        if (companyId) {
          await addOfflineWorkerToCache(offlineWorker, companyId)
        }

        onWorkerCreatedOffline?.(offlineWorker)
        toast.info('Sin conexión. Trabajador registrado localmente en cola de sincronización.')
        onClose()
        triggerSync()
      } catch (err: any) {
        toast.error('Error al guardar localmente: ' + (err?.message || ''))
      }
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-slate-200 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-add-worker-title"
      >
        {/* Cabecera Fija */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <h2 id="modal-add-worker-title" className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
              <UserPlus size={18} />
            </span>
            Agregar Trabajador
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

        {/* Cuerpo del Formulario con Scroll Interno Suave */}
        <form id="add-worker-form" action={formAction} onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
            {state?.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombres <span className="text-rose-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm placeholder:text-slate-400"
                  placeholder="Ej. Juan Carlos"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Apellidos <span className="text-rose-500">*</span>
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm placeholder:text-slate-400"
                  placeholder="Ej. Pérez Gómez"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="dni" className="block text-xs font-semibold text-slate-700 mb-1">
                  DNI / Documento <span className="text-rose-500">*</span>
                </label>
                <input
                  id="dni"
                  name="dni"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm placeholder:text-slate-400 font-mono"
                  placeholder="Ej. 12345678"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm placeholder:text-slate-400"
                  placeholder="Ej. 987654321"
                />
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo / Ocupación <span className="text-rose-500">*</span>
              </label>
              <input
                id="position"
                name="position"
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm placeholder:text-slate-400"
                placeholder="Ej. Operador de Maquinaria"
              />
            </div>

            <div>
              <label htmlFor="hire_date" className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Contratación
              </label>
              <input
                id="hire_date"
                name="hire_date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Pie Fijo Siempre Visible (Acciones protegidas de desbordamiento) */}
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
                'Guardar Trabajador'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
