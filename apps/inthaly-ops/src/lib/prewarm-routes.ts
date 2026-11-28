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

const CRITICAL_OFFLINE_ROUTES = [
  '/offline',
  '/dashboard',
  '/workers',
  '/attendance',
  '/tareo',
  '/requerimientos',
  '/caja-chica',
  '/inventory/stock',
  '/operaciones/planta',
  '/mecanica'
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
    // 1. Prewarm primary offline shell
    await fetch('/offline', { headers: { 'Accept': 'text/html' } }).catch(() => {})

    // 2. Prewarm critical operational modules sequentially in idle without flooding server
    for (const route of CRITICAL_OFFLINE_ROUTES) {
      if (route === p) continue // Already loaded in current view
      try {
        // Fetch both HTML document and RSC payload so route is fully navigable offline
        const [htmlRes] = await Promise.all([
          fetch(route, { headers: { 'Accept': 'text/html' } }),
          fetch(route, { headers: { 'RSC': '1' } }).catch(() => null)
        ])

        if (htmlRes && htmlRes.ok) {
          const htmlText = await htmlRes.text()
          const chunkMatches = Array.from(new Set(htmlText.match(/\/_next\/static\/(?:chunks|css)\/[a-zA-Z0-9_\-\.\/]+\.(?:js|css)/g) || []))
          if (chunkMatches.length > 0) {
            // Pre-cache runtime scripts/styles in batches of 4
            for (let i = 0; i < chunkMatches.length; i += 4) {
              const batch = chunkMatches.slice(i, i + 4)
              await Promise.allSettled(batch.map(chunk => fetch(chunk).catch(() => null)))
            }
          }
        }
        // Polite delay between routes to avoid competing with user interactions
        await new Promise(resolve => setTimeout(resolve, 250))
      } catch (_) {
        // Soft fail per route, continue warming others
      }
    }
  } catch (_) {
  } finally {
    isPrewarmingRunning = false
    isPrewarmingComplete = true
  }
}
