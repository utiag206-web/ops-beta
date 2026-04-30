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
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-50">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-xl">
              <Layers className="text-emerald-600 w-6 h-6 md:w-7 md:h-7" />
            </div>
            Control de Stock
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">Gestión centralizada por producto y almacén.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
          <button 
            onClick={() => setFilterAlert(prev => prev === 'all' ? 'alerts' : 'all')}
            className={`flex-1 md:flex-none border-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 text-[10px] md:text-sm uppercase tracking-widest ${
              filterAlert === 'alerts' 
                ? 'bg-rose-50 border-rose-100 text-rose-600' 
                : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertCircle size={18} />
            <span className="hidden sm:inline">{filterAlert === 'alerts' ? 'Viendo Alertas' : 'Filtrar Alertas'}</span>
            <span className="sm:hidden">{filterAlert === 'alerts' ? 'Alertas' : 'Alertas'}</span>
          </button>
          
          {canWrite && (
            <button 
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
              className="flex-[2] md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 active:scale-95 text-[10px] md:text-sm uppercase tracking-widest"
            >
              <Plus size={18} strokeWidth={3} />
              <span>Movimiento</span>
            </button>
          )}
          
          <button 
            onClick={exportToExcel}
            className="flex-1 md:flex-none bg-white border-2 border-emerald-100 text-emerald-600 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-2 transition-all hover:bg-emerald-50 active:scale-95 text-[10px] md:text-sm uppercase tracking-widest"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px] md:w-5 md:h-5" />
          <input 
            type="text"
            placeholder="Buscar producto..."
            className="w-full bg-white border-2 border-slate-50 focus:border-emerald-500 rounded-xl md:rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:col-span-4">
          <select 
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-full h-[52px] md:h-[58px] bg-white border-2 border-slate-50 focus:border-emerald-500 rounded-xl md:rounded-2xl px-4 text-sm font-bold transition-all outline-none shadow-sm appearance-none"
          >
            <option value="all">📍 Todos los Almacenes</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
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
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] border-2 border-slate-50 p-12 md:p-24 text-center">
            <LayoutGrid size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-black text-lg">No se encontraron productos</p>
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
    <div className={`bg-white rounded-2xl md:rounded-[2rem] border-2 transition-all overflow-hidden ${isExpanded ? 'border-indigo-100 shadow-lg ring-4 ring-indigo-50/50' : 'border-slate-50 hover:border-emerald-100 shadow-sm'}`}>
      <div 
        className="p-4 md:p-5 flex flex-row items-center justify-between gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all shrink-0 ${isExpanded ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
            <Package className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1">
              <span className="text-[8px] md:text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 md:px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-widest truncate max-w-[80px] md:max-w-none">
                {Array.isArray(group.product) ? group.product[0]?.code : group.product?.code}
              </span>
              <span className="text-[8px] md:text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 md:px-2 py-0.5 rounded-md border border-slate-100 uppercase truncate max-w-[80px] md:max-w-none">
                {Array.isArray(group.product) ? group.product[0]?.category : group.product?.category}
              </span>
            </div>
            <h3 className="text-sm md:text-lg font-black text-slate-800 uppercase tracking-tight leading-tight truncate">
              {typeof group.product?.name === 'object' ? JSON.stringify(group.product.name) : (Array.isArray(group.product) ? group.product[0]?.name : group.product?.name) || 'Producto'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-8">
          <div className="text-right">
            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 md:mb-1 leading-none hidden sm:block">Disponibilidad</p>
            <div className={`inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl font-black text-xs md:text-sm border-2 ${
              isCritical ? 'bg-rose-50 text-rose-600 border-rose-100' : 
              isWarning ? 'bg-amber-50 text-amber-600 border-amber-100' : 
              'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {group.totalQuantity} <span className="text-[8px] md:text-[10px] font-bold opacity-60 uppercase">{(Array.isArray(group.product) ? group.product[0]?.unit : group.product?.unit) || 'UND'}</span>
            </div>
          </div>
          <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${isExpanded ? 'bg-slate-100 text-slate-900 rotate-180' : 'text-slate-300'}`}>
            <ChevronDown className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-50 bg-slate-50/30 p-4 md:p-6 space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {/* Warehouse Breakdown */}
            <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 p-4 md:p-6 shadow-sm">
              <h4 className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <MapPin size={14} className="text-indigo-500" /> Stock por Ubicación
              </h4>
              <div className="space-y-2 md:space-y-3">
                {group.items.map((item: StockItem) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100/50 hover:bg-white transition-all group">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 border border-indigo-50 shadow-sm shrink-0">
                        <Box size={14} />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-black text-slate-700 uppercase leading-none mb-1">{item.warehouses?.name || item.location}</p>
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-400">Act: {new Date(item.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      <span className="text-base md:text-lg font-black text-slate-800">{item.quantity}</span>
                      {canWrite && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                           className="p-2 text-slate-400 hover:text-indigo-600 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lazy-Loaded Traceability */}
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
    <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 p-4 md:p-6 shadow-sm">
      <h4 className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <History size={14} className="text-indigo-500" /> Trazabilidad
      </h4>
      
      {loading ? (
        <div className="py-8 md:py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-2 w-5 h-5 md:w-6 md:h-6" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Cargando...</p>
        </div>
      ) : movements.length > 0 ? (
        <div className="space-y-2 md:space-y-3 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {movements.map(m => (
            <div key={m.id} className="p-2.5 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl border ${
                  m.type === 'ingreso' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  m.type === 'salida' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {m.type === 'ingreso' ? <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5" /> : 
                   m.type === 'salida' ? <ArrowDownLeft className="w-3 h-3 md:w-3.5 md:h-3.5" /> : 
                   <Settings2 className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase leading-none mb-0.5 md:mb-1 truncate max-w-[120px] md:max-w-none">
                    {m.movement_types?.name || m.type}
                  </p>
                  <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{new Date(m.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs md:text-sm font-black ${m.type === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {m.type === 'salida' ? '-' : '+'}{m.quantity}
                </p>
                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[80px] md:max-w-none">{m.warehouses?.name || m.location}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 md:py-12 text-center text-slate-400 italic text-xs">Sin registros</div>
      )}
    </div>
  )
}
    </div>
  )
}
