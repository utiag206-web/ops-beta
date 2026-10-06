'use client'

import { useState } from 'react'
import { X, Truck, Scale, CheckCircle2, AlertTriangle, FileText, MapPin, User, Layers } from 'lucide-react'
import { PlantMineralBatch } from '@/app/(main)/operaciones/planta/actions'
import { MultiplePhotoCapture } from '@/components/shared/MultiplePhotoCapture'

interface MineralReceptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (batch: Partial<PlantMineralBatch> & { evidences_base64?: string[] }) => void
}

export function MineralReceptionModal({ isOpen, onClose, onSubmit }: MineralReceptionModalProps) {
  const [guideNumber, setGuideNumber] = useState('')
  const [batchCode, setBatchCode] = useState('')
  const [truckPlate, setTruckPlate] = useState('')
  const [driverName, setDriverName] = useState('')
  const [originMine, setOriginMine] = useState('')
  const [dischargeTime, setDischargeTime] = useState('')
  const [mineralType, setMineralType] = useState('Sulfuros Polimetálicos')
  const [grossWeight, setGrossWeight] = useState<number | ''>('')
  const [tareWeight, setTareWeight] = useState<number | ''>('')
  const [moisturePct, setMoisturePct] = useState<number>(4.5)
  const [estimatedGrade, setEstimatedGrade] = useState('')
  const [qualityStatus, setQualityStatus] = useState<'optimo' | 'regular' | 'observado' | 'rechazado'>('optimo')
  const [qualityNotes, setQualityNotes] = useState('')
  const [stockpile, setStockpile] = useState('En Balanza / Entrada')
  const [operatorName, setOperatorName] = useState('Carlos Ruiz (Líder Planta)')
  const [trasladoPhotos, setTrasladoPhotos] = useState<string[]>([])
  const [plantaPhotos, setPlantaPhotos] = useState<string[]>([])

  if (!isOpen) return null

  const gross = Number(grossWeight) || 0
  const tare = Number(tareWeight) || 0
  const net = Math.max(0, gross - tare)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!truckPlate || !driverName || gross <= 0 || tare <= 0) {
      alert('Por favor complete los datos de la unidad, chofer y pesaje.')
      return
    }

    const now = new Date()
    const finalBatchCode = batchCode.trim() || `LOT-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const autoGuide = guideNumber.trim() || `GR-002-${Math.floor(100000 + Math.random() * 900000)}`

    const mappedEvidences = [
      ...trasladoPhotos.map(url => ({ url, stage: 'traslado', uploaded_at: now.toISOString() })),
      ...plantaPhotos.map(url => ({ url, stage: 'planta', uploaded_at: now.toISOString() }))
    ]

    onSubmit({
      batch_code: finalBatchCode.toUpperCase(),
      guide_number: autoGuide,
      reception_date: now.toISOString().split('T')[0],
      reception_time: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }),
      truck_plate: truckPlate.toUpperCase().trim(),
      driver_name: driverName.trim(),
      origin_mine: originMine,
      discharge_time: dischargeTime || null,
      mineral_type: mineralType,
      gross_weight: Number(gross.toFixed(2)),
      tare_weight: Number(tare.toFixed(2)),
      net_weight: Number(net.toFixed(2)),
      moisture_pct: Number(moisturePct) || 0,
      quality_status: qualityStatus,
      quality_notes: qualityNotes.trim() || 'Ingreso registrado en balanza de planta.',
      stage: 'ingresado',
      stockpile: stockpile,
      operator_name: operatorName,
      evidences: mappedEvidences.length > 0 ? mappedEvidences : undefined
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Scale size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Registro de Ingreso & Pesaje de Mineral</h2>
              <p className="text-xs text-blue-100">Balanza Electrónica de Planta de Beneficio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Section 1: Unidad y Chofer */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Truck size={14} className="text-blue-600" />
              1. Datos de Transporte y Mina
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600">N° Guía de Remisión (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. GR-002-004134"
                  value={guideNumber}
                  onChange={(e) => setGuideNumber(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">Código de Mineral/Lote *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. LOT-2026-4269"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">Placa Volquete / Dumper *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V7B-842"
                  value={truckPlate}
                  onChange={(e) => setTruckPlate(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">Nombre del Chofer / Conductor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Jorge Quispe"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">Labor / Frente de Mina de Origen *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Frente Norte, Lote 4, etc."
                  value={originMine}
                  onChange={(e) => setOriginMine(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">Hora de salida (Mina)</label>
                <input
                  type="time"
                  value={dischargeTime}
                  onChange={(e) => setDischargeTime(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="col-span-full">
                <MultiplePhotoCapture 
                  photos={trasladoPhotos} 
                  onChange={setTrasladoPhotos} 
                  label="Evidencias Fotográficas de Traslado (Opcional)" 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pesaje en Balanza */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Scale size={14} className="text-blue-600" />
              2. Pesaje Electrónico en Balanza (Toneladas Métricas Húmedas - TMH)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Peso Bruto (TMH) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej. 29.40"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full mt-1 p-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:border-blue-600 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">Tara Camión (TMH) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej. 10.20"
                  value={tareWeight}
                  onChange={(e) => setTareWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full mt-1 p-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:border-blue-600 outline-none transition-all"
                />
              </div>
              <div className="bg-blue-600 text-white p-3 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Peso Neto Calculado</span>
                <span className="text-xl font-black">{net.toFixed(2)} TMH</span>
              </div>
            </div>
          </div>

          {/* Section 3: Calidad y Clasificación Visual */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600" />
              3. Triaje y Control de Calidad del Mineral
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Tipo de Mineral</label>
                <input
                  type="text"
                  list="mineral-types"
                  value={mineralType}
                  onChange={(e) => setMineralType(e.target.value)}
                  placeholder="Ej. Cuarzo con Pirita"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
                <datalist id="mineral-types">
                  <option value="Sulfuros Polimetálicos" />
                  <option value="Óxidos Auríferos" />
                  <option value="Cuarzo con Pirita" />
                  <option value="Material Mixto" />
                  <option value="Material de Desbroce / Techo" />
                </datalist>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Condición / Evaluación Visual *</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setQualityStatus('optimo')}
                    className={`p-2 rounded-xl text-[10px] font-black border transition-all ${
                      qualityStatus === 'optimo'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    🟢 Óptimo (Bien)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQualityStatus('regular')}
                    className={`p-2 rounded-xl text-[10px] font-black border transition-all ${
                      qualityStatus === 'regular'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    🟡 Aceptable
                  </button>
                  <button
                    type="button"
                    onClick={() => setQualityStatus('observado')}
                    className={`p-2 rounded-xl text-[10px] font-black border transition-all ${
                      qualityStatus === 'observado'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    🔴 Malo / Desmonte
                  </button>
                  <button
                    type="button"
                    onClick={() => setQualityStatus('rechazado')}
                    className={`p-2 rounded-xl text-[10px] font-black border transition-all ${
                      qualityStatus === 'rechazado'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-800/20'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    🚫 Rechazado
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">% Humedad Estimada</label>
                <input
                  type="number"
                  step="0.1"
                  value={moisturePct}
                  onChange={(e) => setMoisturePct(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Ley Estimada Preliminar (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. 3.5 g/t Au | 4.0 oz/t Ag"
                  value={estimatedGrade}
                  onChange={(e) => setEstimatedGrade(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="col-span-full">
                <label className="text-[11px] font-bold text-slate-600">Observaciones del Evaluador de Planta</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre granularidad, humedad, sobretamaños o presencia de estéril..."
                  value={qualityNotes}
                  onChange={(e) => setQualityNotes(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="col-span-full">
                <MultiplePhotoCapture 
                  photos={plantaPhotos} 
                  onChange={setPlantaPhotos} 
                  label="Evidencias Fotográficas de Calidad / Planta (Opcional)" 
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
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
              Registrar Pesaje & Lote
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
