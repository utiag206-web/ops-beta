// INTHALY OPS - Production Service Worker (Next.js 15 App Router Compatible)
// Universal Offline Navigation & Resilient Module-Level Offline-First Architecture

const CACHE_PREFIX = 'inthaly-ops'
const CACHE_VERSION = 'v1.2.4'
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
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching resilient offline shell assets...')
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Failed to precache asset:', url, err)
          })
        )
      )
    })
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
            // Warm-cache the HTML document in PAGES_CACHE in the background
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

          // Fallback to cached dashboard RSC payload so client-side router transition succeeds
          const fallbackRsc = (await cache.match('/dashboard', { ignoreSearch: true, ignoreVary: true })) ||
                              (await cache.match('/super-admin', { ignoreSearch: true, ignoreVary: true }))
          if (fallbackRsc) {
            console.log('[SW] Serving App Shell fallback RSC for:', url.pathname)
            return fallbackRsc
          }

          throw new TypeError('Offline RSC fetch failure - falling back to document navigation')
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

            // Pre-warm the RSC payload for this route so client-side navigation has it cached
            caches.open(RSC_CACHE).then(async (rscCache) => {
              try {
                const rscRes = await fetch(url.pathname, {
                  headers: { 'RSC': '1' }
                })
                if (rscRes && rscRes.status === 200) {
                  rscCache.put(url.pathname, rscRes)
                }
              } catch (_) {}
            })
          }
          return networkResponse
        } catch (err) {
          // Network failed: Try matching exact request or pathname from pages cache
          const cachedPage = (await cache.match(request)) || (await cache.match(url.pathname))
          if (cachedPage) {
            console.log('[SW] Serving cached page for:', url.pathname)
            return cachedPage
          }

          // UNIVERSAL OFFLINE NAVIGATION:
          // If this is an authenticated app navigation, ALWAYS serve the cached App Shell (/dashboard or /super-admin)!
          // This ensures the user stays inside the application shell (Header, Sidebar, Navigation) rather than being trapped in an isolated offline screen!
          const dashboardFallback = await cache.match('/dashboard')
          if (dashboardFallback) {
            console.log('[SW] Serving cached /dashboard App Shell for un-cached route:', url.pathname)
            return dashboardFallback
          }

          const superAdminFallback = await cache.match('/super-admin')
          if (superAdminFallback) {
            console.log('[SW] Serving cached /super-admin App Shell for un-cached route:', url.pathname)
            return superAdminFallback
          }

          // If no App Shell is cached at all (e.g. brand new install opened offline before any login), fallback to /offline
          const staticCache = await caches.open(STATIC_CACHE)
          const offlineFallback = await staticCache.match('/offline')
          if (offlineFallback) return offlineFallback

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
