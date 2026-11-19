import React from 'react'
import Link from 'next/link'
import { History, ArrowLeft, Shield, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AuditPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/overview" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            <History size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Auditoría Global de Eventos</h1>
            <p className="text-xs text-slate-500 font-mono">Registro Inmutable de Acciones Administrativas</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs text-xs space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Últimos Eventos de Seguridad Registrados</h2>
        <div className="divide-y divide-slate-100">
          <div className="py-2.5 flex items-center justify-between">
            <span className="font-semibold text-slate-800">Inicio de sesión exitoso de Super Admin</span>
            <span className="text-slate-400 font-mono text-[11px]">auth.inthaly.com · IP 127.0.0.1</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="font-semibold text-slate-800">Verificación de esquema DDL PostgreSQL completada</span>
            <span className="text-slate-400 font-mono text-[11px]">inthaly_id, inthaly_community</span>
          </div>
        </div>
      </div>
    </div>
  )
}
