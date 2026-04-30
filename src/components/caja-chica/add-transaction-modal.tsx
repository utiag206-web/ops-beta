'use client'

import React, { useState } from 'react'
import { 
  X, 
  Plus, 
  DollarSign, 
  Calendar, 
  FileText, 
  CreditCard,
  Banknote,
  Phone,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  Tag,
  Hash,
  Paperclip,
  CheckCircle2
} from 'lucide-react'
import { registerPettyCashTransaction } from '@/app/(dashboard)/caja-chica/actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  area: string
}

const CATEGORIES = [
  { id: 'alimentos', label: 'Alimentos', icon: '🍎' },
  { id: 'transporte', label: 'Transporte', icon: '🚗' },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: '🔧' },
  { id: 'utiles', label: 'Útiles', icon: '📚' },
  { id: 'emergencia', label: 'Emergencia', icon: '🚨' },
  { id: 'otros', label: 'Otros', icon: '📦' },
  { id: 'fondo_inicial', label: 'Fondo Inicial', icon: '🏦' },
  { id: 'reposicion', label: 'Reposición', icon: '🔄' },
  { id: 'reembolso', label: 'Reembolso', icon: '💰' },
]

export function AddTransactionModal({ isOpen, onClose, onSuccess, area }: AddTransactionModalProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'egreso' as 'ingreso' | 'egreso',
    category: 'otros',
    reason: '',
    amount: '',
    payment_method: 'efectivo' as const,
    operation_number: '',
    date: new Date().toISOString().split('T')[0],
    voucher_url: ''
  })

  if (!isOpen) return null

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo excede los 5MB permitidos')
      return
    }

    setUploading(true)
    try {
      const { uploadFilesAction } = await import('@/app/actions/storage')
      
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      const uploadRes = await uploadFilesAction(
        [{ name: file.name, type: file.type, base64 }],
        'petty-cash',
        'vouchers',
        area.toLowerCase().replace(/\s+/g, '_')
      )

      if (uploadRes.success && uploadRes.urls) {
        setFormData({ ...formData, voucher_url: uploadRes.urls[0] })
        toast.success('Comprobante subido correctamente')
      } else {
        throw new Error(uploadRes.error || 'Error desconocido')
      }
    } catch (error: any) {
      toast.error('Error al subir comprobante: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.reason || !formData.amount || !formData.category) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setLoading(true)
    const result = await registerPettyCashTransaction({
      ...formData,
      amount: Number(formData.amount),
      area,
      category: formData.category
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Movimiento registrado correctamente')
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Registro de Movimiento</h2>
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">Caja Chica: {area}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-full text-slate-400 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* TIPO DE MOVIMIENTO */}
          <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'ingreso'})}
              className={`flex items-center justify-center gap-3 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                formData.type === 'ingreso' 
                ? 'bg-emerald-500 text-white shadow-lg' 
                : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              <ArrowUpCircle size={18} /> INGRESO
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'egreso'})}
              className={`flex items-center justify-center gap-3 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                formData.type === 'egreso' 
                ? 'bg-rose-500 text-white shadow-lg' 
                : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              <ArrowDownCircle size={18} /> EGRESO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CATEGORIA */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Tag size={12} /> Categoría
              </label>
              <select 
                required
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-sm font-bold text-slate-700 transition-all outline-none appearance-none cursor-pointer"
              >
                {CATEGORIES.filter(c => {
                  if (formData.type === 'ingreso') return ['fondo_inicial', 'reposicion', 'reembolso', 'otros'].includes(c.id)
                  return !['fondo_inicial', 'reposicion', 'reembolso'].includes(c.id)
                }).map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>

            {/* FECHA */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} /> Fecha
              </label>
              <input 
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-sm font-bold text-slate-700 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <FileText size={12} /> Motivo / Concepto
            </label>
            <input 
              type="text"
              required
              placeholder="Ej: Insumos para almuerzo"
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              className="w-full px-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-sm font-bold text-slate-700 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MONTO */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                 <DollarSign size={12} /> Monto (S/)
              </label>
              <input 
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full px-4 py-4 bg-emerald-50/50 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl text-xl font-black text-slate-800 transition-all outline-none"
              />
            </div>

            {/* NRO OPERACION */}
            <div className={`space-y-2 transition-all duration-300 ${['transferencia', 'yape'].includes(formData.payment_method) ? 'opacity-100' : 'opacity-40'}`}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                 <Hash size={12} /> Nro Operación (Opc)
              </label>
              <input 
                type="text"
                placeholder="01234..."
                value={formData.operation_number}
                onChange={e => setFormData({...formData, operation_number: e.target.value})}
                className="w-full px-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-slate-500 rounded-2xl text-sm font-bold text-slate-700 transition-all outline-none"
              />
            </div>
          </div>

          {/* METODO DE PAGO */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Método de Pago</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'efectivo', icon: Banknote, label: 'Efectivo', color: 'hover:text-emerald-600 hover:bg-emerald-50' },
                { id: 'transferencia', icon: CreditCard, label: 'Transf.', color: 'hover:text-blue-600 hover:bg-blue-50' },
                { id: 'yape', icon: Phone, label: 'Yape', color: 'hover:text-indigo-600 hover:bg-indigo-50' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFormData({...formData, payment_method: m.id as any})}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${
                    formData.payment_method === m.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                    : `bg-white border-slate-100 text-slate-400 ${m.color}`
                  }`}
                >
                  <m.icon size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* COMPROBANTE - FILE UPLOAD */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
               <Paperclip size={12} /> Comprobante (Opc)
            </label>
            <div className="relative">
              <input 
                type="file"
                accept=".jpg,.png,.pdf,.webp"
                onChange={handleFileUpload}
                className="hidden"
                id="voucher-upload"
              />
              <label 
                htmlFor="voucher-upload"
                className={`w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                  formData.voucher_url 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> 
                : formData.voucher_url ? <CheckCircle2 className="w-5 h-5" /> 
                : <Paperclip className="w-5 h-5" />}
                <span className="text-xs font-black uppercase tracking-widest">
                  {formData.voucher_url ? 'Comprobante Listo' : 'Subir Imagen / PDF'}
                </span>
              </label>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || uploading}
            className={`w-full py-5 text-white font-black rounded-[1.5rem] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 ${
              formData.type === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={20} />}
            REGISTRAR {formData.type.toUpperCase()}
          </button>
        </form>
      </div>
    </div>
  )
}
