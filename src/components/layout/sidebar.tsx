'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Users, LayoutDashboard, UserCircle, LogOut, Shield, Coins, 
  Bus, Calendar, BarChart3, Building2, Map, Ship, FileText, Bed,
  ChevronDown, ChevronRight, Package, LayoutGrid, Box, History,
  AlertCircle, GraduationCap, MessageSquare, Eye, ShieldAlert, Clock,
  ArrowLeft, Hammer, Trees
} from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { stopImpersonation } from '@/app/(main)/super-admin/actions'
import { useState, useEffect } from 'react'
import { useUserRole } from '@/components/providers/rbac-provider'
import { useSidebar } from '@/components/providers/sidebar-provider'
import { X } from 'lucide-react'

// MASTER LIST: Grupos de navegación por defecto
const navGroups = [
  {
    id: 'super-admin',
    label: 'CENTRO CORPORATIVO',
    items: [
      { name: 'Panel Corporativo', href: '/super-admin', icon: ShieldAlert, module: 'super-admin' },
      // Inactive modules temporarily hidden to keep a clean global console experience
      // { name: 'Gestión de Organizaciones', href: '/super-admin/companies', icon: Building2, module: 'super-admin' },
      // { name: 'Control de Seguridad', href: '/super-admin/users', icon: Users, module: 'super-admin' },
    ]
  },
  {
    id: 'dashboard',
    label: 'CENTRO DE CONTROL',
    items: [
      { name: 'Panel Principal', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
    ]
  },
  {
    id: 'operaciones',
    label: 'GESTIÓN OPERATIVA',
    items: [
      { name: 'Personal', href: '/workers', icon: Users, module: 'workers' },
      { name: 'Control de Asistencia', href: '/attendance', icon: Calendar, module: 'attendance' },
      { name: 'Tareo Operativo', href: '/tareo', icon: Calendar, module: 'tareo' },
      { name: 'Control de Producción', href: '/operaciones/produccion', icon: Hammer, module: 'produccion' },
      { name: 'Control de Maderas', href: '/operaciones/maderas', icon: Trees, module: 'maderas' },
      { name: 'Logística de Personal', href: '/movements', icon: Ship, module: 'movements' },
      { name: 'Control de Activos', href: '/assets', icon: Package, module: 'assets' },
      { name: 'Requerimientos', href: '/requerimientos', icon: FileText, module: 'requerimientos' },
      { name: 'Incidencias', href: '/incidencias?category=operativa', icon: AlertCircle, module: 'incidencias' },
      { name: 'Control Financiero', href: '/caja-chica', icon: Coins, module: 'caja-chica' },
    ]
  },
  {
    id: 'inventario',
    label: 'CENTRO LOGÍSTICO',
    items: [
      { name: 'Catálogo de Productos', href: '/inventory/products', icon: LayoutGrid, module: 'inventory' },
      { name: 'Control de Stock', href: '/inventory/stock', icon: Box, module: 'inventory' },
      { name: 'Trazabilidad Kardex', href: '/inventory/kardex', icon: History, module: 'inventory' },
      { name: 'Historial Movimientos', href: '/inventory/history', icon: History, module: 'inventory' },
    ]
  },
  {
    id: 'soma',
    label: 'GESTIÓN HSEC (SOMA)',
    items: [
      { name: 'Plan de Capacitaciones', href: '/soma/capacitaciones', icon: GraduationCap, module: 'soma-capacitaciones' },
      { name: 'Charlas de Seguridad', href: '/soma/charlas', icon: MessageSquare, module: 'soma-charlas' },
      { name: 'Inspecciones HSEC', href: '/soma/hsec', icon: Eye, module: 'soma-hsec' },
      { name: 'Reporte de Incidentes', href: '/incidencias?category=soma', icon: ShieldAlert, module: 'incidencias' },
    ]
  },
  {
    id: 'gestion',
    label: 'SERVICIOS AL PERSONAL',
    items: [
      { name: 'Gestión Documental', href: '/documents', icon: FileText, module: 'documents' },
      { name: 'Control de EPP', href: '/ppe', icon: Shield, module: 'ppe' },
      { name: 'Control de Campamento', href: '/camp', icon: Bed, module: 'camp' },
      { name: 'Bonificaciones', href: '/bonuses', icon: Coins, module: 'bonuses' },
    ]
  },
  {
    id: 'analytics',
    label: 'REPORTES Y ANALÍTICA',
    items: [
      { name: 'Inteligencia Operacional', href: '/reports', icon: BarChart3, module: 'reports' },
    ]
  },
  {
    id: 'configuracion',
    label: 'ADMINISTRACIÓN',
    items: [
      { name: 'Datos de Empresa', href: '/company', icon: Building2, module: 'company' },
      { name: 'Gestión de Almacenes', href: '/configuracion/warehouses', icon: Map, module: 'inventory' },
      { name: 'Usuarios y Accesos', href: '/users', icon: Shield, module: 'users' },
      { name: 'Mi Cuenta', href: '/profile', icon: UserCircle, module: 'profile' },
    ]
  }
]

// Lógica de prioridad estricta para Sidebar (Refleja Dashboard)
function getSidebarContext(role_id: string | undefined, area: string | null | undefined) {
  if (!role_id) return 'DEFAULT'
  const role = role_id.toLowerCase()
  const cleanArea = area?.toLowerCase() || ''

  if (role === 'super_admin' || role === 'superadmin') return 'SUPER_ADMIN'
  if (role === 'gerente') return 'GERENTE'
  if (['admin', 'administracion'].includes(role)) return 'ADMIN'
  if (role === 'soma' || (role === 'jefe_area' && cleanArea === 'seguridad soma')) return 'SOMA'
  if (role === 'jefe_area' && cleanArea === 'cocina') return 'COCINA'
  if (role === 'operaciones' || (role === 'jefe_area' && cleanArea === 'operaciones')) return 'OPERACIONES'
  if (role === 'almacen' || role === 'logistica' || (role === 'jefe_area' && ['almacén y mantenimiento', 'mecánica'].includes(cleanArea))) return 'ALMACEN'
  if (role === 'trabajador') return 'WORKER'
  return 'DEFAULT'
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
  return undefined
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { role_id, user, hasAccess, isImpersonating } = useUserRole()
  const { isOpen, setIsOpen } = useSidebar()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [isExiting, setIsExiting] = useState(false)
  
  // Note: Resize listener moved to SidebarProvider for global stability

  const isEligible = user?.worker_id && !['admin', 'super_admin', 'superadmin'].includes(role_id?.toLowerCase() || '')
  const [viewMode, setViewMode] = useState<'OPERATIONAL' | 'WORKER'>('OPERATIONAL')

  useEffect(() => {
    if (isEligible) {
      const cookieValue = getCookie('view_mode')
      if (cookieValue === 'WORKER') {
        setViewMode('WORKER')
      } else {
        setViewMode('OPERATIONAL')
      }
    }
  }, [role_id, user, isEligible])

  const handleToggleView = () => {
    const newView = viewMode === 'WORKER' ? 'OPERATIONAL' : 'WORKER'
    document.cookie = `view_mode=${newView}; path=/; max-age=31536000; SameSite=Lax`
    setViewMode(newView)
    window.location.href = '/dashboard'
  }

  const handleItemClick = (groupId: string, href: string, itemName: string, e: React.MouseEvent) => {
    const targetMode = groupId === 'mi-portal-personal' ? 'WORKER' : 'OPERATIONAL'
    
    if (isEligible && targetMode !== viewMode) {
      e.preventDefault()
      document.cookie = `view_mode=${targetMode}; path=/; max-age=31536000; SameSite=Lax`
      setViewMode(targetMode)
      window.location.href = href
    } else {
      if (groupId === 'mi-portal-personal') {
        document.cookie = 'view_mode=WORKER; path=/; max-age=31536000; SameSite=Lax'
      } else if (groupId !== 'dashboard' && groupId !== 'configuracion') {
        document.cookie = 'view_mode=OPERATIONAL; path=/; max-age=31536000; SameSite=Lax'
      } else if (groupId === 'dashboard' && href === '/dashboard') {
        document.cookie = 'view_mode=OPERATIONAL; path=/; max-age=31536000; SameSite=Lax'
      }
    }
  }

  const area = user?.area
  const isWorkerPure = role_id?.toLowerCase() === 'trabajador'
  const context = isEligible && !isWorkerPure ? getSidebarContext(role_id, area) : (viewMode === 'WORKER' ? 'WORKER' : getSidebarContext(role_id, area))

  const handleStopImpersonation = async () => {
    setIsExiting(true)
    const res = await stopImpersonation()
    if (res.success) {
      window.location.href = '/super-admin'
    } else {
      setIsExiting(false)
      alert('Error al salir del modo empresa')
    }
  }

  const getFilteredGroups = () => {
    let groups = navGroups;
    const effectiveContext = isImpersonating ? 'ADMIN' : context

    if (effectiveContext === 'SUPER_ADMIN') {
      groups = groups.filter(g => g.id === 'super-admin');
    } else {
      groups = groups.filter(g => g.id !== 'super-admin');
    }

    switch (effectiveContext) {
      case 'SUPER_ADMIN':
        return groups;

      case 'ADMIN':
        return groups.map(g => {
          if (g.id === 'soma') return { ...g, items: g.items.filter(i => i.name !== 'Dashboard de Seguridad') }
          return g
        })

      case 'GERENTE':
        return groups.map(g => {
          if (g.id === 'configuracion') {
            return { ...g, items: g.items.filter(i => ['profile', 'company'].includes(i.module)) }
          }
          if (g.id === 'soma') {
            return { ...g, items: g.items.filter(i => i.name !== 'Dashboard de Seguridad') }
          }
          return g
        })

      case 'SOMA':
        return groups.filter(g => g.id === 'dashboard' || g.id === 'soma' || g.id === 'configuracion' || g.id === 'gestion')
          .map(g => {
            if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
            if (g.id === 'gestion') return { ...g, items: g.items.filter(i => i.module === 'ppe') }
            return g
          })

      case 'COCINA':
        return groups.map(g => {
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
            items: g.items.filter(i => ['camp'].includes(i.module))
          }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          return { ...g, items: [] }
        })

      case 'OPERACIONES':
        return groups.map(g => {
          if (g.id === 'dashboard' || g.id === 'inventario') return g
          if (g.id === 'operaciones') return {
            ...g,
            items: g.items.filter(i => ['workers', 'attendance', 'tareo', 'movements', 'assets', 'requerimientos', 'incidencias', 'caja-chica', 'produccion', 'maderas'].includes(i.module))
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
        return groups.map(g => {
          if (g.id === 'dashboard' || g.id === 'inventario') return g
          if (g.id === 'operaciones') return { 
            ...g, 
            items: g.items.filter(i => ['requerimientos', 'assets'].includes(i.module)).map(i => {
              if (i.module === 'requerimientos') return { ...i, name: 'Requerimientos Aprobados' }
              return i
            })
          }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          return { ...g, items: [] }
        })

      case 'WORKER':
        return groups.map(g => {
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
        return groups.filter(g => g.id === 'dashboard' || g.id === 'configuracion')
    }
  }

  let filteredGroups = getFilteredGroups().filter(group => group.items.length > 0)

  if (isEligible && role_id?.toLowerCase() !== 'trabajador') {
    const personalGroup = {
      id: 'mi-portal-personal',
      label: 'MI PORTAL PERSONAL',
      items: [
        { name: 'Mi Portal (Inicio)', href: '/dashboard', icon: UserCircle, module: 'dashboard' },
        { name: 'Mi Asistencia', href: '/attendance', icon: Clock, module: 'attendance' },
        { name: 'Mis Documentos', href: '/documents', icon: FileText, module: 'documents' },
        { name: 'Mis EPPs', href: '/ppe', icon: Shield, module: 'ppe' },
        { name: 'Mis Bonos y Pasajes', href: '/bonuses', icon: Coins, module: 'bonuses' }
      ]
    }
    filteredGroups = [...filteredGroups, personalGroup]
  }

  return (
    <>
      {/* Mobile Overlay - Extra safety check for desktop viewports */}
      {isOpen && typeof window !== 'undefined' && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[70]
        w-72 shadow-2xl
        transform transition-transform duration-500 ease-out
        lg:relative lg:translate-x-0
        flex flex-col h-screen h-[100dvh] overflow-hidden nth-sidebar
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Impersonation Banner (Corporate Style) */}
        {isImpersonating && (
          <div className="bg-slate-900 border-b border-white/10 p-4 sm:p-5 animate-in slide-in-from-top duration-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-500 animate-pulse" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Auditoría de Empresa</span>
            </div>
            <button 
              onClick={handleStopImpersonation}
              disabled={isExiting}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-xl"
            >
              {isExiting ? 'Saliendo...' : (
                <>
                  <ArrowLeft size={14} />
                  Finalizar Auditoría
                </>
              )}
            </button>
          </div>
        )}

        <div className="p-6 sm:p-8 flex items-center justify-between nth-divider border-b">
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl nth-logo-box">
              <img 
                src="/logo-ops.png" 
                alt="Inthaly OPS Logo" 
                className="w-8 h-8 object-contain mix-blend-screen brightness-125"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tighter leading-none whitespace-nowrap text-white">Inthaly OPS</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em]">ERP Cloud</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Switcher removed to keep a fully unified and clean hybrid experience */}
        

        <nav className="flex-1 min-h-0 px-4 sm:px-6 py-2 space-y-2 overflow-y-auto custom-scrollbar flex flex-col pb-24 md:pb-6">
          <div className="flex-1 space-y-2">
            {filteredGroups.map((group) => {
              const isCollapsed = collapsed[group.id]
              const hasActiveChild = group.items.some(item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
              const effectivelyCollapsed = isCollapsed === undefined ? !hasActiveChild : isCollapsed

              const toggleGroup = () => {
                setCollapsed(prev => ({ ...prev, [group.id]: !effectivelyCollapsed }))
              }

              return (
                <div key={group.id} className="pt-4 first:pt-0">
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
                    <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {group.items.map((item) => {
                        const isDashboardItem = item.href === '/dashboard'
                        let isActive = false
                        if (isDashboardItem) {
                          if (group.id === 'mi-portal-personal') {
                            isActive = pathname === '/dashboard' && viewMode === 'WORKER'
                          } else {
                            isActive = pathname === '/dashboard' && viewMode === 'OPERATIONAL'
                          }
                        } else {
                          isActive = pathname === item.href || (item.href !== '/super-admin' && item.href !== '/dashboard' && pathname.startsWith(item.href))
                        }
                        
                        const Icon = item.icon
                        
                        return (
                          <Link
                            key={`${group.id}-${item.href}-${item.name}`}
                            href={item.href}
                            onClick={(e) => handleItemClick(group.id, item.href, item.name, e)}
                            className={`flex items-center gap-4 px-4 py-2.5 sm:py-3.5 rounded-2xl font-bold text-sm group/item nth-nav-item ${
                              isActive ? 'nth-nav-item-active' : ''
                            }`}
                          >
                            <Icon size={20} strokeWidth={2.5} className={`transition-colors ${isActive ? 'text-blue-600' : 'opacity-60'}`} />
                            <span className="tracking-tight">{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="pt-6 pb-4 mt-auto border-t border-white/10 shrink-0">
            <form action={logout}>
              <button type="submit" className="flex w-full items-center gap-4 px-4 py-3 sm:py-4 transition-all rounded-[1.5rem] font-bold text-sm group nth-nav-item">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  <LogOut size={20} className="opacity-60 group-hover:opacity-100" />
                </div>
                <span>Cerrar sesión</span>
              </button>
            </form>
          </div>
        </nav>
      </aside>

    </>
  )
}
