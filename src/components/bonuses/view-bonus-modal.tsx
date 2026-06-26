'use client'

import { X, Coins, User, Calendar, Info, CheckCircle2, AlertCircle, DollarSign, FileText, ExternalLink } from 'lucide-react'

interface ViewBonusModalProps {
 bonus: any
 onClose: () => void
}

export function ViewBonusModal({ bonus, onClose }: ViewBonusModalProps) {
 const isBono = bonus.type === 'bono'
 const isPago = bonus.type === 'pago'
 const isPasaje = bonus.type === 'pasaje'

 return (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
 <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
 {/* Header */}
 <div className={`p-6 bg-gradient-to-r text-white flex justify-between items-center ${
 isBono ? 'from-orange-600 to-amber-500' : 
 isPago ? 'from-emerald-600 to-emerald-500' : 'from-blue-600 to-indigo-500'
 }`}>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
 <Coins size={20} />
 </div>
 <div>
 <h3 className="text-lg font-black tracking-tight">Detalle del Registro</h3>
 <p className="text-white/80 text-[10px] font-bold tracking-tight">
 {isBono ? 'Bono de Personal' : isPago ? 'Pago Realizado' : 'Pasaje / Movilidad'}
 </p>
 </div>
 </div>
 <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer">
 <X size={20} />
 </button>
 </div>

 {/* Content */}
 <div className="p-8 space-y-6">
 <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
 {/* Colaborador */}
 <div className="flex items-start gap-3.5 pb-4 border-b border-slate-50">
 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
 <User size={16} />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Colaborador</p>
 <p className="text-sm font-bold text-slate-800 tracking-tight truncate">
 {bonus.worker?.name || 'Desconocido'}
 </p>
 </div>
 </div>

 {/* If it is a normal bonus/transport */}
 {!isPago ? (
 <div className="flex items-start gap-3.5 pb-4 border-b border-slate-50">
 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
 <Info size={16} />
 </div>
 <div className="min-w-0">
 <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Concepto</p>
 <p className="text-sm font-bold text-slate-700 tracking-tight">
 {bonus.bonus_type}
 </p>
 </div>
 </div>
 ) : (
 <>
 {/* Tipo de Pago */}
 <div className="flex items-start gap-3.5 pb-4 border-b border-slate-50">
 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
 <Info size={16} />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Tipo de Pago</p>
 <p className="text-sm font-bold text-slate-700">
 {bonus.payment_type === 'salary' ? 'Sueldo' :
 bonus.payment_type === 'advance' ? 'Adelanto' :
 bonus.payment_type === 'liquidation' ? 'Liquidación' : 'Pago Extraordinario'}
 </p>
 </div>
 </div>

 {/* Periodo */}
 {['salary', 'advance'].includes(bonus.payment_type) && (
 <div className="flex items-start gap-3.5 pb-4 border-b border-slate-50">
 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
 <Calendar size={16} />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Periodo</p>
 <p className="text-sm font-bold text-slate-700">
 {bonus.period || 'Mensual'}
 </p>
 </div>
 </div>
 )}

 {/* Método de Pago */}
 <div className="flex items-start gap-3.5 pb-4 border-b border-slate-50">
 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
 <Coins size={16} />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Método de Pago</p>
 <p className="text-sm font-bold text-slate-700">
 {bonus.payment_method === 'transferencia' ? 'Transferencia Bancaria' :
 bonus.payment_method === 'yape' ? 'Yape' : 'Efectivo'}
 </p>
 </div>
 </div>

 {/* Observaciones */}
 {bonus.observations && (
 <div className="flex items-start gap-3.5 pb-4 border-b border-slate-50">
 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
 <Info size={16} />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Observaciones</p>
 <p className="text-sm font-bold text-slate-700">
 {bonus.observations}
 </p>
 </div>
 </div>
 )}

 {/* Documento Adjunto */}
 {bonus.document_url && (
 <div className="flex items-start gap-3.5 pb-4 border-b border-slate-50">
 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
 <FileText size={16} />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Documento Adjunto</p>
 <a 
 href={bonus.document_url} 
 target="_blank" 
 rel="noopener noreferrer"
 className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1.5 mt-1"
 >
 <ExternalLink size={12} /> Ver Boleta / Comprobante
 </a>
 </div>
 </div>
 )}
 </>
 )}

 {/* Fecha */}
 <div className="flex items-start gap-3.5 pb-4 border-b border-slate-50">
 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
 <Calendar size={16} />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Fecha</p>
 <p className="text-sm font-bold text-slate-700">
 {new Date(bonus.date).toLocaleDateString('es-PE', { dateStyle: 'long' })}
 </p>
 </div>
 </div>

 {/* Monto */}
 <div className="flex items-start gap-3.5 pb-4 border-b border-slate-50">
 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
 <DollarSign size={16} />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Monto Asignado</p>
 <p className="text-lg font-black text-slate-800">
 S/ {Number(bonus.amount).toFixed(2)}
 </p>
 </div>
 </div>

 {/* Estado */}
 <div className="flex items-start gap-3.5 pt-2">
 <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
 {bonus.status === 'paid' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-amber-500" />}
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1.5">Estado del Pago</p>
 <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border shadow-sm ${
 bonus.status === 'paid' 
 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
 : 'bg-amber-50 text-amber-700 border-amber-100'
 }`}>
 {bonus.status === 'paid' ? 'Pagado' : 'Pendiente'}
 </span>
 </div>
 </div>
 </div>

 <div className="pt-2">
 <button 
 type="button"
 onClick={onClose} 
 className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg text-xs tracking-normal active:scale-98 cursor-pointer"
 >
 Cerrar Vista
 </button>
 </div>
 </div>
 </div>
 </div>
 )
}
