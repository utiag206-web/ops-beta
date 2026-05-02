'use client'

import { useState, useActionState, useEffect } from 'react'
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react'
import { createWorker } from '@/app/(dashboard)/workers/actions'

interface AddWorkerModalProps {
  isOpen: boolean
  onClose: () => void
}

const initialState = {
  error: null as string | null,
  success: false as boolean,
}

export function AddWorkerModal({ isOpen, onClose }: AddWorkerModalProps) {
  const [state, formAction, isPending] = useActionState(createWorker, initialState)

  // Close modal automatically on success
  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state?.success, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" />
            Agregar Trabajador
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="add-worker-form" action={formAction} className="space-y-4">
            {state?.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle size={18} />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo *</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dni" className="block text-sm font-medium text-slate-700 mb-1">DNI / Documento *</label>
                <input
                  id="dni"
                  name="dni"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                  placeholder="Ej. 12345678"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                  placeholder="Ej. 987654321"
                />
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-1">Cargo *</label>
              <input
                id="position"
                name="position"
                type="text"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                placeholder="Ej. Operador de Maquinaria"
              />
            </div>

            <div>
              <label htmlFor="hire_date" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Contratación</label>
              <input
                id="hire_date"
                name="hire_date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
              />
            </div>
            
            <div className="pt-6 flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-black uppercase text-xs tracking-widest transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black uppercase text-xs tracking-widest py-3 rounded-xl transition-colors shadow-lg shadow-blue-100 flex items-center justify-center"
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Trabajador'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
