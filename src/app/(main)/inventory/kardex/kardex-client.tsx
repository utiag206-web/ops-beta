'use client'

import { useState } from 'react'
import { Search, Download, Filter, FileText, ArrowRight, ArrowDownLeft, ArrowUpRight, Settings2, Box, Calendar, User, Clock, MessageSquare, MapPin, Layers } from 'lucide-react'
import { getKardexRecords } from './actions'
import { exportKardexToExcel } from '@/lib/export-utils'
import { toast } from 'sonner'

export function KardexClient({ products, warehouses }: { products: any[], warehouses: any[] }) {
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState('')
  const [warehouseId, setWarehouseId] = useState('all')
  const [type, setType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  const [records, setRecords] = useState<any[]>([])
  const [initialBalance, setInitialBalance] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalCount: 0 })

  // Local state for the code input to allow typing
  const [codeValue, setCodeValue] = useState('')

  // Synchronize codeValue when productId changes (e.g. from dropdown)
  const syncFromId = (id: string) => {
    setProductId(id)
    const p = products.find(prod => prod.id === id)
    if (p) setCodeValue(p.code)
    else if (!id) setCodeValue('')
  }

  const handleCodeChange = (val: string) => {
    const cleanVal = val.trim().toUpperCase()
    setCodeValue(cleanVal)
    const product = products.find(p => p.code.toUpperCase() === cleanVal)
    if (product) {
      setProductId(product.id)
    } else {
      setProductId('') // Invalidate search until a full match is typed
    }
  }


  const handleSearch = async (targetPage = 1) => {
    if (!productId) {
      toast.error('Debes seleccionar un producto.')
      return
    }

    setLoading(true)
    try {
      const res = await getKardexRecords({
        product_id: productId,
        warehouse_id: warehouseId === 'all' ? undefined : warehouseId,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page: targetPage,
        limit: 50
      })

      if (res.error) throw new Error(res.error)
      
      setRecords(res.data || [])
      setInitialBalance(res.initialBalance || 0)
      if (res.pagination) {
        setPagination({
          page: res.pagination.currentPage,
          totalPages: res.pagination.totalPages,
          totalCount: res.pagination.totalCount || 0
        })
      }
      setHasSearched(true)
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (records.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }
    const product = products.find(p => p.id === productId)
    exportKardexToExcel(records, product, initialBalance)
  }

  const selectedProduct = products.find(p => p.id === productId)
  const isIntegerUnit = selectedProduct ? ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(selectedProduct.unit.toUpperCase()) : false

  return (
    <div className="space-y-6">
      {/* Filters Bar ERP */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1 block">Código</label>
            <input 
              type="text"
              placeholder="CÓDIGO..."
              value={codeValue}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-[54px] bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-4 text-sm font-black transition-all outline-none uppercase"
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1 block">Descripción del Producto *</label>
            <select 
              value={productId}
              onChange={(e) => syncFromId(e.target.value)}
              className="w-full h-[54px] bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-4 text-sm font-bold transition-all outline-none appearance-none"
            >
              <option value="">Seleccionar por nombre...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1 block">Almacén</label>
            <select 
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full h-[54px] bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-4 text-sm font-bold transition-all outline-none appearance-none"
            >
              <option value="all">Todos los Almacenes</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1 block">Desde</label>
                <input 
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-[54px] bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-3 text-xs font-bold transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1 block">Hasta</label>
                <input 
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-[54px] bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-3 text-xs font-bold transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-slate-50">
          <button 
            onClick={handleExport}
            disabled={!hasSearched || records.length === 0}
            className="flex-1 sm:flex-none border-2 border-slate-100 text-slate-600 px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all hover:bg-slate-50 active:scale-95 text-xs disabled:opacity-50"
          >
            <Download size={16} />
            <span>EXPORTAR EXCEL</span>
          </button>
          
          <button 
            onClick={() => handleSearch(1)}
            disabled={loading}
            className="flex-[2] sm:flex-none bg-slate-900 hover:bg-black text-white px-10 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-100 active:scale-95 text-xs disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileText size={16} />}
            <span>CONSULTAR KARDEX</span>
          </button>
        </div>
      </div>

      {hasSearched ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* ERP Ledger Header */}
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
                <Box size={32} />
              </div>
              <div>
                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Libro de Inventario Continuo</p>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  {selectedProduct?.name}
                  <span className="text-slate-300 font-medium">/</span>
                  <span className="text-slate-400 text-lg uppercase font-bold">{selectedProduct?.code}</span>
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white px-6 py-4 rounded-[1.5rem] border border-slate-100 flex flex-col items-end shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Inicial Periodo</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">{isIntegerUnit ? Math.round(initialBalance) : initialBalance.toFixed(2)}</span>
                  <span className="text-[11px] uppercase font-bold text-slate-400">{selectedProduct?.unit}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b-2 border-slate-100">
                  <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-40">Fecha</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-40">Tipo</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-48">Documento</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Almacén / Contexto</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center bg-slate-50/30">Entrada</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center bg-slate-50/30">Salida</th>
                  <th className="py-5 px-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center bg-indigo-50/20">Saldo</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsable / Obs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length > 0 ? records.map((m) => {
                  const isAjuste = m.ui_type === 'Ajuste'
                  const isIngreso = m.ui_type === 'Ingreso'
                  const isSalida = m.ui_type === 'Salida'
                  const isTransfer = m.ui_type === 'Transferencia'

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="py-4 px-6 border-r border-slate-50">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800">{new Date(m.created_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            <Clock size={10} />
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-tight ${
                          isIngreso ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                          isSalida ? 'bg-rose-50 border-rose-100 text-rose-700' :
                          isTransfer ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                          'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {isIngreso && <ArrowUpRight size={12} />}
                          {isSalida && <ArrowDownLeft size={12} />}
                          {isTransfer && <ArrowRight size={12} />}
                          {isAjuste && <Settings2 size={12} />}
                          {m.ui_type}
                        </div>
                      </td>

                      <td className="py-4 px-6 border-r border-slate-50">
                        <span className="text-[11px] font-black text-slate-700 bg-white border border-slate-200 px-2 py-1.5 rounded-lg shadow-sm">
                          {m.doc_display}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          {m.context_label ? (
                            <>
                              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                                <MapPin size={12} className="text-slate-300" />
                                {m.context_label}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase ml-4.5">
                                {m.warehouses?.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                              <MapPin size={12} className="text-slate-300" />
                              {m.warehouses?.name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center bg-slate-50/30 border-x border-slate-50">
                        {m.entrada > 0 ? (
                          <span className={`text-sm font-black ${isAjuste ? 'text-emerald-500' : 'text-emerald-700'}`}>
                            +{isIntegerUnit ? Math.round(m.entrada) : m.entrada.toFixed(2)}
                          </span>
                        ) : <span className="text-slate-200 font-light">-</span>}
                      </td>
                      
                      <td className="py-4 px-6 text-center bg-slate-50/30 border-r border-slate-50">
                        {m.salida > 0 ? (
                          <span className={`text-sm font-black ${isAjuste ? 'text-rose-500' : 'text-rose-700'}`}>
                            -{isIntegerUnit ? Math.round(m.salida) : m.salida.toFixed(2)}
                          </span>
                        ) : <span className="text-slate-200 font-light">-</span>}
                      </td>
                      
                      <td className="py-4 px-6 text-center bg-indigo-50/20">
                        <span className="text-base font-black text-indigo-700">
                          {isIntegerUnit ? Math.round(m.saldo_acumulado) : m.saldo_acumulado.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <User size={10} className="text-slate-300" />
                            <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[100px]" title={m.users?.name}>
                              {m.users?.name || 'Sistema'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium italic line-clamp-1 group-hover:line-clamp-none transition-all leading-tight">
                            {m.observation || '-'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (

                  <tr>
                    <td colSpan={8} className="py-32 text-center">
                      <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 font-black text-lg">Sin movimientos registrados</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ERP Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Mostrando <span className="text-slate-900">{records.length}</span> de <span className="text-slate-900">{pagination.totalCount}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSearch(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1.5 px-4 h-9 bg-white border border-slate-200 rounded-xl text-[11px] font-black">
                  <span className="text-slate-400">Pág.</span>
                  <span className="text-indigo-600">{pagination.page}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-600">{pagination.totalPages}</span>
                </div>
                <button 
                  onClick={() => handleSearch(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-2 border-slate-100 border-dashed">
          <div className="bg-slate-50 p-8 rounded-full mb-6">
            <Layers className="text-slate-200" size={64} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Consulta de Kardex ERP</h2>
          <p className="text-slate-400 font-medium max-w-sm text-center">
            Selecciona filtros para generar el reporte de auditoría y trazabilidad de inventario.
          </p>
        </div>
      )}
    </div>
  )
}
