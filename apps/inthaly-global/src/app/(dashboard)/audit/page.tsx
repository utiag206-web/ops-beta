import React from 'react'
import Link from 'next/link'
import {
  History,
  ArrowLeft,
  Shield,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search
} from 'lucide-react'
import { getAdminSecurityEvents } from '@/lib/data/ecosystem-data.service'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  const events = await getAdminSecurityEvents()

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
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <History size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Auditoría Global de Seguridad</h1>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Bitácora Forense Activa
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Registro Inmutable de Eventos Criptográficos y de Acceso</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Registro inmutable de eventos de autenticación, autorizaciones OIDC, accesos administrativos e intentos de intrusión bloqueados en todo el ecosistema INTHALY.
        </p>
      </div>

      {/* 2. Tabla de Eventos de Auditoría */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs text-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Eventos de Seguridad Recientes ({events.length})
            </h2>
            <p className="text-xs text-slate-500">Trazabilidad completa con dirección IP y firma del User Agent</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Fecha & Hora</th>
                <th className="py-2.5 px-3">Tipo de Evento</th>
                <th className="py-2.5 px-3">Identidad Afectada</th>
                <th className="py-2.5 px-3">IP de Origen</th>
                <th className="py-2.5 px-3">Agente / Cliente</th>
                <th className="py-2.5 px-3">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((evt) => {
                const isFailed = evt.eventType.includes('failed')
                return (
                  <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                      {new Date(evt.createdAt).toLocaleString('es-PE')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 text-[11px]">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-700 text-[11px]">
                        {evt.identityEmail}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                      {evt.ipAddress}
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-[11px] max-w-[200px] truncate" title={evt.userAgent}>
                      {evt.userAgent}
                    </td>
                    <td className="py-3 px-3">
                      {isFailed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          <AlertTriangle size={11} /> Bloqueado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 size={11} /> Autorizado
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
