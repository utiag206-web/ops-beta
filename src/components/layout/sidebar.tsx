'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, LayoutDashboard, UserCircle, LogOut, Shield, Coins, 
  Bus, Calendar, BarChart3, Building2, Map, Ship, FileText, Bed,
  ChevronDown, ChevronRight, Package, LayoutGrid, Box, History,
  AlertCircle, GraduationCap, MessageSquare, Eye, ShieldAlert, Clock
} from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { useState } from 'react'
import { useUserRole } from '@/components/providers/rbac-provider'

// MASTER LIST: Grupos de navegación por defecto
const navGroups = [
  {
    id: 'dashboard',
    label: 'PANEL DE CONTROL',
    items: [
      { name: 'Dashboard Principal', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
    ]
  },
  {
    id: 'operaciones',
    label: 'OPERACIONES',
    items: [
      { name: 'Trabajadores', href: '/workers', icon: Users, module: 'workers' },
      { name: 'Asistencia', href: '/attendance', icon: Calendar, module: 'attendance' },
      { name: 'Tareo', href: '/tareo', icon: Calendar, module: 'tareo' },
      { name: 'Subidas/Bajadas', href: '/movements', icon: Ship, module: 'movements' },
      { name: 'Activos', href: '/assets', icon: Package, module: 'assets' },
      { name: 'Requerimientos', href: '/requerimientos', icon: FileText, module: 'requerimientos' },
      { name: 'Incidencias', href: '/incidencias', icon: AlertCircle, module: 'incidencias' },
      { name: 'Caja Chica', href: '/caja-chica', icon: Coins, module: 'caja-chica' },
    ]
  },
  {
    id: 'inventario',
    label: 'INVENTARIO',
    items: [
      { name: 'Productos', href: '/inventory/products', icon: LayoutGrid, module: 'inventory' },
      { name: 'Stock', href: '/inventory/stock', icon: Box, module: 'inventory' },
      { name: 'Kardex', href: '/inventory/kardex', icon: History, module: 'inventory' },
      { name: 'Movimientos', href: '/inventory/history', icon: History, module: 'inventory' },
    ]
  },
  {
    id: 'soma',
    label: 'SEGURIDAD SOMA',
    items: [
      { name: 'Dashboard SOMA', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
      { name: 'Capacitaciones', href: '/soma/capacitaciones', icon: GraduationCap, module: 'soma-capacitaciones' },
      { name: 'Charlas 5 Minutos', href: '/soma/charlas', icon: MessageSquare, module: 'soma-charlas' },
      { name: 'STOP / HSEC', href: '/soma/hsec', icon: Eye, module: 'soma-hsec' },
      { name: 'Incidentes SOMA', href: '/incidencias', icon: ShieldAlert, module: 'incidencias' },
    ]
  },
  {
    id: 'gestion',
    label: 'GESTIÓN PERSONAL',
    items: [
      { name: 'Documentos', href: '/documents', icon: FileText, module: 'documents' },
      { name: 'Control de EPP', href: '/ppe', icon: Shield, module: 'ppe' },
      { name: 'Campamento', href: '/camp', icon: Bed, module: 'camp' },
      { name: 'Bonos y Pasajes', href: '/bonuses', icon: Coins, module: 'bonuses' },
    ]
  },
  {
    id: 'analytics',
    label: 'ANALYTICS',
    items: [
      { name: 'Analíticas Avanzadas', href: '/reports', icon: BarChart3, module: 'reports' },
    ]
  },
  {
    id: 'configuracion',
    label: 'CONFIGURACIÓN',
    items: [
      { name: 'Empresa', href: '/company', icon: Building2, module: 'company' },
      { name: 'Almacenes', href: '/configuracion/warehouses', icon: Map, module: 'inventory' },
      { name: 'Usuarios / Roles', href: '/users', icon: Shield, module: 'users' },
      { name: 'Mi Cuenta', href: '/profile', icon: UserCircle, module: 'profile' },
    ]
  }
]

// Lógica de prioridad estricta para Sidebar (Refleja Dashboard)
function getSidebarContext(role_id: string | undefined, area: string | null | undefined) {
  if (!role_id) return 'DEFAULT'
  if (['admin', 'gerente'].includes(role_id)) return 'ADMIN'
  if (role_id === 'soma' || (role_id === 'jefe_area' && area === 'Seguridad SOMA')) return 'SOMA'
  if (role_id === 'jefe_area' && area === 'Cocina') return 'COCINA'
  if (role_id === 'operaciones' || (role_id === 'jefe_area' && area === 'Operaciones')) return 'OPERACIONES'
  if (role_id === 'almacen' || role_id === 'logistica') return 'ALMACEN'
  if (role_id === 'administracion') return 'ADMINISTRACION'
  if (role_id === 'trabajador') return 'WORKER'
  return 'DEFAULT'
}

export function Sidebar() {
  const pathname = usePathname()
  const { role_id, user, hasAccess } = useUserRole()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  
  const area = user?.area
  const context = getSidebarContext(role_id, area)

  const getFilteredGroups = () => {
    switch (context) {
      case 'ADMIN':
        return navGroups.map(g => {
          if (g.id === 'soma') return { ...g, items: g.items.filter(i => i.name !== 'Dashboard SOMA') }
          return g
        })

      case 'SOMA':
        return navGroups.filter(g => g.id === 'soma' || g.id === 'configuracion' || g.id === 'gestion')
          .map(g => {
            if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
            if (g.id === 'gestion') return { ...g, items: g.items.filter(i => i.module === 'ppe') }
            return g
          })

      case 'COCINA':
        return navGroups.map(g => {
          if (g.id === 'dashboard') return g
          if (g.id === 'operaciones') return { 
            ...g, 
            items: g.items.filter(i => ['requerimientos', 'caja-chica'].includes(i.module)) 
          }
          if (g.id === 'inventario') return {
            ...g,
            items: g.items.filter(i => ['/inventory/stock', '/inventory/history'].includes(i.href)).map(i => ({
              ...i,
              name: i.href === '/inventory/stock' ? 'Inventario' : 'Movimientos'
            }))
          }
          if (g.id === 'soma') return {
            ...g,
            items: g.items.filter(i => ['soma-capacitaciones', 'soma-charlas'].includes(i.module))
          }
          if (g.id === 'gestion') return {
            ...g,
            items: g.items.filter(i => ['bonuses', 'camp'].includes(i.module))
          }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          return { ...g, items: [] }
        })

      case 'OPERACIONES':
        return navGroups.map(g => {
          if (g.id === 'dashboard') return g
          if (g.id === 'operaciones') return {
            ...g,
            items: g.items.filter(i => ['workers', 'attendance', 'tareo', 'movements', 'assets', 'requerimientos', 'incidencias', 'caja-chica'].includes(i.module))
          }
          if (g.id === 'gestion') return {
            ...g,
            items: g.items.filter(i => ['camp', 'bonuses'].includes(i.module))
          }
          if (g.id === 'soma') return {
            ...g,
            items: g.items.filter(i => ['soma-capacitaciones', 'soma-charlas'].includes(i.module))
          }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          return { ...g, items: [] }
        })

      case 'ALMACEN':
        return navGroups.map(g => {
          if (g.id === 'dashboard' || g.id === 'inventario') return g
          if (g.id === 'operaciones') return { 
            ...g, 
            items: g.items.filter(i => ['requerimientos'].includes(i.module)).map(i => ({
              ...i,
              name: 'Requerimientos Aprobados'
            }))
          }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          return { ...g, items: [] }
        })

      case 'ADMINISTRACION':
        return navGroups.map(g => {
          if (g.id === 'dashboard') return g
          if (g.id === 'operaciones') return {
            ...g,
            items: g.items.filter(i => ['caja-chica', 'workers'].includes(i.module))
          }
          if (g.id === 'gestion') return {
            ...g,
            items: g.items.filter(i => ['bonuses'].includes(i.module))
          }
          if (g.id === 'analytics') return g
          if (g.id === 'configuracion') return {
            ...g,
            items: g.items.filter(i => ['users', 'profile'].includes(i.module)).map(i => {
              if (i.module === 'users') return { ...i, name: 'Usuarios (Lectura)' }
              return i
            })
          }
          return { ...g, items: [] }
        })

      case 'WORKER':
        return navGroups.map(g => {
          if (g.id === 'dashboard') return g
          if (g.id === 'gestion') return {
            ...g,
            items: g.items.filter(i => ['documents', 'bonuses', 'ppe'].includes(i.module)).map(i => {
              if (i.module === 'bonuses') return { ...i, name: 'Mis Bonos y Pasajes' }
              return i
            })
          }
          if (g.id === 'operaciones') return {
            ...g,
            items: g.items.filter(i => ['attendance', 'requerimientos', 'incidencias'].includes(i.module)).map(i => {
              if (i.module === 'attendance') return { ...i, name: 'Mi Asistencia' }
              if (i.module === 'requerimientos') return { ...i, name: 'Solicitar Productos' }
              if (i.module === 'incidencias') return { ...i, name: 'Reportar Incidencia' }
              return i
            })
          }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          return { ...g, items: [] }
        })

      default:
        return navGroups.filter(g => g.id === 'dashboard' || g.id === 'configuracion')
    }
  }

  const filteredGroups = getFilteredGroups().filter(group => group.items.length > 0)

  return (
    <aside className="w-80 flex flex-col relative z-20 shadow-2xl overflow-hidden nth-sidebar">
      {/* Branding */}
      <div className="p-10 nth-divider border-b">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 flex items-center justify-center">
            <img 
              src="/logo-ops.png" 
              alt="Inthaly OPS Logo" 
              className="w-full h-full object-contain mix-blend-screen brightness-125"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter leading-none whitespace-nowrap">Inthaly OPS</span>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-2">Sistema ERP</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6 py-2 space-y-2 overflow-y-auto custom-scrollbar">
        {filteredGroups.map((group) => {
          const isCollapsed = collapsed[group.id]
          const hasActiveChild = group.items.some(item => pathname.startsWith(item.href))
          const effectivelyCollapsed = isCollapsed === undefined ? !hasActiveChild : isCollapsed

          const toggleGroup = () => {
            setCollapsed(prev => ({ ...prev, [group.id]: !effectivelyCollapsed }))
          }

          return (
            <div key={group.id} className="pt-6 first:pt-0">
              <button
                onClick={toggleGroup}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-widest transition-colors group nth-nav-group-label"
              >
                <span>{group.label}</span>
                {effectivelyCollapsed ? (
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform opacity-40" />
                ) : (
                  <ChevronDown size={14} className="opacity-70" />
                )}
              </button>
              
              {!effectivelyCollapsed && (
                <div className="mt-4 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    const Icon = item.icon
                    
                    return (
                      <Link
                        key={`${group.id}-${item.href}`}
                        href={item.href}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm group/item nth-nav-item ${
                          isActive ? 'nth-nav-item-active' : ''
                        }`}
                      >
                        <Icon size={20} strokeWidth={2.5} className="transition-colors" />
                        <span className="tracking-tight">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-6 mt-auto nth-divider border-t">
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-4 px-4 py-4 transition-all rounded-[1.5rem] font-bold text-sm group nth-nav-item">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/15 transition-colors">
              <LogOut size={20} className="opacity-60 group-hover:opacity-100" />
            </div>
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
