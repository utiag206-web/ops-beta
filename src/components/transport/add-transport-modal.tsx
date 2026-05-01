'use client'

import { useState } from 'react'
import { Bus, Calendar, User, X, Loader2, Save, DollarSign } from 'lucide-react'
import { createTransportPayment } from '@/app/(dashboard)/transport/actions'

interface AddTransportModalProps {
  workers: any[]
  onSuccess: () => void
  onClose: () => void
}

export function AddTransportModal({ workers, onSuccess, onClose }: AddTransportModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const worker_id = formData.get('worker_id') as string
    const amount = Number(formData.get('amount'))
    const date = formData.get('date') as string
    const status = formData.get('status') as 'paid' | 'pending'

    if (!worker_id || !amount || !date) {
      setError('Todos los campos son obligatorios')
      setIsPending(false)
      return
    }

    try {
      const result = await createTransportPayment({ worker_id, amount, date, status })
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Error al registrar el pasaje')
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
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Registrar Pasaje</h3>
            <p className="text-indigo-100 text-xs">Registra un pago de transporte para un trabajador</p>
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
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-slate-800 bg-white"
              required
            >
              <option value="">Seleccionar trabajador...</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <DollarSign size={16} className="text-slate-400" />
                Monto (S/)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-slate-800 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                Fecha
              </label>
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-slate-800 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Estado</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="paid" defaultChecked className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-slate-600">Pagado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="pending" className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-slate-600">Pendiente</span>
              </label>
            </div>
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
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isPending ? 'Guardando...' : 'Registrar Pasaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
