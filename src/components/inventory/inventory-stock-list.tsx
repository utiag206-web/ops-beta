'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, MapPin, Search, 
  AlertCircle, History, 
  Layers, Download,
  Tag, Pencil, LayoutGrid, Plus,
  ChevronDown, ChevronUp, Clock, User, MessageSquare,
  ArrowUpRight, ArrowDownLeft, Settings2, Globe, Locate,
  Box, Loader2
} from 'lucide-react'
import { StockForm } from './stock-form'
import * as XLSX from 'xlsx'
import { getMovementTraceability } from '@/app/(main)/inventory/actions'
import { toast } from 'sonner'

interface Movement {
  id: string
  type: 'ingreso' | 'salida' | 'ajuste'
  quantity: number
  location: string
  observation: string
  product_id: string
  created_at: string
  users?: { name: string }
  warehouse_id: string
  warehouses?: { name: string }
  movement_types?: { name: string, effect: string, code: string }
  document_type?: string
  document_number?: string
  reference?: string
  responsible_name?: string
}

interface StockItem {
  id: string
  product_id: string
  location: string
  quantity: number
  updated_at: string
  products: {
    name: string
    code: string
    unit: string
    category: string
    min_stock: number
  }
  warehouse_id: string
  warehouses?: {
    name: string
  }
}

