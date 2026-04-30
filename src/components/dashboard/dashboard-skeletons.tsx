import { Users, Mountain, Bed, FileText, ClipboardCheck, Activity } from 'lucide-react'

export function DashboardHeaderSkeleton() {
  return (
    <div className="bg-slate-200 animate-pulse rounded-3xl p-8 h-40 mb-8" />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm animate-pulse">
      <div className="bg-slate-100 w-12 h-12 rounded-xl" />
      <div className="space-y-2">
        <div className="bg-slate-100 h-3 w-16 rounded" />
        <div className="bg-slate-100 h-6 w-24 rounded" />
      </div>
    </div>
  )
}

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
    </div>
  )
}

export function WideCardSkeleton() {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-[300px]" />
  )
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12">
      <DashboardHeaderSkeleton />
      <StatsGridSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="h-24 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-24 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[400px] bg-white rounded-2xl border border-slate-100 animate-pulse" />
        <div className="h-[400px] bg-white rounded-2xl border border-slate-100 animate-pulse" />
      </div>
    </div>
  )
}

export function OperationsDashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12">
      <div className="h-24 bg-slate-200 rounded-3xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[500px] bg-white rounded-2xl border border-slate-100 animate-pulse" />
        <div className="h-[500px] bg-white rounded-2xl border border-slate-100 animate-pulse" />
      </div>
    </div>
  )
}
