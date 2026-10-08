'use client'

import { uploadBase64Photo } from '@/lib/upload-base64'
import { useState, useEffect } from 'react'
import { 
  Factory, Search, Plus, Filter, FileText, ChevronRight, Ban, X, Maximize2, ExternalLink,
  FlaskConical, Truck, Activity, Target, CheckCircle2, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react'
import { PlantMineralBatch, PlantMineralSample, getPlantSamples, createPlantBatch, updatePlantBatch, createPlantSample, updatePlantSample } from '@/app/(main)/operaciones/planta/actions'
import { MineralReceptionModal } from './mineral-reception-modal'
import { EditTrasladoModal, EditPlantaModal, MuestreoModal, LaboratorioModal } from './plant-modals'
import { useOffline } from '@/components/providers/offline-provider'
import { addOperationToQueue, getPendingOperations, saveBatchesToCache, getCachedBatches, saveSamplesToCache, getCachedSamples, updateBatchInCache } from '@/lib/offline-sync'
import { v4 as uuidv4 } from 'uuid'

export function PlantDashboard({ companyId, initialBatches, persistToServer = false }: { companyId: string, initialBatches: PlantMineralBatch[], persistToServer?: boolean }) {
  const [batches, setBatches] = useState<PlantMineralBatch[]>(initialBatches)
  const [samples, setSamples] = useState<Record<string, PlantMineralSample[]>>({})
  const [searchTerm, setSearchTerm] = useState('')

  const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false)
  const [detailBatch, setDetailBatch] = useState<PlantMineralBatch | null>(null)

  // Editing state inside detail view
  const [editTrasladoBatch, setEditTrasladoBatch] = useState<PlantMineralBatch | null>(null)
  const [editPlantaBatch, setEditPlantaBatch] = useState<PlantMineralBatch | null>(null)
  const [editMuestreoBatch, setEditMuestreoBatch] = useState<PlantMineralBatch | null>(null)
  const [editLaboratorioSample, setEditLaboratorioSample] = useState<{sample: PlantMineralSample | null, batch: PlantMineralBatch} | null>(null)

  useEffect(() => {
    const initOfflineAndSamples = async () => {
      let currentBatches = [...initialBatches]
      let currentSamples = { ...samples }
      
      // 1. Read Cache: Save server batches if online, or load from IndexedDB if offline/empty
      if (initialBatches && initialBatches.length > 0) {
        await saveBatchesToCache(initialBatches as any, companyId)
      } else {
        const cached = await getCachedBatches(companyId)
        if (cached && cached.length > 0) {
          currentBatches = [...(cached as any)]
        }
      }

      // 2. Load pending from IndexedDB for survival across F5
      const pending = await getPendingOperations()
      const plantaPending = pending.filter(p => p.entity === 'planta_mineral')
      
      for (const op of plantaPending) {
        if (op.action === 'create_batch') {
          const newBatch = { ...op.payload, isPending: true }
          if (!currentBatches.some(b => b.id === newBatch.id)) {
            currentBatches = [newBatch, ...currentBatches]
          }
        }
        if (op.action === 'update_batch') {
          currentBatches = currentBatches.map(b => b.id === op.payload.id ? { ...b, ...op.payload.updates, isPending: true } : b)
        }
        if (op.action === 'create_sample') {
          const newSample = { ...op.payload, isPending: true }
          const bId = newSample.batch_id
          if (bId) {
            const existingArr = currentSamples[bId] || []
            if (!existingArr.some(s => s.id === newSample.id)) {
              currentSamples[bId] = [...existingArr, newSample]
            }
          }
        }
        if (op.action === 'update_sample') {
          const upSample = op.payload.updates
          const bId = upSample.batch_id
          if (bId) {
            const existingArr = currentSamples[bId] || []
            currentSamples[bId] = existingArr.map(s => s.id === op.payload.id ? { ...s, ...upSample, isPending: true } : s)
          }
        }
      }
      
      setBatches(currentBatches)
      setSamples(currentSamples)

      // Fetch samples for online batches or load from read cache
      for (const batch of currentBatches) {
        if (!currentSamples[batch.id] && batch.stage !== 'anulado') {
          if (navigator.onLine && !batch.id.startsWith('temp-')) {
            const res = await getPlantSamples(batch.id)
            if (res.success && res.data && res.data.length > 0) {
              setSamples(prev => ({ ...prev, [batch.id]: res.data }))
              await saveSamplesToCache(res.data as any, batch.id)
            }
          } else {
            const cachedSamples = await getCachedSamples(batch.id)
            if (cachedSamples && cachedSamples.length > 0) {
              setSamples(prev => ({ ...prev, [batch.id]: cachedSamples as any }))
            }
          }
        }
      }
    }
    
    initOfflineAndSamples()
  }, [initialBatches])

  const filteredBatches = batches.filter(b => 
    b.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.truck_plate.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const { isOnline, triggerSync } = useOffline()

  const handleUpdateBatch = async (batchId: string, updates: Partial<PlantMineralBatch>) => {
    if (!persistToServer) return
    const isTempId = batchId.startsWith('temp-')

    // 1. ONLINE REAL: Direct update without offline queue
    if (isOnline && !isTempId) {
      try {
        let processedEvidences = updates.evidences ? [...updates.evidences] : undefined
        if (processedEvidences && processedEvidences.length > 0) {
          for (let i = 0; i < processedEvidences.length; i++) {
            const ev = processedEvidences[i]
            if (ev.url && ev.url.startsWith('data:image')) {
              const uploadedUrl = await uploadBase64Photo(ev.url, companyId, 'planta')
              if (uploadedUrl) {
                processedEvidences[i] = { ...ev, url: uploadedUrl }
              }
            }
          }
        }

        const cleanUpdates = processedEvidences ? { ...updates, evidences: processedEvidences } : { ...updates }
        const res = await updatePlantBatch(batchId, cleanUpdates)
        if (res.success && res.data) {
          const updated = batches.map(b => b.id === batchId ? res.data! : b)
          setBatches(updated)
          await updateBatchInCache(batchId, res.data as any)
          if (detailBatch && detailBatch.id === batchId) setDetailBatch(res.data)
          return
        } else if (res.error && !res.error.toLowerCase().includes('fetch') && !res.error.toLowerCase().includes('network')) {
          alert(res.error)
          return
        }
      } catch (err: any) {
        console.warn('[ONLINE_UPDATE_ERROR]', err)
        if (err.name !== 'TypeError' && !err.message?.includes('fetch')) {
          alert('Error al actualizar: ' + err.message)
          return
        }
      }
    }

    // 2. FALLBACK OFFLINE (only if !isOnline or true network failure)
    const finalUpdates = { ...updates }
    await addOperationToQueue({
      id: uuidv4(),
      entity: 'planta_mineral',
      action: 'update_batch',
      payload: { id: batchId, updates: finalUpdates, company_id: companyId },
      company_id: companyId
    })

    const updatedBatch = { ...batches.find(b => b.id === batchId)!, ...finalUpdates, isPending: true }
    setBatches(batches.map(b => b.id === batchId ? updatedBatch : b))
    if (detailBatch && detailBatch.id === batchId) setDetailBatch(updatedBatch)
    if (isOnline) triggerSync()
  }

  const handleSaveSample = async (sampleData: Partial<PlantMineralSample>) => {
    if (!persistToServer) return
    const isTempSample = sampleData.id?.startsWith('temp-')
    const isTempBatch = sampleData.batch_id?.startsWith('temp-')

    // 1. ONLINE REAL: Direct save without offline queue
    if (isOnline && !isTempSample && !isTempBatch) {
      try {
        let processedEvidences = sampleData.evidences ? [...sampleData.evidences] : undefined
        if (processedEvidences && processedEvidences.length > 0) {
          for (let i = 0; i < processedEvidences.length; i++) {
            const ev = processedEvidences[i]
            if (ev.url && ev.url.startsWith('data:image')) {
              const uploadedUrl = await uploadBase64Photo(ev.url, companyId, 'planta')
              if (uploadedUrl) {
                processedEvidences[i] = { ...ev, url: uploadedUrl }
              }
            }
          }
        }

        const cleanSample = processedEvidences ? { ...sampleData, evidences: processedEvidences } : { ...sampleData }

        if (cleanSample.id) {
          const res = await updatePlantSample(cleanSample.id, cleanSample)
          if (res.success && res.data) {
            const bId = res.data.batch_id
            const newSamples = (samples[bId] || []).map(s => s.id === res.data!.id ? res.data! : s)
            setSamples(prev => ({ ...prev, [bId]: newSamples }))
            if (cleanSample.status === 'ley_acordada') {
              await handleUpdateBatch(bId, { stage: 'ley_final' })
            }
            return
          } else if (res.error && !res.error.toLowerCase().includes('fetch') && !res.error.toLowerCase().includes('network')) {
            alert(res.error)
            return
          }
        } else {
          const res = await createPlantSample(cleanSample)
          if (res.success && res.data) {
            const bId = res.data.batch_id
            setSamples(prev => ({ ...prev, [bId]: [...(prev[bId] || []), res.data!] }))
            await handleUpdateBatch(bId, { stage: 'laboratorio' })
            return
          } else if (res.error && !res.error.toLowerCase().includes('fetch') && !res.error.toLowerCase().includes('network')) {
            alert(res.error)
            return
          }
        }
      } catch (err: any) {
        console.warn('[ONLINE_SAMPLE_ERROR]', err)
        if (err.name !== 'TypeError' && !err.message?.includes('fetch')) {
          alert('Error al guardar muestra: ' + err.message)
          return
        }
      }
    }

    // 2. FALLBACK OFFLINE
    const finalSampleData = { ...sampleData }
    if (sampleData.id) {
      await addOperationToQueue({
        id: uuidv4(),
        entity: 'planta_mineral',
        action: 'update_sample',
        payload: { id: sampleData.id, updates: finalSampleData, company_id: companyId },
        company_id: companyId
      })
      const batchId = sampleData.batch_id!
      const existing = samples[batchId]?.find(s => s.id === sampleData.id)
      const newSamples = (samples[batchId] || []).map(s => s.id === sampleData.id ? { ...existing, ...finalSampleData, isPending: true } as PlantMineralSample : s)
      setSamples(prev => ({ ...prev, [batchId]: newSamples }))
      if (sampleData.status === 'ley_acordada') {
        await handleUpdateBatch(batchId, { stage: 'ley_final' })
      }
    } else {
      const tempId = `temp-${Date.now()}`
      const newSample = { ...finalSampleData, id: tempId, isPending: true } as PlantMineralSample
      await addOperationToQueue({
        id: uuidv4(),
        entity: 'planta_mineral',
        action: 'create_sample',
        payload: { ...newSample, company_id: companyId },
        company_id: companyId
      })
      const batchId = sampleData.batch_id!
      setSamples(prev => ({ ...prev, [batchId]: [...(prev[batchId] || []), newSample] }))
      await handleUpdateBatch(batchId, { stage: 'laboratorio' })
    }
    if (isOnline) triggerSync()
  }

  const handleCreateBatch = async (batchData: Partial<PlantMineralBatch>) => {
    if (!persistToServer) return

    // 1. ONLINE REAL: Direct creation without offline queue or temp-UUID
    if (isOnline) {
      try {
        let processedEvidences = batchData.evidences ? [...batchData.evidences] : []
        if (processedEvidences.length > 0) {
          for (let i = 0; i < processedEvidences.length; i++) {
            const ev = processedEvidences[i]
            if (ev.url && ev.url.startsWith('data:image')) {
              const uploadedUrl = await uploadBase64Photo(ev.url, companyId, 'planta')
              if (uploadedUrl) {
                processedEvidences[i] = { ...ev, url: uploadedUrl }
              }
            }
          }
        }

        const cleanBatch = { ...batchData, evidences: processedEvidences }
        const res = await createPlantBatch(cleanBatch)
        if (res.success && res.data) {
          // Direct real UUID from Supabase, no sync_queue, no temp ID
          setBatches([res.data, ...batches])
          await saveBatchesToCache([res.data as any], companyId)
          setIsReceptionModalOpen(false)
          return
        } else if (res.error && !res.error.toLowerCase().includes('fetch') && !res.error.toLowerCase().includes('network')) {
          alert(res.error)
          return
        }
      } catch (err: any) {
        console.warn('[ONLINE_CREATE_ERROR]', err)
        if (err.name !== 'TypeError' && !err.message?.includes('fetch')) {
          alert('Error al registrar lote: ' + err.message)
          return
        }
      }
    }

    // 2. FALLBACK OFFLINE (only if !isOnline or true network failure)
    const tempId = `temp-${Date.now()}`
    const newBatch = { ...batchData, id: tempId, company_id: companyId } as PlantMineralBatch
    await addOperationToQueue({
      id: uuidv4(),
      entity: 'planta_mineral',
      action: 'create_batch',
      payload: newBatch,
      company_id: companyId
    })
    await saveBatchesToCache([newBatch as any], companyId)
    setBatches([{ ...newBatch, isPending: true }, ...batches])
    setIsReceptionModalOpen(false)
    if (isOnline) triggerSync()
  }

  const handleAnular = async (batchId: string) => {
    if (confirm('Â¿EstÃ¡ seguro de anular este ingreso? Se mantendrÃ¡ el registro pero ya no estarÃ¡ activo en el flujo.')) {
      await handleUpdateBatch(batchId, { stage: 'anulado' })
    }
  }

  const handleReactivar = async (batchId: string) => {
    if (confirm('Â¿EstÃ¡ seguro de reactivar este registro anulado?')) {
      await handleUpdateBatch(batchId, { stage: 'ingresado' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header aligned with INTHALY OPS Branding */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl"><Factory size={24} /></div>
            Control de Planta y Mineral
          </h1>
          <p className="text-sm mt-2 text-slate-500 font-medium">GestiÃ³n y trazabilidad de ingresos, muestreo y leyes.</p>
        </div>
        <div className="flex gap-3 items-center w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar placa o lote..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
            />
          </div>
          <button onClick={() => setIsReceptionModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap">
            <Plus size={18} /> Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Main List view */}
      {!detailBatch && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBatches.map(batch => (
            <BatchCard 
              key={batch.id} 
              batch={batch} 
              sample={samples[batch.id]?.[0]} 
              onViewDetail={() => setDetailBatch(batch)}
              onAnular={() => handleAnular(batch.id)}
              onReactivar={() => handleReactivar(batch.id)}
            />
          ))}
          {filteredBatches.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
              <Factory size={48} className="text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No hay registros de mineral en planta que coincidan.</p>
            </div>
          )}
        </div>
      )}

      {/* Detail View */}
      {detailBatch && (
        <BatchDetailView 
          batch={detailBatch} 
          sample={samples[detailBatch.id]?.[0]}
          onBack={() => setDetailBatch(null)}
          onEditTraslado={() => setEditTrasladoBatch(detailBatch)}
          onEditPlanta={() => setEditPlantaBatch(detailBatch)}
          onEditMuestreo={() => setEditMuestreoBatch(detailBatch)}
          onEditLaboratorio={() => setEditLaboratorioSample({sample: samples[detailBatch.id]?.[0] || null, batch: detailBatch})}
          onReactivar={() => handleReactivar(detailBatch.id)}
        />
      )}

      {/* Edit Modals */}
      <MineralReceptionModal isOpen={isReceptionModalOpen} onClose={() => setIsReceptionModalOpen(false)} onSubmit={handleCreateBatch} />
      
      <EditTrasladoModal isOpen={!!editTrasladoBatch} batch={editTrasladoBatch} onClose={() => setEditTrasladoBatch(null)} onSave={(data) => handleUpdateBatch(editTrasladoBatch!.id, data)} />
      <EditPlantaModal isOpen={!!editPlantaBatch} batch={editPlantaBatch} onClose={() => setEditPlantaBatch(null)} onSave={(data) => handleUpdateBatch(editPlantaBatch!.id, data)} />
      <MuestreoModal isOpen={!!editMuestreoBatch} batchId={editMuestreoBatch?.id || ''} sample={samples[editMuestreoBatch?.id || '']?.[0] || null} onClose={() => setEditMuestreoBatch(null)} onSave={handleSaveSample} />
      <LaboratorioModal isOpen={!!editLaboratorioSample} batchCode={editLaboratorioSample?.batch?.batch_code || ''} sample={editLaboratorioSample?.sample || null} onClose={() => setEditLaboratorioSample(null)} onSave={handleSaveSample} />
    </div>
  )
}

function BatchCard({ batch, sample, onViewDetail, onAnular, onReactivar }: { batch: PlantMineralBatch, sample?: PlantMineralSample, onViewDetail: () => void, onAnular: () => void, onReactivar?: () => void }) {
  const isAnulado = batch.stage === 'anulado'
  
  return (
    <div className={`bg-white p-6 rounded-3xl border ${isAnulado ? 'border-red-100 opacity-75' : 'border-slate-100'} shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-all`}>
      {isAnulado && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
      
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-black text-slate-800">{batch.batch_code}</span>
            {isAnulado && <span className="text-[10px] bg-red-100 text-red-700 px-2 rounded-full font-bold">ANULADO</span>}
            {((batch as any).isPending || (sample as any)?.isPending) && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 rounded-full font-bold" title="Pendiente de sincronizaciÃ³n">PENDIENTE</span>}
          </div>
          <div className="text-xl font-black text-blue-600 flex items-center gap-2">
            <Truck size={18} /> {batch.truck_plate}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Peso Neto</p>
          <p className="text-lg font-black text-slate-700">{batch.net_weight} <span className="text-xs">TMH</span></p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
        <div>
          <p className="text-slate-400 font-bold mb-0.5">Procedencia</p>
          <p className="font-semibold text-slate-700 truncate">{batch.origin_mine}</p>
        </div>
        <div>
          <p className="text-slate-400 font-bold mb-0.5">Tipo</p>
          <p className="font-semibold text-slate-700 truncate">{batch.mineral_type}</p>
        </div>
        <div>
          <p className="text-slate-400 font-bold mb-0.5">Fecha</p>
          <p className="font-semibold text-slate-700">{batch.reception_date}</p>
        </div>
        <div>
          <p className="text-slate-400 font-bold mb-0.5">Ley Final</p>
          <p className={`font-black ${sample?.final_agreed_grade ? 'text-emerald-600' : 'text-slate-400'}`}>{sample?.final_agreed_grade ? `${sample.final_agreed_grade}` : 'Pendiente'}</p>
        </div>
      </div>
      
      {/* Mini Progress */}
      {!isAnulado && (
        <div className="flex items-center justify-between px-1">
          <div className={`h-1.5 flex-1 rounded-l-full ${batch.id ? 'bg-blue-500' : 'bg-slate-200'}`} title="Traslado"></div>
          <div className="w-1"></div>
          <div className={`h-1.5 flex-1 ${['descargado', 'acopio', 'proceso', 'muestreo', 'laboratorio', 'ley_final', 'terminado'].includes(batch.stage) ? 'bg-amber-500' : 'bg-slate-200'}`} title="Planta"></div>
          <div className="w-1"></div>
          <div className={`h-1.5 flex-1 ${['muestreo', 'laboratorio', 'ley_final', 'terminado'].includes(batch.stage) ? 'bg-indigo-500' : 'bg-slate-200'}`} title="Muestreo"></div>
          <div className="w-1"></div>
          <div className={`h-1.5 flex-1 rounded-r-full ${['ley_final', 'terminado'].includes(batch.stage) ? 'bg-emerald-500' : 'bg-slate-200'}`} title="Ley Final"></div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button onClick={onViewDetail} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-2">
          <FileText size={16} /> Ver Detalle
        </button>
        {!isAnulado && (
          <button onClick={onAnular} className="w-10 flex items-center justify-center rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 transition-colors" title="Anular Ingreso">
            <Ban size={16} />
          </button>
        )}
        {isAnulado && onReactivar && (
          <button onClick={onReactivar} className="w-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200 transition-colors" title="Reactivar Ingreso">
            <RefreshCw size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function BatchDetailView({ batch, sample, onBack, onEditTraslado, onEditPlanta, onEditMuestreo, onEditLaboratorio, onReactivar }: any) {
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; stage: string } | null>(null)

  useEffect(() => {
    if (!previewImage) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewImage])

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Detail Header */}
      <div className="bg-slate-50 px-8 py-5 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm">
            <X size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              Lote: {batch.batch_code}
              {batch.stage === 'anulado' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">Anulado</span>}
            </h2>
            <p className="text-sm font-semibold text-slate-500">Trazabilidad detallada del ingreso</p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estado General</p>
          <div className="flex gap-2 justify-end items-center">
            <span className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-black capitalize">{batch.stage.replace('_', ' ')}</span>
            {((batch as any).isPending || (sample as any)?.isPending) && <span className="bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-black">Pendiente de SincronizaciÃ³n</span>}
            {batch.stage === 'anulado' && onReactivar && (
              <button onClick={onReactivar} className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-colors">
                <RefreshCw size={14} /> Reactivar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sections Container */}
      <div className="p-8 space-y-6">
        
        {/* 1. TRASLADO */}
        <SectionCard 
          title="1. Traslado" 
          icon={<Truck className="text-blue-600" size={20} />} 
          headerColor="bg-blue-50/50 border-blue-100"
          onEdit={batch.stage !== 'anulado' ? onEditTraslado : undefined}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
            <Field label="Placa" value={batch.truck_plate} highlight />
            <Field label="VehÃ­culo" value={batch.vehicle_asset_id ? 'Asignado (Sistema)' : 'Externo'} />
            <Field label="Responsable (Chofer)" value={batch.driver_name} />
            <Field label="Procedencia / Labor" value={batch.origin_mine} />
            
            <Field label="Tipo de mineral" value={batch.mineral_type} />
            <Field label="Peso (TMH)" value={batch.net_weight} highlight />
            <Field label="Hora de salida (Mina)" value={batch.discharge_time} />
            <Field label="Hora de llegada (Planta)" value={batch.reception_time} />
          </div>
          {batch.evidences && batch.evidences.filter((e:any) => e.stage === 'traslado').length > 0 && (
            <div className="mt-6 border-t border-blue-100 pt-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Evidencias FotogrÃ¡ficas</p>
              <div className="flex flex-wrap gap-3">
                {batch.evidences.filter((e:any) => e.stage === 'traslado').map((e: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewImage({ url: e.url, title: `Evidencia de Traslado #${idx + 1}`, stage: 'Traslado' })}
                    className="group relative block w-24 h-24 rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-400/40 transition-all shadow-sm bg-slate-100 text-left focus:outline-none cursor-pointer"
                    title="Clic para ampliar fotografÃ­a"
                  >
                    <img src={e.url} alt="evidencia traslado" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* 2. PLANTA */}
        <SectionCard 
          title="2. Planta" 
          icon={<Activity className="text-amber-600" size={20} />} 
          headerColor="bg-amber-50/50 border-amber-100"
          onEdit={batch.stage !== 'anulado' ? onEditPlanta : undefined}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
            <Field label="RecepciÃ³n (Fecha)" value={batch.reception_date} />
            <Field label="Resultado % Humedad" value={batch.moisture_pct ? `${batch.moisture_pct}%` : '-'} highlight />
            <Field label="Chancado (Estado)" value={<span className="capitalize">{batch.quality_status || '-'}</span>} />
            <Field label="Procesamiento (Etapa)" value={<span className="capitalize">{batch.stage.replace('_', ' ')}</span>} />
          </div>
          {batch.evidences && batch.evidences.filter((e:any) => e.stage === 'planta').length > 0 && (
            <div className="mt-6 border-t border-amber-100 pt-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Evidencias FotogrÃ¡ficas</p>
              <div className="flex flex-wrap gap-3">
                {batch.evidences.filter((e:any) => e.stage === 'planta').map((e: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewImage({ url: e.url, title: `Evidencia de Planta #${idx + 1}`, stage: 'Planta' })}
                    className="group relative block w-24 h-24 rounded-xl overflow-hidden border border-slate-200 hover:border-amber-500 hover:ring-2 hover:ring-amber-400/40 transition-all shadow-sm bg-slate-100 text-left focus:outline-none cursor-pointer"
                    title="Clic para ampliar fotografÃ­a"
                  >
                    <img src={e.url} alt="evidencia planta" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* 3. MUESTREO */}
        <SectionCard 
          title="3. Muestreo" 
          icon={<FlaskConical className="text-indigo-600" size={20} />} 
          headerColor="bg-indigo-50/50 border-indigo-100"
          onEdit={batch.stage !== 'anulado' ? onEditMuestreo : undefined}
          isEmpty={!sample}
          emptyText="No se ha registrado el muestreo aÃºn."
        >
          {sample && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
              <Field label="CÃ³digo de muestra" value={sample.sample_code} highlight />
              <Field label="Fecha y hora" value={`${sample.sampling_date} - ${sample.sampling_time}`} />
              <Field label="Responsable" value={sample.sampler_name} />
              <Field label="Contramuestra" value={sample.has_counter_sample ? 'SÃ­, extraÃ­da' : 'No extraÃ­da'} />
            </div>
          )}
          {sample && sample.evidences && sample.evidences.filter((e:any) => e.stage === 'muestreo').length > 0 && (
            <div className="mt-6 border-t border-indigo-100 pt-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Evidencias FotogrÃ¡ficas</p>
              <div className="flex flex-wrap gap-3">
                {sample.evidences.filter((e:any) => e.stage === 'muestreo').map((e: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewImage({ url: e.url, title: `Evidencia de Muestreo #${idx + 1}`, stage: 'Muestreo' })}
                    className="group relative block w-24 h-24 rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-400/40 transition-all shadow-sm bg-slate-100 text-left focus:outline-none cursor-pointer"
                    title="Clic para ampliar fotografÃ­a"
                  >
                    <img src={e.url} alt="evidencia muestreo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* 4. RESULTADO DE LEY */}
        <SectionCard 
          title="4. Resultado de Ley" 
          icon={<Target className="text-emerald-600" size={20} />} 
          headerColor="bg-emerald-50/50 border-emerald-100"
          onEdit={batch.stage !== 'anulado' ? onEditLaboratorio : undefined}
          isEmpty={!sample || (!sample.lab_notes && !sample.obtained_grade && !sample.final_agreed_grade)}
          emptyText="Esperando resultados de laboratorio."
          disabledEdit={!sample}
        >
          {sample && (sample.lab_notes || sample.obtained_grade || sample.final_agreed_grade) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <Field label="CÃ³digo del mineral/lote" value={batch.batch_code} />
              <Field label="Fecha del resultado" value={sample.lab_result_date || '-'} />
              <Field label="Resultado de laboratorio" value={sample.lab_notes || '-'} />
              
              <Field label="Ley obtenida" value={sample.obtained_grade || '-'} highlight />
              <Field label="Resultado de la contramuestra" value={sample.counter_sample_result || '-'} />
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Ley final acordada</p>
                <p className="font-black text-xl text-emerald-800">{sample.final_agreed_grade || '-'} <span className="text-xs">Unid.</span></p>
              </div>
            </div>
          )}
          {sample && sample.evidences && sample.evidences.filter((e:any) => e.stage === 'laboratorio').length > 0 && (
            <div className="mt-6 border-t border-emerald-100 pt-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Evidencias FotogrÃ¡ficas</p>
              <div className="flex flex-wrap gap-3">
                {sample.evidences.filter((e:any) => e.stage === 'laboratorio').map((e: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewImage({ url: e.url, title: `Evidencia de Laboratorio #${idx + 1}`, stage: 'Laboratorio' })}
                    className="group relative block w-24 h-24 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-400/40 transition-all shadow-sm bg-slate-100 text-left focus:outline-none cursor-pointer"
                    title="Clic para ampliar fotografÃ­a"
                  >
                    <img src={e.url} alt="evidencia laboratorio" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Modal Flotante de VisualizaciÃ³n de FotografÃ­as (Lightbox) */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {previewImage.stage}
                </span>
                <h4 className="text-white font-bold text-sm sm:text-base tracking-wide truncate">
                  {previewImage.title}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {previewImage.url.startsWith('http') && (
                  <a
                    href={previewImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                    title="Abrir URL original en pestaÃ±a independiente"
                  >
                    <ExternalLink size={14} />
                    <span className="hidden sm:inline">Abrir original</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
                  title="Cerrar visor (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contenedor de la Imagen */}
            <div className="flex-1 bg-slate-950/90 p-3 sm:p-6 flex items-center justify-center overflow-auto min-h-[250px] max-h-[74vh]">
              <img 
                src={previewImage.url} 
                alt={previewImage.title} 
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/80 select-none"
              />
            </div>

            {/* Footer del Modal */}
            <div className="px-5 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
              <span className="hidden sm:inline">Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">Esc</kbd> o haz clic afuera para cerrar</span>
              <span className="sm:hidden">Toca afuera para cerrar</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionCard({ title, icon, headerColor, onEdit, isEmpty, emptyText, disabledEdit, children }: any) {
  return (
    <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm group">
      <div className={`px-6 py-4 flex items-center justify-between border-b ${headerColor}`}>
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-black text-slate-800 uppercase text-sm tracking-wide">{title}</h3>
        </div>
        {onEdit && (
          <button onClick={onEdit} disabled={disabledEdit} className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-4 py-1.5 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            Editar
          </button>
        )}
      </div>
      <div className="p-6 bg-white">
        {isEmpty ? (
          <div className="text-center py-6 text-slate-400 font-medium text-sm">{emptyText}</div>
        ) : children}
      </div>
    </div>
  )
}

function Field({ label, value, highlight }: { label: string, value: any, highlight?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'font-black text-blue-700' : 'font-semibold text-slate-700'}`}>
        {value || <span className="text-slate-300">-</span>}
      </p>
    </div>
  )
}


