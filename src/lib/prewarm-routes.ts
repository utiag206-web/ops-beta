// INTHALY OPS - Comprehensive Route Pre-warmer for Universal Offline Navigation
// Pre-caches HTML and RSC payloads of all operational, administrative, and configuration submodules.

export const APP_ROUTES = [
  // 1. Centro de Control
  '/dashboard',
  '/profile',

  // 2. Control de Planta y Mineral (Offline-First Completo)
  '/operaciones/planta',

  // 3. Mecánica y Submódulos
  '/mecanica',
  '/mecanica/checklists',
  '/mecanica/compresora-combustible',
  '/mecanica/compresora-mantenimiento',
  '/mecanica/equipos-mina',
  '/mecanica/generador-combustible',
  '/mecanica/generador-mantenimiento',
  '/mecanica/herramientas',
  '/mecanica/mantenimiento-vehiculos',

  // 4. Personal, Asistencia y Tareo
  '/attendance',
  '/tareo',
  '/workers',
  '/documents',
  '/bonuses',

  // 5. Logística, Almacén e Inventario
  '/movements',
  '/inventory/stock',
  '/inventory/products',
  '/inventory/kardex',
  '/inventory/history',
  '/inventory/reports',
  '/configuracion/warehouses',

  // 6. SOMA / HSEC
  '/soma/hsec',
  '/soma/capacitaciones',
  '/soma/charlas',

  // 7. Operaciones Auxiliares y Gestión
  '/requerimientos',
  '/caja-chica',
  '/assets',
  '/operaciones/campo',
  '/reports/export-center',
  '/company',
  '/users',
  '/ppe',
  '/camp',

  // 8. Super Admin / Centro Corporativo
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

let isPrewarmingStarted = false

export async function warmApplicationRoutes() {
  if (typeof window === 'undefined' || isPrewarmingStarted) return
  if (!navigator.onLine) return

  // Do not prewarm on unauthenticated or public entry pages
  const p = window.location.pathname
  if (p === '/login' || p.startsWith('/auth') || p === '/forgot-password' || p === '/reset-password' || p === '/offline') {
    return
  }

  isPrewarmingStarted = true
  console.log('[PREWARM] Starting background pre-warming of', APP_ROUTES.length, 'routes...')

  // Wait 1.5s for initial page render to complete
  await new Promise(r => setTimeout(r, 1500))

  const batchSize = 2
  for (let i = 0; i < APP_ROUTES.length; i += batchSize) {
    if (!navigator.onLine) {
      console.log('[PREWARM] Connection lost. Pausing route pre-warming.')
      break
    }
    const batch = APP_ROUTES.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map(async (route) => {
        try {
          // Pre-warm RSC payload
          await fetch(route + '?_rsc=prewarm', {
            headers: {
              'RSC': '1',
              'Accept': 'text/x-component'
            }
          })
          // Pre-warm HTML document
          await fetch(route, {
            headers: {
              'Accept': 'text/html'
            }
          })
        } catch (_) {}
      })
    )
    // Small throttle between batches to ensure main thread stays 100% responsive
    await new Promise(r => setTimeout(r, 200))
  }

  console.log('[PREWARM] Route pre-warming completed successfully.')
}
