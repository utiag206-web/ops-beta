'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle2, Shield, Settings, Activity } from 'lucide-react'
import { createAsset, updateAsset } from '@/app/(dashboard)/assets/actions'
import { toast } from 'sonner'
import { useEffect } from 'react'

interface AssetFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingAsset?: any
}

const initialState = {
  code: '',
  name: '',
  type: 'equipo',
  status: 'operativo',
  location: ''
}

export function AssetForm({ isOpen, onClose, onSuccess, editingAsset }: AssetFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(initialState)

  useEffect(() => {
    if (isOpen) {
      if (editingAsset) setForm(editingAsset)
      else setForm(initialState)
    }
  }, [editingAsset, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = editingAsset
        ? await updateAsset(editingAsset.id, form)
        : await createAsset(form)

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(editingAsset ? 'Activo actualizado exitosamente' : 'Activo registrado exitosamente')
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
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-blue-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {editingAsset ? 'Editar Activo' : 'Registrar Nuevo Activo'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">Ingresa los datos del equipo o herramienta.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Código / Serie</label>
              <input 
                required
                type="text"
                placeholder="ACT-001"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                value={form.code}
                onChange={e => setForm({...form, code: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo</label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
              >
                <option value="equipo">Equipo Pesado / Vehículo</option>
                <option value="herramienta">Herramienta / Menor</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Nombre del Activo</label>
            <input 
              required
              type="text"
              placeholder="Ej: Camioneta Toyota Hilux"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Estado Operativo</label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value})}
              >
                <option value="operativo">Operativo</option>
                <option value="en mantenimiento">En Mantenimiento</option>
                <option value="fuera de servicio">Fuera de Servicio</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Ubicación Actual</label>
              <input 
                required
                type="text"
                placeholder="Ej: Taller Norte"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                value={form.location}
                onChange={e => setForm({...form, location: e.target.value})}
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
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> {editingAsset ? 'Actualizar Activo' : 'Registrar Ahora'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
