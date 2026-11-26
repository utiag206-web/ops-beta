// INTHALY OPS - Comprehensive Route & Static Asset Pre-warmer for Universal Offline Navigation
// Pre-caches HTML documents, RSC Flight streams, and all client-side JavaScript/CSS chunks.

export const APP_ROUTES = [
  // 1. Centro de Control y Módulos Operativos Críticos (Prioridad 1)
  '/dashboard',
  '/tareo',
  '/attendance',
  '/workers',
  '/operaciones/produccion',
  '/operaciones/planta',
  '/mecanica',
  '/caja-chica',
  '/inventory/stock',
  '/requerimientos',
  '/offline',
  '/profile',

  // 2. Submódulos de Mecánica y Planta
  '/mecanica/checklists',
  '/mecanica/equipos-mina',
  '/mecanica/mantenimiento-vehiculos',
  '/mecanica/herramientas',
  '/mecanica/generador-mantenimiento',
  '/mecanica/compresora-mantenimiento',
  '/mecanica/generador-combustible',
  '/mecanica/compresora-combustible',
  '/operaciones/maderas',
  '/operaciones/campo',

  // 3. Logística, Inventario y Documentación
  '/movements',
  '/inventory/products',
  '/inventory/kardex',
  '/inventory/history',
  '/inventory/reports',
  '/documents',
  '/bonuses',
  '/assets',
  '/ppe',
  '/camp',

  // 4. Seguridad SOMA y Reportes
  '/soma/hsec',
  '/soma/capacitaciones',
  '/soma/charlas',
  '/reports/export-center',
  '/configuracion/warehouses',
  '/company',
  '/users',

  // 5. Centro Corporativo Super Admin
  '/super-admin',
  '/super-admin/companies',
  '/super-admin/users',
  '/super-admin/settings',
  '/super-admin/settings/general',
  '/super-admin/settings/capabilities',
  '/super-admin/settings/security',
  '/super-admin/settings/multiempresa',
  '/super-admin/settings/audit'
]

let isPrewarmingRunning = false
let isPrewarmingComplete = false

export async function warmApplicationRoutes(force = false) {
  if (typeof window === 'undefined') return
  if (!navigator.onLine) return
  if (isPrewarmingRunning) return
  if (isPrewarmingComplete && !force) return
  if (process.env.NODE_ENV === 'development') return

  const p = window.location.pathname
  if (
    p === '/' ||
    p === '/login' ||
    p === '/register' ||
    p.startsWith('/auth') ||
    p.startsWith('/activar') ||
    p.startsWith('/comunidad') ||
    p.startsWith('/id') ||
    p === '/forgot-password' ||
    p === '/reset-password' ||
    p === '/offline'
  ) {
    return
  }

  isPrewarmingRunning = true
  try {
    // Pre-cache only the lightweight offline shell fallback on idle without flooding SSR/Supabase with 44 route renders
    await fetch('/offline', { headers: { 'Accept': 'text/html' } })
  } catch (_) {
  } finally {
    isPrewarmingRunning = false
    isPrewarmingComplete = true
  }
}
