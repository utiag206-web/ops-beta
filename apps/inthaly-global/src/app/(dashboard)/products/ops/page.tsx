import React from 'react'
import Link from 'next/link'
import {
  Building2,
  ArrowLeft,
  Shield,
  Layers,
  Boxes,
  Users,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function InthalyOpsProductAdminPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/overview" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            <Building2 size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Administración de InthalyOps</h1>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                ERP Operativo Activo
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">ops.inthaly.com · Gestión Multiempresa y Arquetipos Operativos</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Núcleo de operaciones de campo para minería, contratistas e industria. Incluye control de asistencia, tareo, tareo biométrico, maquinaria, caja chica y portal de trabajadores.
        </p>
      </div>

      {/* Métricas de InthalyOps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Arquitectura</span>
          <span className="text-lg font-black text-slate-900">Multiempresa</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Aislamiento por Tenant</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capacidades Modulares</span>
          <span className="text-lg font-black text-blue-600">Catálogo Dinámico</span>
          <span className="text-[11px] text-slate-500 block">Switches por Industria</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Acceso de Personal</span>
          <span className="text-lg font-black text-slate-900">DNI + PIN</span>
          <span className="text-[11px] text-slate-500 block">Portal QR / PWA offline</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base de Datos</span>
          <span className="text-lg font-black text-emerald-600">PostgreSQL (Supabase)</span>
          <span className="text-[11px] text-emerald-600 font-bold block">100% Intacto y Protegido</span>
        </div>
      </div>

      {/* Funcionalidades Administrativas Multiempresa */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Gestión Multiempresa Centralizada</h2>
          <a
            href="http://localhost:3000/super-admin"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <span>Abrir Consola InthalyOps</span>
            <ExternalLink size={12} />
          </a>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Desde INTHALY GLOBAL se supervisan las altas, bajas, revisiones de estado y configuraciones operativas de todas las empresas sin interferir en los datos privados de tareo y boletas.
        </p>
      </div>
    </div>
  )
}
