'use client'

import { useState } from 'react'
import { Download, AlertCircle, TrendingDown, TrendingUp, MapPin, Search } from 'lucide-react'
import { exportReportsToExcel } from '@/lib/export-utils'

interface ReportsClientProps {
  stockWarehouse: any[]
  lowStock: any[]
  dormant: any[]
  topConsumed: any[]
}

export function ReportsClient({ stockWarehouse, lowStock, dormant, topConsumed }: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<'warehouse' | 'low' | 'dormant' | 'top'>('warehouse')

  // Transform data for exports
  const exportWarehouse = () => {
    const data = stockWarehouse.map(i => {
      const prod = Array.isArray(i.products) ? i.products[0] : i.products;
      const wh = Array.isArray(i.warehouses) ? i.warehouses[0] : i.warehouses;
      return {
        'Ubicación': wh?.name || 'Desconocida',
        'Código': prod?.code,
        'Producto': prod?.name,
        'Categoría': prod?.category,
        'Stock Actual': i.quantity,
        'Unidad': prod?.unit
      }
    })
    exportReportsToExcel('Stock_Por_Almacen', data)
  }

  const exportLowStock = () => {
    const data = lowStock.map(i => ({
      'Código': i.code,
      'Producto': i.name,
      'Categoría': i.category,
      'Stock Total': i.total_stock,
      'Stock Mínimo (Límite)': i.min_stock,
      'Unidad': i.unit
    }))
    exportReportsToExcel('Bajo_Stock', data)
  }

  const exportDormant = () => {
    const data = dormant.map(i => ({
      'Código': i.code,
      'Producto': i.name,
      'Categoría': i.category,
      'Stock Detenido': i.total_stock,
      'Unidad': i.unit,
      'Días sin movimiento': '>= 30'
    }))
    exportReportsToExcel('Sin_Movimiento', data)
  }

  const exportTop = () => {
    const data = topConsumed.map(i => ({
      'Código': i.code,
      'Producto': i.name,
      'Categoría': i.category,
      'Total Consumido (30 días)': i.total_consumed,
      'Unidad': i.unit
    }))
    exportReportsToExcel('Top_Consumidos', data)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setActiveTab('warehouse')}
          className={`p-6 rounded-[2rem] text-left transition-all border-2 ${activeTab === 'warehouse' ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
        >
          <div className={`p-3 rounded-2xl w-max mb-4 ${activeTab === 'warehouse' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
            <MapPin size={24} />
          </div>
          <h3 className={`font-black text-lg ${activeTab === 'warehouse' ? 'text-indigo-900' : 'text-slate-800'}`}>Stock por Almacén</h3>
          <p className={`text-sm font-medium mt-1 ${activeTab === 'warehouse' ? 'text-indigo-600' : 'text-slate-400'}`}>Distribución de inventario</p>
        </button>

        <button 
          onClick={() => setActiveTab('low')}
          className={`p-6 rounded-[2rem] text-left transition-all border-2 ${activeTab === 'low' ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
        >
          <div className={`p-3 rounded-2xl w-max mb-4 ${activeTab === 'low' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-slate-100 text-slate-500'}`}>
            <AlertCircle size={24} />
          </div>
          <h3 className={`font-black text-lg ${activeTab === 'low' ? 'text-amber-900' : 'text-slate-800'}`}>Bajo Stock</h3>
          <p className={`text-sm font-medium mt-1 ${activeTab === 'low' ? 'text-amber-600' : 'text-slate-400'}`}>Requieren reposición</p>
        </button>

        <button 
          onClick={() => setActiveTab('dormant')}
          className={`p-6 rounded-[2rem] text-left transition-all border-2 ${activeTab === 'dormant' ? 'bg-slate-100 border-slate-300 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
        >
          <div className={`p-3 rounded-2xl w-max mb-4 ${activeTab === 'dormant' ? 'bg-slate-600 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-500'}`}>
            <TrendingDown size={24} />
          </div>
          <h3 className={`font-black text-lg ${activeTab === 'dormant' ? 'text-slate-900' : 'text-slate-800'}`}>Sin Movimiento</h3>
          <p className={`text-sm font-medium mt-1 ${activeTab === 'dormant' ? 'text-slate-600' : 'text-slate-400'}`}>Ociosos hace 30 días</p>
        </button>

        <button 
          onClick={() => setActiveTab('top')}
          className={`p-6 rounded-[2rem] text-left transition-all border-2 ${activeTab === 'top' ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
        >
          <div className={`p-3 rounded-2xl w-max mb-4 ${activeTab === 'top' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
            <TrendingUp size={24} />
          </div>
          <h3 className={`font-black text-lg ${activeTab === 'top' ? 'text-emerald-900' : 'text-slate-800'}`}>Top Consumidos</h3>
          <p className={`text-sm font-medium mt-1 ${activeTab === 'top' ? 'text-emerald-600' : 'text-slate-400'}`}>Los más usados (30d)</p>
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {activeTab === 'warehouse' && 'Distribución Actual de Stock'}
            {activeTab === 'low' && 'Productos con Alerta de Escasez'}
            {activeTab === 'dormant' && 'Capital Inmovilizado (> 30 días sin flujo)'}
            {activeTab === 'top' && 'Salidas Operativas Mayoritarias (Últimos 30 días)'}
          </h2>
          <button 
            onClick={() => {
              if (activeTab === 'warehouse') exportWarehouse()
              if (activeTab === 'low') exportLowStock()
              if (activeTab === 'dormant') exportDormant()
              if (activeTab === 'top') exportTop()
            }}
            className="bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 px-6 py-2.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest"
          >
            <Download size={14} />
            Descargar
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'warehouse' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="pb-4 px-4">Almacén</th>
                  <th className="pb-4 px-4">Código</th>
                  <th className="pb-4 px-4">Producto</th>
                  <th className="pb-4 px-4 text-right">Cant. Disponible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stockWarehouse.map((item, idx) => {
                  const prod = Array.isArray(item.products) ? item.products[0] : item.products;
                  const wh = Array.isArray(item.warehouses) ? item.warehouses[0] : item.warehouses;
                  const isIntegerUnit = ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(prod?.unit?.toUpperCase() || '')
                  const qty = isIntegerUnit ? Math.round(item.quantity) : item.quantity
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-bold text-slate-600 text-xs uppercase"><MapPin size={12} className="inline mr-1"/>{wh?.name}</td>
                      <td className="py-4 px-4 font-black text-slate-400 text-xs">{prod?.code}</td>
                      <td className="py-4 px-4 font-bold text-slate-800 text-sm uppercase">{prod?.name}</td>
                      <td className="py-4 px-4 font-black text-indigo-600 text-right">{qty} <span className="text-[9px] uppercase font-bold text-slate-400 ml-1">{prod?.unit}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'low' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="pb-4 px-4">Código</th>
                  <th className="pb-4 px-4">Producto</th>
                  <th className="pb-4 px-4 text-center">Estado</th>
                  <th className="pb-4 px-4 text-right">Mínimo</th>
                  <th className="pb-4 px-4 text-right">Stock Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lowStock.map((item, idx) => {
                  const isIntegerUnit = ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(item.unit?.toUpperCase() || '')
                  const qty = isIntegerUnit ? Math.round(item.total_stock) : item.total_stock
                  const isZero = qty <= 0
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-black text-slate-400 text-xs">{item.code}</td>
                      <td className="py-4 px-4 font-bold text-slate-800 text-sm uppercase">{item.name}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-[9px] font-black uppercase ${isZero ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isZero ? 'Quedrado' : 'Al Límite'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-slate-400 text-right">
                        {item.min_stock} <span className="text-[9px] uppercase font-bold text-slate-400 ml-1">{item.unit}</span>
                      </td>
                      <td className={`py-4 px-4 font-black text-right ${isZero ? 'text-rose-600' : 'text-amber-500'}`}>
                        {qty} <span className="text-[9px] uppercase font-bold text-slate-400 ml-1">{item.unit}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'dormant' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="pb-4 px-4">Código</th>
                  <th className="pb-4 px-4">Producto inmovilizado</th>
                  <th className="pb-4 px-4">Rubro</th>
                  <th className="pb-4 px-4 text-right">Stock Detenido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dormant.map((item, idx) => {
                  const isIntegerUnit = ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(item.unit?.toUpperCase() || '')
                  const qty = isIntegerUnit ? Math.round(item.total_stock) : item.total_stock
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-black text-slate-400 text-xs">{item.code}</td>
                      <td className="py-4 px-4 font-bold text-slate-800 text-sm uppercase">{item.name}</td>
                      <td className="py-4 px-4 font-bold text-slate-500 text-xs uppercase">{item.category}</td>
                      <td className="py-4 px-4 font-black text-slate-600 text-right">{qty} <span className="text-[9px] uppercase font-bold text-slate-400 ml-1">{item.unit}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'top' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="pb-4 px-4">Rank</th>
                  <th className="pb-4 px-4">Código</th>
                  <th className="pb-4 px-4">Producto</th>
                  <th className="pb-4 px-4 text-right">Total Salidas / Consumo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topConsumed.map((item, idx) => {
                  const isIntegerUnit = ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(item.unit?.toUpperCase() || '')
                  const qty = isIntegerUnit ? Math.round(item.total_consumed) : item.total_consumed
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-black text-emerald-500 text-lg">#{idx + 1}</td>
                      <td className="py-4 px-4 font-black text-slate-400 text-xs">{item.code}</td>
                      <td className="py-4 px-4 font-bold text-slate-800 text-sm uppercase">{item.name}</td>
                      <td className="py-4 px-4 font-black text-emerald-600 text-right">{qty} <span className="text-[9px] uppercase font-bold text-slate-400 ml-1">{item.unit}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </div>
  )
}
