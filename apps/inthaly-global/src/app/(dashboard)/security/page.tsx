import React from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Lock, KeyRound, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SecurityPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/overview" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Seguridad & Accesos Globales</h1>
            <p className="text-xs text-slate-500 font-mono">Políticas de Acceso · Cero Fugas de Tokens · ADR-ID-004</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Políticas de Seguridad Activas</h2>
        <div className="space-y-2">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">Anti-Account Takeover (Anti-ATO)</span>
              <span className="text-slate-500 text-[11px]">Los tokens de recuperación nunca se exponen al cliente y se almacenan como hash SHA-256 de un solo uso.</span>
            </div>
            <span className="text-emerald-600 font-bold">Activo</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">PKCE Obligatorio (RFC 7636)</span>
              <span className="text-slate-500 text-[11px]">Protección estricta S256 para clientes públicos OIDC sin secretos en el frontend.</span>
            </div>
            <span className="text-emerald-600 font-bold">Activo</span>
          </div>
        </div>
      </div>
    </div>
  )
}
