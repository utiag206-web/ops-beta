// INTHALY OPS - Comprehensive Route & Static Asset Pre-warmer for Universal Offline Navigation
// Pre-caches HTML documents, RSC Flight streams, and all client-side JavaScript/CSS chunks.

export const APP_ROUTES = [
  // 1. Centro de Control
  '/dashboard',
  '/profile',

  // 2. Control de Planta y Mineral (Offline-First Completo)
  '/operaciones/planta',
  '/operaciones/produccion',
  '/operaciones/maderas',

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

let isPrewarmingRunning = false
let isPrewarmingComplete = false

export async function warmApplicationRoutes(force = false) {
  if (typeof window === 'undefined') return
  if (!navigator.onLine) return
  if (isPrewarmingRunning) return
  if (isPrewarmingComplete && !force) return

  const p = window.location.pathname
  if (p === '/login' || p.startsWith('/auth') || p === '/forgot-password' || p === '/reset-password' || p === '/offline') {
    return
  }

  isPrewarmingRunning = true
  console.log('[PREWARM] Initiating comprehensive offline pre-warming of', APP_ROUTES.length, 'routes...')

  // Step 1: Pre-warm /dashboard first to guarantee cold-start opening resilience
  try {
    const dashDocRes = await fetch('/dashboard', { 
      headers: { 'Accept': 'text/html' },
      cache: 'no-cache' 
    })
    if (dashDocRes.ok) {
      const htmlText = await dashDocRes.text()
      const chunkMatches = Array.from(new Set(htmlText.match(/\/_next\/static\/(?:chunks|css)\/[a-zA-Z0-9_\-\.\/]+\.(?:js|css)/g) || []))
      await Promise.allSettled(chunkMatches.map(u => fetch(u, { cache: 'no-cache' })))
    }
    await fetch('/dashboard', { 
      headers: { 'RSC': '1', 'Accept': 'text/x-component' },
      cache: 'no-cache' 
    })
    await fetch('/dashboard?_rsc=prewarm', { 
      headers: { 'RSC': '1', 'Accept': 'text/x-component' },
      cache: 'no-cache' 
    })
  } catch (err) {
    console.warn('[PREWARM] /dashboard prime hiccup:', err)
  }

  // Step 2: Batch pre-warm all remaining routes (HTML, JS/CSS static assets, and RSC flight payloads)
  const remainingRoutes = APP_ROUTES.filter(r => r !== '/dashboard')
  const batchSize = 2

  for (let i = 0; i < remainingRoutes.length; i += batchSize) {
    if (!navigator.onLine) {
      console.log('[PREWARM] Connection paused. Will resume when online.')
      break
    }
    const batch = remainingRoutes.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map(async (route) => {
        try {
          // Pre-warm HTML document and download referenced static chunks
          const htmlRes = await fetch(route, { 
            headers: { 'Accept': 'text/html' },
            cache: 'no-cache' 
          })
          if (htmlRes.ok) {
            const htmlText = await htmlRes.text()
            const chunkMatches = Array.from(new Set(htmlText.match(/\/_next\/static\/(?:chunks|css)\/[a-zA-Z0-9_\-\.\/]+\.(?:js|css)/g) || []))
            await Promise.allSettled(chunkMatches.map(u => fetch(u, { cache: 'no-cache' })))
          }

          // Pre-warm RSC flight streams
          await fetch(route, { 
            headers: { 'RSC': '1', 'Accept': 'text/x-component' },
            cache: 'no-cache' 
          })
          await fetch(route + '?_rsc=prewarm', { 
            headers: { 'RSC': '1', 'Accept': 'text/x-component' },
            cache: 'no-cache' 
          })
        } catch (_) {}
      })
    )
    // Small throttle between batches to ensure main thread stays 100% responsive
    await new Promise(r => setTimeout(r, 150))
  }

  isPrewarmingRunning = false
  isPrewarmingComplete = true
  console.log('[PREWARM] Universal route and static asset pre-warming completed successfully.')
}
