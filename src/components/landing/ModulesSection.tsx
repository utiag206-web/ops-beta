'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CalendarCheck,
  Package,
  Coins,
  FileText,
  Truck,
  MapPin,
  Wrench,
  Factory,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react'

interface ModuleItem {
  id: string
  name: string
  category: 'talento' | 'logistica' | 'operaciones' | 'finanzas'
  description: string
  icon: any
  tag: string
  status: string
  capabilities: string[]
}

const CATEGORIES = [
  { id: 'all', label: 'Todos los Módulos' },
  { id: 'talento', label: 'Talento & Tareo' },
  { id: 'logistica', label: 'Logística & Flota' },
  { id: 'operaciones', label: 'Operaciones & Planta' },
  { id: 'finanzas', label: 'Finanzas & Reportes' },
]

const MODULES: ModuleItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard Operativo',
    category: 'operaciones',
    description: 'Vista analítica centralizada con métricas operativas consolidadas en tiempo real.',
    icon: LayoutDashboard,
    tag: 'Control Central',
    status: 'Tiempo Real',
    capabilities: ['KPIs de asistencia', 'Monitoreo de liquidez'],
  },
  {
    id: 'trabajadores',
    name: 'Gestión de Trabajadores',
    category: 'talento',
    description: 'Fichas integrales de personal, contratos laborales, legajos y asignación de puestos.',
    icon: Users,
    tag: 'Talento Humano',
    status: 'Normativa',
    capabilities: ['Legajos y contratos', 'Cuadrillas de campo'],
  },
  {
    id: 'portal',
    name: 'Portal del Trabajador',
    category: 'talento',
    description: 'Autoservicio móvil seguro donde cada trabajador consulta boletas, asistencia y firma.',
    icon: UserCircle,
    tag: 'Autoservicio Móvil',
    status: 'Disponible 24/7',
    capabilities: ['Ingreso DNI + PIN', 'Boletas digitales'],
  },
  {
    id: 'tareo',
    name: 'Asistencia y Tareo',
    category: 'talento',
    description: 'Registro de asistencia diaria en terreno, validación de cuadrillas y turnos.',
    icon: CalendarCheck,
    tag: 'Operación Terreno',
    status: 'Sincronizado',
    capabilities: ['Tareo por frentes', 'Sobretiempos'],
  },
  {
    id: 'inventario',
    name: 'Inventario y Almacenes',
    category: 'logistica',
    description: 'Control de stock multialmacén, catálogo de insumos y trazabilidad Kardex continua.',
    icon: Package,
    tag: 'Suministros',
    status: 'Kardex Activo',
    capabilities: ['Movimientos E/S', 'Stock crítico'],
  },
  {
    id: 'transporte',
    name: 'Logística y Transporte',
    category: 'logistica',
    description: 'Programación de traslados de personal, hojas de ruta y capacidad por unidad.',
    icon: Truck,
    tag: 'Flota y Rutas',
    status: 'En Ruta',
    capabilities: ['Hojas de traslado', 'Lista de pasajeros'],
  },
  {
    id: 'gps',
    name: 'Geolocalización y GPS',
    category: 'logistica',
    description: 'Supervisión geo-referencial de vehículos y control de puntos críticos en ruta.',
    icon: MapPin,
    tag: 'Seguimiento',
    status: 'Geocercas',
    capabilities: ['Rastreo de flota', 'Puntos de control'],
  },
  {
    id: 'planta',
    name: 'Control de Planta',
    category: 'operaciones',
    description: 'Pesaje en balanza digital electrónica, acopio de mineral y despacho de producción.',
    icon: Factory,
    tag: 'Ciclo Productivo',
    status: 'Alta Precisión',
    capabilities: ['Pesaje en balanza', 'Trazabilidad molienda'],
  },
  {
    id: 'mecanica',
    name: 'Mecánica y Activos',
    category: 'operaciones',
    description: 'Mantenimiento preventivo vehicular, maquinaria pesada y checklists pre-operacionales.',
    icon: Wrench,
    tag: 'Maquinaria',
    status: 'Preventivo',
    capabilities: ['Horómetros y Km', 'Checklist pre-uso'],
  },
  {
    id: 'finanzas',
    name: 'Caja Chica y Finanzas',
    category: 'finanzas',
    description: 'Control de egresos diarios, rendición de comprobantes en campo y saldos ágiles.',
    icon: Coins,
    tag: 'Tesorería',
    status: 'Auditado',
    capabilities: ['Rendición de comprobantes', 'Saldos al instante'],
  },
  {
    id: 'documentos',
    name: 'Gestión Documental',
    category: 'finanzas',
    description: 'Repositorio normativo de actas de EPP, charlas de seguridad y certificados.',
    icon: FileText,
    tag: 'Legal & SST',
    status: 'Cero Papel',
    capabilities: ['Firmas digitales', 'Vencimientos automáticos'],
  },
  {
    id: 'exportaciones',
    name: 'Centro de Exportaciones',
    category: 'finanzas',
    description: 'Generación consolidada de informes gerenciales en formatos oficiales Excel y PDF.',
    icon: FileSpreadsheet,
    tag: 'Reportabilidad',
    status: 'Excel & PDF',
    capabilities: ['Descarga en 1 clic', 'Informes gerenciales'],
  },
]

export function ModulesSection() {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredModules =
    activeCategory === 'all'
      ? MODULES
      : MODULES.filter((m) => m.category === activeCategory)

  return (
    <section id="modulos" className="relative py-10 sm:py-12 lg:py-14 bg-slate-50/60 border-t border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="mx-auto max-w-3xl text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Suite Operativa Completa</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight text-slate-900">
            Módulos del Sistema
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Cada área de tu organización interconectada mediante herramientas ágiles diseñadas para el rigor del sector empresarial.
          </p>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* MODULES GRID - STREAMLINED EXECUTIVE SAAS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {filteredModules.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:shadow-blue-600/5 hover:-translate-y-0.5"
            >
              <div>
                {/* Card Top: Icon & Tag */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200/60">
                    {item.tag}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 mb-1 tracking-tight group-hover:text-blue-600 transition-colors leading-snug">
                  {item.name}
                </h3>

                {/* Description (Uniform 2 lines) */}
                <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5 line-clamp-2">
                  {item.description}
                </p>

                {/* Capabilities as Compact Micro-Pills */}
                <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                  {item.capabilities.map((cap, cIdx) => (
                    <span
                      key={cIdx}
                      className="text-[9.5px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/50"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Status Pill */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {item.status}
                </span>
                <span className="text-slate-400 group-hover:text-blue-600 font-bold transition-colors">
                  Activo →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
