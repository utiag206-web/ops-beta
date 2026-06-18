'use client'

import { useState } from 'react'
import { Coins, Calendar, User, X, Loader2, Save, DollarSign, Bus, Paperclip, CheckCircle2 } from 'lucide-react'
import { createBonus } from '@/app/(main)/bonuses/actions'
import { toast } from 'sonner'

interface AddBonusModalProps {
  workers: any[]
  onSuccess: () => void
  onClose: () => void
}

export function AddBonusModal({ workers, onSuccess, onClose }: AddBonusModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<'bono' | 'pasaje' | 'pago'>('bono')
  
  // Payment specific states
  const [paymentType, setPaymentType] = useState<'salary' | 'advance' | 'liquidation' | 'extra'>('salary')
  const [uploading, setUploading] = useState(false)
  const [documentUrl, setDocumentUrl] = useState('')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const selectEl = document.querySelector('select[name="worker_id"]') as HTMLSelectElement | null
    const workerId = selectEl?.value
    if (!workerId) {
      toast.error('Por favor, selecciona un colaborador primero')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo excede los 5MB permitidos')
      return
    }

    setUploading(true)
    try {
      const { uploadFilesAction } = await import('@/app/actions/storage')
      
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      
      const base64 = await base64Promise
      const result = await uploadFilesAction(
        [{ name: file.name, type: file.type, base64 }],
        'worker_documents',
        'payments',
        workerId
      )

      if (result.success && result.urls?.[0]) {
        setDocumentUrl(result.urls[0])
        toast.success('Comprobante subido correctamente')
      } else {
        throw new Error(result.error || 'No se obtuvo la URL pública')
      }
    } catch (error: any) {
      toast.error('Error al subir comprobante: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const worker_id = formData.get('worker_id') as string
    let bonus_type = (formData.get('bonus_type') as string) || ''
    const amount = Number(formData.get('amount'))
    const date = formData.get('date') as string
    const status = formData.get('status') as 'paid' | 'pending'

    if (type === 'pasaje') {
      bonus_type = `Pasaje: ${bonus_type}`
    } else if (type === 'pago') {
      bonus_type = 'Pago'
    }

    const period = formData.get('period') as string
    const payment_method = formData.get('payment_method') as string
    const observations = formData.get('observations') as string

    if (!worker_id || (type !== 'pago' && !bonus_type) || !amount || !date) {
      setError('Todos los campos son obligatorios')
      setIsPending(false)
      return
    }

    try {
      const result = await createBonus({ 
        worker_id, 
        bonus_type, 
        amount, 
        date, 
        status,
        type,
        payment_type: type === 'pago' ? paymentType : undefined,
        period: type === 'pago' ? period : undefined,
        payment_method: type === 'pago' ? payment_method : undefined,
        observations: type === 'pago' ? observations : undefined,
        document_url: type === 'pago' ? documentUrl : undefined
      })
      
      if (result.success) {
        toast.success(type === 'pago' ? 'Pago registrado exitosamente' : 'Registro creado exitosamente')
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Error al registrar')
      }
    } catch (err: any) {
      setError('Error inesperado: ' + err.message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`p-6 bg-gradient-to-r text-white flex justify-between items-center ${
          type === 'bono' ? 'from-amber-600 to-amber-500' : 
          type === 'pago' ? 'from-emerald-600 to-emerald-500' : 'from-blue-600 to-blue-500'
        }`}>
          <div>
            <h3 className="text-xl font-bold uppercase tracking-tight">
              {type === 'bono' ? 'Registrar Bono' : type === 'pago' ? 'Registrar Pago' : 'Registrar Pasaje'}
            </h3>
            <p className="text-white/80 text-xs">
              Asigna un {type === 'bono' ? 'bono' : type === 'pago' ? 'pago' : 'pago por pasaje'} a un colaborador
            </p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <X size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de Registro</label>
            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button 
                type="button" 
                onClick={() => setType('bono')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${type === 'bono' ? 'bg-white text-amber-600 shadow-sm border border-amber-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Bono
              </button>
              <button 
                type="button" 
                onClick={() => setType('pasaje')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${type === 'pasaje' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Pasaje
              </button>
              <button 
                type="button" 
                onClick={() => setType('pago')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${type === 'pago' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Pago
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Colaborador
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                name="worker_id"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white text-sm font-bold"
                required
                defaultValue=""
              >
                <option value="" disabled>Seleccionar colaborador...</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} {worker.last_name || ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional payment fields */}
          {type === 'pago' ? (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Tipo de Pago
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white text-sm font-bold"
                  required
                >
                  <option value="salary">Sueldo</option>
                  <option value="advance">Adelanto</option>
                  <option value="liquidation">Liquidación</option>
                  <option value="extra">Pago Extraordinario</option>
                </select>
              </div>

              {['salary', 'advance'].includes(paymentType) && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Periodo
                  </label>
                  <select
                    name="period"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white text-sm font-bold"
                    required
                    defaultValue="mensual"
                  >
                    <option value="mensual">Mensual</option>
                    <option value="quincenal">Quincenal</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Método de Pago
                </label>
                <select
                  name="payment_method"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white text-sm font-bold"
                  required
                  defaultValue="transferencia"
                >
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="yape">Yape</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Observaciones
                </label>
                <input
                  name="observations"
                  type="text"
                  placeholder="Ej: Pago de quincena de mayo"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white text-sm font-bold"
                />
              </div>

              {/* Attachments / Document Upload */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Documento / Comprobante (Opcional)
                </label>
                <div className="relative">
                  <input 
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="payment-doc-upload"
                  />
                  <label 
                    htmlFor="payment-doc-upload"
                    className={`w-full flex items-center justify-center gap-3 py-3 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                      documentUrl 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> 
                    : documentUrl ? <CheckCircle2 className="w-5 h-5" /> 
                    : <Paperclip className="w-5 h-5" />}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {documentUrl ? 'Archivo Adjunto Listo' : 'Subir Boleta / Transferencia'}
                    </span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                {type === 'bono' ? 'Concepto del Bono' : 'Concepto del Pasaje'}
              </label>
              <input
                name="bonus_type"
                type="text"
                placeholder={type === 'bono' ? "Ej: Bono de Producción, Puntualidad" : "Ej: Pasaje Lima-Mina, Retorno"}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white text-sm font-bold"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Monto (S/)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white text-sm font-bold"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Fecha
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-800 bg-white text-sm font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Estado Inicial</label>
            <div className="flex gap-4 ml-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="pending" className="w-4 h-4 text-slate-900" />
                <span className="text-sm font-bold text-slate-600">Pendiente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="paid" defaultChecked className="w-4 h-4 text-slate-900" />
                <span className="text-sm font-bold text-slate-600">Pagado</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all text-xs uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || uploading}
              className={`flex-1 flex items-center justify-center gap-2 text-white px-4 py-3 rounded-2xl font-bold transition-all shadow-md active:scale-95 text-xs uppercase tracking-wider ${
                type === 'bono' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' :
                type === 'pago' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
              }`}
            >
              {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
