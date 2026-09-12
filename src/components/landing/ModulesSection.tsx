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
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
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
    description: 'Vista ejecutiva y analítica centralizada con métricas operativas consolidadas en tiempo real.',
    icon: LayoutDashboard,
    tag: 'Control Central',
    status: 'Tiempo Real',
    capabilities: ['KPIs de asistencia diaria', 'Monitoreo de incidencias', 'Control de liquidez'],
  },
  {
    id: 'trabajadores',
    name: 'Gestión de Trabajadores',
    category: 'talento',
    description: 'Fichas integrales de personal, contratos laborales, legajos digitales y asignación de puestos.',
    icon: Users,
    tag: 'Talento Humano',
    status: 'Normativa Laboral',
    capabilities: ['Legajos y contratos', 'Asignación por cuadrilla', 'Historial laboral unificado'],
  },
  {
    id: 'portal',
    name: 'Portal del Trabajador',
    category: 'talento',
    description: 'Autoservicio móvil seguro donde cada trabajador consulta boletas, asistencia y realiza solicitudes.',
    icon: UserCircle,
    tag: 'Autoservicio Móvil',
    status: 'Disponible 24/7',
    capabilities: ['Ingreso con DNI y PIN', 'Consulta de asistencia', 'Recepción de boletas'],
  },
  {
    id: 'tareo',
    name: 'Control de Asistencia y Tareo',
    category: 'talento',
    description: 'Registro de asistencia diaria en terreno, validación de cuadrillas y turnos de operación continua.',
    icon: CalendarCheck,
    tag: 'Operaciones de Campo',
    status: 'Sincronizado',
    capabilities: ['Tareo por turnos y frentes', 'Cálculo de sobretiempos', 'Reportes de asistencia'],
  },
  {
    id: 'inventario',
    name: 'Inventario y Almacenes',
    category: 'logistica',
    description: 'Control de stock por almacén, catálogo estructurado de insumos y trazabilidad Kardex continua.',
    icon: Package,
    tag: 'Cadena de Suministro',
    status: 'Kardex Activo',
    capabilities: ['Movimientos de entrada/salida', 'Alertas de stock crítico', 'Trazabilidad por lote'],
  },
  {
    id: 'transporte',
    name: 'Logística y Transporte',
    category: 'logistica',
    description: 'Programación de traslados de personal, hojas de ruta y control de capacidad por unidad.',
    icon: Truck,
    tag: 'Flota y Movilidad',
    status: 'En Ruta',
    capabilities: ['Hojas de ruta para traslados', 'Asignación de choferes', 'Lista de pasajeros'],
  },
  {
    id: 'gps',
    name: 'Geolocalización y GPS',
    category: 'logistica',
    description: 'Supervisión geo-referencial de vehículos y control de puntos críticos en terreno.',
    icon: MapPin,
    tag: 'Seguimiento Terrestre',
    status: 'Geocercas',
    capabilities: ['Rastreo de unidades', 'Puntos de control', 'Monitoreo de velocidades'],
  },
  {
    id: 'planta',
    name: 'Control de Planta y Producción',
    category: 'operaciones',
    description: 'Registro metalúrgico, pesaje de balanza, stock de mineral y despacho de producción.',
    icon: Factory,
    tag: 'Ciclo Productivo',
    status: 'Alta Precisión',
    capabilities: ['Pesaje en balanza digital', 'Trazabilidad de molienda', 'Control de despachos'],
  },
  {
    id: 'mecanica',
    name: 'Mecánica y Mantenimiento',
    category: 'operaciones',
    description: 'Mantenimiento preventivo de camionetas, volquetes, compresoras y generadores con checklists.',
    icon: Wrench,
    tag: 'Activos y Maquinaria',
    status: 'Preventivo',
    capabilities: ['Checklists pre-operacionales', 'Horómetros y kilometraje', 'Control de repuestos'],
  },
  {
    id: 'finanzas',
    name: 'Caja Chica y Finanzas',
    category: 'finanzas',
    description: 'Control de egresos diarios, rendición de gastos en campo y seguimiento presupuestario ágil.',
    icon: Coins,
    tag: 'Tesorería de Campo',
    status: 'Auditoría Continua',
    capabilities: ['Rendición de comprobantes', 'Saldos de caja en tiempo real', 'Aprobaciones de gasto'],
  },
  {
    id: 'documentos',
    name: 'Gestión Documental',
    category: 'finanzas',
    description: 'Repositorio normativo de contratos, entrega de EPPs, charlas de seguridad y certificados legales.',
    icon: FileText,
    tag: 'Cumplimiento Legal',
    status: 'Cero Papel',
    capabilities: ['Firmas digitales y actas', 'Vencimientos automáticos', 'Auditoría de seguridad'],
  },
  {
    id: 'exportaciones',
    name: 'Centro de Exportaciones',
    category: 'finanzas',
    description: 'Generación consolidada de informes ejecutivos en formatos Excel y PDF con un solo clic.',
    icon: FileSpreadsheet,
    tag: 'Reportabilidad',
    status: 'Excel & PDF',
    capabilities: ['Descarga masiva de datos', 'Reportes para gerencia', 'Plantillas institucionales'],
  },
]

export function ModulesSection() {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredModules =
    activeCategory === 'all'
      ? MODULES
      : MODULES.filter((m) => m.category === activeCategory)

  return (
    <section id="modulos" className="relative py-20 md:py-28 bg-slate-50/60 border-t border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Suite Operativa Completa</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Módulos del Sistema
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Cada área de tu organización interconectada mediante herramientas de alto rendimiento diseñadas para el rigor del sector empresarial.
          </p>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-102'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* MODULES GRID WITH MODERN SAAS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModules.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-300 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/10 hover:-translate-y-1"
            >
              <div>
                {/* Card Top: Icon & Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-600/30">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100">
                    {item.tag}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
                  {item.name}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Capabilities list */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  {item.capabilities.map((cap, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer: Status Pill */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
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
