'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  History, Search, Filter, Hash, 
  ArrowUpRight, ArrowDownLeft, Settings2,
  Calendar, Clock, User, MessageSquare, Package, Plus, MapPin
} from 'lucide-react'
import { MovementForm } from './movement-form'

const getTypeStyle = (type: string) => {
  switch (type) {
    case 'ingreso': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    case 'salida': return 'bg-rose-50 text-rose-600 border-rose-100'
    case 'ajuste': return 'bg-amber-50 text-amber-600 border-amber-100'
    default: return 'bg-slate-50 text-slate-600 border-slate-100'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'ingreso': return <ArrowUpRight size={12} />
    case 'salida': return <ArrowDownLeft size={12} />
    case 'ajuste': return <Settings2 size={12} />
    default: return <Package size={12} />
  }
}

interface Movement {
  id: string
  product_id: string
  type: 'ingreso' | 'salida' | 'ajuste'
  quantity: number
  location: string
  observation: string
  created_at: string
  products: {
    name: string
    code: string
    unit: string
  }
  users?: {
    name: string
  }
  warehouse_id: string
  warehouses?: { name: string }
  movement_types?: { name: string, effect: string, code: string }
  document_type?: string
  document_number?: string
  reference?: string
  responsible_name?: string
  running_balance?: number
}

interface InventoryMovementsListProps {
  initialMovements: Movement[]
  initialBalances?: Record<string, number>
  products: any[]
}

export function InventoryMovementsList({ 
  initialMovements, 
  initialBalances = {},
  products 
}: InventoryMovementsListProps) {
  const router = useRouter()
  const [movements, setMovements] = useState<Movement[]>(initialMovements)

  // Sync internal state when props change (Reactive Sync)
  useEffect(() => {
    setMovements(initialMovements)
  }, [initialMovements])

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredMovements = movements.filter(m => {
    const productName = (m.products?.name || '').toLowerCase()
    const productCode = (m.products?.code || '').toLowerCase()
    const observation = (m.observation || '').toLowerCase()
    const search = searchTerm.toLowerCase()
    
    return productName.includes(search) || 
           productCode.includes(search) || 
           observation.includes(search)
  })

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'ingreso': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'salida': return 'bg-rose-50 text-rose-700 border-rose-100'
      case 'ajuste': return 'bg-amber-50 text-amber-700 border-amber-100'
      default: return 'bg-slate-50 text-slate-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ingreso': return <ArrowUpRight size={14} />
      case 'salida': return <ArrowDownLeft size={14} />
      case 'ajuste': return <Settings2 size={14} />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <History className="text-blue-600" size={24} />
            </div>
            Movimientos
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Trazabilidad completa de entradas y salidas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} className="hidden" /> 
          <span>Nuevo Movimiento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por producto, observación..."
            className="w-full bg-white border-2 border-slate-100 focus:border-blue-500 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-white border-2 border-slate-100 hover:bg-slate-50 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2 transition-all shadow-sm h-[54px]">
          <Filter size={18} />
          Filtrar Fecha
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha / Hora</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Código</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Movimiento</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center bg-blue-50/30">Saldo</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Ubicación / Almacén</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100">Documento & Responsable</th>
                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(() => {
                // Lógica de Kardex: Calcular saldos acumulados (Orden Cronológico)
                // Nota: Esto asume que el initialMovements viene ordenado DESC por fecha.
                // Para el cálculo de saldo, necesitamos procesar de la más antigua a la más reciente.
                const sortedMovements = [...filteredMovements].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
                
                let runningBalances: Record<string, number> = {}
                
                // Inicializar saldos con los valores base del servidor (basados en historia previa)
                Object.entries(initialBalances).forEach(([key, val]) => {
                  runningBalances[key] = val
                })

                const movementsWithBalance = sortedMovements.map(m => {
                  const key = `${m.product_id}|${m.warehouse_id}`
                  const currentBalance = runningBalances[key] || 0
                  
                  const effect = m.movement_types?.effect
                  const type = (m.type || '').toLowerCase()
                  const qty = Math.abs(Number(m.quantity))

                  let newBalance = currentBalance
                  if (effect === 'IN' || type === 'ingreso') newBalance += qty
                  else if (effect === 'OUT' || type === 'salida') newBalance -= qty
                  else newBalance -= qty // Default legacy behavior

                  runningBalances[key] = newBalance
                  return { ...m, running_balance: newBalance }
                }).filter(m => !!m.products)

                // Volver a ordenar DESC para mostrar lo más reciente arriba
                const displayMovements = movementsWithBalance.reverse()

                return displayMovements.length > 0 ? displayMovements.map((m) => {
                  if (!m.products) return null;
                  const isIntegerUnit = ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes((m.products.unit || '').toUpperCase())
                  const displayQuantity = isIntegerUnit ? Math.round(m.quantity) : m.quantity
                  
                  return (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-slate-800 font-black text-sm">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(m.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] mt-0.5 uppercase">
                          <Clock size={10} />
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 uppercase tracking-widest">{m.products.code}</span>
                    </td>
                    <td className="py-5 px-6">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1">{m.products.name}</p>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getTypeStyle(m.type)}`} title={m.movement_types?.name}>
                        {getTypeIcon(m.type)}
                        {m.movement_types?.code || m.type}
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <p className={`text-sm font-black ${m.type === 'ingreso' ? 'text-emerald-600' : m.type === 'salida' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {m.type === 'salida' ? '-' : m.type === 'ingreso' ? '+' : ''}{displayQuantity}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{m.products.unit}</p>
                    </td>
                    <td className="py-5 px-6 text-center bg-blue-50/10">
                      <span className="text-sm font-black text-slate-700">{m.running_balance}</span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-tight">
                        <MapPin size={12} className="text-indigo-400" />
                        {m.warehouses?.name || m.location}
                      </div>
                    </td>
                    <td className="py-5 px-6 border-l border-slate-50">
                      <div className="flex flex-col gap-1.5">
                        {m.document_type && m.document_number ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                             <span className="bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest text-[9px]">{m.document_type}</span>
                             <span>{m.document_number}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-medium italic">Sin documento</span>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10px] uppercase">
                          <User size={10} className="text-slate-400" />
                          {m.responsible_name || m.users?.name || 'Sistema'}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      {m.observation ? (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium italic max-w-[200px] line-clamp-1">
                           <MessageSquare size={10} className="text-slate-300" />
                           {m.observation}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                )}) : (
                <tr>
                  <td colSpan={9} className="py-24 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <History size={40} />
                    </div>
                    <p className="text-slate-500 font-black text-lg">Historial vacío</p>
                    <p className="text-slate-400 text-sm font-medium mt-1">Registra movimientos para empezar la trazabilidad.</p>
                  </td>
                </tr>
              )
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <MovementForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => router.refresh()}
        products={products}
      />
    </div>
  )
}
