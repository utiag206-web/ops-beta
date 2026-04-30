import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { getUserSession } from '@/lib/auth'
import { OnboardingCheck } from '@/components/auth/onboarding-check'
import { RbacProvider } from '@/components/providers/rbac-provider'
import { headers } from 'next/headers'
import { hasPermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getUserSession()
  const extendedUser = session?.extendedUser
  const headersList = await headers()
  // RBAC Gateway
  const pathname = (headersList.get('x-pathname') || '').split('?')[0]
  const moduleName = pathname.split('/')[1]
  const userRole = extendedUser?.role_id?.toLowerCase()
  
  if (userRole === 'trabajador') {
    const isForbiddenPath = 
      pathname.includes('/global') || 
      pathname.includes('/admin') ||
      pathname === '/users' ||
      pathname === '/workers' ||
      pathname.startsWith('/company') ||
      pathname.startsWith('/inventory') ||
      pathname.startsWith('/movements') ||
      pathname.startsWith('/caja-chica') ||
      pathname.startsWith('/configuracion') ||
      pathname.startsWith('/users')

    if (isForbiddenPath) {
      console.warn(`[SECURITY_LOCKDOWN] Acceso prohibido detectado para trabajador: ${pathname}`)
      redirect('/dashboard')
    }
  }

  if (moduleName && userRole) {
    if (moduleName !== 'dashboard' && !hasPermission(userRole as string, moduleName, extendedUser?.area)) {
      console.warn(`[RBAC_GATEWAY] Acceso Denegado: Rol ${userRole} intentó acceder a /${moduleName}. Redirigiendo a Dashboard.`)
      redirect('/dashboard')
    }
  }

  return (
    <RbacProvider 
      role_id={extendedUser?.role_id} 
      permissions={(extendedUser as any)?.permissions}
      user={extendedUser}
    >
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RbacProvider>
  )
}
