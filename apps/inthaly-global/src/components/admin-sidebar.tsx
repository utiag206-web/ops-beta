'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Layers,
  KeyRound,
  Compass,
  Building2,
  GraduationCap,
  Truck,
  Activity,
  Server,
  Database,
  ShieldCheck,
  History,
  Settings,
  LogOut,
  Shield,
  CircleDot
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: string
  badgeColor?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'PANORÁMICA',
    items: [
      { label: 'Visión General', href: '/overview', icon: Layers },
    ],
  },
  {
    title: 'ECOSISTEMA & PRODUCTOS',
    items: [
      { label: 'Inthaly ID', href: '/products/inthaly-id', icon: KeyRound, badge: 'Core', badgeColor: 'bg-blue-500/20 text-blue-300' },
      { label: 'Comunidad Inthaly', href: '/products/comunidad', icon: Compass, badge: 'Activo', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
      { label: 'InthalyOps Multiempresa', href: '/products/ops', icon: Building2, badge: 'Activo', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
      { label: 'Inthaly Academia', href: '/products/academia', icon: GraduationCap, badge: 'Satélite', badgeColor: 'bg-amber-500/20 text-amber-300' },
      { label: 'Inthaly Transporte', href: '/products/transporte', icon: Truck, badge: 'Próximo', badgeColor: 'bg-slate-700 text-slate-300' },
    ],
  },
  {
    title: 'CENTRO DE CONTROL & OBSERVABILIDAD',
    items: [
      { label: 'Centro de Control', href: '/control-center', icon: Activity },
      { label: 'Infraestructura & Docker', href: '/infrastructure', icon: Server },
      { label: 'Bases de Datos & Respaldos', href: '/databases', icon: Database },
    ],
  },
  {
    title: 'GOBIERNO & SEGURIDAD',
    items: [
      { label: 'Seguridad & Accesos', href: '/security', icon: ShieldCheck },
      { label: 'Auditoría Global', href: '/audit', icon: History },
      { label: 'Configuración Global', href: '/settings', icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 border-r border-slate-800/80 flex flex-col h-screen shrink-0 sticky top-0 select-none">
      {/* Cabecera del Sidebar */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/overview" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30 font-black text-sm">
            IN
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-white">INTHALY</span>
              <span className="text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/30">
                GLOBAL
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">Centro de Control Ecosistema</span>
          </div>
        </Link>
      </div>

      {/* Navegación Principal con Rutas Recargables */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider px-2 block mb-1.5">
              {section.title}
            </span>
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/overview' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-200 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon size={16} className={isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pie del Sidebar: Estado de Sistema y Usuario */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5">
            <CircleDot size={10} className="text-emerald-400 animate-pulse" />
            <span className="text-slate-200 font-medium">Ecosistema Soberano</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">100% OK</span>
        </div>

        <div className="flex items-center justify-between px-2 pt-1 text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
              <Shield size={14} className="text-blue-400" />
            </div>
            <div className="truncate">
              <span className="text-white font-bold block leading-tight text-xs truncate">Super Administrador</span>
              <span className="text-[10px] text-slate-300 truncate block">admin@inthaly.com</span>
            </div>
          </div>
          <button
            type="button"
            title="Cerrar sesión administrativa"
            className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
