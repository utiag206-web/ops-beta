'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, Calendar, Clock, CheckCircle2, AlertCircle, DollarSign, User, Eye, Edit2, Trash2 } from 'lucide-react'
import { updateBonusStatus, deleteBonus } from '@/app/(main)/bonuses/actions'
import { ViewBonusModal } from './view-bonus-modal'
import { EditBonusModal } from './edit-bonus-modal'
import { toast } from 'sonner'

interface BonusListProps {
 bonuses: any[]
 isWorker?: boolean
 isAdmin?: boolean
 workers?: any[]
}

export function BonusList({ bonuses: initialBonuses, isWorker = false, isAdmin = false, workers = [] }: BonusListProps) {
 const router = useRouter()
 const [bonuses, setBonuses] = useState(initialBonuses)
 const [loadingId, setLoadingId] = useState<string | null>(null)
 
 // Modal states
 const [selectedViewBonus, setSelectedViewBonus] = useState<any>(null)
 const [selectedEditBonus, setSelectedEditBonus] = useState<any>(null)

 // Sync with server data
 useEffect(() => {
 setBonuses(initialBonuses)
 }, [initialBonuses])

 const handleToggleStatus = async (id: string, currentStatus: string) => {
 if (!isAdmin) return
 const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'
 setLoadingId(id)

 try {
 const result = await updateBonusStatus(id, newStatus as 'paid' | 'pending')
 if (result.success) {
 toast.success(`Estado actualizado a ${newStatus === 'paid' ? 'Pagado' : 'Pendiente'}`)
 setBonuses(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
 router.refresh()
 } else {
 toast.error(result.error || 'Error al actualizar el estado')
 }
 } catch (err) {
 console.error(err)
 toast.error('Error inesperado')
 } finally {
 setLoadingId(null)
 }
 }

 const handleDelete = async (bonus: any) => {
 const isBono = bonus.type === 'bono'
 const isPago = bonus.type === 'pago'
 const label = isBono ? 'bono' : isPago ? 'pago' : 'pasaje'
 if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente este ${label}?`)) return
 
 try {
 const res = await deleteBonus(bonus.id)
 if (res.success) {
 toast.success(`¡El ${label} fue eliminado exitosamente!`)
 setBonuses(prev => prev.filter(b => b.id !== bonus.id))
 router.refresh()
 } else {
 toast.error(res.error || `Error al eliminar el ${label}`)
 }
 } catch (err: any) {
 toast.error(`Error: ${err.message}`)
 }
 }

 if (bonuses.length === 0) {
 return (
 <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
 <Coins className="text-slate-300" size={32} />
 </div>
 <p className="font-medium text-slate-700">Sin bonos, pasajes ni pagos registrados</p>
 <p className="text-xs text-slate-500 mt-1">No hay historial disponible en este momento.</p>
 </div>
 )
 }

 return (
 <>
 <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
 {/* Desktop Table View */}
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-100">
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Colaborador</th>
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Concepto</th>
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Fecha</th>
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Monto</th>
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight text-center">Estado</th>
 <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight text-right">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {bonuses.map((bonus) => {
 const isBono = bonus.type === 'bono'
 const isPago = bonus.type === 'pago'
 return (
 <tr key={bonus.id} className="hover:bg-slate-50/30 transition-colors group">
 <td className="py-5 px-6">
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
 isBono ? 'bg-orange-50 text-orange-600' : 
 isPago ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
 }`}>
 {isBono ? 'B' : isPago ? 'P' : 'T'}
 </div>
 <div>
 <p className="text-sm font-bold text-slate-800 tracking-tight">
 {bonus.worker?.name || 'Sistema'}
 </p>
 </div>
 </div>
 </td>
 <td className="py-5 px-6">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-700 tracking-tight">{bonus.bonus_type}</span>
 <span className={`text-[9px] font-black w-fit mt-1 px-2 py-0.5 rounded tracking-wider ${
 isBono ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
 isPago ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
 'bg-blue-50 text-blue-600 border border-blue-100'
 }`}>
 {isBono ? 'Bono' : isPago ? 'Pago' : 'Pasaje'}
 </span>
 </div>
 </td>
 <td className="py-5 px-6">
 <span className="text-sm font-bold text-slate-500">{new Date(bonus.date).toLocaleDateString()}</span>
 </td>
 <td className="py-5 px-6">
 <span className="text-sm font-bold text-slate-800">S/ {Number(bonus.amount).toFixed(2)}</span>
 </td>
 <td className="py-5 px-6 text-center">
 <button
 onClick={() => handleToggleStatus(bonus.id, bonus.status)}
 disabled={!isAdmin || loadingId === bonus.id}
 className={`text-[10px] font-bold px-3 py-1 rounded-lg border shadow-sm transition-all ${
 isAdmin ? 'hover:scale-95 active:scale-90 cursor-pointer' : 'cursor-default'
 } ${
 bonus.status === 'paid' 
 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
 : 'bg-amber-50 text-amber-700 border-amber-100'
 }`}
 >
 {bonus.status === 'paid' ? 'Pagado' : 'Pendiente'}
 </button>
 </td>
 <td className="py-5 px-6 text-right">
 <div className="flex items-center justify-end gap-1">
 <button
 onClick={() => setSelectedViewBonus(bonus)}
 className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
 title="Ver detalle completo"
 >
 <Eye size={16} />
 </button>
 
 {isAdmin && (
 <>
 <button
 onClick={() => setSelectedEditBonus(bonus)}
 className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
 title="Editar registro"
 >
 <Edit2 size={16} />
 </button>
 <button
 onClick={() => handleDelete(bonus)}
 className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
 title="Eliminar registro"
 >
 <Trash2 size={16} />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>

 {/* Mobile Card View */}
 <div className="md:hidden divide-y divide-slate-100">
 {bonuses.map((bonus) => {
 const isBono = bonus.type === 'bono'
 const isPago = bonus.type === 'pago'
 return (
 <div key={bonus.id} className="p-6 space-y-4">
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
 isBono ? 'bg-orange-50 text-orange-600' : 
 isPago ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
 }`}>
 <DollarSign size={20} />
 </div>
 <div>
 <p className="text-[10px] font-bold text-slate-400 tracking-tight leading-none mb-1">Concepto</p>
 <div className="flex flex-col gap-1">
 <p className="text-sm font-bold text-slate-800 leading-snug">{bonus.bonus_type}</p>
 <span className={`text-[8px] font-black w-fit px-1.5 py-0.5 rounded tracking-wider ${
 isBono ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
 isPago ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
 'bg-blue-50 text-blue-600 border border-blue-100'
 }`}>
 {isBono ? 'Bono' : isPago ? 'Pago' : 'Pasaje'}
 </span>
 </div>
 </div>
 </div>
 <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shadow-sm ${
 bonus.status === 'paid' 
 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
 : 'bg-amber-50 text-amber-700 border-amber-100'
 }`}>
 {bonus.status === 'paid' ? 'Pagado' : 'Pendiente'}
 </span>
 </div>

 <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
 <div>
 <p className="text-[10px] font-bold text-slate-400 tracking-tight mb-1">Monto</p>
 <p className="text-lg font-bold text-slate-900 tracking-tighter">S/ {Number(bonus.amount).toFixed(2)}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-bold text-slate-400 tracking-tight mb-1">Fecha</p>
 <p className="text-xs font-bold text-slate-600">{new Date(bonus.date).toLocaleDateString()}</p>
 </div>
 </div>

 <div className="flex items-center justify-between gap-4 pt-2">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
 <User size={12} />
 </div>
 <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{bonus.worker?.name || 'Sistema'}</span>
 </div>
 
 <div className="flex items-center gap-2">
 <button
 onClick={() => setSelectedViewBonus(bonus)}
 className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-all cursor-pointer"
 title="Ver detalle"
 >
 <Eye size={16} />
 </button>
 
 {isAdmin && (
 <>
 <button
 onClick={() => setSelectedEditBonus(bonus)}
 className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all cursor-pointer"
 title="Editar"
 >
 <Edit2 size={16} />
 </button>
 <button
 onClick={() => handleDelete(bonus)}
 className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-xl transition-all cursor-pointer"
 title="Eliminar"
 >
 <Trash2 size={16} />
 </button>

 <button
 disabled={loadingId === bonus.id}
 onClick={() => handleToggleStatus(bonus.id, bonus.status)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold transition-all shadow-sm cursor-pointer ${
 bonus.status === 'paid' 
 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
 : 'bg-indigo-600 text-white shadow-indigo-100'
 }`}
 >
 {loadingId === bonus.id ? (
 <Clock size={12} className="animate-spin" />
 ) : bonus.status === 'paid' ? (
 <>
 <CheckCircle2 size={12} />
 Cobrado
 </>
 ) : (
 <>
 <DollarSign size={12} />
 Pagar
 </>
 )}
 </button>
 </>
 )}
 </div>
 </div>
 </div>
 )
 })}
 </div>
 </div>

 {/* View Modal */}
 {selectedViewBonus && (
 <ViewBonusModal 
 bonus={selectedViewBonus}
 onClose={() => setSelectedViewBonus(null)}
 />
 )}

 {/* Edit Modal */}
 {selectedEditBonus && (
 <EditBonusModal 
 bonus={selectedEditBonus}
 workers={workers}
 onSuccess={() => {
 router.refresh()
 }}
 onClose={() => setSelectedEditBonus(null)}
 />
 )}
 </>
 )
}
