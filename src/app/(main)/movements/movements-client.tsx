'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ship, Plus, ArrowUpRight, ArrowDownRight, History, User } from 'lucide-react'
import { registerMovement } from './actions'

interface Worker {
  id: string
  name: string
  last_name?: string
}

interface MovementsPageProps {
  initialMovements: any[]
  workers: Worker[]
  userRole: string
}

export default function MovementsClient({ initialMovements, workers, userRole }: MovementsPageProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    worker_id: '',
    type: 'subida' as 'subida' | 'bajada',
    date: new Date().toISOString().slice(0, 16) // datetime-local format
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    try {
      const result = await registerMovement(formData)
      if (result?.success === false) {
        setErrorMsg(result.error || 'Error al registrar movimiento')
      } else {
        setShowForm(false)
        router.refresh()
      }
    } catch (error: any) {
      setErrorMsg(error?.message || 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Subidas y Bajadas</h1>
          <p className="text-slate-500 font-medium">Logística de personal y control de ubicación.</p>
        </div>
        {(userRole === 'admin' || userRole === 'gerente' || userRole === 'operaciones') && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            <Plus size={20} />
            Nuevo Registro
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-xl animate-in fade-in slide-in-from-top-4">
          {errorMsg && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trabajador</label>
              <select 
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600"
                value={formData.worker_id}
                onChange={e => setFormData({...formData, worker_id: e.target.value})}
              >
                <option value="">Seleccionar...</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Movimiento</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="subida">Subida a Mina</option>
                <option value="bajada">Bajada de Mina</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha y Hora</label>
              <input 
                type="datetime-local" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white p-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Registrando...' : 'Confirmar Registro'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2">
          <History size={18} className="text-slate-400" />
          <h2 className="font-black text-slate-700 uppercase tracking-wider text-xs">Historial de Movimientos</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trabajador</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Movimiento</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha / Hora</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {initialMovements.map((item) => {
              const isSubida = item.subida_date !== null
              return (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={16} />
                      </div>
                      <div className="font-bold text-slate-800">{item.worker?.name}</div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`flex items-center gap-2 font-bold text-sm ${isSubida ? 'text-blue-600' : 'text-slate-600'}`}>
                      {isSubida ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {isSubida ? 'Subida a Mina' : 'Bajada de Mina'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-700 text-sm">
                      {new Date(item.subida_date || item.bajada_date).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.status === 'En mina' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'En mina' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                      {item.status}
                    </span>
                  </td>
                </tr>
              )
            })}
            {initialMovements.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">
                  Sin movimientos registrados recientemente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
