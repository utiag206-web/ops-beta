'use client'

import { useState } from 'react'
import { FileText, Upload, Trash2, Download, Plus, Loader2, File, CheckCircle2 } from 'lucide-react'
import { uploadWorkerDocument, deleteWorkerDocument } from '@/app/(dashboard)/workers/actions'

type Document = {
  id: string
  name: string
  file_type: string
  file_url: string
  file_path: string
  size: number
  created_at: string
}

export function WorkerDocuments({ 
  workerId, 
  initialDocuments,
  canManage = false
}: { 
  workerId: string, 
  initialDocuments: Document[],
  canManage?: boolean
}) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append('worker_id', workerId)

      const result = await uploadWorkerDocument(formData)

      if (result.success) {
        window.location.reload()
      } else {
        alert(result.error)
        setIsUploading(false)
      }
    } catch (err: any) {
      console.error('Client Upload Error:', err)
      alert('Error de red o del servidor: ' + err.message)
      setIsUploading(false)
    }
  }

  const handleDelete = async (docId: string, filePath: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return

    setIsDeleting(docId)
    const result = await deleteWorkerDocument(docId, workerId, filePath)

    if (result.success) {
      setDocuments(docs => docs.filter(d => d.id !== docId))
    } else {
      alert(result.error)
    }
    setIsDeleting(null)
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" size={20} />
          <h3 className="text-lg font-bold text-slate-800">Documentos Digitales</h3>
        </div>
        {canManage && (
          <button 
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="text-sm flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors font-medium"
          >
            {showUploadForm ? 'Cancelar' : <><Plus size={16} /> Subir Documento</>}
          </button>
        )}
      </div>

      {showUploadForm && (
        <div className="p-6 bg-slate-50 border-b border-slate-100 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nombre del Archivo</label>
              <input 
                name="name" 
                required 
                placeholder="Ej: Contrato 2024"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Categoría</label>
              <select 
                name="file_type" 
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm appearance-none text-slate-900"
              >
                <option value="dni">DNI / Identificación</option>
                <option value="contrato">Contrato</option>
                <option value="certificado">Certificado Médico / Capacitación</option>
                <option value="licencia">Licencia de Conducir / Especial</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Archivo</label>
              <div className="flex gap-2">
                <input 
                  name="file" 
                  type="file" 
                  required 
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="p-0">
        {documents.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <File size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{doc.name}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        {doc.file_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatSize(doc.size)} • {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a 
                    href={doc.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Descargar / Ver"
                  >
                    <Download size={18} />
                  </a>
                  {canManage && (
                    <button 
                      onClick={() => handleDelete(doc.id, doc.file_path)}
                      disabled={isDeleting === doc.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      {isDeleting === doc.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <FileText className="text-slate-300" size={32} />
            </div>
            <p className="font-medium text-slate-700">Sin documentos en InthalyOps</p>
            <p className="text-xs mt-1">Sube el DNI, contratos o certificados del trabajador.</p>
          </div>
        )}
      </div>
      
      <div className="bg-slate-50 p-4 border-t border-slate-100">
        <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-blue-100">
          <CheckCircle2 className="text-blue-500 mt-0.5" size={16} />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Todos los documentos son almacenados de forma segura en **Supabase Storage** y solo son accesibles por personal autorizado de tu empresa.
          </p>
        </div>
      </div>
    </div>
  )
}
