'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, Box, Info, Eye } from 'lucide-react'
import { createProduct, updateProduct } from '@/app/(dashboard)/inventory/actions'
import { toast } from 'sonner'

interface ProductFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingProduct?: any
  isViewOnly?: boolean
}

const initialState = {
  code: '',
  name: '',
  category: 'EPP',
  unit: 'unidad',
  type: 'consumible',
  has_expiry: false,
  min_stock: 0,
  equivalence: '',
  expiry_date: '',
  initial_location: '',
  initial_stock: 0
}

export function ProductForm({ isOpen, onClose, onSuccess, editingProduct, isViewOnly }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(initialState)

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setForm(editingProduct)
      } else {
        setForm(initialState)
      }
    }
  }, [editingProduct, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isViewOnly) return
    
    setLoading(true)
    
    try {
      // Sanitize payload: convert empty strings to undefined for optional fields like expiry_date
      const sanitizedForm = {
        ...form,
        expiry_date: form.has_expiry && form.expiry_date ? form.expiry_date : undefined,
        equivalence: form.equivalence || undefined
      }

      const res = editingProduct 
        ? await updateProduct(editingProduct.id, sanitizedForm)
        : await createProduct(sanitizedForm)

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(editingProduct ? 'Producto actualizado' : 'Producto registrado')
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
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-100/50">
              {isViewOnly ? <Eye className="text-indigo-600" size={24} /> : <Box className="text-indigo-600" size={24} /> }
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {isViewOnly ? 'Detalle del Producto' : editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {isViewOnly ? 'Consulta los atributos base del catálogo.' : 'Define los atributos base del catálogo.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Código</label>
              <input 
                required
                disabled={isViewOnly}
                type="text"
                placeholder="SKU-001"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none disabled:opacity-70"
                value={form.code}
                onChange={e => setForm({...form, code: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Rubro / Categoría</label>
              <select 
                required
                disabled={isViewOnly}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none disabled:opacity-70 appearance-none"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
              >
                <option value="EPP">EPP</option>
                <option value="herramientas">Herramientas</option>
                <option value="alimentos">Alimentos</option>
                <option value="limpieza">Limpieza</option>
                <option value="repuestos">Repuestos</option>
                <option value="oficina">Oficina</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Nombre o Descripción</label>
            <input 
              required
              disabled={isViewOnly}
              type="text"
              placeholder="Ej: Guantes de nitrilo reforzados"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none disabled:opacity-70"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Unidad de Medida</label>
              <select 
                required
                disabled={isViewOnly}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none disabled:opacity-70 appearance-none"
                value={form.unit}
                onChange={e => setForm({...form, unit: e.target.value})}
              >
                <option value="unidad">Unidad (UND)</option>
                <option value="kg">Kilogramos (KG)</option>
                <option value="litros">Litros (LTS)</option>
                <option value="metros">Metros (MTS)</option>
                <option value="par">Par</option>
                <option value="caja">Caja</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo</label>
              <select 
                required
                disabled={isViewOnly}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none disabled:opacity-70 appearance-none"
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
              >
                <option value="consumible">Consumible</option>
                <option value="no consumible">No Consumible</option>
                <option value="herramienta">Herramienta</option>
                <option value="equipo">Equipo</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Equivalencia (Opcional)</label>
            <input 
              disabled={isViewOnly}
              type="text"
              placeholder="Ej: 1 caja = 12 unidades"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none disabled:opacity-70"
              value={form.equivalence || ''}
              onChange={e => setForm({...form, equivalence: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Stock Mínimo</label>
              <input 
                required
                disabled={isViewOnly}
                type="number"
                min="0"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none disabled:opacity-70"
                value={form.min_stock}
                onChange={e => setForm({...form, min_stock: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-4">
              <div className={`flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border-2 border-transparent transition-all transition-all ${isViewOnly ? 'opacity-70 cursor-not-allowed' : 'hover:border-slate-100 cursor-pointer select-none'}`}
                  onClick={() => !isViewOnly && setForm({...form, has_expiry: !form.has_expiry})}>
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${form.has_expiry ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                  {form.has_expiry && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <span className="text-xs font-bold text-slate-600 uppercase">¿Vence?</span>
              </div>
              
              {form.has_expiry && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Fecha de Vencimiento</label>
                  <input 
                    required={form.has_expiry}
                    disabled={isViewOnly}
                    type="date"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none disabled:opacity-70"
                    value={form.expiry_date || ''}
                    onChange={e => setForm({...form, expiry_date: e.target.value})}
                  />
                </div>
              )}
            </div>
          </div>

          {!editingProduct && !isViewOnly && (
            <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Box size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest">Configuración Stock Inicial</h3>
                </div>
                {form.initial_stock > 0 && !form.initial_location && (
                  <span className="text-[9px] font-black text-emerald-600 bg-white px-2 py-1 rounded-lg border border-emerald-200 animate-pulse">
                    USA: ALMACÉN PRINCIPAL
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 px-1">Ubicación</label>
                  <input 
                    type="text"
                    placeholder="Ej: Central (opcional)"
                    className="w-full bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl p-3 text-xs font-bold transition-all outline-none shadow-sm"
                    value={form.initial_location || ''}
                    onChange={e => setForm({...form, initial_location: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 px-1">Cant. Inicial</label>
                  <input 
                    type="number"
                    min="0"
                    step={['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(form.unit.toUpperCase()) ? "1" : "0.01"}
                    placeholder="0"
                    className="w-full bg-white border-2 border-transparent focus:border-emerald-500 rounded-xl p-3 text-xs font-bold transition-all outline-none shadow-sm"
                    value={form.initial_stock || 0}
                    onChange={e => {
                      const val = Number(e.target.value)
                      const isInteger = ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(form.unit.toUpperCase())
                      setForm({...form, initial_stock: isInteger ? Math.floor(val) : val})
                    }}
                    onKeyDown={e => {
                      if (['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(form.unit.toUpperCase()) && (e.key === '.' || e.key === ',')) {
                        e.preventDefault()
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-emerald-600/70 font-medium px-1 flex items-center gap-1.5">
                <Info size={12} /> Trazabilidad: Se generará un "Ajuste Inicial" automáticamente.
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl transition-all hover:bg-slate-200">
              {isViewOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isViewOnly && (
              <button 
                disabled={loading}
                type="submit"
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> {editingProduct ? 'Actualizar' : 'Guardar'}</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  </div>
  )
}
