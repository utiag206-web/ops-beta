'use client'

import { useState } from 'react'
import { Package, Calendar, User, X, Loader2, Save } from 'lucide-react'
import { createPPEDelivery } from '@/app/(main)/ppe/actions'

interface AddPPEDeliveryModalProps {
  workers: any[]
  onSuccess: () => void
  onClose: () => void
}

export function AddPPEDeliveryModal({ workers, onSuccess, onClose }: AddPPEDeliveryModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const worker_id = formData.get('worker_id') as string
    const ppe_type = formData.get('ppe_type') as string
    const delivery_date = formData.get('delivery_date') as string

    if (!worker_id || !ppe_type || !delivery_date) {
      setError('Todos los campos son obligatorios')
      setIsPending(false)
      return
    }

    try {
      const result = await createPPEDelivery({ worker_id, ppe_type, delivery_date })
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Error al registrar la entrega')
      }
    } catch (err) {
      setError('Error inesperado')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 bg-gradient-to-r from-blue-800 to-blue-600 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Registrar Entrega de EPP</h3>
            <p className="text-blue-100 text-xs">Asigna equipo de protección a un trabajador</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <X size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              Trabajador
            </label>
            <select
              name="worker_id"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-800 bg-white"
              required
            >
              <option value="">Seleccionar trabajador...</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name} - {worker.position}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
              <Package size={16} className="text-slate-400" />
              Tipo de EPP
            </label>
            <input
              name="ppe_type"
              type="text"
              placeholder="Ej: Casco, Guantes, Botas"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-800 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              Fecha de Entrega
            </label>
            <input
              name="delivery_date"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-800 bg-white"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isPending ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
