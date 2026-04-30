'use client'

import { useState } from 'react'
import { Coins, Calendar, User, X, Loader2, Save, DollarSign, Bus } from 'lucide-react'
import { createBonus } from '@/app/(main)/bonuses/actions'

interface AddBonusModalProps {
  workers: any[]
  onSuccess: () => void
  onClose: () => void
}

export function AddBonusModal({ workers, onSuccess, onClose }: AddBonusModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<'bono' | 'pasaje'>('bono')


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    // We no longer rely on selectedWorker for the error check
    // Native HTML required validation handles this

    const formData = new FormData(e.currentTarget)
    const worker_id = formData.get('worker_id') as string
    let bonus_type = formData.get('bonus_type') as string
    const amount = Number(formData.get('amount'))
    const date = formData.get('date') as string
    const status = formData.get('status') as 'paid' | 'pending'

    // Prepend type if pasaje to reuse the same column safely
    if (type === 'pasaje') {
      bonus_type = `Pasaje: ${bonus_type}`
    }

    if (!worker_id || !bonus_type || !amount || !date) {
      setError('Todos los campos son obligatorios')
      setIsPending(false)
      return
    }

    try {
      const result = await createBonus({ worker_id, bonus_type, amount, date, status })
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Error al registrar el registro')
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
        <div className={`p-6 bg-gradient-to-r text-white flex justify-between items-center ${type === 'bono' ? 'from-amber-600 to-amber-500' : 'from-blue-600 to-blue-500'}`}>
          <div>
            <h3 className="text-xl font-bold">{type === 'bono' ? 'Registrar Bono' : 'Registrar Pasaje'}</h3>
            <p className="text-white/80 text-xs">Asigna un {type === 'bono' ? 'bono' : 'pago por pasaje'} a un trabajador</p>
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
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de Registro</label>
            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button 
                type="button" 
                onClick={() => setType('bono')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${type === 'bono' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Bono
              </button>
              <button 
                type="button" 
                onClick={() => setType('pasaje')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${type === 'pasaje' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Pasaje
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                Trabajador
              </span>
            </label>
            <select
              name="worker_id"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white"
              required
              defaultValue=""
            >
              <option value="" disabled>Seleccionar trabajador...</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} {worker.last_name || ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
              {type === 'bono' ? <Coins size={16} className="text-slate-400" /> : <Bus size={16} className="text-slate-400" />}
              {type === 'bono' ? 'Concepto del Bono' : 'Concepto del Pasaje'}
            </label>
            <input
              name="bonus_type"
              type="text"
              placeholder={type === 'bono' ? "Ej: Bono de Producción, Puntualidad" : "Ej: Pasaje Lima-Mina, Retorno"}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white"
              required
            />
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
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white"
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
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Estado Inicial</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="pending" defaultChecked className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-slate-600">Pendiente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="paid" className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-slate-600">Pagado</span>
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
              className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isPending ? 'Guardando...' : type === 'bono' ? 'Registrar Bono' : 'Registrar Pasaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
