import React from 'react'
import Link from 'next/link'
import {
  Settings,
  ArrowLeft,
  Building2,
  Bell,
  Plug,
  Server,
  Activity,
  Shield,
  Boxes,
  Info,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface SettingCategory {
  title: string
  desc: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge: string
  badgeColor: string
}

const categories: SettingCategory[] = [
  {
    title: 'Configuración General',
    desc: 'Identidad del ecosistema, logos, moneda, zona horaria y WhatsApp comercial.',
    href: '/settings/general',
    icon: Settings,
    badge: 'Identidad',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    title: 'Industrias y Capacidades',
    desc: 'Catálogo de sectores minero/industrial, arquetipos de personal y feature flags.',
    href: '/settings/capabilities',
    icon: Boxes,
    badge: 'Módulos',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    title: 'Seguridad',
    desc: 'Políticas transversales, expiración de sesiones, bloqueo y directivas MFA.',
    href: '/settings/security',
    icon: Shield,
    badge: 'OWASP',
    badgeColor: 'bg-red-50 text-red-700 border-red-200'
  },
  {
    title: 'Multiempresa',
    desc: 'Valores predeterminados de empresas, cuotas de operarios y modo demo.',
    href: '/settings/multiempresa',
    icon: Building2,
    badge: 'Tenants',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    title: 'Notificaciones',
    desc: 'Plantillas de correo transaccional, servidor SMTP y alertas operativas.',
    href: '/settings/notifications',
    icon: Bell,
    badge: 'Alertas',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    title: 'Integraciones & OIDC',
    desc: 'Clientes federados OIDC, endpoints de descubrimiento y satélites.',
    href: '/settings/integrations',
    icon: Plug,
    badge: 'RFC 8414',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    title: 'Sistema & Diagnóstico',
    desc: 'Modo mantenimiento, nivel de logs y parámetros de telemetría de host.',
    href: '/settings/system',
    icon: Server,
    badge: 'Host',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  {
    title: 'Auditoría Forense',
    desc: 'Políticas de retención de logs inmutables y formatos de exportación.',
    href: '/settings/audit',
    icon: Activity,
    badge: 'Inmutable',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    title: 'Acerca de INTHALY',
    desc: 'Versión del producto, arquitectura de monorepo desacoplado y licencias.',
    href: '/settings/about',
    icon: Info,
    badge: 'v2.0',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  }
]

export default function SettingsHubPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/overview"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Settings size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Centro de Configuración Global</h1>
                <span className="text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  9 Submódulos Soberanos
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Políticas y Parámetros Transversales del Ecosistema</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Administración centralizada de identidades, cuotas de empresas, seguridad y parámetros globales del ecosistema. Todos los submódulos operan con aislamiento desacoplado y guardias soberanas.
        </p>
      </div>

      {/* 2. Grid de los 9 Submódulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {categories.map((cat, idx) => {
          const Icon = cat.icon
          return (
            <Link
              key={idx}
              href={cat.href}
              className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                    <Icon size={16} />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${cat.badgeColor}`}>
                    {cat.badge}
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed text-[11px] mt-1">
                    {cat.desc}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-blue-600 font-bold text-xs">
                <span>Configurar</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
