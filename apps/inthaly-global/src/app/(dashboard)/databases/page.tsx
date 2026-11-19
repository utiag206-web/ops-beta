import React from 'react'
import Link from 'next/link'
import { Database, ArrowLeft, ShieldCheck, CheckCircle2, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function DatabasesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/overview" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            <Database size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Bases de Datos & Respaldos</h1>
            <p className="text-xs text-slate-500 font-mono">PostgreSQL Soberano · Esquemas inthaly_id e inthaly_community</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 text-xs">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Base de Datos: inthaly_id</h2>
          <p className="text-slate-500">Almacena identidades globales, sesiones criptográficas, refresh tokens ciegos y clientes OIDC.</p>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">Usuario propietario:</span><span className="font-mono font-bold">inthaly_id_user</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Encriptación:</span><span className="font-bold text-emerald-600">SCRAM-SHA-256</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 text-xs">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Base de Datos: inthaly_community</h2>
          <p className="text-slate-500">Almacena perfiles profesionales, grupos dinámicos, publicaciones, comentarios y mensajes directos.</p>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">Usuario propietario:</span><span className="font-mono font-bold">inthaly_community_user</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Aislamiento:</span><span className="font-bold text-emerald-600">Cero acceso a inthaly_id</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
