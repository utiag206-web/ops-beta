'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, Factory } from 'lucide-react'
import { createWarehouse, updateWarehouse } from '@/app/(dashboard)/inventory/actions'
import { toast } from 'sonner'

interface WarehouseFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newWarehouse: any) => void
  editingWarehouse?: any | null
}

export function WarehouseForm({ isOpen, onClose, onSuccess, editingWarehouse }: WarehouseFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    code: '',
  })

  // Sincronizar formulario al abrir o cambiar de modo
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: editingWarehouse?.name || '',
        code: editingWarehouse?.code || '',
      })
    }
  }, [isOpen, editingWarehouse])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('El nombre del almacén es obligatorio')
      return
    }

    setLoading(true)
    try {
      let res;
      if (editingWarehouse) {
        res = await updateWarehouse(editingWarehouse.id, form)
      } else {
        res = await createWarehouse(form)
      }

      if (res && 'error' in res && res.error) {
        toast.error(res.error as string)
      } else {
        toast.success(editingWarehouse ? 'Almacén actualizado' : 'Almacén creado exitosamente')
        if (res && 'data' in res) onSuccess?.(res.data)
        onClose()
      }
    } catch (err: any) {
      toast.error(`Error crítico: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600">
              <Factory size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{editingWarehouse ? 'Editar Almacén' : 'Nuevo Almacén'}</h2>
              <p className="text-slate-500 text-xs font-medium">{editingWarehouse ? 'Actualizar detalles.' : 'Registrar nueva ubicación.'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
            <X size={20} className="stroke-[3px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Nombre del Almacén <span className="text-rose-500">*</span></label>
            <input 
              required
              type="text"
              placeholder="Ej: Almacén Principal"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Código (Opcional)</label>
            <input 
              type="text"
              placeholder="Ej: ALM-CEN"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none uppercase"
              value={form.code}
              onChange={e => setForm({...form, code: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl transition-all hover:bg-slate-200">
              Cancelar
            </button>
            <button 
              disabled={loading}
              type="submit"
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Entendido</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
