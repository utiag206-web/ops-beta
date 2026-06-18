'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, Calendar, Clock, CheckCircle2, AlertCircle, DollarSign, User, Eye, Edit2, Trash2, Plus, FileText } from 'lucide-react'
import { updateBonusStatus, deleteBonus } from '@/app/(main)/bonuses/actions'
import { ViewBonusModal } from '../bonuses/view-bonus-modal'
import { EditBonusModal } from '../bonuses/edit-bonus-modal'
import { AddBonusModal } from '../bonuses/add-bonus-modal'
import { toast } from 'sonner'

interface WorkerFinancialHistoryProps {
  bonuses: any[]
  worker: any
  isAdmin?: boolean
}

export function WorkerFinancialHistory({ bonuses: initialBonuses, worker, isAdmin = false }: WorkerFinancialHistoryProps) {
  const router = useRouter()
  const [bonuses, setBonuses] = useState(initialBonuses)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Modal states
  const [selectedViewBonus, setSelectedViewBonus] = useState<any>(null)
  const [selectedEditBonus, setSelectedEditBonus] = useState<any>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

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

  const getBadgeStyles = (bonus: any) => {
    if (bonus.type === 'bono') {
      return 'bg-orange-50 text-orange-700 border-orange-100'
    }
    if (bonus.type === 'pasaje') {
      return 'bg-blue-50 text-blue-700 border-blue-100'
    }
    
    // Payments (type === 'pago')
    switch (bonus.payment_type) {
      case 'salary':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'advance':
        return 'bg-teal-50 text-teal-700 border-teal-100'
      case 'liquidation':
        return 'bg-rose-50 text-rose-700 border-rose-100'
      case 'extra':
        return 'bg-purple-50 text-purple-700 border-purple-100'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  }

  const getBadgeLabel = (bonus: any) => {
    if (bonus.type === 'bono') return 'Bono'
    if (bonus.type === 'pasaje') return 'Pasaje'
    
    switch (bonus.payment_type) {
      case 'salary':
        return 'Sueldo'
      case 'advance':
        return 'Adelanto'
      case 'liquidation':
        return 'Liquidación'
      case 'extra':
        return 'Pago Extra'
      default:
        return 'Pago'
    }
  }

  const cleanWorkerArray = [{
    id: worker.id,
    name: `${worker.name} ${worker.last_name || ''}`.trim()
  }]

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Sub-header with Add Button */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Historial Financiero Consolidado</h4>
            <p className="text-xs text-slate-500 mt-0.5">Visualización unificada de pagos, bonos y transporte de este colaborador.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-sm shadow-emerald-100"
            >
              <Plus size={16} />
              Registrar Transacción
            </button>
          )}
        </div>

        {bonuses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Coins className="text-slate-300" size={32} />
            </div>
            <p className="font-bold text-slate-700">Sin historial financiero registrado</p>
            <p className="text-xs text-slate-500 mt-1">No hay bonos, pasajes ni pagos para este trabajador en el sistema.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bonuses.map((bonus) => {
                    const badgeStyles = getBadgeStyles(bonus)
                    const badgeLabel = getBadgeLabel(bonus)
                    return (
                      <tr key={bonus.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="py-4 px-6">
                          <span className="text-xs font-bold text-slate-600">
                            {new Date(bonus.date).toLocaleDateString('es-PE', { dateStyle: 'short' })}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded border uppercase tracking-wider ${badgeStyles}`}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                              {bonus.bonus_type}
                            </span>
                            {bonus.observations && (
                              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[250px]">
                                {bonus.observations}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-black text-slate-900">
                            S/ {Number(bonus.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleToggleStatus(bonus.id, bonus.status)}
                            disabled={!isAdmin || loadingId === bonus.id}
                            className={`text-[9px] font-black px-2.5 py-0.5 rounded-lg uppercase border shadow-sm transition-all ${
                              isAdmin ? 'hover:scale-95 active:scale-90 cursor-pointer' : 'cursor-default'
                            } ${
                              bonus.status === 'paid' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}
                          >
                            {loadingId === bonus.id ? '...' : bonus.status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {bonus.document_url && (
                              <a
                                href={bonus.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Ver comprobante adjunto"
                              >
                                <FileText size={14} />
                              </a>
                            )}
                            <button
                              onClick={() => setSelectedViewBonus(bonus)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="Ver detalle completo"
                            >
                              <Eye size={14} />
                            </button>
                            
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => setSelectedEditBonus(bonus)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                  title="Editar registro"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(bonus)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                  title="Eliminar registro"
                                >
                                  <Trash2 size={14} />
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
                const badgeStyles = getBadgeStyles(bonus)
                const badgeLabel = getBadgeLabel(bonus)
                return (
                  <div key={bonus.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(bonus.date).toLocaleDateString('es-PE', { dateStyle: 'medium' })}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeStyles}`}>
                            {badgeLabel}
                          </span>
                          <span className="text-xs font-bold text-slate-800 uppercase leading-none truncate max-w-[150px]">
                            {bonus.bonus_type}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                        bonus.status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {bonus.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>

                    {bonus.observations && (
                      <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                        {bonus.observations}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                      <span className="text-xs font-black text-slate-900">
                        S/ {Number(bonus.amount).toFixed(2)}
                      </span>

                      <div className="flex items-center gap-1">
                        {bonus.document_url && (
                          <a
                            href={bonus.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 bg-slate-50 rounded-lg transition-all"
                            title="Ver comprobante"
                          >
                            <FileText size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedViewBonus(bonus)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg transition-all"
                        >
                          <Eye size={14} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setSelectedEditBonus(bonus)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(bonus)}
                              className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
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
          workers={cleanWorkerArray}
          onSuccess={() => {
            router.refresh()
          }}
          onClose={() => setSelectedEditBonus(null)}
        />
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <AddBonusModal
          workers={cleanWorkerArray}
          onSuccess={() => {
            router.refresh()
          }}
          onClose={() => setIsAddOpen(false)}
        />
      )}
    </>
  )
}
