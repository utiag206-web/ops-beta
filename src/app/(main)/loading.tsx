import { OperationsDashboardSkeleton } from '@/components/dashboard/dashboard-skeletons'

export default function MainModuleLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <OperationsDashboardSkeleton />
    </div>
  )
}
