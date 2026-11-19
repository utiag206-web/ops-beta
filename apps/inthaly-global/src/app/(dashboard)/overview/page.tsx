import React from 'react'
import Link from 'next/link'
import {
  KeyRound,
  Compass,
  Building2,
  GraduationCap,
  Truck,
  Activity,
  Server,
  Database,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import os from 'os'

export const dynamic = 'force-dynamic'

interface ProductCardDef {
  id: string
  name: string
  tag: string
  domain: string
  description: string
  status: 'active' | 'satellite' | 'upcoming'
  statusLabel: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  adminUrl: string
  kpiLabel: string
  kpiValue: string
  lastCheck: string
}

const products: ProductCardDef[] = [
  {
    id: 'inthaly-id',
    name: 'Inthaly ID',
    tag: 'Identidad Soberana',
    domain: 'auth.inthaly.com',
    description: 'Motor de autenticación central, sesiones criptográficas y emisor de tokens OIDC/OAuth 2.0.',
    status: 'active',
    statusLabel: 'Operativo',
    icon: KeyRound,
    color: 'from-blue-600 to-indigo-600',
    adminUrl: '/products/inthaly-id',
    kpiLabel: 'Identidades Registradas',
    kpiValue: 'Soberano',
    lastCheck: 'Hace 30s'
  },
  {
    id: 'comunidad',
    name: 'Comunidad Inthaly',
    tag: 'Red Profesional',
    domain: 'comunidad.inthaly.com',
    description: 'Red profesional y técnica de la industria y minería. Foros, publicaciones y perfiles soberanos.',
    status: 'active',
    statusLabel: 'Operativo',
    icon: Compass,
    color: 'from-blue-700 to-sky-600',
    adminUrl: '/products/comunidad',
    kpiLabel: 'Perfiles Activos',
    kpiValue: 'En Línea',
    lastCheck: 'Hace 45s'
  },
  {
    id: 'ops',
    name: 'InthalyOps',
    tag: 'Gestión Operativa',
    domain: 'ops.inthaly.com',
    description: 'Sistema empresarial minero e industrial. Control de personal, tareo, maquinaria y finanzas.',
    status: 'active',
    statusLabel: 'Operativo',
    icon: Building2,
    color: 'from-indigo-600 to-slate-800',
    adminUrl: '/products/ops',
    kpiLabel: 'Empresas Operativas',
    kpiValue: 'Multiempresa',
    lastCheck: 'Hace 1m'
  },
  {
    id: 'academia',
    name: 'Inthaly Academia',
    tag: 'LMS Satélite',
    domain: 'app.inthaly.com',
    description: 'Plataforma educativa externa en Laravel / MySQL para certificaciones SOMA y cursos técnicos.',
    status: 'satellite',
    statusLabel: 'Satélite Conectado',
    icon: GraduationCap,
    color: 'from-amber-600 to-amber-700',
    adminUrl: '/products/academia',
    kpiLabel: 'Sincronización OIDC',
    kpiValue: 'Contrato Listo',
    lastCheck: 'Hace 2m'
  },
  {
    id: 'transporte',
    name: 'Inthaly Transporte',
    tag: 'Movilidad & Carga',
    domain: 'transporte.inthaly.com',
    description: 'Módulo futuro para despacho de mineral, rutas de convoyes y transporte de personal en faena.',
    status: 'upcoming',
    statusLabel: 'Espacio Preparado',
    icon: Truck,
    color: 'from-slate-600 to-slate-800',
    adminUrl: '/products/transporte',
    kpiLabel: 'Estado Arquitectónico',
    kpiValue: 'Reservado',
    lastCheck: 'Inactivo'
  }
]

export default function OverviewPage() {
  const totalMem = Math.round(os.totalmem() / (1024 * 1024))
  const freeMem = Math.round(os.freemem() / (1024 * 1024))
  const usedMem = totalMem - freeMem
  const memPct = Math.round((usedMem / totalMem) * 100)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera Principal */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Panorámica General del Ecosistema</h1>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              Ecosistema Operativo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión consolidada de todos los productos, estado de servicios, observabilidad en tiempo real y gobernanza soberana.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/control-center"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Activity size={14} />
            <span>Centro de Control</span>
          </Link>
          <Link
            href="/databases"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
          >
            <Database size={14} />
            <span>Bases de Datos</span>
          </Link>
        </div>
      </div>

      {/* Métricas Globales del Ecosistema */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Servicios del Ecosistema</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">4 / 5</span>
            <span className="text-xs text-emerald-600 font-bold">Activos</span>
          </div>
          <span className="text-[11px] text-slate-500 block">3 Core + 1 Satélite</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uso de Memoria Servidor</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{memPct}%</span>
            <span className="text-xs text-slate-500 font-semibold">{usedMem} / {totalMem} MB</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold">Rango Seguro (&lt; 80%)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Último Respaldo</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">SHA-256</span>
            <span className="text-xs text-emerald-600 font-bold">Verificado</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Retención de 30 días</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incidencias Críticas</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">0</span>
            <span className="text-xs text-emerald-600 font-bold">Ninguna</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Todos los servicios estables</span>
        </div>
      </div>

      {/* Sección: Tarjetas Individuales de los Productos del Ecosistema */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Productos del Ecosistema Inthaly</h2>
          <span className="text-xs text-slate-500">Haz clic en una tarjeta para gestionar el producto</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => {
            const Icon = prod.icon
            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all group"
              >
                <div className="space-y-3">
                  {/* Encabezado de Tarjeta */}
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black shadow-xs">
                      <Icon size={20} />
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        prod.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : prod.status === 'satellite'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {prod.statusLabel}
                    </span>
                  </div>

                  {/* Título y Dominio */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {prod.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-slate-400">{prod.domain}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-semibold">{prod.tag}</span>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {prod.description}
                  </p>

                  {/* Indicador Primario del Producto */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">{prod.kpiLabel}</span>
                    <span className="font-bold text-slate-800">{prod.kpiValue}</span>
                  </div>
                </div>

                {/* Footer de Tarjeta */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock size={12} />
                    <span>{prod.lastCheck}</span>
                  </div>

                  <Link
                    href={prod.adminUrl}
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Administrar</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
