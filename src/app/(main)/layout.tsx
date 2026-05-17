import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { getUserSession } from '@/lib/auth'
import { OnboardingCheck } from '@/components/auth/onboarding-check'
import { RbacProvider } from '@/components/providers/rbac-provider'
import { SidebarProvider } from '@/components/providers/sidebar-provider'
import { headers } from 'next/headers'
import { hasPermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session;
  let headersList;
  try {
    session = await getUserSession()
    headersList = await headers()
  } catch (err) {
    console.error('[LAYOUT_CRITICAL_ERROR] Error fetching session or headers:', err)
    redirect('/login?message=Error+de+sesion')
  }

  const extendedUser = session?.extendedUser
  const pathname = (headersList.get('x-pathname') || '').split('?')[0]
  
  // 1. Mandatory Session Guard
  if (!extendedUser) {
    if (pathname !== '/dashboard' && pathname !== '/login') {
       redirect('/login')
    }
    if (pathname !== '/dashboard') return null
  }

  const moduleName = pathname.split('/')[1]
  const userRole = extendedUser?.role_id?.toLowerCase()
  
  console.log(`[LAYOUT] 🏁 Path: ${pathname} | User: ${extendedUser?.email || 'ANONYMOUS'} | Role: ${userRole}`)
  
  // 2. Variables for Guards
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'superadmin'
  const isImpersonating = !!extendedUser?.is_impersonating

  // 3. Super Admin Global Guard
  if (isSuperAdmin && !isImpersonating && !pathname.startsWith('/super-admin')) {
    console.log(`[LAYOUT] 🛡️ SuperAdmin detected outside /super-admin. Redirecting to /super-admin`)
    redirect('/super-admin')
  }

  // 4. Access Control Block for non-SuperAdmins
  if (!isSuperAdmin && pathname.startsWith('/super-admin')) {
    console.log(`[LAYOUT] ⛔ Non-SuperAdmin tried to access /super-admin. Redirecting to /dashboard`)
    redirect('/dashboard')
  }

  // 5. Worker Specific Guards (Optimized PRE-DEPLOY: No redundant DB fetch)
  if (userRole === 'trabajador') {
    if (extendedUser.worker_id && !extendedUser.worker_status) {
       console.warn(`[LAYOUT] ⚠️ Worker profile missing or inactive for ${extendedUser.email}`)
       redirect('/login')
    }

    const forbiddenSegments = ['/global', '/admin', '/users', '/workers', '/company', '/inventory', '/movements', '/caja-chica', '/configuracion']
    if (forbiddenSegments.some(segment => pathname.startsWith(segment))) {
       redirect('/dashboard')
    }
  }

  // 6. Generic RBAC Guard
  const cleanModule = moduleName || 'dashboard'
  if (cleanModule !== 'dashboard' && cleanModule !== 'profile') {
    if (!hasPermission(userRole as string, cleanModule, extendedUser?.area)) {
      console.warn(`[RBAC_GATEWAY] Access Denied: ${userRole} to /${cleanModule}`)
      redirect('/dashboard')
    }
  }

  return (
    <RbacProvider 
      role_id={extendedUser?.role_id} 
      permissions={(extendedUser as any)?.permissions}
      user={extendedUser}
    >
      <SidebarProvider>
        <div className="flex h-screen bg-slate-50 overflow-hidden relative">
          <Sidebar />
          <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
            {console.log("[LAYOUT_TRACE] 6. Rendering Header")}
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
              <div className="max-w-7xl mx-auto">
                {console.log("[LAYOUT_TRACE] 7. Rendering Children")}
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </RbacProvider>
  )
}
