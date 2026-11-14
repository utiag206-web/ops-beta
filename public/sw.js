// INTHALY OPS - Production Service Worker (Next.js 15 App Router Compatible)
// Universal Offline Navigation, Static Asset Pre-caching & Sanitized Cache-API Match Architecture

const CACHE_PREFIX = 'inthaly-ops'
const CACHE_VERSION = 'v1.4.1'
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`
const PAGES_CACHE = `${CACHE_PREFIX}-pages-${CACHE_VERSION}`
const RSC_CACHE = `${CACHE_PREFIX}-rsc-${CACHE_VERSION}`
const MEDIA_CACHE = `${CACHE_PREFIX}-media-${CACHE_VERSION}`

const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, RSC_CACHE, MEDIA_CACHE]

const PRECACHE_ASSETS = [
  '/offline',
  '/icon.svg',
  '/logo-ops.svg',
  '/manifest.json',
  '/logo-ops.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
]

// Sanitizer helper: Removes Vary header to ensure Cache API matches offline requests reliably
async function cleanResponseForCache(response) {
  const blob = await response.clone().blob()
  const headers = new Headers(response.headers)
  headers.delete('vary')
  headers.delete('Vary')
  headers.set('Cache-Control', 'public, max-age=31536000')
  return new Response(blob, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  })
}

// 1. INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      console.log('[SW] Precaching resilient offline shell assets...')
      
      // 1. Precache base shell assets
      await Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Failed to precache asset:', url, err)
          })
        )
      )

      // 2. CRITICAL: Deep precache /offline chunks (HTML + dynamic JavaScript bundles + CSS)
      // Guarantees zero ChunkLoadError when disconnected devices navigate to offline fallback
      try {
        const offlineRes = await fetch('/offline', { cache: 'no-cache' })
        if (offlineRes.ok) {
          const sanitized = await cleanResponseForCache(offlineRes)
          await cache.put('/offline', sanitized.clone())
          const htmlText = await offlineRes.text()
          const chunkMatches = Array.from(new Set(htmlText.match(/\/_next\/static\/(?:chunks|css)\/[a-zA-Z0-9_\-\.\/]+\.(?:js|css)/g) || []))
          if (chunkMatches.length > 0) {
            console.log('[SW] Deep precaching', chunkMatches.length, 'runtime scripts/styles for /offline fallback')
            await Promise.allSettled(
              chunkMatches.map((chunkUrl) =>
                cache.add(chunkUrl).catch((err) => console.warn('[SW] Failed /offline chunk:', chunkUrl, err))
              )
            )
          }
        }
      } catch (err) {
        console.warn('[SW] Deep precache for /offline failed:', err)
      }
    })()
  )
})

// 2. ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map((name) => {
          if (name.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.includes(name)) {
            console.log('[SW] Deleting stale cache:', name)
            return caches.delete(name)
          }
        })
      )
      await self.clients.claim()
      console.log('[SW] Active & Claimed clients with version:', CACHE_VERSION)
    })()
  )
})

// 3. FETCH
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // Only handle GET requests from same-origin
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) {
    // Cross-origin fonts
    if (url.hostname.includes('gstatic.com') || url.hostname.includes('googleapis.com')) {
      event.respondWith(
        caches.open(MEDIA_CACHE).then(async (cache) => {
          const cached = await cache.match(request, { ignoreSearch: true, ignoreVary: true })
          if (cached) return cached
          try {
            const res = await fetch(request)
            if (res.ok) cache.put(request, res.clone())
            return res
          } catch {
            return cached || new Response('', { status: 408 })
          }
        })
      )
    }
    return
  }

  // Bypass API routes and Supabase Auth callbacks
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/callback')) {
    return
  }

  // A. Next.js Static Assets (Immutable hashed files in /_next/static/*)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const isLocalDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1'

        // En producción busca en caché primero. En desarrollo local, busca en red primero
        // para garantizar que siempre se sirva el chunk de la compilación activa de Next.js
        if (!isLocalDev) {
          const cached = (await cache.match(request, { ignoreSearch: true, ignoreVary: true })) ||
                         (await cache.match(url.pathname, { ignoreSearch: true, ignoreVary: true }))
          if (cached) return cached
        }

        try {
          const networkResponse = await fetch(request)
          if (networkResponse && networkResponse.status === 200 && !networkResponse.redirected) {
            const sanitized = await cleanResponseForCache(networkResponse)
            await cache.put(request, sanitized.clone())
            await cache.put(url.pathname, sanitized)
          }
          return networkResponse
        } catch (err) {
          const cached = (await cache.match(request, { ignoreSearch: true, ignoreVary: true })) ||
                         (await cache.match(url.pathname, { ignoreSearch: true, ignoreVary: true }))
          if (cached) return cached
          throw err
        }
      })
    )
    return
  }

  // B. Next.js App Router RSC Requests (payloads for client-side navigation)
  const isRsc = request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')
  if (isRsc) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RSC_CACHE)
        try {
          const networkResponse = await fetch(request)
          if (networkResponse && networkResponse.status === 200 && !networkResponse.redirected) {
            const sanitized = await cleanResponseForCache(networkResponse)
            await cache.put(url.pathname, sanitized.clone())
            await cache.put(request, sanitized)
          }
          return networkResponse
        } catch (err) {
          const cached = (await cache.match(url.pathname, { ignoreSearch: true, ignoreVary: true })) ||
                         (await cache.match(request, { ignoreSearch: true, ignoreVary: true }))
          if (cached) {
            return cached
          }
          throw new TypeError('Offline RSC unavailable')
        }
      })()
    )
    return
  }

  // C. Media, Images, Fonts
  if (/\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(request, { ignoreSearch: true, ignoreVary: true })
        const fetchPromise = fetch(request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            cache.put(request, networkRes.clone())
          }
          return networkRes
        }).catch(() => cached)

        return cached || fetchPromise
      })
    )
    return
  }

  // D. Navigation Requests and HTML Documents (mode === 'navigate' OR Accept text/html)
  const isHtml = request.mode === 'navigate' || 
                 (request.headers.get('Accept')?.includes('text/html') && !isRsc)
  if (isHtml) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES_CACHE)
        try {
          const networkResponse = await fetch(request)
          if (networkResponse && networkResponse.status === 200 && !networkResponse.redirected) {
            const sanitized = await cleanResponseForCache(networkResponse)
            await cache.put(url.pathname, sanitized.clone())
            await cache.put(request, sanitized)
          }
          return networkResponse
        } catch (err) {
          // 1. Exact match on requested route
          let cachedPage = (await cache.match(url.pathname, { ignoreSearch: true, ignoreVary: true })) ||
                           (await cache.match(request, { ignoreSearch: true, ignoreVary: true }))
          if (cachedPage) {
            return cachedPage
          }

          // 2. Cold-start resilience: If root "/" is opened offline, serve cached /dashboard
          if (url.pathname === '/' || url.pathname === '') {
            const dashboardFallback = await cache.match('/dashboard', { ignoreSearch: true, ignoreVary: true })
            if (dashboardFallback) {
              return dashboardFallback
            }
          }

          // 3. Dedicated offline fallback page
          const staticCache = await caches.open(STATIC_CACHE)
          const offlineFallback = await staticCache.match('/offline')
          if (offlineFallback) return offlineFallback

          // 4. Ultra-resilient In-line Emergency Corporate Fallback (Zero external network dependencies)
          const emergencyHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Modo Desconectado — INTHALY OPS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at top, #0b1b3d 0%, #06122e 100%);
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 1.5rem;
      padding: 2rem 1.75rem;
      max-width: 26rem;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      background: #fbbf24;
      border-radius: 9999px;
      box-shadow: 0 0 8px #fbbf24;
    }
    h1 {
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: -0.025em;
      margin-bottom: 0.5rem;
      color: #ffffff;
    }
    p {
      color: #94a3b8;
      font-size: 0.825rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.825rem;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #2563eb;
      color: white;
    }
    .btn-primary:active {
      transform: scale(0.97);
      background: #1d4ed8;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn-secondary:active {
      transform: scale(0.97);
      background: rgba(255, 255, 255, 0.15);
    }
    .footer {
      margin-top: 1.25rem;
      font-size: 0.7rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="dot"></span>
      Modo Desconectado
    </div>
    <h1>Módulo no sincronizado</h1>
    <p>Esta pantalla no llegó a descargarse antes de perder internet. Tus datos y las operaciones registradas localmente siguen 100% protegidas en tu equipo.</p>
    <div class="actions">
      <button class="btn btn-primary" onclick="window.location.href='/dashboard'">Volver al Dashboard</button>
      <button class="btn btn-secondary" onclick="window.location.reload()">Reintentar conexión</button>
    </div>
    <div class="footer">INTHALY OPS — Sistema Offline-First</div>
  </div>
</body>
</html>`

          return new Response(emergencyHtml, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 200
          })
        }
      })()
    )
    return
  }
})
