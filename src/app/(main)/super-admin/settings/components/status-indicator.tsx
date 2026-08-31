'use client'

export function StatusIndicator({ 
  label, 
  status, 
  description,
  badge
}: { 
  label: string, 
  status: 'ACTIVO' | 'ACTIVA' | 'PREPARADO' | 'PREPARADA',
  description?: string,
  badge?: string
}) {
  const isReady = status.startsWith('PREPARAD')
  return (
    <div className="flex flex-col gap-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 tracking-tight">{label}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase bg-purple-100 text-purple-700">
              {badge}
            </span>
          )}
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase whitespace-nowrap ${
          isReady ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {status}
        </span>
      </div>
      {description && (
        <p className="text-[10px] font-medium text-slate-400 tracking-tight uppercase leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
