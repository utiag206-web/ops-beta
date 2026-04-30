'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { 
  Eye, Plus, ShieldAlert, AlertTriangle, 
  MapPin, CheckCircle2, ChevronRight, X, 
  Loader2, Camera, Filter, Grid, List,
  ArrowRight, Info, AlertCircle, Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { getHsecStops, createHsecStop, closeHsecStop } from './actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const STOP_CATEGORIES = [
  { id: 'ppe', label: 'EPP / Ropa de Trabajo', icon: ShieldAlert },
  { id: 'tools', label: 'Herramientas / Equipos', icon: Grid },
  { id: 'housekeeping', label: 'Orden y Limpieza', icon: CheckCircle2 },
  { id: 'position', label: 'Posición de Personas', icon: Activity },
  { id: 'environment', label: 'Medio Ambiente', icon: MapPin },
  { id: 'others', label: 'Otros Riesgos', icon: Info },
]

export default function StopHsecPage() {
  const [stops, setStops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'abierta' | 'cerrada'>('all')

  useEffect(() => {
    loadStops()
  }, [])

  async function loadStops() {
    setLoading(true)
    const data = await getHsecStops()
    setStops(data)
    setLoading(false)
  }

  const filteredStops = stops.filter(s => filter === 'all' || s.status === filter)

  const stats = {
    total: stops.length,
    open: stops.filter(s => s.status === 'abierta').length,
    closed: stops.filter(s => s.status === 'cerrada').length,
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 md:pb-8">
      {/* Mobile Friendly Header */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-200 animate-pulse">
            <Eye size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">STOP / HSEC</h1>
            <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Observación Preventiva</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-[2.2rem] shadow-2xl shadow-rose-200 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={24} />
          Nuevo Reporte
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-slate-50 p-3 rounded-xl text-slate-400"><List size={20} /></div>
          <div>
            <div className="text-2xl font-black text-slate-800">{stats.total}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-rose-50 p-3 rounded-xl text-rose-500"><AlertCircle size={20} /></div>
          <div>
            <div className="text-2xl font-black text-rose-600">{stats.open}</div>
            <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Abiertas</div>
          </div>
        </div>
        <div className="hidden md:flex bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-500"><CheckCircle2 size={20} /></div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{stats.closed}</div>
            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">Cerradas</div>
          </div>
        </div>
      </div>

      {/* Filter Menu */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['all', 'abierta', 'cerrada'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === f ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {f === 'all' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {/* List - Mobile Optimized Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto" />
          </div>
        ) : filteredStops.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center flex flex-col items-center">
            <ShieldAlert size={60} className="text-slate-100 mb-6" />
            <p className="text-slate-500 font-black text-lg">No se registran observaciones</p>
            <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">Registra tu primer STOP ahora</p>
          </div>
        ) : filteredStops.map((stop) => (
          <div key={stop.id} className="group bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col hover:-translate-y-2 transition-all">
            <div className="p-8 flex-1">
              <div className="flex items-center justify-between mb-6">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  stop.type === 'condicion_insegura' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  {stop.type === 'acto_inseguro' ? 'Acto' : 'Condición'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {format(new Date(stop.created_at), 'dd MMM', { locale: es })}
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-800 tracking-tight line-clamp-2 min-h-[3.5rem] mb-4 group-hover:text-rose-600 transition-colors">
                {stop.description}
              </h3>

              <div className="flex items-center gap-3 text-slate-400 mb-6">
                <MapPin size={14} className="text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-widest line-clamp-1">{stop.area_location || 'Área General'}</span>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase tracking-tight">
                     {stop.observer?.name?.charAt(0) || 'S'}
                   </div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stop.observer?.name || 'Observer'}</div>
                 </div>
                 {stop.status === 'abierta' ? (
                   <button 
                    onClick={() => handleCloseStop(stop.id)}
                    className="flex items-center gap-2 text-[10px] font-black text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all"
                   >
                     Cerrar <ArrowRight size={12} />
                   </button>
                 ) : (
                   <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                     <CheckCircle2 size={12} /> Cerrada
                   </span>
                 )}
              </div>
            </div>
            {stop.photo_url && (
              <div className="h-40 bg-slate-100 overflow-hidden">
                <img src={stop.photo_url} alt="Evidencia" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <AddStopModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={loadStops}
        />
      )}
    </div>
  )

  async function handleCloseStop(id: string) {
    if (!confirm('¿Deseas dar por cerrada esta observación?')) return
    const res = await closeHsecStop(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('STOP cerrada correctamente')
      loadStops()
    }
  }
}

function AddStopModal({ isOpen, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  if (!isOpen) return null
  const [formData, setFormData] = useState({
    type: 'acto_inseguro' as 'acto_inseguro' | 'condicion_insegura',
    category: '',
    area_location: '',
    description: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.category) return toast.warning('Selecciona una categoría')
    setLoading(true)
    try {
      const res = await createHsecStop(formData as any)
      if (res.error) throw new Error(res.error)
      toast.success('Reporte STOP guardado')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col scale-in-center">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reporte Preventivo</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-rose-500">FASE SOMA: STOP / HSEC</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          {/* Mobile Selector for Type */}
          <div className="p-2 bg-slate-100 rounded-[1.8rem] flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'acto_inseguro'})}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
                formData.type === 'acto_inseguro' ? 'bg-white text-blue-600 shadow-md translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <AlertSquare size={16} /> Acto
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'condicion_insegura'})}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
                formData.type === 'condicion_insegura' ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <AlertTriangle size={16} /> Condición
            </button>
          </div>

          {/* Location Picker */}
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
               <MapPin size={12} className="text-rose-500" /> Ubicación del Riesgo
             </label>
             <input 
              required
              type="text" 
              value={formData.area_location}
              onChange={e => setFormData({...formData, area_location: e.target.value})}
              placeholder="Ej: Frente Mina Norte, Garita Principal..."
              className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 font-bold text-slate-700 shadow-inner"
             />
          </div>

          {/* Categoría Selector (Horizontal Scroll or Grid) */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Seleccione Categoría</label>
            <div className="grid grid-cols-2 gap-3">
              {STOP_CATEGORIES.map(cat => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat.id})}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${
                      formData.category === cat.id 
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-lg shadow-rose-50 translate-y-[-2px]' 
                        : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-[10px] font-black uppercase tracking-tight text-center">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">¿Qué observaste? (Detalle)</label>
             <textarea 
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Sé breve y conciso con la observación detectada..."
              className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 font-bold text-slate-700 shadow-inner resize-none"
             />
          </div>

          {/* Action buttons fixed or bottom of scroll */}
          <div className="flex gap-4 pt-10 border-t border-slate-50">
             <button
              onClick={onClose}
              type="button"
              className="flex-1 py-5 font-black text-slate-400 hover:text-slate-600 transition-colors"
             >
               Cancelar
             </button>
             <button
              disabled={loading}
              type="submit"
              className="flex-[2] bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {loading && <Loader2 className="w-5 h-5 animate-spin" />}
               Enviar Reporte
             </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AlertSquare(props: any) {
  return <ShieldAlert {...props} />
}
