'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Calendar, CheckCircle2, PenTool, Loader2, Clock } from 'lucide-react'
import { SignaturePad } from './signature-pad'
import { signPPEDelivery } from '@/app/(main)/ppe/actions'

interface PPEListProps {
  deliveries: any[]
  isWorker?: boolean
}

export function PPEList({ deliveries: initialDeliveries, isWorker = false }: PPEListProps) {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState(initialDeliveries)
  const [signingId, setSigningId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSign = async (signature: string) => {
    if (!signingId) return
    setIsSubmitting(true)

    try {
      const result = await signPPEDelivery(signingId, signature)
      if (result.success) {
        setDeliveries(prev => prev.map(d => 
          d.id === signingId ? { ...d, status: 'signed' } : d
        ))
        setSigningId(null)
        router.refresh()
      } else {
        alert(result.error)
      }
    } catch (err) {
      alert('Error inesperado al firmar')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (deliveries.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <Shield className="text-slate-300" size={32} />
        </div>
        <p className="font-medium text-slate-700">Sin entregas de EPP</p>
        <p className="text-xs text-slate-500 mt-1">No se han registrado entregas de equipo de protección personal.</p>
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
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Equipo / EPP</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Fecha</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Hora</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
              <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Firma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {deliveries.map((delivery) => (
              <tr key={delivery.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Shield size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {delivery.worker?.name || 'Sistema'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{delivery.ppe_type}</span>
                </td>
                <td className="py-5 px-6 text-center">
                  <span className="text-sm font-bold text-slate-800">
                    {new Date(delivery.delivery_date).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-5 px-6 text-center">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(delivery.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td className="py-5 px-6 text-center">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase border shadow-sm ${
                    (delivery.status === 'delivered' || delivery.status === 'signed')
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {(delivery.status === 'delivered' || delivery.status === 'signed') ? 'Entregado' : 'Pendiente'}
                  </span>
                </td>
                <td className="py-5 px-6 text-right">
                  {isWorker && delivery.status === 'pending_signature' ? (
                    <button 
                      onClick={() => setSigningId(delivery.id)}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl text-[10px] font-black transition-all shadow-sm uppercase tracking-tighter active:scale-95"
                    >
                      <PenTool size={14} />
                      Firmar Recibido
                    </button>
                  ) : (delivery.status === 'signed' || delivery.status === 'delivered' && delivery.signature_url) ? (
                    <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                      <CheckCircle2 size={14} />
                      Firmado
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase italic">Digital</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {deliveries.map((delivery) => (
          <div key={delivery.id} className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entregado a</p>
                  <p className="text-sm font-black text-slate-800 uppercase">{delivery.worker?.name || 'Sistema'}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase border shadow-sm ${
                (delivery.status === 'delivered' || delivery.status === 'signed')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {(delivery.status === 'delivered' || delivery.status === 'signed') ? 'Recibido' : 'Pendiente'}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Equipo / EPP</p>
                <p className="text-sm font-black text-slate-700 uppercase">{delivery.ppe_type}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                <p className="text-xs font-bold text-slate-600">{new Date(delivery.delivery_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} />
                  <span className="text-[10px] font-black uppercase">{new Date(delivery.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
               
               {isWorker && delivery.status === 'pending_signature' ? (
                <button 
                  onClick={() => setSigningId(delivery.id)}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-blue-100 uppercase tracking-widest"
                >
                  Firmar Ahora
                </button>
              ) : (delivery.status === 'signed' || delivery.status === 'delivered' && delivery.signature_url) ? (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                  <CheckCircle2 size={14} />
                  Documento Firmado
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {signingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          {isSubmitting ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center flex flex-col items-center">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
              <p className="font-bold text-slate-800">Procesando firma...</p>
            </div>
          ) : (
            <SignaturePad 
              onSave={handleSign}
              onCancel={() => setSigningId(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
