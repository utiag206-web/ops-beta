'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
 Users, LayoutDashboard, UserCircle, LogOut, Shield, Coins, 
 Bus, Calendar, BarChart3, Building2, Map, Ship, FileText, Bed,
 ChevronDown, ChevronRight, Package, LayoutGrid, Box, History,
 AlertCircle, GraduationCap, MessageSquare, Eye, ShieldAlert, Clock,
 ArrowLeft, Hammer, Trees, Wrench, Truck, Cpu, Fuel, Activity, ClipboardCheck,
 FileSpreadsheet, Factory, Layers, Settings, Boxes, Sprout, HeartHandshake
} from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { stopImpersonation } from '@/app/(main)/super-admin/actions'
import { useState, useEffect, useMemo } from 'react'
import { useUserRole } from '@/components/providers/rbac-provider'
import { useSidebar } from '@/components/providers/sidebar-provider'
import { useGlobalSettings } from '@/components/providers/global-settings-provider'
import { useOperationalContext, useTerminology } from '@/components/providers/operational-context-provider'
import { CapabilityKey, SemanticToken } from '@/lib/operating-profiles/types'
import { RoadmapModal } from './roadmap-modal'
import { X } from 'lucide-react'

interface NavItemDef {
  name: string
  href: string
  icon: any
  module: string
  capability?: CapabilityKey
  token?: SemanticToken
}

interface NavGroupDef {
  id: string
  label: string
  token?: SemanticToken
  items: NavItemDef[]
}

