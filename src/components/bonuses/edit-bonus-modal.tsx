'use client'

import { useState } from 'react'
import { Coins, Calendar, User, X, Loader2, Save, DollarSign, Bus, Paperclip, CheckCircle2 } from 'lucide-react'
import { updateBonus } from '@/app/(main)/bonuses/actions'
import { toast } from 'sonner'

interface EditBonusModalProps {
  bonus: any
  workers: any[]
  onSuccess: () => void
  onClose: () => void
}

export function EditBonusModal({ bonus, workers, onSuccess, onClose }: EditBonusModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<'bono' | 'pasaje' | 'pago'>(bonus.type || 'bono')
  
  // Payment specific states
  const [paymentType, setPaymentType] = useState<'salary' | 'advance' | 'liquidation' | 'extra'>(bonus.payment_type || 'salary')
  const [uploading, setUploading] = useState(false)
  const [documentUrl, setDocumentUrl] = useState(bonus.document_url || '')

  // Extract clean concept name (stripping 'Pasaje: ' prefix if present)
  const cleanConcept = bonus.bonus_type && bonus.bonus_type.startsWith('Pasaje: ') 
    ? bonus.bonus_type.replace('Pasaje: ', '') 
    : bonus.bonus_type || ''

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const selectEl = document.querySelector('select[name="worker_id"]') as HTMLSelectElement | null
    const workerId = selectEl?.value || bonus.worker_id || 'generic'

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
      const result = await updateBonus(bonus.id, bonus.type, { 
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
        toast.success('Registro actualizado exitosamente')
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Error al actualizar')
      }
    } catch (err: any) {
      setError('Error inesperado: ' + err.message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className={`p-6 bg-gradient-to-r text-white flex justify-between items-center ${
          type === 'bono' ? 'from-orange-600 to-amber-500' : 
          type === 'pago' ? 'from-emerald-600 to-emerald-500' : 'from-blue-600 to-indigo-500'
        }`}>
          <div>
            <h3 className="text-xl font-bold uppercase tracking-tight">Editar Registro</h3>
            <p className="text-white/80 text-xs">Modifica los detalles del bono, pasaje o pago</p>
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
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${type === 'bono' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Colaborador</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                required 
                name="worker_id"
                defaultValue={bonus.worker_id}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm font-bold transition-all outline-none text-slate-800"
              >
                <option value="">Seleccionar colaborador...</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
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
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold transition-all outline-none text-slate-800"
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
                    defaultValue={bonus.period || 'mensual'}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold transition-all outline-none text-slate-800"
                    required
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
                  defaultValue={bonus.payment_method || 'transferencia'}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold transition-all outline-none text-slate-800"
                  required
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
                  defaultValue={bonus.observations || ''}
                  placeholder="Ej: Pago de quincena de mayo"
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold transition-all outline-none text-slate-800"
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
                    id="payment-doc-edit-upload"
                  />
                  <label 
                    htmlFor="payment-doc-edit-upload"
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
                      {documentUrl ? 'Archivo Adjunto Listo' : 'Reemplazar Boleta / Transferencia'}
                    </span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {type === 'bono' ? 'Concepto del Bono' : 'Concepto del Pasaje'}
              </label>
              <input 
                required 
                type="text" 
                name="bonus_type"
                defaultValue={cleanConcept}
                placeholder={type === 'bono' ? "Ej: Bono de Producción, Puntualidad" : "Ej: Pasaje Lima-Mina, Retorno"} 
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold transition-all outline-none text-slate-800"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto (S/)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  required 
                  type="number" 
                  name="amount"
                  step="0.01" 
                  min="0.01" 
                  defaultValue={bonus.amount}
                  placeholder="0.00" 
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl py-3 pl-8 pr-3 text-sm font-bold transition-all outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} style={{ zIndex: 10 }} />
                <input 
                  required 
                  type="date" 
                  name="date"
                  defaultValue={bonus.date}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl py-3 pl-8 pr-3 text-sm font-bold transition-all outline-none text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado del Pago</label>
            <select 
              name="status"
              defaultValue={bonus.status}
              className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-bold transition-all outline-none text-slate-800"
            >
              <option value="pending">Pendiente de Pago</option>
              <option value="paid">Pagado</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-50">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-xs tracking-wider uppercase cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending || uploading}
              className={`flex-1 py-3 text-white font-bold rounded-2xl transition-all shadow-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                type === 'bono' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 
                type === 'pago' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
