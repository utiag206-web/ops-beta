'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Trash2, AlertCircle, CheckCircle2, AlertTriangle, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { addWorkerDocument, deleteDocument } from './actions'

interface Worker {
  id: string
  name: string
  last_name?: string
}

interface DocumentsPageProps {
  initialDocuments: any[]
  workers: Worker[]
  userRole: string
}

export default function DocumentsClient({ initialDocuments, workers, userRole }: DocumentsPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    worker_id: '',
    name: '',
    file_type: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: ''
  })

  const getStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { label: 'Sin vencimiento', color: 'bg-slate-50 text-slate-500 border-slate-100', icon: FileText }
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { label: 'Vencido', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: AlertCircle }
    if (diffDays <= 30) return { label: 'Por vencer', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: AlertTriangle }
    return { label: 'Vigente', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    try {
      let file_url = ''
      let file_path = ''

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${formData.worker_id}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('worker_documents')
          .upload(filePath, file)

        if (uploadError) {
          throw new Error(`Error subiendo archivo: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('worker_documents')
          .getPublicUrl(filePath)

        file_url = publicUrl
        file_path = filePath
      }

      const result = await addWorkerDocument({ ...formData, file_url, file_path })
      if (result?.success === false) {
        setErrorMsg(result.error || 'Error al registrar documento')
      } else {
        setShowForm(false)
        setFormData({ worker_id: '', name: '', file_type: '', issue_date: new Date().toISOString().split('T')[0], expiry_date: '' })
        setFile(null)
        router.refresh()
      }
    } catch (error: any) {
      setErrorMsg(error?.message || 'Error inesperado al registrar el documento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Documentos y Vencimientos</h1>
          <p className="text-slate-500 font-medium">Registro y control de documentos de trabajadores.</p>
        </div>
        {(userRole === 'admin' || userRole === 'company_admin') && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            <Plus size={20} />
            Nuevo Documento
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-50 shadow-xl animate-in fade-in slide-in-from-top-4">
          {errorMsg && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trabajador</label>
              <select required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
                value={formData.worker_id} onChange={e => setFormData({...formData, worker_id: e.target.value})}>
                <option value="">Seleccionar...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Documento</label>
              <input type="text" required placeholder="Ej. EMO 2026" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
              <select required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
                value={formData.file_type} onChange={e => setFormData({...formData, file_type: e.target.value})}>
                <option value="">Seleccionar...</option>
                <option value="emo">Examen Médico (EMO)</option>
                <option value="licencia">Licencia de Conducir</option>
                <option value="curso_seguridad">Curso de Seguridad</option>
                <option value="certificacion_minera">Certificación Minera</option>
                <option value="contrato">Contrato</option>
                <option value="dni">DNI</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vencimiento</label>
              <input type="date" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold outline-none focus:border-blue-600 text-slate-800"
                value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Archivo (Opcional)</label>
              <input type="file" accept=".pdf,image/*" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-2.5 font-bold outline-none focus:border-blue-600 text-slate-800 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <button type="submit" disabled={saving} className="bg-slate-900 text-white p-3.5 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trabajador</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {initialDocuments.map((doc) => {
              const status = getStatus(doc.expiry_date)
              const Icon = status.icon
              return (
                <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5 font-bold text-slate-800">{doc.worker?.name}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" />
                      <span className="font-bold text-slate-700">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-slate-600 font-semibold capitalize">{doc.file_type?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-700">
                      {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString('es-PE') : '—'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${status.color}`}>
                      <Icon size={12} />
                      {status.label}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Ver documento adjunto">
                        <Download size={18} />
                      </a>
                    )}
                    {(userRole === 'admin' || userRole === 'company_admin') && (
                      <button onClick={() => deleteDocument(doc.id).then(() => router.refresh())} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar registro">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {initialDocuments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold">Sin documentos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
