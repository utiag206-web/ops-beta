export default function MainModuleLoading() {
  return (
    <div className="space-y-5 animate-pulse p-1 sm:p-2">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-slate-200 rounded-md" />
          <div className="h-6 w-48 bg-slate-300 rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-white rounded-2xl border border-slate-100 p-3 shadow-xs" />
        ))}
      </div>
      <div className="h-72 bg-white rounded-2xl border border-slate-100 shadow-xs" />
    </div>
  )
}
