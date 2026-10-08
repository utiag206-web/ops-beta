// INTHALY OPS - Production Service Worker (Next.js 15 App Router Compatible)
// Resilient Offline-First Architecture without obsolete static hashes

const CACHE_PREFIX = 'inthaly-ops'
const CACHE_VERSION = 'v1.2.1'
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`
const PAGES_CACHE = `${CACHE_PREFIX}-pages-${CACHE_VERSION}`
const RSC_CACHE = `${CACHE_PREFIX}-rsc-${CACHE_VERSION}`
const MEDIA_CACHE = `${CACHE_PREFIX}-media-${CACHE_VERSION}`

const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, RSC_CACHE, MEDIA_CACHE]

const PRECACHE_ASSETS = [
  '/offline',
  '/manifest.json',
  '/logo-ops.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
]

// 1. INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      // Use allSettled so that missing optional icons never abort SW installation
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-cache' })
            if (response.ok) {
              await cache.put(url, response)
            }
          } catch (e) {
            console.warn('[SW] Precache non-critical failure for:', url, e)
          }
        })
      )
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
    // Cross-origin: fonts.gstatic.com or fonts.googleapis.com
    if (url.hostname.includes('gstatic.com') || url.hostname.includes('googleapis.com')) {
      event.respondWith(
        caches.open(MEDIA_CACHE).then(async (cache) => {
          const cached = await cache.match(request)
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
        const cached = await cache.match(request)
        if (cached) return cached

        try {
          const networkResponse = await fetch(request)
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone())
          }
          return networkResponse
        } catch (err) {
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
      caches.open(RSC_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(request)
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone())
            cache.put(url.pathname, networkResponse.clone())
            // Warm-cache the HTML document in PAGES_CACHE in the background for smooth offline document navigation
            caches.open(PAGES_CACHE).then((pCache) => {
              fetch(url.pathname, { cache: 'no-cache' }).then((docRes) => {
                if (docRes && docRes.status === 200) {
                  pCache.put(url.pathname, docRes)
                }
              }).catch(() => {})
            })
          }
          return networkResponse
        } catch (err) {
          const cached = (await cache.match(request, { ignoreSearch: true, ignoreVary: true })) ||
                         (await cache.match(url.pathname, { ignoreSearch: true, ignoreVary: true }))
          if (cached) return cached
          return new Response('', { status: 408, statusText: 'Offline RSC Unavailable' })
        }
      })
    )
    return
  }

  // C. Media, Images, Fonts
  if (/\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
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

  // D. Navigation Requests (HTML Documents: mode === 'navigate')
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(PAGES_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(request)
          if (networkResponse && networkResponse.status === 200) {
            // Save both the full request and the URL pathname for robust matching
            cache.put(request, networkResponse.clone())
            cache.put(url.pathname, networkResponse.clone())
          }
          return networkResponse
        } catch (err) {
          // Network failed: Try matching exact request or pathname from pages cache
          const cachedPage = (await cache.match(request)) || (await cache.match(url.pathname))
          if (cachedPage) {
            console.log('[SW] Serving cached page for:', url.pathname)
            return cachedPage
          }

          // Fallback to cached App Shell or /offline
          const staticCache = await caches.open(STATIC_CACHE)
          const offlineFallback = await staticCache.match('/offline')
          if (offlineFallback) {
            console.log('[SW] Serving /offline fallback for:', url.pathname)
            return offlineFallback
          }

          // Super Admin or Company context fallback for start_url (/dashboard or /)
          if (url.pathname === '/dashboard' || url.pathname === '/') {
            const superAdminFallback = await cache.match('/super-admin')
            if (superAdminFallback) return superAdminFallback
            const dashboardFallback = await cache.match('/dashboard')
            if (dashboardFallback) return dashboardFallback
          }

          // Last resort: try root /dashboard if available
          const dashboardFallback = await cache.match('/dashboard')
          if (dashboardFallback) return dashboardFallback

          return new Response('<h1>Sin conexión</h1><p>Esta aplicación está operando sin conexión a Internet.</p>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 200
          })
        }
      })
    )
    return
  }
})

