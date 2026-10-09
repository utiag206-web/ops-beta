import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { getUserSession, getActiveViewMode } from '@/lib/auth'
import { OnboardingCheck } from '@/components/auth/onboarding-check'
import { RbacProvider } from '@/components/providers/rbac-provider'
import { SidebarProvider } from '@/components/providers/sidebar-provider'
import { GlobalSettingsProvider } from '@/components/providers/global-settings-provider'
import { OperationalContextProvider } from '@/components/providers/operational-context-provider'
import { headers } from 'next/headers'
import { hasPermission } from '@/lib/permissions'
import { getCapabilityForRoute, isCapabilityAvailable } from '@/lib/operating-profiles'
import { redirect } from 'next/navigation'
import { getGlobalSettings } from '@/app/(main)/super-admin/settings/general/actions'
import { serializeToLegacyArray } from '@/lib/rbac/engine'
import { OfflineSessionProvider } from '@/components/providers/offline-session-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getUserSession()
  const extendedUser = session?.extendedUser
  const viewMode = await getActiveViewMode()
  const globalSettings = await getGlobalSettings()
  
  const headersList = await headers()
  const pathname = (headersList.get('x-pathname') || '').split('?')[0]
  
  // 1. Mandatory Session Guard
  if (!extendedUser) {
    if (pathname !== '/dashboard' && pathname !== '/login') {
      redirect('/login')
    }
    if (pathname !== '/dashboard') return null
    redirect('/login')
  }

  const moduleName = pathname.split('/')[1]
  const userRole = extendedUser?.role_id?.toLowerCase()

  // 2. Variables for Guards
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'superadmin'
  const isImpersonating = !!extendedUser?.is_impersonating

  // 3. Super Admin Global Guard
  if (isSuperAdmin && !isImpersonating && !pathname.startsWith('/super-admin')) {
    console.log(`[LAYOUT] ðŸ›¡ï¸ SuperAdmin detected outside /super-admin. Redirecting to /super-admin`)
    redirect('/super-admin')
  }

  // 4. Access Control Block for non-SuperAdmins
  if (!isSuperAdmin && pathname.startsWith('/super-admin')) {
    console.log(`[LAYOUT] â›” Non-SuperAdmin tried to access /super-admin. Redirecting to /dashboard`)
    redirect('/dashboard')
  }

  // 5. Worker Specific Guards (Optimized PRE-DEPLOY: No redundant DB fetch)
  if (userRole === 'trabajador' || viewMode === 'WORKER') {
    if (userRole === 'trabajador' && extendedUser.worker_id && !extendedUser.worker_status) {
      console.warn(`[LAYOUT] âš ï¸ Worker profile missing or inactive for ${extendedUser.email}`)
      redirect('/login')
    }

    const forbiddenSegments = ['/global', '/admin', '/users', '/workers', '/company', '/inventory', '/movements', '/caja-chica', '/configuracion']
    if (forbiddenSegments.some(segment => pathname.startsWith(segment))) {
      redirect('/dashboard')
    }
  }

  // 6. Capability Gateway Guard: COMPANY_CAPABILITY
  // Si la ruta está asociada a una capacidad y no está disponible para la empresa, denegar acceso directo por URL.
  if (!isSuperAdmin && pathname && pathname !== '/dashboard' && pathname !== '/profile') {
    const routeCapability = getCapabilityForRoute(pathname)
    if (routeCapability) {
      const operatingProfile = (extendedUser as any)?.operating_profile
      const companyIndustry = operatingProfile?.industry_key || extendedUser?.company_industry || extendedUser?.companies?.industry
      const isAvailable = isCapabilityAvailable(routeCapability, {
        capabilities: operatingProfile?.capabilities,
        industry: companyIndustry
      })
      if (!isAvailable) {
        console.warn(`[CAPABILITY_GATEWAY] â›” Access Denied: Route '${pathname}' requires capability '${routeCapability}', which is not active/available for company industry '${companyIndustry || 'LEGACY'}'`)
        redirect('/dashboard')
      }
    }
  }

  // 7. Generic RBAC Guard: USER_PERMISSION
  const cleanModule = moduleName || 'dashboard'
  if (cleanModule !== 'dashboard' && cleanModule !== 'profile') {
    const checkRole = viewMode === 'WORKER' ? 'trabajador' : userRole
    if (!hasPermission(checkRole as string, cleanModule, extendedUser?.area)) {
      console.warn(`[RBAC_GATEWAY] Access Denied: ${checkRole} to /${cleanModule}`)
      redirect('/dashboard')
    }
  }

  return (
    <OfflineSessionProvider initialUser={extendedUser}>
      <GlobalSettingsProvider settings={globalSettings}>
      <RbacProvider 
        role_id={extendedUser?.role_id} 
        permissions={
          (extendedUser as any)?.resolved_permissions
            ? serializeToLegacyArray((extendedUser as any).resolved_permissions)
            : (extendedUser as any)?.permissions
        }
        user={extendedUser}
      >
        <OperationalContextProvider
          companyId={extendedUser?.active_company_id || extendedUser?.company_id}
          industry={extendedUser?.company_industry || extendedUser?.companies?.industry}
          initialProfile={(extendedUser as any)?.operating_profile}
        >
          <SidebarProvider>
            <div className="flex h-screen bg-slate-50 overflow-hidden relative">
              <Sidebar />
              <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header />
                <main className="flex-1 overflow-y-auto p-2 sm:p-2.5 lg:p-3 bg-slate-50/50">
                  <div className="max-w-[1536px] w-full mx-auto space-y-2.5 sm:space-y-3">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </OperationalContextProvider>
      </RbacProvider>
      </GlobalSettingsProvider>
    </OfflineSessionProvider>
  )
}

