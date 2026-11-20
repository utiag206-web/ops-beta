'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2, FlaskConical, TestTube2, Truck, Activity } from 'lucide-react'
import { PlantMineralBatch, PlantMineralSample } from '@/app/(main)/operaciones/planta/actions'
import { MultiplePhotoCapture } from '@/components/shared/MultiplePhotoCapture'

export function EditTrasladoModal({ isOpen, batch, onClose, onSave }: { isOpen: boolean, batch: PlantMineralBatch | null, onClose: () => void, onSave: (data: Partial<PlantMineralBatch>) => void }) {
  const [formData, setFormData] = useState<Partial<PlantMineralBatch>>({})
  const [newPhotos, setNewPhotos] = useState<string[]>([])

  useEffect(() => {
    if (batch) {
      setFormData(batch)
      setNewPhotos([])
    }
  }, [batch])

  if (!isOpen || !batch) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Truck size={20} /></div>
            <h2 className="text-lg font-black text-slate-800">Editar Traslado</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-slate-600">Placa</label>
            <input type="text" value={formData.truck_plate || ''} onChange={e => setFormData({ ...formData, truck_plate: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Procedencia</label>
            <input type="text" value={formData.origin_mine || ''} onChange={e => setFormData({ ...formData, origin_mine: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Tipo de mineral</label>
            <input type="text" value={formData.mineral_type || ''} onChange={e => setFormData({ ...formData, mineral_type: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Peso (TMH)</label>
            <input type="number" step="0.01" value={formData.net_weight || 0} onChange={e => setFormData({ ...formData, net_weight: Number(e.target.value) })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Responsable</label>
            <input type="text" value={formData.driver_name || ''} onChange={e => setFormData({ ...formData, driver_name: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Vehículo</label>
            <input type="text" value={formData.vehicle_asset_id ? 'Asignado en Sistema' : 'Externo'} disabled className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-500" /></div>
          <div><label className="text-xs font-bold text-slate-600">Hora de salida (Mina)</label>
            <input type="time" value={formData.discharge_time || ''} onChange={e => setFormData({ ...formData, discharge_time: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Hora de llegada (Planta)</label>
            <input type="time" value={formData.reception_time || ''} onChange={e => setFormData({ ...formData, reception_time: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          
          <div className="col-span-2">
            <MultiplePhotoCapture photos={newPhotos} onChange={setNewPhotos} label="Fotografías Adicionales de Traslado" />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={() => {
            const mapped = newPhotos.length > 0 ? newPhotos.map(url => ({ url, stage: 'traslado', uploaded_at: new Date().toISOString() })) : [];
            const oldEvidences = formData.evidences || [];
            const finalEvidences = [...oldEvidences, ...mapped];
            const finalData = { ...formData, evidences: finalEvidences };
            onSave(finalData as any); 
            onClose(); 
          }} className="px-5 py-2 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors">Guardar Cambios</button>
        </div>
      </div>
    </div>
  )
}

export function EditPlantaModal({ isOpen, batch, onClose, onSave }: { isOpen: boolean, batch: PlantMineralBatch | null, onClose: () => void, onSave: (data: Partial<PlantMineralBatch>) => void }) {
  const [formData, setFormData] = useState<Partial<PlantMineralBatch>>({})
  const [newPhotos, setNewPhotos] = useState<string[]>([])

  useEffect(() => {
    if (batch) {
      setFormData(batch)
      setNewPhotos([])
    }
  }, [batch])

  if (!isOpen || !batch) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-lg"><Activity size={20} /></div>
            <h2 className="text-lg font-black text-slate-800">Editar Datos de Planta</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-slate-600">Código de Mineral/Lote</label>
            <input type="text" value={formData.batch_code || ''} onChange={e => setFormData({ ...formData, batch_code: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50 uppercase font-bold" /></div>
          <div><label className="text-xs font-bold text-slate-600">Recepción (Fecha)</label>
            <input type="date" value={formData.reception_date || ''} onChange={e => setFormData({ ...formData, reception_date: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Resultado % Humedad</label>
            <input type="number" step="0.01" value={formData.moisture_pct || 0} onChange={e => setFormData({ ...formData, moisture_pct: Number(e.target.value) })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Chancado (Calidad)</label>
            <select value={formData.quality_status || ''} onChange={e => setFormData({ ...formData, quality_status: e.target.value as any })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50">
              <option value="">Seleccione...</option>
              <option value="optimo">Óptimo</option>
              <option value="regular">Regular</option>
              <option value="observado">Observado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
          <div><label className="text-xs font-bold text-slate-600">Procesamiento (Etapa)</label>
            <select value={formData.stage || ''} onChange={e => setFormData({ ...formData, stage: e.target.value as any })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50">
              <option value="ingresado">Ingresado</option>
              <option value="descargado">Descargado</option>
              <option value="acopio">En Acopio</option>
              <option value="proceso">En Proceso (Molienda)</option>
              <option value="muestreo">En Muestreo</option>
              <option value="laboratorio">En Laboratorio</option>
              <option value="ley_final">Ley Final Acordada</option>
            </select>
          </div>
          
          <div className="col-span-2">
            <MultiplePhotoCapture photos={newPhotos} onChange={setNewPhotos} label="Fotografías Adicionales de Planta" />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={() => {
            const mapped = newPhotos.length > 0 ? newPhotos.map(url => ({ url, stage: 'planta', uploaded_at: new Date().toISOString() })) : [];
            const oldEvidences = formData.evidences || [];
            const finalEvidences = [...oldEvidences, ...mapped];
            const finalData = { ...formData, evidences: finalEvidences };
            onSave(finalData as any); 
            onClose(); 
          }} className="px-5 py-2 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors">Guardar Cambios</button>
        </div>
      </div>
    </div>
  )
}

export function MuestreoModal({ isOpen, sample, batchId, onClose, onSave }: { isOpen: boolean, sample: PlantMineralSample | null, batchId: string, onClose: () => void, onSave: (sample: Partial<PlantMineralSample>) => void }) {
  const [formData, setFormData] = useState<Partial<PlantMineralSample>>({
    batch_id: batchId,
    sampling_date: new Date().toISOString().split('T')[0],
    sampling_time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }),
    has_counter_sample: false
  })
  const [newPhotos, setNewPhotos] = useState<string[]>([])

  useEffect(() => {
    if (sample) {
      setFormData(sample)
      setNewPhotos([])
    } else {
      setFormData(prev => ({ ...prev, batch_id: batchId }))
      setNewPhotos([])
    }
  }, [sample, batchId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><FlaskConical size={20} /></div>
            <h2 className="text-lg font-black text-slate-800">Registro de Muestreo</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-slate-600">Código de muestra</label>
            <input type="text" value={formData.sample_code || ''} onChange={e => setFormData({ ...formData, sample_code: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Responsable</label>
            <input type="text" value={formData.sampler_name || ''} onChange={e => setFormData({ ...formData, sampler_name: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Fecha de muestreo</label>
            <input type="date" value={formData.sampling_date || ''} onChange={e => setFormData({ ...formData, sampling_date: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div><label className="text-xs font-bold text-slate-600">Hora de muestreo</label>
            <input type="time" value={formData.sampling_time || ''} onChange={e => setFormData({ ...formData, sampling_time: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          
          <div className="col-span-2 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl mt-2">
            <input type="checkbox" checked={formData.has_counter_sample || false} onChange={e => setFormData({ ...formData, has_counter_sample: e.target.checked })} id="cs" className="w-4 h-4 text-indigo-600 rounded" />
            <label htmlFor="cs" className="text-sm font-bold text-slate-700 select-none">Se extrajo contramuestra</label>
          </div>
          
          <div className="col-span-2">
            <MultiplePhotoCapture photos={newPhotos} onChange={setNewPhotos} label="Fotografías de la Muestra / Código de barras (Opcional)" />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={() => { 
            const mapped = newPhotos.length > 0 ? newPhotos.map(url => ({ url, stage: 'muestreo', uploaded_at: new Date().toISOString() })) : [];
            const oldEvidences = formData.evidences || [];
            const finalEvidences = [...oldEvidences, ...mapped];
            const finalData = { ...formData, evidences: finalEvidences };
            onSave(finalData as any); 
            onClose(); 
          }} className="px-5 py-2 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors">Guardar Muestra</button>
        </div>
      </div>
    </div>
  )
}

export function LaboratorioModal({ isOpen, sample, batchCode, onClose, onSave }: { isOpen: boolean, sample: PlantMineralSample | null, batchCode: string, onClose: () => void, onSave: (sample: Partial<PlantMineralSample>) => void }) {
  const [formData, setFormData] = useState<Partial<PlantMineralSample>>({})
  const [newPhotos, setNewPhotos] = useState<string[]>([])

  useEffect(() => {
    if (sample) {
      setFormData(sample)
      setNewPhotos([])
    }
  }, [sample])

  if (!isOpen || !sample) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><TestTube2 size={20} /></div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Resultado de Ley</h2>
              <p className="text-xs font-semibold text-slate-500">Código del mineral/lote: {batchCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-xs font-bold text-slate-600">Resultado de laboratorio (Descriptivo)</label>
            <input type="text" value={formData.lab_notes || ''} onChange={e => setFormData({ ...formData, lab_notes: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" placeholder="Ej. Laboratorio externo certificado" /></div>
          
          <div><label className="text-xs font-bold text-slate-600">Ley obtenida</label>
            <input type="number" step="0.01" value={formData.obtained_grade || ''} onChange={e => setFormData({ ...formData, obtained_grade: Number(e.target.value) })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          
          <div><label className="text-xs font-bold text-slate-600">Resultado de la contramuestra</label>
            <input type="number" step="0.01" value={formData.counter_sample_result || ''} onChange={e => setFormData({ ...formData, counter_sample_result: Number(e.target.value) })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
          
          <div><label className="text-xs font-bold text-emerald-700">Ley final acordada</label>
            <input type="number" step="0.01" value={formData.final_agreed_grade || ''} onChange={e => setFormData({ ...formData, final_agreed_grade: Number(e.target.value) })} className="w-full mt-1 p-2 border border-emerald-300 rounded-xl bg-emerald-50 text-emerald-900 font-bold focus:border-emerald-500" /></div>
          
          <div><label className="text-xs font-bold text-slate-600">Fecha del resultado</label>
            <input type="date" value={formData.lab_result_date || ''} onChange={e => setFormData({ ...formData, lab_result_date: e.target.value })} className="w-full mt-1 p-2 border border-slate-200 rounded-xl bg-slate-50" /></div>
            
          <div className="col-span-2">
            <MultiplePhotoCapture photos={newPhotos} onChange={setNewPhotos} label="Fotografías del Certificado de Laboratorio (Opcional)" />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={() => { 
            const mapped = newPhotos.length > 0 ? newPhotos.map(url => ({ url, stage: 'laboratorio', uploaded_at: new Date().toISOString() })) : [];
            const oldEvidences = formData.evidences || [];
            const finalEvidences = [...oldEvidences, ...mapped];
            const finalData = { ...formData, status: 'ley_acordada', evidences: finalEvidences };
            onSave(finalData as any); 
            onClose(); 
          }} className="px-5 py-2 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors">Guardar Resultado</button>
        </div>
      </div>
    </div>
  )
}
