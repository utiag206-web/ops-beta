import React from 'react'
import Link from 'next/link'
import { Server, ArrowLeft, RefreshCw, Cpu, HardDrive, ShieldCheck } from 'lucide-react'
import { getSystemSettings } from '@/lib/settings/global-settings.service'
import { getSystemMetrics } from '@/lib/telemetry/system-telemetry.service'

export const dynamic = 'force-dynamic'

export default async function SettingsSystemPage() {
  const system = await getSystemSettings()
  const metrics = getSystemMetrics()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black">
            <Server size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Sistema & Parámetros Operativos</h1>
            <p className="text-xs text-slate-500">Comportamiento del runtime, modo mantenimiento y telemetría</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Control de Runtime</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Modo Mantenimiento Global</span>
            <span className={`text-base font-black ${system.maintenanceMode ? 'text-amber-600' : 'text-emerald-600'}`}>
              {system.maintenanceMode ? 'Activado (Acceso Restringido)' : 'Desactivado (Operación Normal)'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Motor de Caché & Sesiones</span>
            <span className="text-base font-black text-slate-900 block">{system.cacheDriver}</span>
            <span className="text-[11px] text-slate-500">Amortiguador en memoria volátil</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Intervalo de Refresco Telemetría</span>
            <span className="text-base font-black text-slate-900 block">{system.telemetryIntervalSec} segundos</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Nivel de Log del Sistema</span>
            <span className="text-base font-black text-blue-600 block uppercase font-mono">{system.logLevel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
