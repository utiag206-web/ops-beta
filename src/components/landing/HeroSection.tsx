'use client'

import Image from 'next/image'
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
} from 'lucide-react'

interface HeroSectionProps {
  onOpenDemo: () => void
}

export function HeroSection({ onOpenDemo }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#06122e] via-[#091a42] to-[#0c235c] text-white pt-10 pb-20 sm:pt-14 sm:pb-28 lg:pt-16 lg:pb-36">
      {/* Dynamic Background Atmosphere (Instapage Deep Blue Lighting) */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[750px] w-[1300px] rounded-full bg-radial from-blue-500/25 via-indigo-600/15 to-transparent blur-3xl opacity-80"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/4 -right-40 h-[550px] w-[550px] rounded-full bg-cyan-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-3xl"
        aria-hidden="true"
      />

      {/* Subtle High-Tech Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* LADO IZQUIERDO: COPY & CTAS (ALTO IMPACTO Y CONTRASTE INSTAPAGE) */}
          <div className="flex flex-col items-center text-center lg:col-span-5 lg:items-start lg:text-left z-10">
            {/* Tech Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-1.5 text-xs font-bold text-blue-200 mb-6 shadow-lg shadow-blue-950/40 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Plataforma SaaS de Gestión Operativa Integral</span>
            </div>

            {/* Título Principal de Alto Contraste */}
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08]">
              Controla toda tu operación{' '}
              <span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
                desde un solo lugar.
              </span>
            </h1>

            {/* Texto Descriptivo */}
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-blue-100/90 font-normal max-w-xl">
              Centraliza trabajadores, operaciones en terreno, inventario Kardex,
              transporte, documentos y finanzas en una sola suite conectada.
              Diseñada específicamente para la exigencia del sector empresarial.
            </p>

            {/* Botón de Acción Principal Único */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button
                onClick={onOpenDemo}
                className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/35 transition-all duration-200 hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-blue-400/30"
              >
                <span>Solicitar demostración</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Micro-items de Confianza Verificables */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-semibold text-blue-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>Despliegue 100% en la nube</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>Portal móvil para personal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>Demostración guiada</span>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: MOCKUP DEL SOFTWARE (LAPTOP/MONITOR REFINADO CON PROFUNDIDAD ELEGANTE) */}
          <div className="relative mx-auto w-full max-w-2xl lg:col-span-7 lg:max-w-none pt-6 sm:pt-10 lg:pt-0">
            {/* Ambient Multi-layered Glow */}
            <div
              className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-blue-500/30 via-cyan-400/20 to-indigo-500/25 blur-3xl opacity-80 transition-all duration-700 pointer-events-none"
              aria-hidden="true"
            />

            {/* PERSPECTIVE WRAPPER (CALIBRADO PARA EFECTO 3D ISOMÉTRICO 'DE COSTADO') */}
            <div className="relative [perspective:1300px]">
              {/* TARJETA FLOTANTE 1: CONTROL OPERATIVO (DISCRETA Y SIN MÉTRICAS CONFUSAS) */}
              <div className="absolute -top-5 -right-2 sm:-top-7 sm:-right-4 z-20 hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3 text-slate-800 shadow-xl shadow-blue-950/40 backdrop-blur-md transition-all duration-300 hover:scale-102">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 tracking-tight">Control Operativo</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="block text-[11px] font-semibold text-slate-500">
                    ORGANIZACIÓN DEMO
                  </span>
                </div>
              </div>

              {/* TARJETA FLOTANTE 2: TRAZABILIDAD DE INFORMACIÓN (DISCRETA Y CONCEPTUAL) */}
              <div className="absolute -bottom-5 -left-2 sm:-bottom-7 sm:-left-4 z-20 hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3 text-slate-800 shadow-xl shadow-blue-950/40 backdrop-blur-md transition-all duration-300 hover:scale-102">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-900 tracking-tight">
                    Trazabilidad de Información
                  </span>
                  <span className="block text-[11px] font-medium text-slate-500">
                    Personal • Operaciones • Logística
                  </span>
                </div>
              </div>

              {/* MARCO DEL SOFTWARE: 3D ISOMÉTRICO 'DE COSTADO' CON PROFUNDIDAD Y SOMBRA REALISTA */}
              <div className="hero-mockup-isometric group/mockup relative rounded-2xl sm:rounded-3xl border border-blue-400/25 bg-slate-900/85 p-2 sm:p-3 shadow-[0_35px_100px_-20px_rgba(2,6,23,0.95)] backdrop-blur-md">
                {/* Bezel Outer Ring */}
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl">
                  {/* Browser / Application Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3">
                    {/* Traffic Lights */}
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-400/80" />
                      <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                    </div>

                    {/* URL Bar */}
                    <div className="flex items-center gap-2 rounded-lg bg-slate-950/80 px-4 py-1 text-xs font-medium text-slate-300 border border-slate-700/80 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold text-white">inthaly-ops.com</span>
                      <span className="text-slate-400">/ dashboard</span>
                    </div>

                    {/* Right Status Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                      <span className="hidden sm:inline">Conexión Segura</span>
                    </div>
                  </div>

                  {/* Screen Image with Specular Light Overlay */}
                  <div className="relative aspect-[16/9.5] w-full overflow-hidden bg-slate-950">
                    <Image
                      src="/images/screens/hero-dashboard.png"
                      alt="INTHALY OPS - Dashboard de Gestión Operativa Empresarial"
                      width={2400}
                      height={1425}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover/mockup:scale-[1.005]"
                      priority
                    />

                    {/* Specular Diagonal Glass Reflection */}
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/12 opacity-40"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
