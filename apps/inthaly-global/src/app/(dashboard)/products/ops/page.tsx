import React from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  ShieldCheck,
  Building,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { getAdminOpsCompanies } from '@/lib/data/ecosystem-data.service'

export const dynamic = 'force-dynamic'

export default async function OpsProductAdminPage() {
  const companies = await getAdminOpsCompanies()
  const realCompanies = companies.filter(c => !c.isDemo)
  const demoCompanies = companies.filter(c => c.isDemo)
  const totalWorkers = companies.reduce((acc, c) => acc + c.workersCount, 0)
  const totalTareos = companies.reduce((acc, c) => acc + c.activeTareosCount, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/overview"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Supervisión InthalyOps Multiempresa</h1>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Operativo Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">sistemaops.inthaly.com · RLS Estricto por Tenant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="http://localhost:3000/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Ir al Panel Empresarial</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Centro de supervisión operativa y multi-tenant de InthalyOps. Control de tareos mineros, asistencias, guardias rotativas, cuadrillas y cálculo legal de horas extras con aislamiento estricto mediante Row-Level Security (RLS).
        </p>
      </div>

      {/* 2. Indicadores Operativos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Empresas Totales</span>
          <span className="text-lg font-black text-slate-900">{companies.length} Empresas</span>
          <span className="text-[11px] text-emerald-600 font-bold block">{realCompanies.length} Reales · {demoCompanies.length} Demo</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Personal Gestionado</span>
          <span className="text-lg font-black text-purple-600">{totalWorkers} Trabajadores</span>
          <span className="text-[11px] text-slate-500 block">Personal Minero e Industrial</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tareos Registrados</span>
          <span className="text-lg font-black text-slate-900">{totalTareos} Tareos</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Con Redondeo Legal Minero</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aislamiento RLS</span>
          <span className="text-lg font-black text-emerald-600">100% Blindado</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Segregación de company_id</span>
        </div>
      </div>

      {/* 3. Tabla de Empresas Gestionadas */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Empresas & Contratistas ({companies.length})
            </h2>
            <p className="text-xs text-slate-500">Supervisión de tenants activos y suscripciones</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Empresa / Razón Social</th>
                <th className="py-2.5 px-3">RUC</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Trabajadores</th>
                <th className="py-2.5 px-3">Tareos</th>
                <th className="py-2.5 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((comp) => (
                <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{comp.name}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                    {comp.ruc}
                  </td>
                  <td className="py-3 px-3">
                    {comp.isDemo ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Sparkles size={10} /> Demo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <Building size={10} /> Real S.A.C.
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono uppercase text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {comp.plan}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-700">
                    {comp.workersCount} operarios
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {comp.activeTareosCount}
                  </td>
                  <td className="py-3 px-3">
                    {comp.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 size={12} /> Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        Inactiva
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
