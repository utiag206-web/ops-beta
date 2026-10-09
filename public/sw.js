// INTHALY OPS - Production Service Worker (Next.js 15 App Router Compatible)
// Universal Offline Navigation & Sanitized Cache-API Match Architecture

const CACHE_PREFIX = 'inthaly-ops'
const CACHE_VERSION = 'v1.2.5'
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
          if (networkResponse && networkResponse.status === 200 && !networkResponse.redirected) {
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
          const cached = (await cache.match(url.pathname, { ignoreSearch: true })) ||
                         (await cache.match(request, { ignoreSearch: true }))
          if (cached) {
            return cached
          }
          // IMPORTANT: Do NOT return mismatched RSC payloads (such as /dashboard) for other routes!
          // Throwing a TypeError simulates network failure, which allows Next.js router
          // to trigger native document navigation fallback, served cleanly from PAGES_CACHE.
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
          const cachedPage = (await cache.match(url.pathname, { ignoreSearch: true })) ||
                             (await cache.match(request, { ignoreSearch: true }))
          if (cachedPage) {
            return cachedPage
          }

          // Dedicated offline fallback: NEVER return /dashboard HTML for other routes
          // to prevent Next.js App Router hydration mismatches

          const staticCache = await caches.open(STATIC_CACHE)
          const offlineFallback = await staticCache.match('/offline')
          if (offlineFallback) return offlineFallback

          return new Response('<h1>Sin conexión</h1><p>Esta aplicación está operando sin conexión a Internet.</p>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 200
          })
        }
      })()
    )
    return
  }
})
