import React from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  ArrowLeft,
  ExternalLink,
  Shield,
  FileCheck2,
  RefreshCw
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AcademiaProductAdminPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/overview" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-black">
            <GraduationCap size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Administración de Inthaly Academia</h1>
              <span className="text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                Satélite Laravel Conectado
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">app.inthaly.com · Contrato de Integración OIDC</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Plataforma educativa externa para formación minera, seguridad industrial y emisión de certificados SOMA. Se comunica con el ecosistema mediante Inthaly ID OIDC y federación de identidad.
        </p>
      </div>

      {/* Métricas de Academia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipo de Aplicación</span>
          <span className="text-lg font-black text-slate-900">Satélite Autónomo</span>
          <span className="text-[11px] text-amber-600 font-bold block">Backend Laravel / MySQL</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Autenticación Federada</span>
          <span className="text-lg font-black text-blue-600">OIDC Client</span>
          <span className="text-[11px] text-slate-500 block">inthaly-academy-satellite</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scope Autorizado</span>
          <span className="text-lg font-black text-slate-900">Certificaciones</span>
          <span className="text-[11px] text-slate-500 block">academy.certifications</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aislamiento Comercial</span>
          <span className="text-lg font-black text-emerald-600">Estricto</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Sin acceso cruzado a nóminas</span>
        </div>
      </div>
    </div>
  )
}
