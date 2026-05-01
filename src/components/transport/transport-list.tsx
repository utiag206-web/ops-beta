'use client'

import { Bus, Calendar, DollarSign, User, CheckCircle2, AlertCircle } from 'lucide-react'

interface TransportListProps {
  payments: any[]
  isWorker?: boolean
}

export function TransportList({ payments, isWorker = false }: TransportListProps) {
  if (payments.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <Bus className="text-slate-300" size={32} />
        </div>
        <p className="font-medium text-slate-700">Sin registros de pasajes</p>
        <p className="text-xs text-slate-500 mt-1">No se han registrado pagos de transporte.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {isWorker ? 'Mi Pasaje' : payment.worker?.name || 'Sistema'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm font-bold text-slate-600">Transporte / Pasajes</span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm font-bold text-slate-500">{new Date(payment.date).toLocaleDateString()}</span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm font-black text-slate-800">S/ {Number(payment.amount).toFixed(2)}</span>
                </td>
                <td className="py-5 px-6 text-center">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase border shadow-sm ${
                    payment.status === 'paid' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {payments.map((payment) => (
          <div key={payment.id} className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Bus size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Concepto</p>
                  <p className="text-sm font-black text-slate-800 uppercase">Pasajes / Movilidad</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase border shadow-sm ${
                payment.status === 'paid' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reembolso</p>
                <p className="text-lg font-black text-slate-900 tracking-tighter">S/ {Number(payment.amount).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                <p className="text-xs font-bold text-slate-600">{new Date(payment.date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
               <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                 <User size={12} />
               </div>
               <span className="text-[10px] font-bold text-slate-500 uppercase">{isWorker ? 'Mi Registro' : payment.worker?.name || 'Sistema'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  )
}