// MASTER LIST: Grupos de navegación con mapeo a Capability Gateway
const navGroups: NavGroupDef[] = [
  {
    id: 'super-admin',
    label: 'Centro Corporativo',
    items: [
      { name: 'Panel Corporativo', href: '/super-admin', icon: ShieldAlert, module: 'super-admin' },
      { name: 'Configuración Global', href: '/super-admin/settings', icon: Settings, module: 'super-admin' },
      { name: 'Industrias y Capacidades', href: '/super-admin/settings/capabilities', icon: Boxes, module: 'super-admin' },
    ]
  },
  {
    id: 'dashboard',
    label: 'Centro de Control',
    items: [
      { name: 'Panel Principal', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
    ]
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    token: 'operation.module_name',
    items: [
      { name: 'Personal', token: 'worker.plural', href: '/workers', icon: Users, module: 'workers', capability: 'workers' },
      { name: 'Control de Asistencia', href: '/attendance', icon: Calendar, module: 'attendance', capability: 'attendance' },
      { name: 'Tareo Operativo', href: '/tareo', icon: Calendar, module: 'tareo', capability: 'tareo' },
      { name: 'Lotes y Cultivos', href: '/operaciones/campo', icon: Sprout, module: 'operaciones', capability: 'campo_lotes' },
      { name: 'Producción Agrícola', href: '/operaciones/produccion-agricola', icon: Layers, module: 'operaciones', capability: 'produccion_agricola' },
      { name: 'Control de Producción', href: '/operaciones/produccion', icon: Hammer, module: 'produccion', capability: 'operaciones_mina' },
      { name: 'Control de Planta y Mineral', href: '/operaciones/planta', icon: Factory, module: 'planta', capability: 'planta_mineral' },
      { name: 'Control de Maderas', href: '/operaciones/maderas', icon: Trees, module: 'maderas', capability: 'maderas' },
      { name: 'Control de Avance de Obra', href: '/operaciones/avance-obra', icon: Building2, module: 'operaciones', capability: 'avance_obra' },
      { name: 'Logística de Personal', href: '/movements', icon: Ship, module: 'movements', capability: 'logistica_rutas' },
      { name: 'Telemetría y Rastreo GPS', href: '/operaciones/telemetria', icon: Cpu, module: 'movements', capability: 'telemetria_gps' },
      { name: 'Control de Activos', href: '/assets', icon: Package, module: 'assets', capability: 'assets' },
      { name: 'Requerimientos', href: '/requerimientos', icon: FileText, module: 'requerimientos', capability: 'requerimientos' },
      { name: 'Control Financiero', href: '/caja-chica', icon: Coins, module: 'caja-chica', capability: 'caja-chica' },
    ]
  },
  {
    id: 'mecanica',
    label: 'Maquinaria y Mantenimiento',
    token: 'maintenance.module_name',
    items: [
      { name: 'Equipos y Maquinaria', token: 'asset.primary.plural', href: '/mecanica/equipos-mina', icon: Wrench, module: 'mecanica', capability: 'mecanica' },
      { name: 'Mantenimiento', href: '/mecanica/mantenimiento-vehiculos', icon: Truck, module: 'mecanica', capability: 'mecanica_vehiculos' },
      { name: 'Combustible', href: '/mecanica/generador-combustible', icon: Fuel, module: 'mecanica', capability: 'combustible' },
      { name: 'Checklists', href: '/mecanica/checklists', icon: ClipboardCheck, module: 'mecanica', capability: 'checklists' },
      { name: 'Control de Herramientas', href: '/mecanica/herramientas', icon: Hammer, module: 'mecanica', capability: 'herramientas' },
    ]
  },
  {
    id: 'inventario',
    label: 'Centro Logístico',
    items: [
      { name: 'Catálogo de Productos', href: '/inventory/products', icon: LayoutGrid, module: 'inventory', capability: 'inventory' },
      { name: 'Control de Stock', href: '/inventory/stock', icon: Box, module: 'inventory', capability: 'inventory' },
      { name: 'Trazabilidad Kardex', href: '/inventory/kardex', icon: History, module: 'inventory', capability: 'inventory' },
      { name: 'Historial Movimientos', href: '/inventory/history', icon: History, module: 'inventory', capability: 'inventory' },
    ]
  },
  {
    id: 'soma',
    label: 'Gestión HSEC (SOMA)',
    items: [
      { name: 'Plan de Capacitaciones', href: '/soma/capacitaciones', icon: GraduationCap, module: 'soma-capacitaciones', capability: 'soma' },
      { name: 'Charlas de Seguridad', href: '/soma/charlas', icon: MessageSquare, module: 'soma-charlas', capability: 'soma' },
      { name: 'Inspecciones HSEC', href: '/soma/hsec', icon: Eye, module: 'soma-hsec', capability: 'soma' },
      { name: 'Incidencias SOMA', href: '/incidencias?category=soma', icon: ShieldAlert, module: 'incidencias', capability: 'soma' },
    ]
  },
  {
    id: 'gestion',
    label: 'Servicios al Personal',
    items: [
      { name: 'Gestión Documental', href: '/documents', icon: FileText, module: 'documents', capability: 'documents' },
      { name: 'Clínica / Salud Ocupacional', href: '/servicios/salud-ocupacional', icon: Activity, module: 'documents', capability: 'salud_ocupacional' },
      { name: 'Bienestar Social', href: '/servicios/bienestar-social', icon: HeartHandshake, module: 'documents', capability: 'bienestar_social' },
      { name: 'Control de EPP', href: '/ppe', icon: Shield, module: 'ppe', capability: 'soma' },
      { name: 'Control de Campamento', href: '/camp', icon: Bed, module: 'camp', capability: 'workers' },
      { name: 'Bonificaciones', href: '/bonuses', icon: Coins, module: 'bonuses', capability: 'bonuses' },
    ]
  },
  {
    id: 'analytics',
    label: 'Reportes y Analítica',
    items: [
      { name: 'Centro de Exportaciones', href: '/reports/export-center', icon: FileSpreadsheet, module: 'reports', capability: 'reports' },
      { name: 'Inteligencia Operacional', href: '/reports', icon: BarChart3, module: 'reports', capability: 'reports' },
    ]
  },
  {
    id: 'configuracion',
    label: 'Administración',
    items: [
      { name: 'Datos de Empresa', href: '/company', icon: Building2, module: 'company', capability: 'company' },
      { name: 'Gestión de Almacenes', href: '/configuracion/warehouses', icon: Map, module: 'inventory', capability: 'inventory' },
      { name: 'Usuarios y Accesos', href: '/users', icon: Shield, module: 'users', capability: 'users' },
      { name: 'Mi Cuenta', href: '/profile', icon: UserCircle, module: 'profile', capability: 'profile' },
    ]
  }
]

import { normalizeAreaName } from '@/lib/permissions'

// Lógica de prioridad estricta para Sidebar (Refleja Dashboard)
function getSidebarContext(role_id: string | undefined, area: string | null | undefined) {
 if (!role_id) return 'DEFAULT'
 const role = role_id.toLowerCase()
 const cleanArea = area ? normalizeAreaName(area) : ''

 if (role === 'super_admin' || role === 'superadmin') return 'SUPER_ADMIN'
 if (role === 'gerente') return 'GERENTE'
 if (['admin', 'administracion'].includes(role)) return 'ADMIN'
 if (role === 'soma' || (role === 'jefe_area' && cleanArea === 'seguridad soma')) return 'SOMA'
 if (role === 'jefe_area' && cleanArea === 'cocina') return 'COCINA'
 if (role === 'jefe_area' && cleanArea === 'mecanica') return 'MECANICA'
 if (role === 'operaciones' || (role === 'jefe_area' && ['operaciones', 'mina'].includes(cleanArea))) return 'OPERACIONES'
 if (role === 'supervisor') return 'SUPERVISOR'
 if (role === 'almacen' || role === 'logistica' || (role === 'jefe_area' && ['almacen y mantenimiento', 'almacen', 'logistica'].includes(cleanArea))) return 'ALMACEN'
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
 const pathname = usePathname()
 const router = useRouter()
 const { role_id, user, hasAccess, isImpersonating } = useUserRole()
  const { isCapabilityAvailable, isCapabilityVisibleInSidebar, getCapabilityStatus, industryLabel } = useOperationalContext()
  const { term } = useTerminology()
  const { isOpen, setIsOpen } = useSidebar()
  const settings = useGlobalSettings()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [isExiting, setIsExiting] = useState(false)
  const [roadmapItem, setRoadmapItem] = useState<{ key: CapabilityKey | null; name: string } | null>(null)
 
 // Note: Resize listener moved to SidebarProvider for global stability

 const isWorkerPure = role_id?.toLowerCase() === 'trabajador'
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
 if (isWorkerPure) {
 document.cookie = 'view_mode=WORKER; path=/; max-age=31536000; SameSite=Lax'
 return
 }
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

 const filteredGroups = useMemo(() => {
    let groups = navGroups;
    const effectiveContext = isImpersonating ? 'ADMIN' : context

    if (effectiveContext === 'SUPER_ADMIN') {
      groups = groups.filter(g => g.id === 'super-admin');
    } else {
      groups = groups.filter(g => g.id !== 'super-admin');
    }

    let resolved: any[] = []

    switch (effectiveContext) {
      case 'SUPER_ADMIN':
        resolved = groups;
        break;

      case 'ADMIN':
        resolved = groups.map(g => {
          if (g.id === 'soma') return { ...g, items: g.items.filter(i => i.name !== 'Dashboard de Seguridad') }
          return g
        })
        break;

      case 'GERENTE':
        resolved = groups.map(g => {
          if (g.id === 'configuracion') {
            return { ...g, items: g.items.filter(i => ['profile', 'company'].includes(i.module)) }
          }
          if (g.id === 'soma') {
            return { ...g, items: g.items.filter(i => i.name !== 'Dashboard de Seguridad') }
          }
          return g
        })
        break;

      case 'SOMA':
        resolved = groups.filter(g => g.id === 'dashboard' || g.id === 'soma' || g.id === 'configuracion' || g.id === 'gestion')
          .map(g => {
            if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
            if (g.id === 'gestion') return { ...g, items: g.items.filter(i => i.module === 'ppe') }
            return g
          })
        break;

      case 'COCINA':
        resolved = groups.map(g => {
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
        break;

      case 'MECANICA':
        resolved = groups.map(g => {
          if (g.id === 'dashboard') {
            return {
              ...g,
              label: 'Centro de Control',
              items: g.items.map(i => ({ ...i, name: 'Panel de Mecánica' }))
            }
          }
          if (g.id === 'mecanica') return g
          if (g.id === 'operaciones') return { 
            ...g, 
            label: 'Gestión Auxiliar',
            items: g.items.filter(i => ['requerimientos', 'caja-chica', 'assets'].includes(i.module)) 
          }
          if (g.id === 'soma') return {
            ...g,
            items: g.items.filter(i => ['soma-capacitaciones', 'soma-charlas'].includes(i.module))
          }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          return { ...g, items: [] }
        })
        break;

      case 'OPERACIONES':
        resolved = groups.map(g => {
          if (g.id === 'mecanica') return { ...g, items: g.items.filter(i => i.module === 'mecanica') }
          if (g.id === 'inventario') return { ...g, items: g.items.filter(i => ['/inventory/stock', '/inventory/history'].includes(i.href)) }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          if (g.id === 'analytics') return { ...g, items: g.items.filter(i => i.href === '/reports') }
          return g
        })
        break;

      case 'SUPERVISOR':
        resolved = groups.map(g => {
          if (g.id === 'dashboard') return g
          if (g.id === 'operaciones') return {
            ...g,
            items: g.items.filter(i => ['workers', 'attendance', 'tareo', 'produccion', 'maderas', 'requerimientos'].includes(i.module))
          }
          if (g.id === 'soma') return {
            ...g,
            items: g.items.filter(i => ['soma-capacitaciones', 'soma-charlas', 'soma-hsec', 'incidencias'].includes(i.module))
          }
          if (g.id === 'gestion') return {
            ...g,
            items: g.items.filter(i => ['ppe'].includes(i.module))
          }
          if (g.id === 'mecanica') return {
            ...g,
            items: g.items.filter(i => ['checklists'].some(sub => i.href.includes(sub)))
          }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          return { ...g, items: [] }
        })
        break;

      case 'ALMACEN':
        resolved = groups.map(g => {
          if (g.id === 'dashboard') return g
          if (g.id === 'inventario') return g
          if (g.id === 'operaciones') return { ...g, items: g.items.filter(i => ['requerimientos', 'caja-chica'].includes(i.module)) }
          if (g.id === 'gestion') return { ...g, items: g.items.filter(i => ['ppe', 'documents'].includes(i.module)) }
          if (g.id === 'soma') return { ...g, items: g.items.filter(i => ['soma-capacitaciones', 'soma-charlas'].includes(i.module)) }
          if (g.id === 'analytics') return { ...g, items: g.items.filter(i => i.href === '/reports') }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          return { ...g, items: [] }
        })
        break;

      case 'WORKER':
        resolved = groups.map(g => {
          if (g.id === 'dashboard') return g
          if (g.id === 'gestion') return {
            ...g,
            items: g.items.filter(i => ['documents', 'bonuses', 'ppe'].includes(i.module)).map(i => {
              if (i.module === 'bonuses') return { ...i, name: 'Mi Historial Financiero' }
              return i
            })
          }
          if (g.id === 'operaciones') return {
            ...g,
            items: g.items.filter(i => ['attendance', 'requerimientos'].includes(i.module)).map(i => {
              if (i.module === 'attendance') return { ...i, name: 'Mi Asistencia' }
              if (i.module === 'requerimientos') return { ...i, name: 'Solicitar Productos' }
              return i
            })
          }
          if (g.id === 'soma') return {
            ...g,
            items: g.items.filter(i => i.module === 'incidencias').map(i => ({ ...i, name: 'Reportar Incidencia' }))
          }
          if (g.id === 'configuracion') return { ...g, items: g.items.filter(i => i.module === 'profile') }
          return { ...g, items: [] }
        })
        break;

      default:
        resolved = groups.filter(g => g.id === 'dashboard' || g.id === 'configuracion')
        break;
    }

    // Capa de Decisión: Capability Gateway (Dimensión Empresa)
    // Filtra los items según su visibilidad en el Mapa Operativo de la Empresa
    const capabilityResolved = resolved.map(g => {
      const allowedItems = g.items
        .filter((item: any) => {
          if (!item.capability) return true
          return isCapabilityVisibleInSidebar(item.capability)
        })
        .map((item: any) => {
          const status = item.capability ? getCapabilityStatus(item.capability) : 'ACTIVE'
          let displayName = item.name
          if (item.token) {
            displayName = term(item.token, item.name)
          }
          return {
            ...item,
            name: displayName,
            status
          }
        })

      let groupLabel = g.label
      if ((g as any).token) {
        groupLabel = term((g as any).token, g.label)
      }

      return {
        ...g,
        label: groupLabel,
        items: allowedItems
      }
    })

    let finalGroups = capabilityResolved.filter(group => group.items.length > 0)
    const showWorkerOnly = viewMode === 'WORKER' || isWorkerPure

    if (showWorkerOnly) {
      const personalGroup = {
        id: 'mi-portal-personal',
        label: 'Mi Portal Personal',
        items: [
          { name: 'Mi Portal (Inicio)', href: `/w/${user?.company_slug || 'empresa'}`, icon: UserCircle, module: 'dashboard' },
          { name: 'Mi Asistencia', href: '/attendance', icon: Clock, module: 'attendance' },
          { name: 'Mis Documentos', href: '/documents', icon: FileText, module: 'documents' },
          { name: 'Mis EPPs', href: '/ppe', icon: Shield, module: 'ppe' },
          { name: 'Mi Historial Financiero', href: '/bonuses', icon: Coins, module: 'bonuses' }
        ]
      }
      finalGroups = [personalGroup]
    } else if (isEligible && !isWorkerPure) {
      const personalGroup = {
        id: 'mi-portal-personal',
        label: 'Mi Portal Personal',
        items: [
          { name: 'Mi Portal (Inicio)', href: `/w/${user?.company_slug || 'empresa'}`, icon: UserCircle, module: 'dashboard' },
          { name: 'Mi Asistencia', href: '/attendance', icon: Clock, module: 'attendance' },
          { name: 'Mis Documentos', href: '/documents', icon: FileText, module: 'documents' },
          { name: 'Mis EPPs', href: '/ppe', icon: Shield, module: 'ppe' },
          { name: 'Mi Historial Financiero', href: '/bonuses', icon: Coins, module: 'bonuses' }
        ]
      }
      finalGroups = [...finalGroups, personalGroup]
    }

    return finalGroups
  }, [isImpersonating, context, viewMode, isWorkerPure, isEligible, user?.company_slug, isCapabilityAvailable, term])

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
    w-64 lg:w-56 xl:w-56 shadow-2xl
    transform transition-transform duration-500 ease-out
    lg:relative lg:translate-x-0
    flex flex-col h-screen h-[100dvh] overflow-hidden nth-sidebar
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `}>
    {/* Impersonation Banner (Corporate Style) */}
    {isImpersonating && (
      <div className="bg-slate-900 border-b border-white/10 p-2.5 sm:p-3 animate-in slide-in-from-top duration-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center">
            <Shield className="w-3 h-3 text-amber-500 animate-pulse" />
          </div>
          <span className="text-[9px] font-bold tracking-tight text-slate-400">Auditoría de Empresa</span>
        </div>
        <button 
          onClick={handleStopImpersonation}
          disabled={isExiting}
          className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-md text-[10px] font-bold tracking-normal transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-xs"
        >
          {isExiting ? 'Saliendo...' : (
            <>
              <ArrowLeft size={12} />
              Finalizar Auditoría
            </>
          )}
        </button>
      </div>
    )}

    <div className="px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center justify-between nth-divider border-b">
      <div className="flex items-center gap-2.5 text-white">
        <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg nth-logo-box shrink-0">
          <img 
            src={settings?.ecosystem_logo || "/logo-ops.png"}
            alt={settings?.ecosystem_name || "Inthaly OPS Logo"}
            className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span 
            className="text-sm sm:text-base font-bold tracking-tight leading-none whitespace-nowrap text-white" 
            style={settings?.brand_color ? { color: settings.brand_color } : {}}
          >
            {settings?.ecosystem_name || "Inthaly OPS"}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-semibold text-white/90 tracking-normal px-1.5 py-0.5 bg-white/10 rounded-sm">
              {industryLabel || "Sistema de Gestión"}
            </span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setIsOpen(false)}
        className="lg:hidden p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-all"
      >
        <X size={16} />
      </button>
    </div>

    {/* Navigation items */}
    <nav className="flex-1 min-h-0 px-2 sm:px-2.5 py-1.5 space-y-1 overflow-y-auto custom-scrollbar flex flex-col pb-20 md:pb-4">
      <div className="flex-1 space-y-1">
        {filteredGroups.map((group) => {
          const isCollapsed = collapsed[group.id]
          const hasActiveChild = group.items.some((item: any) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
          const isOpenByDefault = (group.id === 'mecanica' && context === 'MECANICA') || (group.id === 'operaciones' && context === 'SUPERVISOR')
          const effectivelyCollapsed = isCollapsed === undefined ? (isOpenByDefault ? false : !hasActiveChild) : isCollapsed

          const toggleGroup = () => {
            setCollapsed(prev => ({ ...prev, [group.id]: !effectivelyCollapsed }))
          }

          return (
            <div key={group.id} className="pt-2 first:pt-0">
              <button
                onClick={toggleGroup}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold tracking-tight transition-colors group nth-nav-group-label"
              >
                <span>{group.label}</span>
                {effectivelyCollapsed ? (
                  <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform opacity-50" />
                ) : (
                  <ChevronDown size={13} className="opacity-80" />
                )}
              </button>
              
              {!effectivelyCollapsed && (
                <div className="mt-0.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {group.items.map((item: any) => {
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
                    const status = item.status || 'ACTIVE'
                    const isComingSoon = status === 'COMING_SOON'
                    const isPrototype = status === 'PROTOTYPE'
                    const isBeta = status === 'BETA'

                    return (
                      <Link
                        key={`${group.id}-${item.href}-${item.name}`}
                        href={item.href}
                        onClick={(e) => {
                          if (isComingSoon) {
                            e.preventDefault()
                            setRoadmapItem({ key: item.capability || null, name: item.name })
                            return
                          }
                          handleItemClick(group.id, item.href, item.name, e)
                        }}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium text-xs group/item nth-nav-item transition-all ${
                          isActive ? 'nth-nav-item-active' : ''
                        } ${isComingSoon ? 'opacity-80 hover:opacity-100' : ''}`}
                      >
                        <Icon 
                          size={14} 
                          strokeWidth={2.2} 
                          className={`transition-colors shrink-0 ${
                            isActive 
                              ? 'text-blue-600' 
                              : isComingSoon 
                              ? 'text-amber-400/80 group-hover/item:text-amber-400' 
                              : isPrototype 
                              ? 'text-purple-400/80 group-hover/item:text-purple-400' 
                              : 'opacity-70'
                          }`} 
                        />
                        <span className="tracking-tight truncate text-[11px] sm:text-xs">
                          {item.name}
                        </span>

                        {/* Lifecycle Badges */}
                        {isBeta && (
                          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                            Beta
                          </span>
                        )}
                        {isPrototype && (
                          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                            Prototipo
                          </span>
                        )}
                        {isComingSoon && (
                          <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.2 rounded-sm bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                            Próximamente
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-3 pb-2 mt-auto border-t border-white/10 shrink-0">
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-2.5 px-2.5 py-1.5 transition-all rounded-lg font-medium text-xs group nth-nav-item">
            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-white/15 transition-colors shrink-0">
              <LogOut size={14} className="opacity-60 group-hover:opacity-100" />
            </div>
            <span className="text-[11px] sm:text-xs">Cerrar sesión</span>
          </button>
        </form>
      </div>
    </nav>
  </aside>

  {/* Roadmap Modal for COMING_SOON capabilities */}
  <RoadmapModal
    isOpen={Boolean(roadmapItem)}
    onClose={() => setRoadmapItem(null)}
    capabilityKey={roadmapItem?.key || null}
    capabilityName={roadmapItem?.name || ''}
    industryLabel={industryLabel}
  />
 </>
 )
}
