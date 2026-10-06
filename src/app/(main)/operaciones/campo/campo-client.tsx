'use client'

import React, { useState } from 'react'
import { 
  Trees, Sprout, MapPin, Search, Filter, Plus, Calendar,
  Droplets, User, Info, Layers, CheckCircle2, AlertCircle, ArrowUpRight
} from 'lucide-react'
import { toast } from 'sonner'

interface LoteItem {
  id: string
  codigo: string
  nombre: string
  cultivo: string
  variedad: string
  hectareas: number
  estado: 'Floración' | 'Cosecha Activa' | 'Cuajado' | 'Crecimiento' | 'Descanso'
  capataz: string
  sistemaRiego: string
  rendimientoEstimadoKg: number
}

const INITIAL_LOTES: LoteItem[] = [
  {
    id: '1',
    codigo: 'LT-01',
    nombre: 'Cuartel San José',
    cultivo: 'Palto',
    variedad: 'Hass',
    hectareas: 14.5,
    estado: 'Floración',
    capataz: 'Juan Pérez (Capataz Campo)',
    sistemaRiego: 'Goteo automatizado',
    rendimientoEstimadoKg: 145000
  },
  {
    id: '2',
    codigo: 'LT-04',
    nombre: 'Sector La Esperanza',
    cultivo: 'Arándano',
    variedad: 'Biloxi',
    hectareas: 8.2,
    estado: 'Cosecha Activa',
    capataz: 'Marcos Ríos (Capataz Cosecha)',
    sistemaRiego: 'Goteo y fertirriego',
    rendimientoEstimadoKg: 82000
  },
  {
    id: '3',
    codigo: 'LT-07',
    nombre: 'Parcela El Molino',
    cultivo: 'Vid',
    variedad: 'Red Globe',
    hectareas: 12.0,
    estado: 'Cuajado',
    capataz: 'Carlos Mendoza (Supervisor)',
    sistemaRiego: 'Aspersión tecnificada',
    rendimientoEstimadoKg: 180000
  },
  {
    id: '4',
    codigo: 'LT-11',
    nombre: 'Fundo Los Sauces',
    cultivo: 'Espárrago',
    variedad: 'Verde UC-157',
    hectareas: 20.0,
    estado: 'Crecimiento',
    capataz: 'David Quispe (Capataz Campo)',
    sistemaRiego: 'Gravedad tecnificada',
    rendimientoEstimadoKg: 120000
  }
]

export default function CampoClient({
  companyName,
  userRole
}: {
  companyName: string
  userRole?: string
}) {
  const [lotes, setLotes] = useState<LoteItem[]>(INITIAL_LOTES)
  const [searchTerm, setSearchTerm] = useState('')
  const [cultivoFilter, setCultivoFilter] = useState('all')

  const filteredLotes = lotes.filter(l => {
    const matchesSearch = 
      l.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.variedad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.capataz.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCultivo = cultivoFilter === 'all' || l.cultivo === cultivoFilter

    return matchesSearch && matchesCultivo
  })

  const totalHectareas = lotes.reduce((acc, l) => acc + l.hectareas, 0)
  const totalRendimiento = lotes.reduce((acc, l) => acc + l.rendimientoEstimadoKg, 0)

  const handleCreateMock = () => {
    toast.info('Funcionalidad en Prototipo', {
      description: 'En la versión productiva este módulo permitirá georreferenciar cuarteles por coordenadas GPS y asociar el tareo diario por lote.'
    })
  }

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Prototype Warning Banner */}
      <div className="bg-linear-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 text-white p-4 rounded-2xl shadow-lg border border-purple-400/20 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 text-purple-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-200 border border-purple-400/30">
                Modo Prototipo
              </span>
              <span className="text-xs text-purple-200 font-medium">Levantamiento Operativo</span>
            </div>
            <p className="text-xs text-purple-100/90 mt-0.5">
              Esta pantalla representa el modelo operativo de <strong>Lotes y Cultivos Agrícolas</strong> para validación de flujos de campo en <strong>{companyName}</strong>.
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateMock}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white tracking-tight transition-all shrink-0 active:scale-95"
        >
          Ver Alcance Previsto
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trees className="w-6 h-6 text-emerald-600" />
            Lotes y Cultivos Agrícolas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mapeo operativo de cuarteles, estado fenológico de cultivos y rendimientos proyectados.
          </p>
        </div>

        <button
          onClick={handleCreateMock}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus size={15} />
          Nuevo Lote (Prototipo)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Área Total</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalHectareas.toFixed(1)} ha</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">4 Lotes Registrados</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Proyección Cosecha</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{(totalRendimiento / 1000).toFixed(1)} tn</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Rendimiento estimado</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Cultivo Principal</div>
          <div className="text-2xl font-black text-slate-900 mt-1">Palto Hass</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">14.5 ha en Floración</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Estado de Cosecha</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">1 Activo</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Arándano Biloxi (LT-04)</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar lote, cultivo, variedad o capataz..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={cultivoFilter}
            onChange={(e) => setCultivoFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-auto"
          >
            <option value="all">Todos los Cultivos</option>
            <option value="Palto">Palto</option>
            <option value="Arándano">Arándano</option>
            <option value="Vid">Vid</option>
            <option value="Espárrago">Espárrago</option>
          </select>
        </div>
      </div>

      {/* Lotes Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Código / Lote</th>
                <th className="py-2.5 px-3">Cultivo y Variedad</th>
                <th className="py-2.5 px-3">Superficie</th>
                <th className="py-2.5 px-3">Estado Fenológico</th>
                <th className="py-2.5 px-3">Riego</th>
                <th className="py-2.5 px-3">Capataz Responsable</th>
                <th className="py-2.5 px-3 text-right">Proyección (Kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLotes.map((lote) => (
                <tr key={lote.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{lote.codigo}</div>
                    <div className="text-[11px] text-slate-500">{lote.nombre}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-emerald-800">{lote.cultivo}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{lote.variedad}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {lote.hectareas.toFixed(1)} ha
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lote.estado === 'Cosecha Activa' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : lote.estado === 'Floración'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : lote.estado === 'Cuajado'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {lote.estado}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Droplets size={12} className="text-blue-500" />
                      {lote.sistemaRiego}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-slate-400" />
                      {lote.capataz}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {lote.rendimientoEstimadoKg.toLocaleString()} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
