import React from 'react'
import Link from 'next/link'
import { Building2, ArrowLeft, Users, Building, ShieldCheck, Sparkles } from 'lucide-react'
import { getMultiempresaSettings } from '@/lib/settings/global-settings.service'
import { getAdminOpsCompanies } from '@/lib/data/ecosystem-data.service'

export const dynamic = 'force-dynamic'

export default async function SettingsMultiempresaPage() {
  const settings = await getMultiempresaSettings()
  const companies = await getAdminOpsCompanies()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Building2 size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Configuración Multiempresa</h1>
            <p className="text-xs text-slate-500">Parámetros heredables de tenants, cuotas por defecto y modo demo</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Parámetros de Aprovisionamiento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Cuota Predeterminada de Trabajadores</span>
            <span className="text-lg font-black text-slate-900 block">{settings.defaultWorkerQuota} operarios</span>
            <span className="text-[11px] text-slate-500">Límite inicial por tenant antes de requerir ampliación de plan</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Días de Retención para Empresas Demo</span>
            <span className="text-lg font-black text-slate-900 block">{settings.demoRetentionDays} días</span>
            <span className="text-[11px] text-slate-500">Periodo de gracia para pruebas operativas de clientes mineros</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Empresas Registradas en el Sistema ({companies.length})</h2>
          <Link href="/products/ops" className="text-blue-600 font-bold hover:underline">Gestionar en InthalyOps →</Link>
        </div>

        <div className="divide-y divide-slate-100">
          {companies.map((c) => (
            <div key={c.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">{c.name}</span>
                <span className="text-slate-400 font-mono text-[10px]">RUC: {c.ruc} · Plan: {c.plan}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400'
              }`}>
                {c.status === 'active' ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
