import React from 'react'
import Link from 'next/link'
import { Activity, ArrowLeft, History, FileCheck, ShieldCheck } from 'lucide-react'
import { getAuditSettings } from '@/lib/settings/global-settings.service'

export const dynamic = 'force-dynamic'

export default async function SettingsAuditSubmodulePage() {
  const audit = await getAuditSettings()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
            <Activity size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Políticas de Auditoría & Trazabilidad</h1>
            <p className="text-xs text-slate-500">Reglas de retención forense y registro inmutable de acciones</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Directivas de Retención Forense</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Periodo de Retención Obligatorio</span>
            <span className="text-base font-black text-slate-900 block">{audit.retentionDays} días</span>
            <span className="text-[11px] text-slate-500">Mínimo para cumplimiento en fiscalizaciones mineras</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Almacenamiento Inmutable</span>
            <span className="text-base font-black text-emerald-600 block">Habilitado (WORM)</span>
            <span className="text-[11px] text-slate-500">Los registros no pueden ser modificados tras ser escritos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
