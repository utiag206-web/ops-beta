'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle2, Shield, Settings, Activity } from 'lucide-react'
import { createAsset, updateAsset } from '@/app/(main)/assets/actions'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { ModalPortal } from '@/components/ui/modal-portal'

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
 if (editingAsset) setForm(prev => ({ ...prev, ...editingAsset }))
 else setForm(prev => ({ ...prev, ...initialState }))
 }
 }, [editingAsset?.id, isOpen])

 if (!isOpen) return null

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 
 try {
 const cleanForm = {
 code: form.code.toUpperCase().trim(),
 name: form.name.toUpperCase().trim(),
 type: form.type,
 status: form.status,
 location: form.location.toUpperCase().trim()
 }

 const res = editingAsset
 ? await updateAsset(editingAsset.id, cleanForm)
 : await createAsset(cleanForm)

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

  if (!isOpen) return null

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          {/* Cabecera */}
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                {editingAsset ? 'Editar Activo' : 'Registrar Nuevo Activo'}
              </h2>
              <p className="text-slate-400 text-xs font-medium mt-1">Ingresa los datos del equipo o herramienta.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-tight text-slate-400 px-1">Código / Serie</label>
                  <input 
                    required
                    type="text"
                    placeholder="ACT-001"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all outline-none"
                    value={form.code}
                    onChange={e => setForm(prev => ({...prev, code: e.target.value.toUpperCase()}))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-tight text-slate-400 px-1">Tipo</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all outline-none"
                    value={form.type}
                    onChange={e => setForm(prev => ({...prev, type: e.target.value}))}
                  >
                    <option value="equipo">Equipo Pesado / Vehículo</option>
                    <option value="herramienta">Herramienta / Menor</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-tight text-slate-400 px-1">Nombre del Activo</label>
                <input 
                  required
                  type="text"
                  placeholder="Ej: Camioneta Toyota Hilux"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all outline-none"
                  value={form.name}
                  onChange={e => setForm(prev => ({...prev, name: e.target.value.toUpperCase()}))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-tight text-slate-400 px-1">Estado Operativo</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all outline-none"
                    value={form.status}
                    onChange={e => setForm(prev => ({...prev, status: e.target.value}))}
                  >
                    <option value="operativo">Operativo</option>
                    <option value="en mantenimiento">En Mantenimiento</option>
                    <option value="fuera de servicio">Fuera de Servicio</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-tight text-slate-400 px-1">Ubicación Actual</label>
                  <input 
                    required
                    type="text"
                    placeholder="Ej: Taller Norte"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all outline-none"
                    value={form.location}
                    onChange={e => setForm(prev => ({...prev, location: e.target.value.toUpperCase()}))}
                  />
                </div>
              </div>
            </div>

            {/* Footer Fijo */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                disabled={loading}
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> {editingAsset ? 'Actualizar Activo' : 'Registrar Activo'}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
