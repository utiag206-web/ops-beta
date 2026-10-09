'use client'

import { useState } from 'react'
import { 
  Building2, Plus, X, User, Mail, Lock, 
  Shield, CheckCircle2, Loader2, Copy, Phone,
  Briefcase, Users, FileText, AlertCircle, Sparkles
} from 'lucide-react'
import { createCompany } from '@/app/(main)/super-admin/actions'
import { useRouter } from 'next/navigation'

interface CreateCompanyModalProps {
  isOpen: boolean
  onClose: () => void
}

const INDUSTRIES = [
  'Minería y Metalurgia',
  'Construcción e Infraestructura',
  'Transporte y Logística',
  'Manufactura e Industria',
  'Servicios Generales y Contratistas',
  'Agroindustria y Alimentos',
  'Seguridad y Vigilancia',
  'Otro Sector',
]

const WORKER_RANGES = [
  '1 a 15 trabajadores',
  '16 a 50 trabajadores',
  '51 a 200 trabajadores',
  'Más de 200 trabajadores',
]

export function CreateCompanyModal({ isOpen, onClose }: CreateCompanyModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    // 9 datos corporativos estándar (idénticos al formulario de demostración)
    adminName: '',
    contactPosition: '',
    adminEmail: '',
    phone: '',
    name: '',
    taxId: '',
    industry: 'Minería y Metalurgia',
    estimatedWorkers: '16 a 50 trabajadores',
    notes: '',
    // Opciones técnicas de creación
    adminPassword: '',
    is_test: false
  })

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError('Esta operación administrativa requiere conexión a Internet.')
      setLoading(false)
      return
    }

    if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError('Esta operación administrativa requiere conexión a Internet.')
      setLoading(false)
      return
    }

    if (formData.taxId && formData.taxId.length !== 11) {
      setError('El RUC debe contener exactamente 11 dígitos numéricos.')
      setLoading(false)
      return
    }

    try {
      const res = await createCompany({
        name: formData.name,
        taxId: formData.taxId,
        industry: formData.industry,
        phone: formData.phone,
        contactPosition: formData.contactPosition,
        estimatedWorkers: formData.estimatedWorkers,
        notes: formData.notes,
        adminEmail: formData.adminEmail,
        adminName: formData.adminName,
        adminPassword: formData.adminPassword || undefined,
        is_test: formData.is_test
      })

          if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError('Esta operación administrativa requiere conexión a Internet.')
      setLoading(false)
      return
    }

    if (res.error) {
        setError(res.error)
      } else {
        setSuccess(res)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al crear la empresa')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError('Esta operación administrativa requiere conexión a Internet.')
      setLoading(false)
      return
    }

    if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 sm:p-7 text-center animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-1">Â¡Empresa Creada!</h2>
          <p className="text-xs text-slate-500 mb-6">La infraestructura y base de datos han sido inicializadas correctamente.</p>
          
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2.5 border border-slate-200/80 mb-6 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Empresa / RUC</p>
              <p className="font-bold text-slate-900">{success.data.name} {formData.taxId ? `(RUC: ${formData.taxId})` : ''}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Administrador & Cargo</p>
              <p className="font-bold text-slate-900">{formData.adminName} {formData.contactPosition ? `(${formData.contactPosition})` : ''}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Email Corporativo</p>
              <p className="font-mono text-slate-700">{formData.adminEmail}</p>
            </div>
            {success.password && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Contraseña Temporal</p>
                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 mt-0.5">
                  <code className="font-mono font-bold text-slate-800 text-xs">{success.password}</code>
                  <button 
                    onClick={() => copyToClipboard(success.password)}
                    className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Copiar contraseña"
                  >
                    {copied ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-md cursor-pointer"
          >
            Cerrar y Continuar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-auto bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl text-white shadow-sm">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-none">Nueva Empresa</h2>
              <p className="text-slate-400 text-xs font-medium mt-1">
                Ficha corporativa completa y configuración de instancia
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4" autoComplete="off">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bloque: Los 9 Datos Corporativos Estándar */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
              <Sparkles size={14} className="text-blue-600" />
              <span>Datos Corporativos y de Contacto (Estándar Inthaly)</span>
            </div>

            {/* Fila 1: Contacto y Cargo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Nombre Completo *
                </label>
                <input 
                  required
                  type="text"
                  placeholder="Ej. Ing. Carlos Mendoza"
                  value={formData.adminName}
                  onChange={(e) => setFormData(prev => ({...prev, adminName: e.target.value}))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Cargo en la Empresa *
                </label>
                <input 
                  required
                  type="text"
                  placeholder="Ej. Jefe de Operaciones / Gerente"
                  value={formData.contactPosition}
                  onChange={(e) => setFormData(prev => ({...prev, contactPosition: e.target.value}))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Fila 2: Correo y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Correo Corporativo *
                </label>
                <input 
                  required
                  type="email"
                  placeholder="carlos@tuempresa.com"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData(prev => ({...prev, adminEmail: e.target.value}))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input 
                  required
                  type="tel"
                  placeholder="Ej. +51 987 654 321"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Fila 3: Empresa y RUC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Nombre de la Empresa *
                </label>
                <input 
                  required
                  type="text"
                  placeholder="Ej. Minera o Constructora SAC"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                  RUC / Identificación Fiscal *
                </label>
                <input 
                  required
                  type="text"
                  maxLength={11}
                  placeholder="20XXXXXXXXX (11 dígitos)"
                  value={formData.taxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value.replace(/\D/g, '') }))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
                />
              </div>
            </div>

            {/* Fila 4: Rubro y Personal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Rubro / Sector Operativo
                </label>
                <select 
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({...prev, industry: e.target.value}))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Personal Aproximado
                </label>
                <select 
                  value={formData.estimatedWorkers}
                  onChange={(e) => setFormData(prev => ({...prev, estimatedWorkers: e.target.value}))}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                >
                  {WORKER_RANGES.map(rng => (
                    <option key={rng} value={rng}>{rng}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fila 5: Requerimientos Específicos o Mensaje */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                Requerimientos específicos o mensaje (Opcional)
              </label>
              <textarea 
                rows={2}
                placeholder="Describe requerimientos u observaciones iniciales de la empresa..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
              />
            </div>
          </div>

          {/* Bloque: Parámetros Técnicos del Ecosistema */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                Contraseña Temporal de Acceso (Opcional)
              </label>
              <input 
                type="password"
                placeholder="Dejar vacío para auto-generar contraseña segura"
                value={formData.adminPassword}
                onChange={(e) => setFormData(prev => ({...prev, adminPassword: e.target.value}))}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200/70">
              <input 
                type="checkbox" 
                checked={formData.is_test}
                onChange={(e) => setFormData(prev => ({...prev, is_test: e.target.checked}))}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Marcar como Empresa de Prueba</span>
                <span className="text-[10px] text-slate-500">Habilita eliminación futura y marca como entorno demo</span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Inicializando Empresa...</span>
                </>
              ) : (
                <>
                  <Shield size={14} />
                  <span>Crear e Inicializar Empresa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

