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
  // En entorno local de desarrollo, Next.js compila bajo demanda (JIT).
  // Precalentar 44 rutas simultáneas satura el servidor de desarrollo y provoca ChunkLoadError.
  if (process.env.NODE_ENV === 'development') return

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
  } catch (err) {
    console.warn('[PREWARM] /dashboard prime hiccup:', err)
  }

  // Step 2: Batch pre-warm all remaining routes (HTML, JS/CSS static assets, and RSC flight payloads)
  // Utiliza un lote controlado y pausa de 600ms para evitar saturación de red mientras el usuario navega
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

          // Pre-warm canonical RSC flight stream (el Service Worker lo indexa por pathname y request)
          await fetch(route, { 
            headers: { 'RSC': '1', 'Accept': 'text/x-component' },
            cache: 'no-cache' 
          })
        } catch (_) {}
      })
    )
    // Pausa optimizada para no colisionar con el uso interactivo del usuario
    await new Promise(r => setTimeout(r, 600))
  }

  isPrewarmingRunning = false
  isPrewarmingComplete = true
  console.log('[PREWARM] Universal route and static asset pre-warming completed successfully.')
}
