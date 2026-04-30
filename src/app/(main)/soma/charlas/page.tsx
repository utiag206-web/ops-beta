'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { 
  MessageSquare, Plus, Search, Calendar, Users, 
  MapPin, Camera, ChevronRight, X, Loader2,
  CheckCircle2, Info
} from 'lucide-react'
import { toast } from 'sonner'
import { getSomaTalks, createSomaTalk, getCurrentUser, confirmSomaTalk } from '../actions'
import { getWorkers } from '@/app/(main)/workers/actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CharlasSomaPage() {
  const [talks, setTalks] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [tData, wData, userData] = await Promise.all([
        getSomaTalks(),
        getWorkers('active'),
        getCurrentUser()
      ])
      setTalks(tData)
      setWorkers(wData)
      setUser(userData)
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const isSomaRole = ['admin', 'soma', 'operaciones'].includes(user?.role_id) || user?.role_id === 'jefe_area'

  const handleConfirm = async (talkId: string) => {
    try {
      const res = await confirmSomaTalk(talkId)
      if (res.error) throw new Error(res.error)
      toast.success('Asistencia confirmada')
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filteredTalks = talks.filter(t => 
    t.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.leader?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-200">
            <MessageSquare size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Charlas 5 Minutos</h1>
            <p className="text-slate-500 font-bold text-lg">Registro diario de seguridad y salud ocupacional</p>
          </div>
        </div>
        {isSomaRole && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[2rem] shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            Nueva Charla
          </button>
        )}
      </div>

      {/* Monthly Summary Card */}
      <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Calendar size={28} />
          </div>
          <div>
            <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Charlas registradas</div>
            <div className="text-4xl font-black text-slate-800">{talks.length}</div>
          </div>
        </div>
        <div className="h-px w-full md:w-px md:h-12 bg-slate-100" />
        <div className="flex gap-4">
          <div className="bg-blue-50 px-6 py-4 rounded-3xl flex items-center gap-4">
            <Users className="text-blue-500" size={20} />
            <div>
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Total Asistentes</div>
              <div className="text-xl font-black text-blue-700">{talks.reduce((acc, t) => acc + (t.participants?.length || 0), 0)}</div>
            </div>
          </div>
          <div className="bg-emerald-50 px-6 py-4 rounded-3xl flex items-center gap-4">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <div>
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Tu Estado</div>
              <div className="text-xl font-black text-emerald-700 uppercase">
                {user?.role_id === 'soma' ? 'SOMA' : talks.some(t => t.participants?.some((p: any) => p.worker?.id === user?.worker_id)) ? 'ACTIVO' : 'PENDIENTE'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por tema o responsable..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-600 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-10 gap-8">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
            </div>
          ) : filteredTalks.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400 font-bold">
              No se encontraron registros de charlas.
            </div>
          ) : filteredTalks.map((t) => {
            const hasConfirmed = t.participants?.some((p: any) => p.worker?.id === user?.worker_id)
            
            return (
              <div key={t.id} className="group flex flex-col bg-slate-50/50 hover:bg-white p-8 rounded-[2.5rem] border border-transparent hover:border-emerald-100 hover:shadow-2xl hover:shadow-emerald-100 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <div className="px-4 py-2 bg-white rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                      {format(new Date(t.date), 'dd MMM, yyyy', { locale: es })}
                    </div>
                    {t.target_area && (
                      <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                        {t.target_area}
                      </div>
                    )}
                  </div>
                  {hasConfirmed ? (
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                      <CheckCircle2 size={18} />
                    </div>
                  ) : t.photo_url && (
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Camera size={18} />
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight group-hover:text-emerald-700 transition-colors">
                  {t.topic}
                </h3>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-bold">
                    <Users size={16} className="text-slate-300" />
                    <span>{t.participants?.length || 0} Participantes</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-bold">
                    <MapPin size={16} className="text-slate-300" />
                    <span>{t.location || 'Planta Principal'}</span>
                  </div>
                </div>

                {!isSomaRole && !hasConfirmed && (
                  <button 
                    onClick={() => handleConfirm(t.id)}
                    className="w-full mb-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
                  >
                    Confirmar Asistencia
                  </button>
                )}

                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                    Por: <span className="text-slate-600">{t.leader?.name || 'Sistema'}</span>
                  </div>
                  <div className="flex gap-2">
                    {t.material_url && (
                      <a 
                        href={t.material_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-600 transition-all text-xs font-black uppercase tracking-widest"
                      >
                        Material
                      </a>
                    )}
                    <button className="p-3 hover:bg-emerald-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {isModalOpen && (
        <AddTalkModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          workers={workers}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}

function AddTalkModal({ isOpen, onClose, workers, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    topic: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    target_area: '',
    material_url: '',
    participants: [] as string[]
  })

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (formData.participants.length === 0) {
      toast.warning('Selecciona al menos un asistente')
      return
    }
    setLoading(true)
    try {
      const res = await createSomaTalk(formData)
      if (res.error) throw new Error(res.error)
      toast.success('Charla registrada exitosamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleParticipant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(id)
        ? prev.participants.filter(p => p !== id)
        : [...prev.participants, id]
    }))
  }

  const selectAll = () => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.length === workers.length ? [] : workers.map((w: any) => w.id)
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col scale-in-center border border-white/20">
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nueva Charla de 5 Minutos</h2>
              <p className="text-slate-400 font-bold text-sm tracking-tight text-emerald-500 uppercase">Seguridad Preventiva Diaria</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tema de la Charla</label>
                <input 
                  required
                  type="text" 
                  value={formData.topic}
                  onChange={e => setFormData({...formData, topic: e.target.value})}
                  placeholder="Ej: Uso correcto de arnés de seguridad"
                  className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fecha</label>
                  <input 
                    required
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 shadow-sm"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Lugar / Frente</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="Ej: Taller Norte"
                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Área Asignada (Transversal)</label>
                  <select 
                    value={formData.target_area}
                    onChange={e => setFormData({...formData, target_area: e.target.value})}
                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 shadow-sm"
                  >
                    <option value="">Todas las áreas</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Cocina">Cocina</option>
                    <option value="Administración">Administración</option>
                    <option value="Almacén y Mantenimiento">Almacén y Mantenimiento</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">URL Material de Apoyo (Opcional)</label>
                  <input 
                    type="url" 
                    value={formData.material_url}
                    onChange={e => setFormData({...formData, material_url: e.target.value})}
                    placeholder="https://docs.google.com/..."
                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 shadow-sm"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 flex items-start gap-4">
                <Info size={24} className="text-emerald-500 mt-1" />
                <div>
                  <h4 className="font-black text-emerald-800 text-sm mb-2 uppercase tracking-wider">Recordatorio SOMA</h4>
                  <p className="text-emerald-700/70 text-sm font-medium leading-relaxed">
                    Asegúrate de registrar a todos los asistentes y capturar una fotografía grupal como evidencia de la charla de seguridad periódica.
                  </p>
                </div>
              </div>
            </div>

            {/* Selection Column */}
            <div className="flex flex-col h-full bg-slate-50/80 rounded-[3rem] p-10 border border-slate-100 shadow-inner">
               <div className="flex items-center justify-between mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Users size={14} /> Asistentes ({formData.participants.length})
                </label>
                <button 
                  type="button" 
                  onClick={selectAll}
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  {formData.participants.length === workers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
               </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-4 custom-scrollbar min-h-[300px]">
                {workers.map((w: any) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleParticipant(w.id)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${
                      formData.participants.includes(w.id) 
                        ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100 -translate-y-1' 
                        : 'bg-white text-slate-600 hover:bg-emerald-50 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                        formData.participants.includes(w.id) ? 'bg-white/20' : 'bg-slate-100'
                      }`}>
                        {w.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className="font-black text-sm tracking-tight">{w.name}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${formData.participants.includes(w.id) ? 'text-white/60' : 'text-slate-400'}`}>
                          {w.position}
                        </div>
                      </div>
                    </div>
                    {formData.participants.includes(w.id) && <CheckCircle2 size={20} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 flex justify-end gap-8 pt-10 border-t border-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-10 py-4 font-black text-slate-400 hover:text-rose-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex items-center gap-4 px-14 py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-2xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-6 h-6 animate-spin" />}
              Enviar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
