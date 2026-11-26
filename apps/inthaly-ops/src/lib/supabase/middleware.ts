import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const MW_TOKEN_CACHE_TTL = 30 * 1000
const mwTokenCache: Map<string, { user: any; timestamp: number }> =
  (globalThis as any).__inthaly_mw_token_cache ?? ((globalThis as any).__inthaly_mw_token_cache = new Map())

function isJwtFarFromExpiry(cookieVal: string): boolean {
  try {
    let raw = cookieVal
    if (raw.startsWith('base64-')) {
      raw = Buffer.from(raw.slice(7), 'base64').toString('utf8')
    }
    const parsed = raw.startsWith('{') ? JSON.parse(raw) : null
    if (parsed?.expires_at && typeof parsed.expires_at === 'number') {
      return (parsed.expires_at * 1000) - Date.now() > 120 * 1000
    }
  } catch {}
  return false
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const workerSessionCookie = request.cookies.get('worker_session')?.value
  if (workerSessionCookie && (pathname === '/' || pathname === '/login')) {
    try {
      const session = JSON.parse(decodeURIComponent(workerSessionCookie))
      if (session?.companySlug) {
        const url = request.nextUrl.clone()
        url.pathname = `/w/${session.companySlug}`
        return NextResponse.redirect(url)
      }
    } catch (e) {
      console.error('[MIDDLEWARE] Error parsing worker session:', e)
    }
  }

  // Inject x-pathname into request headers so React Server Components can read it via headers()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Fast-path for public unauthenticated routes when no Supabase auth cookie is present:
  const authCookie = request.cookies.getAll().find(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
  const hasSbAuthCookie = Boolean(authCookie?.value)
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
    pathname.startsWith('/workers') || 
    pathname.startsWith('/profile') ||
    pathname.startsWith('/super-admin')

  if (!hasSbAuthCookie) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    supabaseResponse.headers.set('x-pathname', pathname)
    return supabaseResponse
  }

  const tokenKey = authCookie!.value.slice(-64)
  const now = Date.now()
  const cachedMwUser = mwTokenCache.get(tokenKey)
  if (cachedMwUser && (now - cachedMwUser.timestamp) < MW_TOKEN_CACHE_TTL && isJwtFarFromExpiry(authCookie!.value)) {
    supabaseResponse.headers.set('x-pathname', pathname)
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user
  if (user && !authError) {
    mwTokenCache.set(tokenKey, { user, timestamp: now })
  }

  if (authError && isProtectedRoute) {
    console.error(`[MIDDLEWARE] ❌ Auth Error on ${pathname}: ${authError.message}`)
  }

  // Handle Protected Routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Inject current pathname on response as well
  supabaseResponse.headers.set('x-pathname', pathname)

  return supabaseResponse
}
