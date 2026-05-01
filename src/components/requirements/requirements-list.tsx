'use client'

import { useState, useEffect } from 'react'
import { 
  getRequirements, 
  updateRequirementStatus 
} from '@/app/(main)/requerimientos/actions'
import { RequirementStatusBadge, PriorityBadge, CreateRequirementModal, ApproveRequirementModal } from '@/components/requirements/requirements-components'
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  Package,
  X,
  Hash
} from 'lucide-react'
import { toast } from 'sonner'

export default function RequirementsPage({ userRole, initialData = [] }: { userRole: string, initialData?: any[] }) {
  const [requirements, setRequirements] = useState<any[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [approveModalData, setApproveModalData] = useState<{isOpen: boolean, reqId: string | null}>({ isOpen: false, reqId: null })
  
  const [filters, setFilters] = useState({
    status: 'todos',
    priority: 'todas'
  })

  const isGlobalAdmin = userRole === 'admin' || userRole === 'gerente' || userRole === 'operaciones' || userRole === 'almacen'
  const isJefeArea = userRole === 'jefe_area'

  const fetchData = async () => {
    setLoading(true)
    const res = await getRequirements(filters)
    if (res.data) {
      setRequirements(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    // Solo disparar fetch si no es la carga inicial o si los filtros cambiaron
    if (filters.status !== 'todos' || filters.priority !== 'todas') {
      fetchData()
    }
  }, [filters])

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const res = await updateRequirementStatus(id, newStatus)
    if (res.success) {
      toast.success(`Estado actualizado a ${newStatus}`)
      fetchData()
    } else {
      toast.error(res.error || 'Error al actualizar')
    }
  }

  const handleApproveClick = (req: any) => {
    if (req.type === 'insumo' && req.product_id) {
      setApproveModalData({ isOpen: true, reqId: req.id })
    } else {
      handleStatusUpdate(req.id, 'aprobado')
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <Package className="text-indigo-600" size={24} />
            </div>
            Gestión de Requerimientos
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Solicitudes operativas y flujos de aprobación.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Nuevo Requerimiento</span>
        </button>
      </div>

      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex-1 max-w-xs">
          <Filter size={16} className="text-slate-400" />
          <select 
            className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full"
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="atendido">Atendidos</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <Clock size={16} className="text-slate-400" />
          <select 
            className="bg-transparent text-sm font-bold text-slate-600 outline-none"
            value={filters.priority}
            onChange={e => setFilters({...filters, priority: e.target.value})}
          >
            <option value="todas">Todas las prioridades</option>
            <option value="alta">Prioridad Alta</option>
            <option value="media">Prioridad Media</option>
            <option value="baja">Prioridad Baja</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Motivo / Detalle</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Unidad</th>
                <th className="py-5 px-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Área</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Solicitado por</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Prioridad</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Fecha</th>
                <th className="py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      <p className="text-sm font-bold text-slate-400">Cargando requerimientos...</p>
                    </div>
                  </td>
                </tr>
              ) : requirements.length > 0 ? requirements.map((req) => {
                const canManageStatus = isGlobalAdmin || isJefeArea
                
                return (
                  <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-6 text-center">
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded shadow-sm border border-slate-200 uppercase tracking-tighter">
                        {req.type}
                      </span>
                    </td>
                    <td className="py-6 px-6 max-w-[200px]">
                      <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">
                         {req.title || req.description}
                      </p>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-2">
                         <div className="bg-slate-100 p-2 rounded-lg text-slate-400 shrink-0">
                           <Hash size={14} />
                         </div>
                         <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">
                           {req.products?.code || 'S/C'}
                         </span>
                      </div>
                    </td>
                    <td className="py-6 px-6 min-w-[200px]">
                      {req.products?.name ? (
                        <div className="flex items-center gap-2">
                           <div className="bg-indigo-50 p-2 rounded-lg text-indigo-400 shrink-0">
                             <Package size={14} />
                           </div>
                           <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                             {req.products?.name}
                           </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No especificado</span>
                      )}
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="text-sm font-black text-slate-800">
                        {req.quantity}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="text-[10px] font-black text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-tight whitespace-nowrap">
                        {req.products?.unit || '—'}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="text-[9px] font-black text-indigo-500 bg-indigo-50/30 px-2 py-1 rounded-lg uppercase">
                        {req.area || '—'}
                      </span>
                    </td>
                    <td className="py-6 px-6">
                      <span className="text-[10px] text-slate-600 font-bold uppercase whitespace-nowrap">
                        {req.user?.name || 'Sistema'}
                      </span>
                    </td>
                    <td className="py-6 px-6 text-center">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="py-6 px-6 text-center">
                      <RequirementStatusBadge status={req.status} />
                    </td>
                    <td className="py-6 px-6 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManageStatus ? (
                          <div className="flex gap-2">
                            {req.status === 'pendiente' && (
                              <>
                                <button 
                                  onClick={() => handleApproveClick(req)}
                                  className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm border border-blue-100/50"
                                  title="Aprobar / Atender"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleStatusUpdate(req.id, 'rechazado')}
                                  className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm border border-rose-100/50"
                                  title="Rechazar"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                            {(req.status === 'aprobado' && isGlobalAdmin) && (
                              <button 
                                onClick={() => handleStatusUpdate(req.id, 'atendido')}
                                className="px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white text-[10px] font-black rounded-xl transition-all shadow-sm uppercase tracking-tighter border border-emerald-100/50"
                              >
                                Marcar Atendido
                              </button>
                            )}
                          </div>
                        ) : (
                          <button className="p-2.5 bg-slate-50 text-slate-400 hover:bg-white hover:shadow-md hover:text-indigo-600 rounded-xl transition-all border border-slate-100/50">
                            <Eye size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              }) : (

                <tr>
                  <td colSpan={12} className="py-32 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                        <Search size={32} />
                      </div>
                      <p className="text-slate-400 font-bold">No se encontraron requerimientos con los filtros seleccionados.</p>
                      <button 
                        onClick={() => setFilters({ status: 'todos', priority: 'todas' })}
                        className="text-xs font-black text-indigo-600 uppercase tracking-widest underline"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateRequirementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
      
      <ApproveRequirementModal
        isOpen={approveModalData.isOpen}
        onClose={() => setApproveModalData({ isOpen: false, reqId: null })}
        reqId={approveModalData.reqId}
        onSuccess={fetchData}
      />
    </div>
  )
}
