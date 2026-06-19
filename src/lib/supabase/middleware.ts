import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Redirect worker to portal if session exists and they access landing or login
  const workerSessionCookie = request.cookies.get('worker_session')?.value
  if (workerSessionCookie && (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login')) {
    try {
      const session = JSON.parse(decodeURIComponent(workerSessionCookie))
      if (session?.companySlug) {
        console.log(`[MIDDLEWARE] 🔄 Worker session found. Redirecting to portal: /w/${session.companySlug}`)
        const url = request.nextUrl.clone()
        url.pathname = `/w/${session.companySlug}`
        return NextResponse.redirect(url)
      }
    } catch (e) {
      console.error('[MIDDLEWARE] Error parsing worker session:', e)
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  
  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user

  console.log(`[MIDDLEWARE] 🛡️ Path: ${request.nextUrl.pathname}`)
  console.log(`[MIDDLEWARE] 👤 User Auth ID: ${user?.id || 'NO_SESSION'}`)
  if (authError) console.error(`[MIDDLEWARE] ❌ Auth Error: ${authError.message}`)

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') || 
                     request.nextUrl.pathname.startsWith('/auth')
  
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                           request.nextUrl.pathname.startsWith('/workers') || 
                           request.nextUrl.pathname.startsWith('/profile') ||
                           request.nextUrl.pathname.startsWith('/super-admin')

  // Handle Protected Routes
  if (!user && isProtectedRoute) {
    console.log(`[MIDDLEWARE] 🚫 Access Denied to ${request.nextUrl.pathname}. Redirecting to /login`)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Handle root route
  if (request.nextUrl.pathname === '/' && user) {
    console.log(`[MIDDLEWARE] 🏠 Root detected with session. Allowing app to handle entry.`)
  }

  console.log(`[MIDDLEWARE] ✅ Session valid for path: ${request.nextUrl.pathname}. Passing to Layout.`)
  
  // Inject current pathname so Layouts can read it for RBAC
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)

  return supabaseResponse
}
