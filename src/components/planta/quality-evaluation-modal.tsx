'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2, AlertTriangle, ShieldCheck, FileText, Activity } from 'lucide-react'
import { MineralBatch } from './plant-mock-data'

interface QualityEvaluationModalProps {
  isOpen: boolean
  batch: MineralBatch | null
  onClose: () => void
  onSave: (batchId: string, updates: Partial<MineralBatch>) => void
}

export function QualityEvaluationModal({ isOpen, batch, onClose, onSave }: QualityEvaluationModalProps) {
  const [qualityStatus, setQualityStatus] = useState<'optimo' | 'regular' | 'observado' | 'rechazado'>('optimo')
  const [moisturePct, setMoisturePct] = useState<number>(4.5)
  const [estimatedGrade, setEstimatedGrade] = useState('')
  const [qualityNotes, setQualityNotes] = useState('')

  useEffect(() => {
    if (batch) {
      setQualityStatus(batch.qualityStatus)
      setMoisturePct(batch.moisturePct)
      setEstimatedGrade(batch.estimatedGrade || '')
      setQualityNotes(batch.qualityNotes || '')
    }
  }, [batch])

  if (!isOpen || !batch) return null

  const handleSave = () => {
    onSave(batch.id, {
      qualityStatus,
      moisturePct,
      estimatedGrade,
      qualityNotes
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-orange-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Activity size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Evaluación y Control de Calidad</h2>
              <p className="text-xs text-amber-100">Triaje, Muestreo y Clasificación de Mineral</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-slate-800">
          {/* Lote Resumen */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lote</span>
              <p className="text-sm font-black text-slate-900">{batch.batchCode}</p>
              <p className="text-xs text-slate-500">Mina: {batch.originMine}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Masa Neta</span>
              <p className="text-sm font-black text-slate-800">{batch.netWeight.toFixed(2)} TMH</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-tight text-slate-700 block mb-2">
              Clasificación de Calidad del Mineral *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setQualityStatus('optimo')}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  qualityStatus === 'optimo'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <div className="text-xs font-black">🟢 ÓPTIMO / BIEN</div>
                <div className={`text-[10px] mt-0.5 ${qualityStatus === 'optimo' ? 'text-emerald-100' : 'text-emerald-600'}`}>
                  Buena ley aparente, sin desmonte estéril.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQualityStatus('regular')}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  qualityStatus === 'regular'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <div className="text-xs font-black">🟡 ACEPTABLE</div>
                <div className={`text-[10px] mt-0.5 ${qualityStatus === 'regular' ? 'text-amber-100' : 'text-amber-600'}`}>
                  Humedad media, ley estándar procesable.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQualityStatus('observado')}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  qualityStatus === 'observado'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <div className="text-xs font-black">🔴 MALO / OBSERVADO</div>
                <div className={`text-[10px] mt-0.5 ${qualityStatus === 'observado' ? 'text-rose-100' : 'text-rose-600'}`}>
                  Alto desmonte, sobrehumedad o baja ley.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQualityStatus('rechazado')}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  qualityStatus === 'rechazado'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-800/25'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <div className="text-xs font-black">🚫 RECHAZADO</div>
                <div className={`text-[10px] mt-0.5 ${qualityStatus === 'rechazado' ? 'text-slate-300' : 'text-slate-500'}`}>
                  No apto para planta. Derivar a botadero.
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600">% Humedad Estimada</label>
              <input
                type="number"
                step="0.1"
                value={moisturePct}
                onChange={(e) => setMoisturePct(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-amber-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600">Ley Preliminar (Au / Ag / Cu)</label>
              <input
                type="text"
                placeholder="Ej. 3.2 g/t Au"
                value={estimatedGrade}
                onChange={(e) => setEstimatedGrade(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-amber-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600">Notas u Observaciones del Triaje</label>
            <textarea
              rows={3}
              value={qualityNotes}
              onChange={(e) => setQualityNotes(e.target.value)}
              placeholder="Escriba aquí los detalles sobre presencia de cuarzo, pirita, arcillas o desmonte..."
              className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal focus:border-amber-500 focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              Guardar Calificación
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
