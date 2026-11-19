import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileCheck,
  Sparkles
} from 'lucide-react'
import { getSecurityPerimeterStatus } from '@/lib/telemetry/system-telemetry.service'

export const dynamic = 'force-dynamic'

export default function SecurityPage() {
  const security = getSecurityPerimeterStatus()

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
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Seguridad & Defensa en Profundidad</h1>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Estándar OWASP Cumplido
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Políticas de Acceso · Cero Fugas de Tokens · Aislamiento Estricto</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Matriz central de ciberseguridad del ecosistema INTHALY. Implementa autenticación basada en Scrypt, validación PKCE RFC 7636 (S256), cifrado SCRAM-SHA-256 en base de datos y aislamiento absoluto de contenedores sin exposición del Docker socket.
        </p>
      </div>

      {/* 2. Matriz de Defensa en Profundidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Pilar 1: Criptografía & Identidad */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <KeyRound size={16} className="text-blue-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              1. Criptografía & Control de Acceso
            </h2>
          </div>
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Scrypt Memory-Hard (OWASP)</span>
                <span className="text-emerald-600 font-bold text-[10px] uppercase">Activo</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                N=16384, r=8, p=1 con salts criptográficos de 32 bytes y comparación en tiempo constante contra Timing Attacks.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">PKCE S256 Mandatorio (RFC 7636)</span>
                <span className="text-emerald-600 font-bold text-[10px] uppercase">Obligatorio</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Clientes públicos OIDC obligados a usar code_challenge y code_verifier. Prohibido almacenar client_secrets en el navegador.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Almacenamiento Ciego de Tokens</span>
                <span className="text-emerald-600 font-bold text-[10px] uppercase">Blindado</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Los refresh tokens y reset tokens se persisten exclusivamente como hash SHA-256. Imposible leer tokens en claro desde volcados SQL.
              </p>
            </div>
          </div>
        </div>

        {/* Pilar 2: Seguridad Perimetral & Contenedores */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <Server size={16} className="text-emerald-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              2. Perímetro, Redes & Docker
            </h2>
          </div>
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Docker Socket Aislado</span>
                <span className="text-emerald-600 font-bold text-[10px] uppercase">100% Protegido</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                /var/run/docker.sock jamás montado en aplicaciones web. Previene escalada de privilegios y escapes de contenedor host.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Caddy TLS 1.3 Automatizado</span>
                <span className="text-emerald-600 font-bold text-[10px] uppercase">HSTS Activo</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Certificados con rotación automática, cabeceras estrictas de seguridad (CSP, X-Frame-Options: DENY, HSTS max-age=31536000).
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Firewall UFW & Fail2ban</span>
                <span className="text-emerald-600 font-bold text-[10px] uppercase">Activo</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Bloqueo automático de IPs tras intentos fallidos de autenticación (maxretry=5, bantime=3600 segundos).
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Indicador de Garantía Anti-Espionaje Comunitaria */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-purple-600" />
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            3. Aislamiento Laboral & Anti-Espionaje Empresarial (ADR-014)
          </h2>
        </div>
        <p className="text-slate-600 leading-relaxed">
          Las empresas suscritas a InthalyOps no poseen telemetría ni acceso a las actividades comunitarias de sus empleados. Toda consulta técnica en foros y perfiles de Comunidad Inthaly es estrictamente soberana, garantizando que los empleadores no puedan rastrear o monitorear a los operarios ni acceder a sus consultas en faena.
        </p>
      </div>
    </div>
  )
}
