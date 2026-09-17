'use client'

import {
  Users,
  Package,
  Factory,
  CheckCircle2,
  ShieldCheck,
  Cloud,
  Smartphone,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react'

const STRATEGIC_PILLARS = [
  {
    icon: Users,
    tag: 'Talento & Terreno',
    title: 'Personal, Asistencia y Tareo',
    description:
      'Control diario de asistencia en campo, turnos rotativos, legajos normativos y Portal del Trabajador para autoservicio y firmas desde cualquier móvil.',
    tags: ['Tareo en vivo', 'Portal Móvil DNI/PIN', 'Legajos & EPP'],
    accentColor: 'from-blue-600 to-indigo-600',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-100',
    iconBg: 'bg-blue-600',
  },
  {
    icon: Package,
    tag: 'Abastecimiento & Flota',
    title: 'Inventario Kardex y Transporte',
    description:
      'Control continuo de existencias multialmacén, trazabilidad Kardex al instante, alertas de stock mínimo y programación de rutas para traslado de personal.',
    tags: ['Kardex continuo', 'Stock preventivo', 'Logística de flota'],
    accentColor: 'from-emerald-600 to-teal-600',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    iconBg: 'bg-emerald-600',
  },
  {
    icon: Factory,
    tag: 'Producción & Finanzas',
    title: 'Operaciones, Planta y Caja Chica',
    description:
      'Ciclo metalúrgico con pesaje en balanza digital, mantenimiento preventivo de maquinaria pesada, rendición de caja chica y exportaciones ejecutivas.',
    tags: ['Pesaje en balanza', 'Checklist mecánico', 'Caja chica auditada'],
    accentColor: 'from-purple-600 to-slate-900',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-100',
    iconBg: 'bg-slate-900',
  },
]

const ASSURANCES = [
  { icon: Cloud, label: '100% Nube & Móvil', desc: 'Acceso seguro desde cualquier sede o frente' },
  { icon: Layers, label: 'Trazabilidad en Vivo', desc: 'Kardex, tareo y despachos sincronizados' },
  { icon: ShieldCheck, label: 'Seguridad y Roles RLS', desc: 'Control granular de accesos y auditoría' },
  { icon: FileSpreadsheet, label: 'Reportes Excel & PDF', desc: 'Descarga consolidada para gerencia' },
]

export function WhatIsSection() {
  return (
    <section id="que-es" className="relative py-10 sm:py-12 lg:py-14 bg-white border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER - PANORAMIC & EXECUTIVE */}
        <div className="mx-auto max-w-3xl text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Arquitectura Operativa Unificada</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight text-slate-900">
            ¿Qué es INTHALY OPS?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Una plataforma integral que conecta cuadrillas en campo, almacenes y gerencia en un solo panorama, eliminando la dispersión de planillas Excel.
          </p>
        </div>

        {/* THREE STRATEGIC PILLARS - CLEAN HORIZONTAL EXECUTIVE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10">
          {STRATEGIC_PILLARS.map((pillar, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-300 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/5 hover:-translate-y-1"
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${pillar.iconBg} text-white shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${pillar.badgeColor}`}>
                    {pillar.tag}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
                  {pillar.title}
                </h3>

                <p className="text-slate-600 leading-relaxed text-xs mb-4">
                  {pillar.description}
                </p>

                {/* Micro tags */}
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                  {pillar.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Subtle Link */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-600 group-hover:text-blue-700">
                <span>Pilar Operativo Conectado</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>

        {/* INTEGRATED PANORAMIC ASSURANCE STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 backdrop-blur-xs">
          {ASSURANCES.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">{item.label}</h4>
                <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
