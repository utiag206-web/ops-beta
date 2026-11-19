import React from 'react'
import Link from 'next/link'
import {
  KeyRound,
  ShieldCheck,
  Users,
  Smartphone,
  ExternalLink,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function InthalyIdProductAdminPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/overview" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            <KeyRound size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Administración de Inthaly ID</h1>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Core Soberano Activo
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">auth.inthaly.com · Esquema inthaly_id (PostgreSQL)</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Proveedor central de identidad del ecosistema Inthaly. Implementa autenticación Scrypt, almacenamiento ciego de tokens, OpenID Connect y PKCE RFC 7636 (S256).
        </p>
      </div>

      {/* Indicadores de Inthaly ID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Algoritmo de Claves</span>
          <span className="text-lg font-black text-slate-900">Scrypt N=32768</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Resistente a GPU/ASIC</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Protección OIDC</span>
          <span className="text-lg font-black text-blue-600">PKCE S256</span>
          <span className="text-[11px] text-slate-500 block">Clientes Públicos Obligatorio</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Conectados</span>
          <span className="text-lg font-black text-slate-900">3 Registrados</span>
          <span className="text-[11px] text-slate-500 block">Comunidad, Consola, Academia</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base de Datos</span>
          <span className="text-lg font-black text-emerald-600">PostgreSQL 16</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Aislamiento Total de Usuario</span>
        </div>
      </div>

      {/* Clientes OIDC Registrados */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Clientes OIDC del Ecosistema</h2>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 block">Comunidad Inthaly Web</span>
              <span className="text-slate-400 font-mono text-[11px]">Client ID: inthaly-community-web (Público / PKCE S256)</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Activo
            </span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 block">Consola Global INTHALY</span>
              <span className="text-slate-400 font-mono text-[11px]">Client ID: inthaly-global-console (Confidencial / Client Secret)</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Activo
            </span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 block">Inthaly Academia (LMS)</span>
              <span className="text-slate-400 font-mono text-[11px]">Client ID: inthaly-academy-satellite (Confidencial Satélite)</span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Contrato Preparado
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
