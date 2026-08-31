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
  const [selectedRequirement, setSelectedRequirement] = useState<any | null>(null)
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-left w-full md:w-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 text-indigo-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-sm shrink-0">
            <Package size={24} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Gestión de Requerimientos
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">Solicitudes operativas y flujos de aprobación.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 active:scale-95 text-xs sm:text-base"
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
            onChange={e => setFilters(prev => ({...prev, status: e.target.value}))}
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
            onChange={e => setFilters(prev => ({...prev, priority: e.target.value}))}
          >
            <option value="todas">Todas las prioridades</option>
            <option value="alta">Prioridad Alta</option>
            <option value="media">Prioridad Media</option>
            <option value="baja">Prioridad Baja</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight text-center">Tipo</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Motivo / Detalle</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Código</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Producto</th>
                <th className="py-5 px-4 text-[11px] font-bold text-slate-400 tracking-tight text-center">Cant.</th>
                <th className="py-5 px-4 text-[11px] font-bold text-slate-400 tracking-tight text-center">Unidad</th>
                <th className="py-5 px-4 text-[11px] font-bold text-slate-400 tracking-tight text-center">Área</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight">Solicitado por</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight text-center">Prioridad</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight text-center">Estado</th>
                <th className="py-5 px-6 text-[11px] font-bold text-slate-400 tracking-tight text-center">Fecha</th>
                <th className="py-5 px-8 text-[11px] font-bold text-slate-400 tracking-tight text-right">Acciones</th>
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
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-1 rounded shadow-sm border border-slate-200 tracking-tighter">
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
                        <div className={`p-2 rounded-lg shrink-0 ${req.products?.is_new ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Hash size={14} />
                        </div>
                        <span className={`text-xs font-bold tracking-tighter ${req.products?.is_new ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200' : 'text-indigo-600'}`}>
                          {req.products?.code || 'S/C'}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-6 min-w-[200px]">
                      {req.products?.name ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`p-2 rounded-lg shrink-0 ${req.products?.is_new ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-400'}`}>
                            <Package size={14} />
                          </div>
                          <span className="text-sm font-bold text-slate-800 tracking-tight">
                            {req.products?.name}
                          </span>
                          {req.products?.is_new && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-300/60 whitespace-nowrap shadow-2xs">
                              ✨ Pendiente de Registro
                            </span>
                          )}
                        </div>
                      ) : req.type === 'fondos' ? (
                        <div className="flex items-center gap-2">
                          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-500 shrink-0">
                            <Package size={14} />
                          </div>
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 tracking-tight">
                            Solicitud de Fondos
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No especificado</span>
                      )}
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="text-sm font-bold text-slate-800">
                        {req.quantity}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 tracking-tight whitespace-nowrap">
                        {req.type === 'fondos' ? 'Soles (S/)' : (req.products?.unit || '—')}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50/30 px-2 py-1 rounded-lg">
                        {req.area || '—'}
                      </span>
                    </td>
                    <td className="py-6 px-6">
                      <span className="text-[10px] text-slate-600 font-bold whitespace-nowrap">
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
                      <span className="text-[10px] font-bold text-slate-500">
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
                                className="px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white text-[10px] font-bold rounded-xl transition-all shadow-sm tracking-tighter border border-emerald-100/50"
                              >
                                Marcar Atendido
                              </button>
                            )}
                            <button 
                              onClick={() => setSelectedRequirement(req)}
                              className="p-2.5 bg-slate-50 text-slate-400 hover:bg-white hover:shadow-md hover:text-indigo-600 rounded-xl transition-all border border-slate-100/50"
                              title="Ver Detalle"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setSelectedRequirement(req)}
                            className="p-2.5 bg-slate-50 text-slate-400 hover:bg-white hover:shadow-md hover:text-indigo-600 rounded-xl transition-all border border-slate-100/50"
                            title="Ver Detalle"
                          >
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
                        className="text-xs font-bold text-indigo-600 tracking-tight underline"
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

      {selectedRequirement && (
        <RequirementDetailModal 
          isOpen={!!selectedRequirement}
          onClose={() => setSelectedRequirement(null)}
          requirement={selectedRequirement}
        />
      )}
    </div>
  )
}

function RequirementDetailModal({ isOpen, onClose, requirement }: { isOpen: boolean, onClose: () => void, requirement: any }) {
  if (!isOpen || !requirement) return null
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Detalle de Requerimiento</h2>
            <p className="text-slate-400 text-[10px] font-bold tracking-tight">Trazabilidad completa de la solicitud.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Main Info */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-2.5 py-1 rounded shadow-sm border border-indigo-100 tracking-normal">
                  {requirement.type}
                </span>
                {requirement.products?.is_new && (
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2.5 py-1 rounded shadow-sm border border-amber-300 tracking-normal">
                    ✨ Pendiente de Registro
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mt-3 leading-tight">
                {requirement.products?.name || 'Solicitud de Fondos'}
              </h3>
              {requirement.products?.is_new ? (
                <p className="text-xs font-bold text-amber-600 mt-1">
                  ⚠️ Producto no registrado previamente en Almacén General
                </p>
              ) : requirement.products?.code ? (
                <p className="text-xs font-bold text-slate-400 mt-1">SKU/Código: {requirement.products.code}</p>
              ) : null}
            </div>
            <div className="text-right shrink-0">
              <RequirementStatusBadge status={requirement.status} />
              <div className="mt-2">
                <PriorityBadge priority={requirement.priority} />
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
            <div>
              <p className="text-[9px] font-bold text-slate-400 tracking-tight">Solicitado Por</p>
              <p className="text-xs font-black text-slate-700 mt-1">{requirement.user?.name || 'Sistema'}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 tracking-tight">Área / Depto.</p>
              <p className="text-xs font-black text-slate-700 mt-1">{requirement.area || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 tracking-tight">Cantidad</p>
              <p className="text-sm font-black text-slate-800 mt-1">
                {requirement.quantity} <span className="text-[10px] font-bold text-slate-400">{requirement.type === 'fondos' ? 'Soles (S/)' : (requirement.products?.unit || '—')}</span>
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 tracking-tight">Fecha Registro</p>
              <p className="text-xs font-black text-slate-700 mt-1">
                {requirement.created_at ? new Date(requirement.created_at).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          {/* Justification / Title / Description */}
          <div className="space-y-2 text-left">
            <p className="text-[9px] font-bold text-slate-400 tracking-tight px-1">Justificación / Descripción del Pedido</p>
            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-600 font-bold leading-relaxed">{requirement.title || requirement.description}</p>
            </div>
          </div>

          {/* Trazabilidad de Almacén */}
          {requirement.movement_id && (
            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4 text-left">
              <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 shrink-0">
                <Package size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-blue-800 tracking-normal">Despacho de Almacén</h4>
                <p className="text-[11px] font-semibold text-blue-600 mt-0.5 leading-normal">
                  Esta solicitud ha sido despachada y sincronizada de forma segura en el Kardex de Inventario. 
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[9px] font-bold text-blue-700 bg-white border border-blue-100 px-2.5 py-1 rounded-md">Vínculo: REQ-APP</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
