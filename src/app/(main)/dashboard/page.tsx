import { Suspense } from 'react'
import Link from 'next/link'
import { AlertCircle, ShieldAlert } from 'lucide-react'
import { getDashboardStats } from './actions'
import { getUserSession } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { AdminDashboardSkeleton } from '@/components/dashboard/dashboard-skeletons'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { extendedUser } = await getUserSession()
  
  if (!extendedUser?.role_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm">
        <div className="bg-rose-50 p-4 rounded-2xl mb-6">
          <AlertCircle className="w-12 h-12 text-rose-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Rol No Reconocido</h1>
        <p className="text-slate-500 max-w-md font-medium mb-8">
          Tu cuenta no tiene un rol asignado para esta empresa. Por favor, contacta al administrador.
        </p>
        <Link href="/login" className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all">
          Cerrar Sesión
        </Link>
      </div>
    )
  }

  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <DashboardContent user={extendedUser} />
    </Suspense>
  )
}

async function DashboardContent({ user }: { user: any }) {
  const stats = await getDashboardStats()
  
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8">
        <div className="bg-blue-50 p-4 rounded-2xl mb-6">
          <ShieldAlert className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-xl font-black text-slate-800 mb-2">Error de Carga</h1>
        <p className="text-slate-500 max-w-sm">No pudimos cargar tus estadísticas en este momento.</p>
      </div>
    )
  }

  return <DashboardShell stats={stats} user={user} />
}
