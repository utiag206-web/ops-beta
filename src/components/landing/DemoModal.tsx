'use client'

import { useEffect, useState } from 'react'
import { X, MessageCircle, Mail, Building2, CheckCircle2, Send } from 'lucide-react'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const whatsappMessage = encodeURIComponent(
    `Hola, me gustaría solicitar una demostración personalizada de INTHALY OPS para mi empresa.`
  )
  const whatsappUrl = `https://wa.me/51999999999?text=${whatsappMessage}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              Solicitud Recibida
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Gracias por tu interés en INTHALY OPS. Nuestro equipo corporativo se pondrá en contacto contigo a la brevedad.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setSubmitted(false)
                  onClose()
                }}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Demostración Ejecutiva
              </span>
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              Agenda una sesión técnica
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Conoce en vivo cómo INTHALY OPS centraliza las operaciones de tu empresa.
            </p>

            {/* Acceso Rápido vía WhatsApp */}
            <div className="mt-6 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      Respuesta Inmediata vía WhatsApp
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Conversa directamente con un asesor técnico.
                    </p>
                  </div>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  Abrir Chat
                </a>
              </div>
            </div>

            <div className="relative my-6 flex items-center justify-center">
              <hr className="w-full border-slate-200" />
              <span className="absolute bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                o completa tus datos
              </span>
            </div>

            {/* Formulario Express */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Carlos Mendoza"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa / Razón Social
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Corporación Industrial SAC"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+51 999 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico Corporativo
                </label>
                <input
                  type="email"
                  required
                  placeholder="carlos@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
                Enviar Solicitud
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
