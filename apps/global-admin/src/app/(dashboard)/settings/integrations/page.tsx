import React from 'react'
import Link from 'next/link'
import { Plug, ArrowLeft, ExternalLink, ShieldCheck, Sparkles, KeyRound } from 'lucide-react'
import { getIntegrationsSettings } from '@/lib/settings/global-settings.service'
import { getAdminOidcClients } from '@/lib/data/ecosystem-data.service'

export const dynamic = 'force-dynamic'

export default async function SettingsIntegrationsPage() {
  const integrations = await getIntegrationsSettings()
  const clients = await getAdminOidcClients()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <Plug size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Integraciones & Clientes OIDC</h1>
            <p className="text-xs text-slate-500">Gestión de conectores externos, webhooks y satélites federados</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Parámetros de Federación OIDC</h2>
        <div className="space-y-3 font-mono text-[11px]">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-sans font-bold text-xs block">Discovery Endpoint (RFC 8414):</span>
            <span className="text-blue-700 font-bold">{integrations.oidcDiscoveryUrl}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-sans font-bold text-xs block">Webhook Central de Eventos:</span>
            <span className="text-slate-700">{integrations.webhookEndpoint}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4 text-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Clientes del Ecosistema ({clients.length})</h2>
        <div className="divide-y divide-slate-100">
          {clients.map((c) => (
            <div key={c.clientId} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">{c.clientName}</span>
                <span className="font-mono text-slate-400 text-[10px]">{c.clientId} · {c.clientType}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Activo
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
