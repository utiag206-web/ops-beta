'use client'

import { useEffect, useState } from 'react'
import {
  X,
  MessageCircle,
  Mail,
  Building2,
  CheckCircle2,
  Send,
  Loader2,
  Phone,
  Briefcase,
  Users,
  FileText,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'
import { submitDemoRequest } from '@/app/(marketing)/actions'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
  commercialWhatsApp?: string
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

export function DemoModal({ isOpen, onClose, commercialWhatsApp = '51923207309' }: DemoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successInfo, setSuccessInfo] = useState<{ companyName: string; contactName: string } | null>(null)

  const [formData, setFormData] = useState({
    contactName: '',
    email: '',
    phone: '',
    companyName: '',
    taxId: '',
    industry: 'Minería y Metalurgia',
    contactPosition: '',
    estimatedWorkers: '16 a 50 trabajadores',
    message: '',
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await submitDemoRequest(formData)
      if (res.success) {
        setSuccessInfo({
          companyName: formData.companyName,
          contactName: formData.contactName,
        })
        setSubmitted(true)
      } else {
        setErrorMessage(res.error || 'No se pudo procesar la solicitud.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión. Inténtalo nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cleanWa = (commercialWhatsApp || '51923207309').replace(/\D/g, '')
  const whatsappMessage = encodeURIComponent(
    `Hola, me gustaría solicitar una demostración de INTHALY OPS para la empresa ${formData.companyName || '[Nombre Empresa]'}.`
  )
  const whatsappUrl = `https://wa.me/${cleanWa}?text=${whatsappMessage}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative my-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer z-10"
          aria-label="Cerrar modal"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-4 sm:py-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100 shadow-sm">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Solicitud Registrada • Estado: PENDIENTE
            </span>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              ¡Gracias por tu interés, {successInfo?.contactName || 'estimado cliente'}!
            </h3>

            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Hemos registrado la solicitud de demostración para <strong className="text-slate-900">{successInfo?.companyName}</strong>. 
              Nuestro equipo corporativo revisará los datos para habilitar tu acceso guiado.
            </p>

            <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Protocolo de Activación Segura:</span>
              </div>
              <p className="text-slate-600">
                1. Validación de datos de la empresa por el Área Corporativa de INTHALY OPS.
              </p>
              <p className="text-slate-600">
                2. Recepción de correo con enlace seguro para configurar tus credenciales (sin contraseñas en texto plano).
              </p>
              <p className="text-slate-600">
                3. Activación y sesión guiada en la plataforma.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Contactar por WhatsApp ahora</span>
              </a>

              <button
                onClick={() => {
                  setSubmitted(false)
                  onClose()
                }}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1.5">
                <Building2 className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Solicitud de Demostración Corporativa
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Conoce INTHALY OPS en vivo
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Completa los datos de tu empresa para coordinar una presentación técnica y evaluar la suite en tu operación.
              </p>
            </div>

            {/* Acceso Rápido vía WhatsApp */}
            <div className="mb-4 p-3 sm:p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    ¿Prefieres atención inmediata?
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    Escríbenos directamente a nuestra línea corporativa.
                  </p>
                </div>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
              >
                WhatsApp Directo
              </a>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Formulario Completo de Solicitud */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nombre Completo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ing. Carlos Mendoza"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    Cargo en la Empresa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Jefe de Operaciones / Gerente"
                    value={formData.contactPosition}
                    onChange={(e) => setFormData({ ...formData, contactPosition: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Correo Electrónico */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    Correo Corporativo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@tuempresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Teléfono / WhatsApp */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    Teléfono / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. +51 987 654 321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nombre de la Empresa */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    Nombre de la Empresa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Minera o Constructora SAC"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* RUC */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    RUC / Identificación Fiscal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="20XXXXXXXXX (11 dígitos)"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Rubro / Sector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    Rubro / Sector Operativo
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad Aproximada de Trabajadores */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                    Personal Aproximado
                  </label>
                  <select
                    value={formData.estimatedWorkers}
                    onChange={(e) => setFormData({ ...formData, estimatedWorkers: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                  >
                    {WORKER_RANGES.map((rng) => (
                      <option key={rng} value={rng}>
                        {rng}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mensaje Opcional */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Requerimientos específicos o mensaje (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe brevemente tus prioridades (ej. control de tareo en campo, inventario Kardex, transporte...)"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                />
              </div>

              {/* Botón de Envío */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Registrando solicitud...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Solicitud de Demostración</span>
                      <Send className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
