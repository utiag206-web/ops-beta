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
  AlertTriangle,
  History,
  Shield,
  Layers,
  Search,
  Check,
  X
} from 'lucide-react'
import {
  getAdminIdentities,
  getAdminOidcClients,
  getAdminSecurityEvents
} from '@/lib/data/ecosystem-data.service'

export const dynamic = 'force-dynamic'

export default async function InthalyIdProductAdminPage() {
  const [identities, oidcClients, securityEvents] = await Promise.all([
    getAdminIdentities(),
    getAdminOidcClients(),
    getAdminSecurityEvents()
  ])

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
              <KeyRound size={20} />
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

          <div className="flex items-center gap-2">
            <a
              href="http://localhost:3000/id/cuenta"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Portal de Cuenta ID</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
            <a
              href="http://localhost:3000/.well-known/openid-configuration"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <span>Ver RFC 8414 Discovery</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Motor central de identidad del ecosistema Inthaly. Implementa derivación Scrypt memory-hard, almacenamiento ciego de credenciales mediante hashes SHA-256, sesiones criptográficas y protocolo OpenID Connect con verificación PKCE RFC 7636 (S256).
        </p>
      </div>

      {/* 2. Indicadores Criptográficos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Algoritmo de Claves</span>
          <span className="text-base font-black text-slate-900">Scrypt N=16384</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Resistente a GPU/ASIC</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Protección OIDC</span>
          <span className="text-base font-black text-blue-600">PKCE S256</span>
          <span className="text-[11px] text-slate-500 block">Clientes Públicos Obligatorio</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Conectados</span>
          <span className="text-base font-black text-slate-900">{oidcClients.length} Registrados</span>
          <span className="text-[11px] text-slate-500 block">Comunidad, Consola, Academia</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base de Datos</span>
          <span className="text-base font-black text-emerald-600">PostgreSQL 16</span>
          <span className="text-[11px] text-emerald-600 font-bold block">inthaly_id (Pool PgBouncer)</span>
        </div>
      </div>

      {/* 3. Tabla de Identidades Soberanas */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Identidades Registradas ({identities.length})
            </h2>
            <p className="text-xs text-slate-500">Cuentas globales federadas en Inthaly ID</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Identidad & Correo</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Verificación</th>
                <th className="py-2.5 px-3">MFA (2FA)</th>
                <th className="py-2.5 px-3">Roles</th>
                <th className="py-2.5 px-3">Último Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {identities.map((id) => (
                <tr key={id.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block">{id.displayName}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{id.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={11} /> Activo
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {id.isVerified ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check size={13} /> Verificado
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold">Pendiente</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {id.mfaEnabled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        <ShieldCheck size={12} /> Habilitado
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No configurado</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {id.roles.map((r) => (
                        <span key={r} className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                    {new Date(id.lastLoginAt).toLocaleString('es-PE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Clientes OIDC Registrados */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Clientes OIDC & Aplicaciones Conectadas
          </h2>
          <p className="text-xs text-slate-500">Configuración RFC 6749 / RFC 7636 de las apps del ecosistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {oidcClients.map((client) => (
            <div key={client.clientId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    client.clientType === 'public'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    {client.clientType === 'public' ? 'Cliente Público (PKCE)' : 'Confidencial (Secret)'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Activo</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{client.clientName}</h3>
                  <span className="font-mono text-[10px] text-slate-500 block">{client.clientId}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {client.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">Redirect URIs:</span>
                  {client.redirectUris.map((uri, idx) => (
                    <span key={idx} className="font-mono text-[10px] text-slate-500 block truncate" title={uri}>
                      {uri}
                    </span>
                  ))}
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">Scopes:</span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {client.allowedScopes.map((s) => (
                      <span key={s} className="text-[9px] font-mono bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Auditoría de Seguridad Reciente */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <History size={16} className="text-slate-500" />
              <span>Eventos de Seguridad Central</span>
            </h2>
            <p className="text-xs text-slate-500">Registro inmutable de autenticaciones, autorizaciones y bloqueos</p>
          </div>
          <Link
            href="/audit"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Ver Auditoría Completa →
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {securityEvents.map((evt) => (
            <div key={evt.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  evt.eventType.includes('failed') ? 'bg-red-500' : 'bg-emerald-500'
                }`} />
                <div>
                  <span className="font-bold text-slate-900 block font-mono text-[11px]">{evt.eventType}</span>
                  <span className="text-slate-500 text-[11px]">{evt.identityEmail} · IP: {evt.ipAddress}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-mono text-[10px] block">
                  {new Date(evt.createdAt).toLocaleTimeString('es-PE')}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[200px] block" title={evt.userAgent}>
                  {evt.userAgent}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
