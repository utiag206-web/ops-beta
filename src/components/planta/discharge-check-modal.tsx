'use client'

import { useState } from 'react'
import { X, CheckCircle2, Layers, MapPin, User, Clock, AlertTriangle } from 'lucide-react'
import { MineralBatch } from './plant-mock-data'

interface DischargeCheckModalProps {
  isOpen: boolean
  batch: MineralBatch | null
  onClose: () => void
  onConfirm: (batchId: string, stockpile: string, operator: string) => void
}

export function DischargeCheckModal({ isOpen, batch, onClose, onConfirm }: DischargeCheckModalProps) {
  const [stockpile, setStockpile] = useState('Cancha A - Sulfuros Alta Ley')
  const [operator, setOperator] = useState('Carlos Ruiz (Líder Planta)')

  if (!isOpen || !batch) return null

  const handleConfirm = () => {
    onConfirm(batch.id, stockpile, operator)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Layers size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Check de Descarga & Acopio</h2>
              <p className="text-xs text-emerald-100">Confirmación física en Cancha de Beneficio</p>
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
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Lote a Descargar</span>
              <p className="text-sm font-black text-slate-900">{batch.batchCode}</p>
              <p className="text-xs text-slate-600">Unidad: <span className="font-bold text-slate-800">{batch.truckPlate}</span> ({batch.driverName})</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Peso Neto</span>
              <p className="text-lg font-black text-emerald-800">{batch.netWeight.toFixed(2)} TMH</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-tight text-slate-700 flex items-center gap-2 mb-1.5">
              <MapPin size={14} className="text-emerald-600" />
              Asignar Cancha / Stockpile de Descarga *
            </label>
            <select
              value={stockpile}
              onChange={(e) => setStockpile(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:border-emerald-600 focus:bg-white outline-none transition-all"
            >
              <option value="Cancha A - Sulfuros Alta Ley">Cancha A - Sulfuros Alta Ley</option>
              <option value="Cancha B - Óxidos">Cancha B - Óxidos</option>
              <option value="Cancha C - Cuarentena / Triaje">Cancha C - Cuarentena / Triaje</option>
              <option value="Tolva de Gruesos - Faja 1">Tolva de Gruesos - Faja 1 (Alimentación Directa)</option>
              <option value="Botadero Mina Este">Botadero Mina Este (Desmonte Rechazado)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-tight text-slate-700 flex items-center gap-2 mb-1.5">
              <User size={14} className="text-emerald-600" />
              Operador Responsable de Cancha *
            </label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="Nombre del operador"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2.5">
            <Clock size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <p>
              Al confirmar, se registrará la hora actual y el lote pasará automáticamente al estado <strong className="text-emerald-700 font-bold">"Descargado / En Acopio"</strong>, habilitándose para tratamiento en molino o tolva.
            </p>
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
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              Confirmar Check Descarga
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
