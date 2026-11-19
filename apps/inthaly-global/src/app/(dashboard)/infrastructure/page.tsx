import React from 'react'
import Link from 'next/link'
import { Server, ArrowLeft, Shield, HardDrive, Cpu, Network } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function InfrastructurePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/overview" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            <Server size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Infraestructura & Contenedores</h1>
            <p className="text-xs text-slate-500 font-mono">Topología Docker Compose · Red inthaly_internal</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Topología de Servicios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <span className="font-bold text-slate-900 block text-sm">Capa de Datos</span>
            <p className="text-slate-500">PostgreSQL 16 en 127.0.0.1:5432 con pooling mediante PgBouncer.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <span className="font-bold text-slate-900 block text-sm">Capa de Objetos (S3)</span>
            <p className="text-slate-500">MinIO S3 para almacenamiento de avatares, fotos y documentos fuera de PostgreSQL.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <span className="font-bold text-slate-900 block text-sm">Capa de Gateway</span>
            <p className="text-slate-500">Caddy Reverse Proxy con emisión automática de certificados TLS y balanceo.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