export function InventoryStockList({ 
  initialStock, 
  products,
  user
}: { 
  initialStock: StockItem[], 
  products: any[],
  user?: any
}) {
  const router = useRouter()
  const role_id = user?.role_id
  const canWrite = ['admin', 'almacen', 'cocina', 'operaciones', 'logistica', 'administracion', 'gerente'].includes(role_id || '')
  const [stock, setStock] = useState<StockItem[]>(initialStock)
  
  // Sync internal state when props change (Reactive Sync)
  useEffect(() => {
    setStock(initialStock)
  }, [initialStock])

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  const [filterLocation, setFilterLocation] = useState<string>('all')
  const [filterAlert, setFilterAlert] = useState<'all' | 'alerts'>('all')

  // Agrupar stock por producto para una vista más limpia (Issue 7)
  const groupedStock = useMemo(() => {
    const groups: Record<string, { product: any, items: StockItem[], totalQuantity: number }> = {}
    
    stock.forEach(item => {
      const pid = item.product_id
      // Skip item if product details are missing to prevent crashes
      if (!item.products) {
        console.warn('Orphaned stock record found:', item.id)
        return
      }
      
      if (!groups[pid]) {
        groups[pid] = { 
          product: item.products, 
          items: [], 
          totalQuantity: 0 
        }
      }
      groups[pid].items.push(item)
      groups[pid].totalQuantity += item.quantity
    })
    
    return Object.values(groups).sort((a, b) => {
      const nameA = a.product?.name || ''
      const nameB = b.product?.name || ''
      return nameA.localeCompare(nameB)
    })
  }, [stock])

  // Filtrar grupos
  const filteredGroups = useMemo(() => {
    return groupedStock.filter(group => {
      if (!group.product) return false;
      const matchesSearch = (group.product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (group.product.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const hasLocation = filterLocation === 'all' || group.items.some(item => (item.warehouses?.name || item.location) === filterLocation);
      
      const isCritical = group.totalQuantity <= 0;
      const isWarning = group.totalQuantity <= (group.product?.min_stock || 0) && group.totalQuantity > 0;
      const matchesAlert = filterAlert === 'all' || (filterAlert === 'alerts' && (isCritical || isWarning));
      
      return matchesSearch && hasLocation && matchesAlert;
    })
  }, [groupedStock, searchTerm, filterLocation, filterAlert])

  const locations = useMemo(() => {
    return Array.from(new Set(stock.map(item => item.warehouses?.name || item.location))).sort();
  }, [stock])

  const exportToExcel = () => {
    const dataToExport = stock.map(item => ({
      'Código / SKU': item.products.code,
      'Descripción': item.products.name,
      'Almacén': item.warehouses?.name || item.location,
      'Stock': item.quantity,
      'Unidad': item.products.unit,
      'Categoría': item.products.category
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Actual')
    XLSX.writeFile(wb, `Stock_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <Layers className="text-emerald-600" size={24} />
            </div>
            Control de Stock
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">Gestión centralizada por producto y almacén.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
          <button 
            onClick={() => setFilterAlert(prev => prev === 'all' ? 'alerts' : 'all')}
            className={`flex-1 md:flex-none border-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 text-xs md:text-sm ${
              filterAlert === 'alerts' 
                ? 'bg-rose-50 border-rose-100 text-rose-600' 
                : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertCircle size={18} />
            <span>{filterAlert === 'alerts' ? 'Viendo Alertas' : 'Filtrar Alertas'}</span>
          </button>
          
          {canWrite && (
            <>
              <button 
                onClick={async () => {
                  if (confirm('¿Deseas recalcular el stock base en todos los movimientos? Esta operación es segura y corregirá cualquier desfase.')) {
                    toast.promise(import('@/app/(main)/inventory/actions').then(a => a.syncInventoryStock()), {
                      loading: 'Sincronizando stock...',
                      success: 'Stock sincronizado correctamente',
                      error: 'Error al sincronizar'
                    })
                  }
                }}
                className="bg-white border-2 border-slate-100 text-slate-400 p-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all hover:bg-slate-50 active:scale-95 text-sm"
                title="Sincronizar Totales"
              >
                <Clock size={18} />
              </button>
              
              <button 
                onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                className="flex-[2] md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 active:scale-95 text-xs md:text-sm"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Movimiento</span>
              </button>
            </>
          )}
          
          <button 
            onClick={exportToExcel}
            className="flex-1 md:flex-none bg-white border-2 border-emerald-100 text-emerald-600 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all hover:bg-emerald-50 active:scale-95 text-xs md:text-sm"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por código o nombre..."
            className="w-full bg-white border-2 border-slate-50 focus:border-emerald-500 rounded-xl md:rounded-2xl py-3 md:py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:col-span-4">
          <select 
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-full h-[50px] md:h-[58px] bg-white border-2 border-slate-50 focus:border-emerald-500 rounded-xl md:rounded-2xl px-4 text-sm font-bold transition-all outline-none shadow-sm appearance-none"
          >
            <option value="all">📍 Almacenes</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredGroups.length > 0 ? filteredGroups.map((group) => (
          <StockGroup 
            key={group.product.id} 
            group={group} 
            canWrite={canWrite}
            onEdit={(item) => {
              setEditingItem({
                product_id: item.product_id,
                location: item.warehouses?.name || item.location,
                quantity: item.quantity
              })
              setIsModalOpen(true)
            }}
          />
        )) : (
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 p-24 text-center">
            <LayoutGrid size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-black text-lg">No se encontraron productos en stock</p>
          </div>
        )}
      </div>

      <StockForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => router.refresh()}
        products={products}
        editingItem={editingItem}
      />
    </div>
  )
}

function StockGroup({ 
  group, 
  onEdit,
  canWrite
}: { 
  group: any, 
  onEdit: (item: any) => void,
  canWrite: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isCritical = group.totalQuantity <= 0
  const isWarning = group.totalQuantity <= (group.product.min_stock || 0) && group.totalQuantity > 0

  return (
    <div className={`bg-white rounded-2xl md:rounded-[2rem] border-2 transition-all overflow-hidden ${isExpanded ? 'border-indigo-100 shadow-xl ring-4 ring-indigo-50/50' : 'border-slate-50 hover:border-emerald-100 shadow-sm'}`}>
      <div 
        className="p-5 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-4 rounded-2xl transition-all ${isExpanded ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
            <Package size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-widest">
                {Array.isArray(group.product) ? group.product[0]?.code : group.product?.code}
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 uppercase">
                {Array.isArray(group.product) ? group.product[0]?.category : group.product?.category}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight">
              {typeof group.product?.name === 'object' ? JSON.stringify(group.product.name) : (Array.isArray(group.product) ? group.product[0]?.name : group.product?.name) || 'Producto sin nombre'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right hidden md:block">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Disponibilidad Total</p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm border-2 ${
              isCritical ? 'bg-rose-50 text-rose-600 border-rose-100' : 
              isWarning ? 'bg-amber-50 text-amber-600 border-amber-100' : 
              'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {group.totalQuantity} <span className="text-[10px] font-bold opacity-60 uppercase">{(Array.isArray(group.product) ? group.product[0]?.unit : group.product?.unit) || 'UND'}</span>
            </div>
          </div>
          <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-slate-100 text-slate-900 rotate-180' : 'text-slate-300'}`}>
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-50 bg-slate-50/30 p-6 space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warehouse Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <MapPin size={14} className="text-indigo-500" /> Distribución por Ubicación
              </h4>
              <div className="space-y-3">
                {group.items.map((item: StockItem) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 border border-indigo-50 shadow-sm">
                        <Box size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-700 uppercase">{item.warehouses?.name || item.location}</p>
                        <p className="text-[10px] font-bold text-slate-400 italic">Actualizado: {new Date(item.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-black text-slate-800">{item.quantity}</span>
                      {canWrite && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                           className="p-2 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lazy-Loaded Traceability (Issue 8) */}
            <TraceabilityCard productId={group.product.id} unit={group.product.unit} />
          </div>
        </div>
      )}
    </div>
  )
}

function TraceabilityCard({ productId, unit }: { productId: string, unit: string }) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await getMovementTraceability(productId)
      if (res.data) setMovements(res.data)
      setLoading(false)
    }
    load()
  }, [productId])

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <History size={14} className="text-indigo-500" /> Historial de Trazabilidad (Últimos 50)
      </h4>
      
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-2" size={24} />
          <p className="text-xs font-bold uppercase tracking-widest">Cargando historial...</p>
        </div>
      ) : movements.length > 0 ? (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {movements.map(m => (
            <div key={m.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  m.type === 'ingreso' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  m.type === 'salida' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {m.type === 'ingreso' ? <ArrowUpRight size={14} /> : 
                   m.type === 'salida' ? <ArrowDownLeft size={14} /> : 
                   <Settings2 size={14} />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-700 uppercase leading-none mb-1">
                    {m.movement_types?.name || m.type}
                    {m.document_number && <span className="ml-2 text-slate-400 font-bold border-l pl-2 border-slate-200"># {m.document_number}</span>}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${m.type === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {m.type === 'salida' ? '-' : '+'}{m.quantity}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{m.warehouses?.name || m.location}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 italic text-sm">Sin movimientos registrados</div>
      )}
    </div>
  )
}
