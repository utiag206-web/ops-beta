import React from 'react'
import Link from 'next/link'
import { Info, ArrowLeft, Shield, Sparkles, Server, FileText } from 'lucide-react'
import { getAboutSettings } from '@/lib/settings/global-settings.service'

export const dynamic = 'force-dynamic'

export default async function SettingsAboutPage() {
  const about = await getAboutSettings()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black">
            <Info size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Acerca de INTHALY GLOBAL</h1>
            <p className="text-xs text-slate-500">Versión del producto, arquitectura de monorepo y propiedad</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Ficha Técnica de la Plataforma</h2>
        <div className="divide-y divide-slate-100 font-mono text-[11px]">
          <div className="py-2.5 flex justify-between">
            <span className="font-sans font-bold text-slate-600">Versión Central:</span>
            <span className="font-bold text-blue-600">{about.version}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-sans font-bold text-slate-600">Edición del Ecosistema:</span>
            <span className="font-bold text-slate-900">{about.ecosystemVersion}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-sans font-bold text-slate-600">Build ID:</span>
            <span className="text-slate-500">{about.buildId}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-sans font-bold text-slate-600">Arquitectura de Despliegue:</span>
            <span className="text-slate-700">{about.architecture}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-sans font-bold text-slate-600">Licencia de Operación:</span>
            <span className="text-emerald-700 font-bold">{about.license}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
