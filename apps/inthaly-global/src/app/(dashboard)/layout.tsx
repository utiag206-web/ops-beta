import React from 'react'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/admin-session'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminHeader } from '@/components/admin-header'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  // Guardia de Seguridad Soberana: Redirección automática si no hay sesión válida
  if (!session || !session.user || !session.user.isSuperAdmin) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader user={session.user} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
