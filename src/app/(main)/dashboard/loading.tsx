import { AdminDashboardSkeleton } from '@/components/dashboard/dashboard-skeletons'

export default function Loading() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <AdminDashboardSkeleton />
    </div>
  )
}
