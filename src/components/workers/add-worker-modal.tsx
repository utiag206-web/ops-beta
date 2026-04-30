'use client'

import { useState, useActionState, useEffect } from 'react'
import { X, UserPlus, AlertCircle, Loader2 } from 'lucide-react'
import { createWorker } from '@/app/(main)/workers/actions'

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-[2rem] sm:rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-300">
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <UserPlus size={22} className="text-blue-600" />
            Nuevo Trabajador
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <form id="add-worker-form" action={formAction} className="space-y-5">
            {state?.error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in shake duration-500">
                <AlertCircle size={20} className="shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre Completo *</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-5 py-3.5 md:py-4 border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none transition-all text-slate-900 bg-slate-50/50 font-bold"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="dni" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">DNI / Documento *</label>
                <input
                  id="dni"
                  name="dni"
                  type="text"
                  required
                  className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none transition-all text-slate-900 bg-slate-50/50 font-bold"
                  placeholder="Ej. 12345678"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Teléfono</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none transition-all text-slate-900 bg-slate-50/50 font-bold"
                  placeholder="Ej. 987654321"
                />
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cargo *</label>
              <input
                id="position"
                name="position"
                type="text"
                required
                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none transition-all text-slate-900 bg-slate-50/50 font-bold"
                placeholder="Ej. Operador de Maquinaria"
              />
            </div>

            <div>
              <label htmlFor="hire_date" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fecha de Contratación</label>
              <input
                id="hire_date"
                name="hire_date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none transition-all text-slate-900 bg-slate-50/50 font-bold"
              />
            </div>
            
            <div className="pt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-6 py-4 border-2 border-slate-100 text-slate-600 rounded-2xl hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center active:scale-95"
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Confirmar Registro'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>iv>
          </form>
        </div>
      </div>
    </div>
  )
}
