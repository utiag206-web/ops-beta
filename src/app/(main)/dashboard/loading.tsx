import { AdminDashboardSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { Sparkles } from 'lucide-react'

export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">Preparando tu espacio operativo</h2>
          </div>
          <p className="text-blue-200/90 text-xs sm:text-sm font-medium">
            Estamos poniendo todo a punto para que sigas operando con la mejor experiencia.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-blue-100">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Sincronizando información...</span>
        </div>
      </div>
      <AdminDashboardSkeleton />
    </div>
  )
}
