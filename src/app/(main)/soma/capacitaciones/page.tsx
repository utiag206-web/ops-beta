'use client'

import { useState, useEffect } from 'react'
import { 
  GraduationCap, Plus, Search, Calendar, Users, 
  AlertTriangle, CheckCircle2, FileVideo, FileText, ChevronRight,
  Clock, X, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { getSomaTrainings, createSomaTraining } from '../actions'
import { getWorkers } from '@/app/(main)/workers/actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRbac } from '@/components/providers/rbac-provider'

export default function CapacitacionesSomaPage() {
  const { role_id, user: rbacUser } = useRbac()
  const [trainings, setTrainings] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [tData, wData] = await Promise.all([
        getSomaTrainings(),
        getWorkers('active')
      ])
      setTrainings(tData)
      setWorkers(wData)
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const filteredTrainings = trainings.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.trainer?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: trainings.length,
    vencidos: trainings.filter(t => t.expiry_date && new Date(t.expiry_date) < new Date()).length,
    proximos: trainings.filter(t => {
      if (!t.expiry_date) return false
      const days = Math.floor((new Date(t.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
      return days > 0 && days <= 30
    }).length
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Capacitaciones SOMA</h1>
            <p className="text-slate-500 font-bold text-lg">Registro de cursos, certificaciones y vencimientos</p>
          </div>
        </div>
        {['admin', 'soma', 'operaciones', 'jefe_area'].includes(role_id || '') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            Registrar Curso
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><FileVideo size={28} /></div>
          <div>
            <div className="text-3xl font-black text-slate-800">{stats.total}</div>
            <div className="text-slate-400 font-bold text-sm uppercase tracking-wider">Total Cursos</div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6">
          <div className="bg-amber-50 p-4 rounded-2xl text-amber-600"><Clock size={28} /></div>
          <div>
            <div className="text-3xl font-black text-slate-800">{stats.proximos}</div>
            <div className="text-slate-400 font-bold text-sm uppercase tracking-wider">Prox. Vencimientos</div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6">
          <div className="bg-rose-50 p-4 rounded-2xl text-rose-600"><AlertTriangle size={28} /></div>
          <div>
            <div className="text-3xl font-black text-slate-800">{stats.vencidos}</div>
            <div className="text-slate-400 font-bold text-sm uppercase tracking-wider">Cursos Vencidos</div>
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
              placeholder="Buscar por título o instructor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Capacitación</th>
                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Instructor</th>
                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha / Exp</th>
                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Participantes</th>
                <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredTrainings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center text-slate-400 font-bold">
                    No se encontraron registros de capacitación.
                  </td>
                </tr>
              ) : filteredTrainings.map((t) => {
                const isExpired = t.expiry_date && new Date(t.expiry_date) < new Date()
                const daysToExpiry = t.expiry_date ? Math.floor((new Date(t.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null
                
                let expiryStatus = 'Vigente'
                let statusColor = 'bg-emerald-50 text-emerald-600'
                
                if (isExpired) {
                  expiryStatus = 'Vencido'
                  statusColor = 'bg-rose-50 text-rose-600'
                } else if (daysToExpiry !== null && daysToExpiry <= 30) {
                  expiryStatus = `Vence en ${daysToExpiry} días`
                  statusColor = 'bg-amber-50 text-amber-600'
                }

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-lg tracking-tight">{t.title}</div>
                          <div className="text-slate-400 font-bold text-xs">{t.description || 'Sin descripción'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="font-bold text-slate-600">{t.trainer || 'N/A'}</div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                          <Calendar size={14} className="text-slate-400" />
                          {format(new Date(t.date), 'dd MMM, yyyy', { locale: es })}
                        </div>
                        {t.expiry_date && (
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-5">
                            EXP: {format(new Date(t.expiry_date), 'dd MMM, yyyy', { locale: es })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 font-black text-slate-600 bg-slate-100 self-start px-3 py-1 rounded-lg">
                        <Users size={14} />
                        {t.participants?.length || 0}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-2 rounded-xl text-xs font-black tracking-tight ${statusColor}`}>
                        {expiryStatus}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button className="p-3 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all hover:shadow-lg">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AddTrainingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          workers={workers}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}

function AddTrainingModal({ isOpen, onClose, workers, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  if (!isOpen) return null
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trainer: '',
    date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    participants: [] as string[]
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await createSomaTraining(formData)
      if (res.error) throw new Error(res.error)
      toast.success('Capacitación registrada')
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
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col scale-in-center">
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nueva Capacitación</h2>
              <p className="text-slate-400 font-bold text-sm tracking-tight text-indigo-400">FASE SEGURIDADES SOMA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left side: Basic Info */}
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Título del Curso</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Ej: Inducción General de Seguridad"
                  className="w-full px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Instructor / Entrenador</label>
                <input 
                  type="text" 
                  value={formData.trainer}
                  onChange={e => setFormData({...formData, trainer: e.target.value})}
                  placeholder="Nombre del responsable"
                  className="w-full px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fecha Realización</label>
                  <input 
                    required
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Vencimiento</label>
                  <input 
                    type="date" 
                    value={formData.expiry_date}
                    onChange={e => setFormData({...formData, expiry_date: e.target.value})}
                    className="w-full px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Descripción</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalles del contenido del curso..."
                  rows={4}
                  className="w-full px-8 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Right side: Participant Selection */}
            <div className="flex flex-col h-full bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100/50">
              <div className="flex items-center justify-between mb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Users size={14} /> Asistentes ({formData.participants.length})
                </label>
                <button 
                  type="button" 
                  onClick={selectAll}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  {formData.participants.length === workers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-4 custom-scrollbar min-h-[300px]">
                {workers.map((w: any) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleParticipant(w.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                      formData.participants.includes(w.id) 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 translate-x-1' 
                        : 'bg-white text-slate-600 hover:bg-indigo-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
                        formData.participants.includes(w.id) ? 'bg-white/20' : 'bg-slate-100'
                      }`}>
                        {w.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-sm tracking-tight">{w.name}</div>
                        <div className={`text-[10px] ${formData.participants.includes(w.id) ? 'text-white/60' : 'text-slate-400'}`}>
                          {w.position}
                        </div>
                      </div>
                    </div>
                    {formData.participants.includes(w.id) && <CheckCircle2 size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-end gap-6 pt-10 border-t border-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-10 py-4 font-black text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex items-center gap-3 px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Guardar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
