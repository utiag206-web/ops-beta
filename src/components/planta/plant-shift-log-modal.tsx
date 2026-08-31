'use client'

import { useState } from 'react'
import { X, CheckCircle2, ClipboardCheck, Activity, AlertOctagon, User, Clock, CheckSquare, Square } from 'lucide-react'
import { PlantShiftChecklist } from './plant-mock-data'

interface PlantShiftLogModalProps {
  isOpen: boolean
  currentChecklist: PlantShiftChecklist
  onClose: () => void
  onSave: (checklist: PlantShiftChecklist) => void
}

export function PlantShiftLogModal({ isOpen, currentChecklist, onClose, onSave }: PlantShiftLogModalProps) {
  const [shift, setShift] = useState<'dia' | 'noche'>(currentChecklist.shift)
  const [supervisor, setSupervisor] = useState(currentChecklist.supervisor)
  const [operator, setOperator] = useState(currentChecklist.operator)
  const [scaleChecked, setScaleChecked] = useState(currentChecklist.scaleChecked)
  const [hoppersChecked, setHoppersChecked] = useState(currentChecklist.hoppersChecked)
  const [conveyorBeltsChecked, setConveyorBeltsChecked] = useState(currentChecklist.conveyorBeltsChecked)
  const [crusherChecked, setCrusherChecked] = useState(currentChecklist.crusherChecked)
  const [ballMillChecked, setBallMillChecked] = useState(currentChecklist.ballMillChecked)
  const [tailingsDamChecked, setTailingsDamChecked] = useState(currentChecklist.tailingsDamChecked)
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(currentChecklist.downtimeMinutes)
  const [downtimeReason, setDowntimeReason] = useState(currentChecklist.downtimeReason)
  const [notes, setNotes] = useState(currentChecklist.notes)

  if (!isOpen) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...currentChecklist,
      shift,
      supervisor,
      operator,
      scaleChecked,
      hoppersChecked,
      conveyorBeltsChecked,
      crusherChecked,
      ballMillChecked,
      tailingsDamChecked,
      downtimeMinutes: Number(downtimeMinutes) || 0,
      downtimeReason,
      notes
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <ClipboardCheck size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Bitácora Operativa & Checklist de Planta</h2>
              <p className="text-xs text-blue-200">Control Pre-Operacional y Relevo de Turno</p>
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
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Section 1: Turno y Responsables */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600">Turno de Operación</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShift('dia')}
                  className={`p-2 rounded-xl text-xs font-black border transition-all ${
                    shift === 'dia'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ☀️ Turno Día
                </button>
                <button
                  type="button"
                  onClick={() => setShift('noche')}
                  className={`p-2 rounded-xl text-xs font-black border transition-all ${
                    shift === 'noche'
                      ? 'bg-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-700/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🌙 Turno Noche
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Supervisor de Planta</label>
              <input
                type="text"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-blue-600 focus:bg-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Operadores de Turno</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-blue-600 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Section 2: Checklist Pre-Operacional */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-blue-600" />
              Checklist de Inspección de Equipos de Planta
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                onClick={() => setScaleChecked(!scaleChecked)}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:border-blue-500 transition-all select-none"
              >
                {scaleChecked ? (
                  <CheckSquare size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <Square size={18} className="text-slate-300 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-black text-slate-800">1. Balanza de Camiones / Plataforma</div>
                  <div className="text-[10px] text-slate-500">Calibración en cero y sensores limpios</div>
                </div>
              </label>

              <label
                onClick={() => setHoppersChecked(!hoppersChecked)}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:border-blue-500 transition-all select-none"
              >
                {hoppersChecked ? (
                  <CheckSquare size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <Square size={18} className="text-slate-300 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-black text-slate-800">2. Tolvas de Gruesos y Finos</div>
                  <div className="text-[10px] text-slate-500">Parrillas sin campaneos ni atoros</div>
                </div>
              </label>

              <label
                onClick={() => setConveyorBeltsChecked(!conveyorBeltsChecked)}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:border-blue-500 transition-all select-none"
              >
                {conveyorBeltsChecked ? (
                  <CheckSquare size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <Square size={18} className="text-slate-300 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-black text-slate-800">3. Fajas Transportadoras (1, 2 y 3)</div>
                  <div className="text-[10px] text-slate-500">Alineamiento, polines y paradas de emergencia</div>
                </div>
              </label>

              <label
                onClick={() => setCrusherChecked(!crusherChecked)}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:border-blue-500 transition-all select-none"
              >
                {crusherChecked ? (
                  <CheckSquare size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <Square size={18} className="text-slate-300 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-black text-slate-800">4. Chancadora Primaria (Quijada)</div>
                  <div className="text-[10px] text-slate-500">Lubricación, pernos de toggle y fajas en V</div>
                </div>
              </label>

              <label
                onClick={() => setBallMillChecked(!ballMillChecked)}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:border-blue-500 transition-all select-none"
              >
                {ballMillChecked ? (
                  <CheckSquare size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <Square size={18} className="text-slate-300 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-black text-slate-800">5. Molino de Bolas & Clasificador</div>
                  <div className="text-[10px] text-slate-500">Nivel de carga de bolas y bomba de pulpa</div>
                </div>
              </label>

              <label
                onClick={() => setTailingsDamChecked(!tailingsDamChecked)}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:border-blue-500 transition-all select-none"
              >
                {tailingsDamChecked ? (
                  <CheckSquare size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <Square size={18} className="text-slate-300 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-black text-slate-800">6. Pozas de Sedimentación / Relave</div>
                  <div className="text-[10px] text-slate-500">Borde libre, bombeo de recirculación</div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Paradas de Planta & Novedades */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600">Parada Operativa (Minutos)</label>
              <input
                type="number"
                value={downtimeMinutes}
                onChange={(e) => setDowntimeMinutes(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-blue-600 focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600">Motivo de Parada / Mantenimiento</label>
              <input
                type="text"
                value={downtimeReason}
                onChange={(e) => setDowntimeReason(e.target.value)}
                placeholder="Ej. Cambio de malla en zaranda, lubricación de chancadora..."
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-blue-600 focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="col-span-full">
              <label className="text-[11px] font-bold text-slate-600">Observaciones Generales y Relevo de Turno</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escriba aquí los compromisos para el siguiente turno, consumos de reactivos o novedades..."
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal focus:border-blue-600 focus:bg-white outline-none transition-all"
              />
            </div>
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
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              Guardar Bitácora de Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
