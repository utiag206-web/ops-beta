'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, CheckCircle2, Package } from 'lucide-react'
import { updateStockRecord, getWarehouses } from '@/app/(dashboard)/inventory/actions'
import { WarehouseForm } from './warehouse-form'
import { toast } from 'sonner'

interface StockFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  products: any[]
  editingItem?: {
    product_id: string
    warehouse_id: string
    quantity: number
  } | null
}

export function StockForm({ isOpen, onClose, onSuccess, products, editingItem }: StockFormProps) {
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false)
  const [form, setForm] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: 0
  })

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setForm({
          product_id: editingItem.product_id,
          warehouse_id: editingItem.warehouse_id,
          quantity: editingItem.quantity
        })
      } else {
        setForm({
          product_id: '',
          warehouse_id: '',
          quantity: 0
        })
      }
      
      const loadContext = async () => {
        setInitLoading(true)
        const wRes = await getWarehouses()
        if (wRes.data) setWarehouses(wRes.data)
        setInitLoading(false)
      }
      loadContext()
    }
  }, [editingItem, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_id || !form.warehouse_id) {
      toast.error('Selecciona producto y almacén')
      return
    }

    setLoading(true)
    try {
      const res = await updateStockRecord(form)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Stock actualizado')
        onSuccess?.()
        onClose()
      }
    } catch (err: any) {
      toast.error(`Error crítico: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-emerald-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Package className="text-emerald-600" size={24} />
              Actualizar Stock
            </h2>
            <p className="text-slate-500 text-sm font-medium">Define la cantidad disponible en una ubicación.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {initLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <span className="font-bold">Cargando contexto actual...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Producto / Insumo</label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none appearance-none"
                value={form.product_id}
                onChange={e => setForm({...form, product_id: e.target.value})}
              >
                <option value="">Seleccionar producto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>[{p.code}] {p.name} - {p.unit}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Almacén</label>
                <select 
                  required
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none appearance-none"
                  value={form.warehouse_id}
                  onChange={e => {
                    if (e.target.value === 'new_warehouse') {
                      setIsWarehouseModalOpen(true)
                    } else {
                      setForm({...form, warehouse_id: e.target.value})
                    }
                  }}
                >
                  <option value="">Seleccionar almacén...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                  <option value="new_warehouse" className="font-bold text-blue-600 bg-blue-50">➕ Crear nuevo almacén</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Cantidad Actual</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                  value={form.quantity}
                  onChange={e => setForm({...form, quantity: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl transition-all hover:bg-slate-200">
                Cancelar
              </button>
              <button 
                disabled={loading}
                type="submit"
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Actualizar Stock</>}
              </button>
            </div>
          </form>
        )}
      </div>

      <WarehouseForm 
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        onSuccess={(newWarehouse) => {
          setWarehouses(prev => [...prev, newWarehouse])
          setForm(prev => ({ ...prev, warehouse_id: newWarehouse.id }))
        }}
      />
    </div>
  )
}
