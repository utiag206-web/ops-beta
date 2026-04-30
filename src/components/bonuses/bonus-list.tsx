'use client'

import { useState } from 'react'
import { Coins, Calendar, Clock, CheckCircle2, AlertCircle, DollarSign, User } from 'lucide-react'
import { updateBonusStatus } from '@/app/(dashboard)/bonuses/actions'

interface BonusListProps {
  bonuses: any[]
  isWorker?: boolean
  isAdmin?: boolean
}

export function BonusList({ bonuses: initialBonuses, isWorker = false, isAdmin = false }: BonusListProps) {
  const [bonuses, setBonuses] = useState(initialBonuses)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!isAdmin) return
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'
    setLoadingId(id)

    try {
      const result = await updateBonusStatus(id, newStatus as 'paid' | 'pending')
      if (result.success) {
        setBonuses(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  if (bonuses.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <Coins className="text-slate-300" size={32} />
        </div>
        <p className="font-medium text-slate-700">Sin bonos registrados</p>
        <p className="text-xs text-slate-500 mt-1">No hay historial de bonificaciones disponibles.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bonuses.map((bonus) => (
              <tr key={bonus.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {bonus.worker?.name || 'Sistema'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm font-bold text-slate-600">{bonus.bonus_type}</span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm font-bold text-slate-500">{new Date(bonus.date).toLocaleDateString()}</span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm font-black text-slate-800">S/ {Number(bonus.amount).toFixed(2)}</span>
                </td>
                <td className="py-5 px-6 text-center">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase border shadow-sm ${
                    bonus.status === 'paid' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {bonus.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex items-center justify-end gap-2 transition-opacity">
                    {isAdmin && (
                      <button
                        disabled={loadingId === bonus.id}
                        onClick={() => handleToggleStatus(bonus.id, bonus.status)}
                        className={`p-2 rounded-xl transition-all ${
                          bonus.status === 'paid' 
                            ? 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50' 
                            : 'text-amber-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                        title={bonus.status === 'paid' ? 'Marcar como Pendiente' : 'Marcar como Pagado'}
                      >
                        {loadingId === bonus.id ? (
                          <Clock size={18} className="animate-spin" />
                        ) : bonus.status === 'paid' ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <AlertCircle size={18} />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
