import React from 'react'
import Link from 'next/link'
import { Boxes, ArrowLeft, Check, Sparkles, Layers } from 'lucide-react'
import { getCapabilitiesSettings } from '@/lib/settings/global-settings.service'

export const dynamic = 'force-dynamic'

export default async function SettingsCapabilitiesPage() {
  const data = await getCapabilitiesSettings()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <Boxes size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Industrias & Capacidades Modulares</h1>
            <p className="text-xs text-slate-500">Gestión de sectores económicos y activación de módulos operativos</p>
          </div>
        </div>
      </div>

      {/* Sectores Industriales */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Sectores Económicos Habilitados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.industries.map((ind) => (
            <div key={ind.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">{ind.name}</span>
                <span className="text-[11px] text-slate-500">{ind.archetypesCount} arquetipos de roles configurados</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                ind.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-500'
              }`}>
                {ind.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Catálogo Central de Capacidades */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Catálogo Modular de Capacidades</h2>
        <div className="divide-y divide-slate-100">
          {data.capabilities.map((cap) => (
            <div key={cap.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{cap.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border">
                    {cap.key}
                  </span>
                </div>
                <span className="text-slate-500 text-[11px] block mt-0.5">Categoría: {cap.category}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                cap.enabled ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400'
              }`}>
                {cap.enabled ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
