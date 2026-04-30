'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, Settings2, Plus, ArrowRight, ArrowUpRight, ArrowDownLeft, AlertCircle, History } from 'lucide-react'
import { 
  createMovement, 
  getWarehouses, 
  getMovementTypes, 
  getNextDocumentNumber,
  getPurchaseOrders, 
  getPurchaseOrderItems,
  processInboundFromPO 
} from '@/app/(main)/inventory/actions'
import { toast } from 'sonner'

interface MovementFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  products: any[]
}

export function MovementForm({ isOpen, onClose, onSuccess, products }: MovementFormProps) {
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [movementTypes, setMovementTypes] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [poItems, setPoItems] = useState<any[]>([])
  
  const [form, setForm] = useState({
    product_id: '',
    movement_type_id: '',
    quantity: 0,
    warehouse_id: '',
    target_warehouse_id: '',
    document_type: '',
    document_number: '', // Para TRS mayormente
    reference: '',
    responsible_name: '',
    observation: '',

    // ERP ERP ERP
    entry_origin: 'MANUAL', // 'MANUAL', 'PO', 'RETURN'
    outbound_type: 'EXTERNAL', // 'EXTERNAL' (Externa), 'INTERNAL' (Transferencia)
    po_id: '',
    invoice_type: 'FACTURA', // 'FACTURA', 'BOLETA', 'NOTA DE CRÉDITO'
    invoice_number: '',
    guide_number: '',
    document_date: new Date().toISOString().split('T')[0]
  })

  // Estado para capturar ingresos de la grilla de OC
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({})

  // Estado para tipo de ajuste (+/-) en modo Ajuste
  const [adjType, setAdjType] = useState<'plus' | 'minus'>('plus')

  // Carga inicial
  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        setInitLoading(true)
        const [wRes, mTRes, poRes] = await Promise.all([
          getWarehouses(), 
          getMovementTypes(),
          getPurchaseOrders()
        ])
        if (wRes.data) setWarehouses(wRes.data)
        if (mTRes.data) setMovementTypes(mTRes.data)
        if (poRes.data) setPurchaseOrders(poRes.data)
        setInitLoading(false)
      }
      load()
    } else {
      setForm({
        product_id: '', movement_type_id: '', quantity: 0, warehouse_id: '',
        target_warehouse_id: '', document_type: '', document_number: '', reference: '',
        responsible_name: '', observation: '',
        entry_origin: 'MANUAL', outbound_type: 'EXTERNAL', po_id: '', invoice_type: 'FACTURA',
        invoice_number: '', guide_number: '', 
        document_date: new Date().toISOString().split('T')[0]
      })
      setPoItems([])
      setReceivedQtys({})
      setAdjType('plus')
    }
  }, [isOpen])

  const selectedProduct = products.find(p => p.id === form.product_id)
  const isIntegerUnit = selectedProduct ? ['UND', 'UNIDAD', 'PAR', 'CAJA'].includes(selectedProduct.unit.toUpperCase()) : false
  const activeMovementType = movementTypes.find(t => t.id === form.movement_type_id)
  const isTransfer = activeMovementType?.effect === 'BOTH'
  const isIngreso = activeMovementType?.effect === 'IN'
  const isAdjustment = activeMovementType?.effect === 'SET' || activeMovementType?.name?.toLowerCase().includes('ajuste')

  // Efecto para PREVIEW de TRS
  useEffect(() => {
    const isActuallyTransfer = isTransfer || (activeMovementType?.effect === 'OUT' && form.outbound_type === 'INTERNAL')
    
    if (isActuallyTransfer && isOpen) {
      const fetchTrs = async () => {
        const res = await getNextDocumentNumber('TRS')
        if (res.data) {
          setForm(prev => ({ 
            ...prev, 
            document_type: 'TRS',
            document_number: res.data 
          }))
        }
      }
      fetchTrs()
    } else if (!isActuallyTransfer && isOpen) {
      // Limpiar TRS si ya no es transferencia
      setForm(prev => ({ 
        ...prev, 
        document_type: '',
        document_number: '' 
      }))
    }
  }, [isTransfer, form.outbound_type, isOpen, activeMovementType])

  // Carga de items de OC
  useEffect(() => {
    if (form.po_id) {
      const loadItems = async () => {
        const res = await getPurchaseOrderItems(form.po_id)
        if (res.data) setPoItems(res.data)
      }
      loadItems()
    } else {
      setPoItems([])
    }
  }, [form.po_id])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones base
    if (!form.warehouse_id || !form.movement_type_id) {
      toast.error('Completa los campos obligatorios')
      return
    }

    setLoading(true)
    try {
      let res;
      
      if (isIngreso && form.entry_origin === 'PO') {
        // FLUJO ÓRDEN DE COMPRA (Masivo)
        const itemsToReceive = Object.entries(receivedQtys)
          .filter(([_, qty]) => qty > 0)
          .map(([poItemId, qty]) => {
            const item = poItems.find(i => i.id === poItemId)
            return {
              po_item_id: poItemId,
              product_id: item.product_id,
              quantity_to_receive: qty
            }
          })

        if (itemsToReceive.length === 0) {
          toast.error('Debes ingresar al menos una cantidad en la tabla')
          setLoading(false)
          return
        }

        res = await processInboundFromPO({
          po_id: form.po_id,
          warehouse_id: form.warehouse_id,
          document_date: form.document_date,
          invoice_type: form.invoice_type,
          invoice_number: form.invoice_number,
          guide_number: form.guide_number,
          observation: form.observation,
          items: itemsToReceive
        })
      } else {
        // FLUJO ESTÁNDAR (Manual / Transfer / Salida / Ajuste)
        if (!form.product_id || form.quantity <= 0) {
          toast.error('Especifica el producto y cantidad')
          setLoading(false)
          return
        }

        const signedQty = isAdjustment ? (form.quantity * (adjType === 'plus' ? 1 : -1)) : form.quantity
        const payload = { ...form, quantity: signedQty }
        
        if (isTransfer) payload.document_type = 'TRS' 
        res = await createMovement(payload)
      }

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Operación procesada exitosamente`)
        onSuccess?.()
        onClose()
      }
    } catch (err: any) {
      toast.error(`Error crítico: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleQtyChange = (itemId: string, val: number, pending: number) => {
    if (val > pending) {
      toast.error('No puedes ingresar más de lo pendiente')
      return
    }
    setReceivedQtys(prev => ({ ...prev, [itemId]: val }))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <Settings2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Operación de Inventario</h2>
              <p className="text-slate-500 text-sm font-medium">Gestión de flujo físico y documental.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {initLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <span className="font-bold">Sincronizando con maestros ERP...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
            
            {/* Selector de Modo ERP */}
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-3xl shrink-0">
              {[
                { id: 'IN', label: 'Ingreso', color: 'bg-emerald-600', icon: <ArrowUpRight size={16} /> },
                { id: 'OUT', label: 'Salida', color: 'bg-rose-600', icon: <ArrowDownLeft size={16} /> },
                { id: 'BOTH', label: 'Transferencia', color: 'bg-indigo-600', icon: <ArrowRight size={16} /> },
                { id: 'SET', label: 'Ajuste Stock', color: 'bg-amber-600', icon: <Settings2 size={16} /> }
              ].map(mode => {
                const isActive = (mode.id === 'SET' && (activeMovementType?.effect === 'SET' || activeMovementType?.name?.toLowerCase().includes('ajuste'))) || 
                                 (activeMovementType?.effect === mode.id);
                
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      const mt = movementTypes.find(t => 
                        mode.id === 'SET' ? (t.effect === 'SET' || t.name?.toLowerCase().includes('ajuste')) : t.effect === mode.id
                      );
                      if (mt) setForm({...form, movement_type_id: mt.id, outbound_type: mode.id === 'BOTH' ? 'INTERNAL' : 'EXTERNAL'});
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all duration-300 ${
                      isActive 
                        ? `${mode.color} text-white shadow-lg scale-[1.02]` 
                        : 'text-slate-400 hover:bg-white hover:text-slate-600'
                    }`}
                  >
                    {mode.icon}
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Campos Comunes: Almacén y Producto (Decoupled) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Ubicación <span className="text-rose-500">*</span></label>
                <select 
                  required
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 text-sm font-bold transition-all shadow-sm outline-none"
                  value={form.warehouse_id}
                  onChange={e => setForm({...form, warehouse_id: e.target.value})}
                >
                  <option value="">Almacén...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Código de Producto</label>
                <input 
                  type="text"
                  placeholder="Ej: ABC..."
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 text-sm font-black transition-all outline-none uppercase"
                  value={products.find(p => p.id === form.product_id)?.code || ''}
                  onChange={e => {
                    const code = e.target.value.trim().toLowerCase()
                    const found = products.find(p => p.code.toLowerCase() === code)
                    if (found) setForm({...form, product_id: found.id})
                    else if (code === '') setForm({...form, product_id: ''})
                  }}
                />
              </div>

              <div className="md:col-span-6 space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Descripción del Producto <span className="text-rose-500">*</span></label>
                <select 
                  required
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                  value={form.product_id}
                  onChange={e => setForm({...form, product_id: e.target.value})}
                >
                  <option value="">Selección de producto por nombre...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* BLOQUE DINÁMICO POR MODO */}
            <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
              
              {/* MODO INGRESO */}
              {isIngreso && (
                <div className="space-y-6 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-emerald-600 px-1">Cantidad a Ingresar</label>
                      <div className="relative">
                        <input 
                          type="number"
                          className="w-full bg-white border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 text-lg font-black outline-none shadow-sm"
                          value={form.quantity || ''}
                          onChange={e => setForm({...form, quantity: Number(e.target.value)})}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          {selectedProduct?.unit || 'UND'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Origen / Documento</label>
                      <select 
                        className="w-full bg-white border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 text-sm font-bold outline-none shadow-sm"
                        value={form.invoice_type}
                        onChange={e => setForm({...form, invoice_type: e.target.value})}
                      >
                        <option value="GUIA">GUÍA DE REMISIÓN</option>
                        <option value="FACTURA">FACTURA</option>
                        <option value="BOLETA">BOLETA</option>
                        <option value="OTROS">OTROS</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* MODO SALIDA */}
              {activeMovementType?.effect === 'OUT' && form.outbound_type !== 'INTERNAL' && (
                <div className="space-y-6 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-rose-500 px-1">Cantidad a Retirar</label>
                      <div className="relative">
                        <input 
                          type="number"
                          className="w-full bg-white border-2 border-transparent focus:border-rose-500 rounded-2xl p-4 text-lg font-black outline-none shadow-sm"
                          value={form.quantity || ''}
                          onChange={e => setForm({...form, quantity: Number(e.target.value)})}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          {selectedProduct?.unit || 'UND'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Responsable del Retiro</label>
                      <input 
                        type="text"
                        placeholder="Nombre completo..."
                        className="w-full bg-white border-2 border-transparent focus:border-rose-500 rounded-2xl p-4 text-sm font-bold outline-none shadow-sm"
                        value={form.responsible_name}
                        onChange={e => setForm({...form, responsible_name: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODO TRANSFERENCIA */}
              {isTransfer && (
                <div className="space-y-6 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-indigo-600 px-1">Cantidad a Trasladar</label>
                      <input 
                        type="number"
                        className="w-full bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 text-lg font-black outline-none shadow-sm"
                        value={form.quantity || ''}
                        onChange={e => setForm({...form, quantity: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-indigo-600 px-1">Almacén de Destino <span className="text-rose-500">*</span></label>
                      <select 
                        required
                        className="w-full bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-2xl p-4 text-sm font-bold outline-none shadow-sm"
                        value={form.target_warehouse_id}
                        onChange={e => setForm({...form, target_warehouse_id: e.target.value})}
                      >
                        <option value="">Seleccionar destino...</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id} disabled={w.id === form.warehouse_id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                    <History size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Documento Generado: {form.document_number}</span>
                  </div>
                </div>
              )}

              {/* MODO AJUSTE (DELTA +/-) */}
              {(activeMovementType?.effect === 'SET' || activeMovementType?.name?.toLowerCase().includes('ajuste')) && (
                <div className="space-y-6 animate-in slide-in-from-top-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                    <AlertCircle size={16} className="text-amber-500" />
                    <p className="text-[10px] font-bold text-amber-800 uppercase leading-none">
                      Ajuste por Diferencia: El valor ingresado se sumará o restará al stock actual.
                    </p>
                  </div>
                  
                  <div className="flex gap-2 p-1 bg-amber-100/50 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setAdjType('plus')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                        adjType === 'plus' ? 'bg-amber-600 text-white shadow-md' : 'text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      <Plus size={14} strokeWidth={3} />
                      Incremento (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjType('minus')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                        adjType === 'minus' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      <ArrowDownLeft size={14} strokeWidth={3} />
                      Decremento (-)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-amber-600 px-1">Cantidad a Ajustar <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input 
                          type="number"
                          placeholder="0"
                          className="w-full bg-white border-2 border-transparent focus:border-amber-500 rounded-2xl p-4 text-xl font-black outline-none shadow-sm text-center"
                          value={form.quantity || ''}
                          onChange={e => setForm({...form, quantity: Math.abs(Number(e.target.value))})}
                        />
                        <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl ${adjType === 'plus' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {adjType === 'plus' ? '+' : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Referencia / Hallazgo</label>
                      <input 
                        type="text"
                        placeholder="Ej: Inventario cíclico..."
                        className="w-full bg-white border-2 border-transparent focus:border-amber-500 rounded-2xl p-4 text-sm font-bold outline-none shadow-sm"
                        value={form.reference}
                        onChange={e => setForm({...form, reference: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Información Común de Trazabilidad (Simplificada) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Documento de Referencia (Nº)</label>
                  <input 
                    type="text"
                    placeholder="Ej: F001-000123"
                    className="w-full bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 text-sm font-bold outline-none shadow-sm uppercase"
                    value={form.invoice_number}
                    onChange={e => setForm({...form, invoice_number: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Motivo / Observación</label>
                  <input 
                    placeholder="Detalles adicionales..."
                    className="w-full bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 text-sm font-bold outline-none shadow-sm"
                    value={form.observation}
                    onChange={e => setForm({...form, observation: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 font-black py-5 rounded-3xl transition-all hover:bg-slate-200 uppercase tracking-widest text-[10px]">
                Cancelar
              </button>
              <button 
                disabled={loading}
                type="submit"
                className="flex-[2] bg-slate-900 hover:bg-black text-white font-black py-5 rounded-3xl shadow-xl shadow-slate-100 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Procesar Movimiento</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

