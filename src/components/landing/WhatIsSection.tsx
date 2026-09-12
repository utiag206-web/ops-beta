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
} from 'lucide-react'

const ARCHITECTURE_PILLARS = [
  {
    icon: Cloud,
    label: 'Arquitectura en la Nube',
    desc: 'Acceso seguro y centralizado para directivos, sedes y frentes de trabajo.',
  },
  {
    icon: Layers,
    label: 'Trazabilidad Continua',
    desc: 'Kardex, cuadrillas operativas y flota vehicular conectadas al instante.',
  },
  {
    icon: Smartphone,
    label: 'Autoservicio para Personal',
    desc: 'Portal móvil accesible para consulta de asistencia, boletas y firmas.',
  },
  {
    icon: ShieldCheck,
    label: 'Seguridad y Control de Roles',
    desc: 'Gestión con permisos granulares y auditoría de acciones operativas.',
  },
]

const STRATEGIC_PILLARS = [
  {
    icon: Users,
    tag: 'Gestión de Talento & Campo',
    title: 'Personal, Asistencia y Tareo',
    description:
      'Control diario de asistencia en campo, gestión de cuadrillas, turnos rotativos, legajos normativos y Portal del Trabajador para consultas y firmas desde cualquier celular.',
    highlights: [
      'Tareo operativo y cuadrillas en terreno',
      'Portal del trabajador con acceso seguro',
      'Control de contratos, EPPs y licencias',
    ],
  },
  {
    icon: Package,
    tag: 'Abastecimiento & Movilidad',
    title: 'Inventario Kardex y Transporte',
    description:
      'Control continuo de existencias, almacenes múltiples, trazabilidad Kardex en tiempo real, programación de rutas de transporte y asignación de unidades para traslados de personal.',
    highlights: [
      'Kardex continuo automatizado',
      'Alertas preventivas de stock mínimo',
      'Logística de viajes y despacho de flota',
    ],
  },
  {
    icon: Factory,
    tag: 'Producción & Finanzas',
    title: 'Operaciones, Mantenimiento y Caja Chica',
    description:
      'Supervisión del ciclo operativo y planta, plan preventivo de mecánica y maquinaria pesada, rendición de caja chica y generación masiva de reportes ejecutivos en Excel y PDF.',
    highlights: [
      'Control de planta y pesaje en balanza',
      'Mantenimiento vehicular y maquinaria',
      'Caja chica y exportaciones avanzadas',
    ],
  },
]

export function WhatIsSection() {
  return (
    <section id="que-es" className="relative py-20 md:py-28 bg-white border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* FUNCTIONAL ARCHITECTURE PILLARS STRIP */}
        <div className="mb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 sm:p-8 rounded-3xl border border-slate-200/80 bg-slate-50/70 backdrop-blur-xs">
          {ARCHITECTURE_PILLARS.map((m, idx) => (
            <div key={idx} className="flex flex-col text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3.5 border border-blue-100/70 shadow-2xs">
                <m.icon className="h-5 w-5" />
              </div>
              <span className="text-base font-bold text-slate-900">
                {m.label}
              </span>
              <span className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {m.desc}
              </span>
            </div>
          ))}
        </div>

        {/* SECTION HEADER */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Arquitectura Empresarial</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            ¿Qué es INTHALY OPS?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Una plataforma integral diseñada para resolver la desconexión operativa entre el campo, el almacén y la gerencia mediante tres pilares fundamentales.
          </p>
        </div>

        {/* THREE STRATEGIC PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STRATEGIC_PILLARS.map((pillar, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-9 shadow-xs transition-all duration-300 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-600/10 hover:-translate-y-1.5"
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-transform duration-300 group-hover:scale-105">
                    <pillar.icon className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                    {pillar.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors">
                  {pillar.title}
                </h3>

                <p className="text-slate-600 leading-relaxed text-sm mb-6">
                  {pillar.description}
                </p>

                {/* Highlights List */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  {pillar.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Subtle Link */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Pilar Operativo Conectado</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
