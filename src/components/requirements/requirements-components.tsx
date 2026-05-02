'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, CheckCircle2, Package, MapPin, Activity, ShieldAlert, AlertTriangle } from 'lucide-react'
import { createRequirement, approveRequirementWithMovement } from '@/app/(dashboard)/requerimientos/actions'
import { getProducts } from '@/app/(dashboard)/inventory/actions'
import { toast } from 'sonner'

export function RequirementStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pendiente: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    aprobado: 'bg-amber-50 text-amber-600 border-amber-100',
    atendido: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rechazado: 'bg-rose-50 text-rose-600 border-rose-100',
  }

  return (
    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest shadow-sm transition-all ${styles[status] || styles.pendiente}`}>
      {status === 'atendido' ? '✅ Atendido' : status}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    alta: 'bg-rose-50 text-rose-600 border-rose-100',
    media: 'bg-amber-50 text-amber-600 border-amber-100',
    baja: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  }

  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase ${styles[priority] || styles.media}`}>
      {priority}
    </span>
  )
}

interface CreateRequirementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateRequirementModal({ isOpen, onClose, onSuccess }: CreateRequirementModalProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [fetchingProducts, setFetchingProducts] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'insumo',
    priority: 'media',
    product_id: '',
    quantity: 0
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const loadProducts = async () => {
        setFetchingProducts(true)
        const { getProductsMinimal } = await import('@/app/(dashboard)/inventory/actions')
        const res = await getProductsMinimal()
        if (res.data) setProducts(res.data)
        setFetchingProducts(false)
      }
      loadProducts()
    }
  }, [isOpen])

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10) // Limit suggestions for UX

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Only validate product if type is insumo
    if (form.type === 'insumo' && (!form.product_id || form.quantity <= 0)) {
      toast.error('Selecciona un producto y una cantidad mayor a 0')
      return
    }

    setLoading(true)
    
    try {
      // payload cleans up product ID if it's not an insumo
      const payload: any = { ...form }
      if (form.type !== 'insumo') {
        delete payload.product_id
        delete payload.quantity
      }

      const res = await createRequirement(payload)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Requerimiento creado exitosamente')
        onSuccess?.()
        onClose()
      }
    } catch (err: any) {
      toast.error(`Error crítico: ${err.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Nuevo Requerimiento</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Completa los detalles de tu solicitud.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-2 space-y-4">
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo de Pedido</label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-3.5 text-xs font-bold transition-all outline-none"
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
              >
                <option value="insumo">Insumo / Producto</option>
                <option value="herramienta">Herramienta</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Prioridad</label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-3.5 text-xs font-bold transition-all outline-none"
                value={form.priority}
                onChange={e => setForm({...form, priority: e.target.value})}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>

          {form.type === 'insumo' && (
            <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100/50 space-y-4 relative">
              <div className="space-y-2">
                <label className="text-[10px] font-black flex items-center gap-1 uppercase tracking-widest text-indigo-700 px-1">
                  <Package size={12} />
                  Producto Solicitado
                </label>
                
                {/* AUTOCOMPLETE SEARCH */}
                <div className="relative">
                  <input 
                    type="text"
                    placeholder={fetchingProducts ? 'Consultando catálogo...' : 'Buscar producto...'}
                    className="w-full bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl p-3 text-sm font-bold transition-all outline-none"
                    value={searchQuery}
                    onFocus={() => setShowDropdown(true)}
                    onChange={e => {
                      setSearchQuery(e.target.value)
                      setShowDropdown(true)
                      if (!e.target.value) setForm({...form, product_id: ''})
                    }}
                  />
                  {fetchingProducts && (
                    <div className="absolute right-3 top-3.5">
                      <Loader2 size={16} className="animate-spin text-indigo-400" />
                    </div>
                  )}

                  {showDropdown && searchQuery && (
                    <div className="absolute left-0 right-0 top-14 bg-white border border-slate-100 rounded-2xl shadow-xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      {filteredProducts.length > 0 ? (
                        <div className="p-1">
                          {filteredProducts.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setForm({ ...form, product_id: p.id })
                                setSearchQuery(p.name)
                                setShowDropdown(false)
                              }}
                              className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-3 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-white flex items-center justify-center text-indigo-600 transition-colors">
                                <Package size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{p.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Unidad: {p.unit}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50/50">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No se encontraron productos</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Cantidad Necesaria</label>
                  {form.product_id && (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-slate-100">
                      Unidad: {products.find(p => p.id === form.product_id)?.unit || '—'}
                    </span>
                  )}
                </div>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl p-3 text-sm font-bold transition-all outline-none"
                  value={form.quantity}
                  onChange={e => setForm({...form, quantity: Number(e.target.value)})}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Título / Asunto</label>
            <input 
              required
              type="text"
              placeholder={form.type === 'insumo' ? "Ej: Urgente para parada de planta" : "Ej: Repuesto para retroexcavadora"}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Justificación detallada</label>
            <textarea 
              rows={3}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none resize-none"
              placeholder="Explica para qué se necesita esta solicitud..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button 
              disabled={loading || fetchingProducts}
              type="submit"
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Guardar Requerimiento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


export function ApproveRequirementModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  reqId 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSuccess?: () => void,
  reqId: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [warehouses, setWarehouses] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      const loadWH = async () => {
        const { getWarehouses } = await import('@/app/(dashboard)/inventory/actions')
        const res = await getWarehouses()
        if (res.data) setWarehouses(res.data)
      }
      loadWH()
    }
  }, [isOpen])

  if (!isOpen || !reqId) return null

  const handleApprove = async () => {
    if (!warehouseId) {
      toast.error('Debes seleccionar el almacén de donde saldrá el stock')
      return
    }

    setLoading(true)
    
    try {
      const res = await approveRequirementWithMovement(reqId, warehouseId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Requerimiento aprobado y movimiento de stock generado.')
        onSuccess?.()
        onClose()
      }
    } catch (err) {
      toast.error('Error de red al aprobar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Aprobar con Salida de Stock</h2>
          <p className="text-slate-500 text-sm font-medium">Esta acción marcará el requerimiento como aprobado y descontará el producto del inventario.</p>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1">
            <MapPin size={12} />
            Almacén de Origen
          </label>
          <select 
            required
            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none appearance-none"
            value={warehouseId}
            onChange={e => setWarehouseId(e.target.value)}
          >
            <option value="">Seleccionar almacén...</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.name} ({wh.area})</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all text-sm"
          >
            Cancelar
          </button>
          <button 
            disabled={loading}
            onClick={handleApprove}
            className="flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar Salida'}
          </button>
        </div>

      </div>
    </div>
  )
}

export function ReportIncidentModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<{file: File, preview: string}[]>([])
  const [form, setForm] = useState({
    type: 'operacion',
    area_location: '',
    description: '',
    severity: 'media',
    event_date: new Date().toISOString().split('T')[0],
    incident_category: 'personal',
    corrective_actions: ''
  })

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      let photoUrls: string[] = []

      // 1. Upload files if any
      if (files.length > 0) {
        const { uploadFilesAction } = await import('@/app/actions/storage')
        const filesData = await Promise.all(files.map(async ({ file }) => {
          const reader = new FileReader()
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          return { name: file.name, type: file.type, base64 }
        }))

        const uploadRes = await uploadFilesAction(filesData, 'soma', 'incidents', 'new')
        if (uploadRes.success && uploadRes.urls) {
          photoUrls = uploadRes.urls
        } else {
          toast.error('Error al subir imágenes. Se guardará sin fotos.')
        }
      }

      // 2. Create Incident
      const { createIncidencia } = await import('@/app/(dashboard)/incidencias/actions')
      const res = await createIncidencia({
        area_location: form.area_location || (form.type === 'maquinaria' ? 'Falla de Equipo' : form.type),
        description: form.description,
        severity: form.severity,
        event_date: form.event_date,
        incident_category: form.incident_category,
        corrective_actions: form.corrective_actions,
        photo_urls: photoUrls
      })

      if (res.success) {
        toast.success('Incidencia reportada correctamente')
        onClose()
      } else {
        toast.error(res.error || 'Error al reportar incidencia')
      }
    } catch (err) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-orange-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reportar Incidencia SOMA</h2>
            <p className="text-slate-500 text-sm font-medium italic">FASE 2: Investigación y Seguimiento</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Ubicación / Área Relacionada</label>
              <input 
                required
                type="text"
                placeholder="Ej: Taller Mecánico, KM 15..."
                className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                value={form.area_location}
                onChange={e => setForm({...form, area_location: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo de Evento</label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
              >
                <option value="maquinaria">Maquinaria / Equipo</option>
                <option value="personal">Personal / Salud</option>
                <option value="ambiental">Impacto Ambiental</option>
                <option value="legal">Incumplimiento Legal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Gravedad (SOMA)</label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                value={form.severity}
                onChange={e => setForm({...form, severity: e.target.value})}
              >
                <option value="leve">Leve</option>
                <option value="moderado">Moderado</option>
                <option value="grave">Grave</option>
                <option value="critico">Crítico</option>
                <option value="fatal">Fatal</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Categoría</label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                value={form.incident_category}
                onChange={e => setForm({...form, incident_category: e.target.value})}
              >
                <option value="personal">Daño Personal</option>
                <option value="ambiental">Daño Ambiental</option>
                <option value="material">Daño Material</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Fecha del Suceso</label>
              <input 
                required
                type="date"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                value={form.event_date}
                onChange={e => setForm({...form, event_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between items-center">
              <span>Evidencias Fotográficas</span>
              <span className="text-[10px] text-orange-600 lowercase font-bold">Opcional</span>
            </label>
            <div className="flex flex-wrap gap-4 mt-2">
              {files.map((file, idx) => (
                <div key={idx} className="relative group w-24 h-24">
                  <img src={file.preview} className="w-full h-full object-cover rounded-2xl border-2 border-slate-100 shadow-sm" />
                  <button 
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all text-slate-400 hover:text-orange-600">
                <Plus size={24} />
                <span className="text-[9px] font-black uppercase">Subir</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">¿Qué sucedió? (Descripción)</label>
            <textarea 
              rows={3}
              required
              className="w-full bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none resize-none"
              placeholder="Detalla lo sucedido de forma clara..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-orange-600 px-1">Acciones Correctivas Inmediatas</label>
            <textarea 
              rows={2}
              className="w-full bg-orange-50 border-2 border-orange-100 focus:border-orange-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none resize-none"
              placeholder="¿Qué se hizo al instante para mitigar el riesgo?"
              value={form.corrective_actions}
              onChange={e => setForm({...form, corrective_actions: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 font-black py-5 rounded-2xl transition-all">
              Cancelar
            </button>
            <button 
              disabled={loading}
              type="submit"
              className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin text-white" size={24} /> : (
                <>
                  <Activity size={20} strokeWidth={3} />
                  Reportar Incidencia
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
