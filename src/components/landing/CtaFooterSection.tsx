'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Mail,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react'

interface CtaFooterSectionProps {
  onOpenDemo: () => void
  commercialWhatsApp?: string
}

export function CtaFooterSection({ onOpenDemo, commercialWhatsApp = '51923207309' }: CtaFooterSectionProps) {
  const currentYear = new Date().getFullYear()

  const cleanWa = (commercialWhatsApp || '51923207309').replace(/\D/g, '')
  const whatsappMessage = encodeURIComponent(
    'Hola, me gustaría solicitar una demostración de INTHALY OPS para mi empresa.'
  )
  const whatsappUrl = `https://wa.me/${cleanWa}?text=${whatsappMessage}`

  return (
    <div className="bg-slate-950 text-white">
      {/* ========================================================================= */}
      {/* 1. CTA SECTION (Único botón y micro-copy de confianza) */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden py-10 sm:py-14 lg:py-16 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800">
        {/* Subtle dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md mb-5 shadow-xs">
            <ShieldCheck className="h-4 w-4 text-blue-200" />
            <span>Consolidación y Rigor para Empresas</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-black tracking-tight text-white leading-[1.15]">
            Lleva la gestión operativa de tu empresa{' '}
            <span className="text-blue-200 underline decoration-blue-300/40">
              al siguiente nivel.
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
            Centraliza trabajadores, operaciones, flota, inventario y finanzas en una suite conectada. Diseñada para la alta exigencia de las organizaciones modernas.
          </p>

          {/* ÚNICO BOTÓN DE ACCIÓN */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-blue-700 shadow-xl shadow-blue-950/30 transition-all duration-200 hover:bg-blue-50 hover:scale-102 active:scale-100 cursor-pointer"
            >
              <span>Solicitar una demostración</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* TEXTO DE CONFIANZA */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-blue-100">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Sesión técnica personalizada
            </span>
            <span className="hidden sm:inline text-blue-300/60">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Sin compromiso de contratación
            </span>
            <span className="hidden sm:inline text-blue-300/60">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Respuesta en menos de 24 horas
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FOOTER CORPORATIVO PREMIUM DE ALTO CONTRASTE */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-800/90 bg-slate-950 pt-10 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-8">
            {/* Columna 1: Brand e Identidad (5 cols) */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-blue-600 shadow-md">
                  <Image
                    src="/logo-ops.png"
                    alt="INTHALY OPS Logo"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight text-white leading-tight">
                    INTHALY <span className="text-blue-500">OPS</span>
                  </span>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Sistema de Gestión Empresarial
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-4">
                Software de gestión y control operativo para empresas. Centralización continua de personal, inventario, logística y operaciones.
              </p>

              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-0.5 text-[11px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sistemas 100% Operacionales en la Nube</span>
              </div>
            </div>

            {/* Columna 2: Módulos Principales (3 cols) */}
            <div className="lg:col-span-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Módulos del Sistema
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#modulos" className="hover:text-blue-400 transition-colors">
                    Dashboard Operativo
                  </a>
                </li>
                <li>
                  <a href="#modulos" className="hover:text-blue-400 transition-colors">
                    Personal & Tareo Diario
                  </a>
                </li>
                <li>
                  <a href="#modulos" className="hover:text-blue-400 transition-colors">
                    Portal Móvil del Trabajador
                  </a>
                </li>
                <li>
                  <a href="#modulos" className="hover:text-blue-400 transition-colors">
                    Inventario & Kardex Continuo
                  </a>
                </li>
                <li>
                  <a href="#modulos" className="hover:text-blue-400 transition-colors">
                    Transporte & Rutas de Personal
                  </a>
                </li>
                <li>
                  <a href="#modulos" className="hover:text-blue-400 transition-colors">
                    Control de Planta & Balanza
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 3: Contacto Directo & Clientes (4 cols) */}
            <div className="lg:col-span-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Atención Comercial
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                ¿Deseas una propuesta formal o agendar una llamada técnica con nuestros asesores?
              </p>

              <div className="space-y-2.5">
                <a
                  href="mailto:contacto@inthaly.com"
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-200 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Correo Oficial</span>
                    <span className="font-semibold text-white">contacto@inthaly.com</span>
                  </div>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-200 transition-all hover:border-emerald-700/50 hover:bg-slate-800 hover:text-white"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Atención Rápida</span>
                    <span className="font-semibold text-emerald-400">WhatsApp Comercial Directo</span>
                  </div>
                </a>

                {/* Acceso Clientes */}
                <div className="pt-1.5">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>Acceder a la plataforma de tu empresa</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar con Copyright */}
          <div className="pt-6 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© {currentYear} INTHALY OPS. Todos los derechos reservados.</p>
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-blue-400" />
                Cifrado SSL de extremo a extremo
              </span>
              <span>Protección de Datos Empresariales</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
