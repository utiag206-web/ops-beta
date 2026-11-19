import React from 'react'
import Link from 'next/link'
import {
  KeyRound,
  Compass,
  Building2,
  GraduationCap,
  Truck,
  Activity,
  Server,
  Database,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Shield
} from 'lucide-react'
import { getEcosystemKPIs } from '@/lib/data/ecosystem-data.service'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const kpis = await getEcosystemKPIs()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Cabecera Panorámica Ejecutiva */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Panorámica del Ecosistema INTHALY</h1>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                100% Operativo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supervisión consolidada de productos, identidades soberanas, centros de datos y telemetría en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/control-center"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Activity size={14} className="text-blue-400" />
              <span>Centro de Control</span>
            </Link>
            <Link
              href="/databases"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <Database size={14} className="text-emerald-600" />
              <span>Bases de Datos</span>
            </Link>
          </div>
        </div>

        {/* Barra de KPIs Globales */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inthaly ID</span>
            <span className="text-xl font-black text-slate-900">{kpis.totalIdentities}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">{kpis.verifiedIdentities} Verificadas</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sesiones Activas</span>
            <span className="text-xl font-black text-blue-600">{kpis.activeSessions}</span>
            <span className="text-[10px] text-slate-500 block">En tiempo real</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comunidad</span>
            <span className="text-xl font-black text-slate-900">{kpis.communityMembersCount}</span>
            <span className="text-[10px] text-slate-500 block">{kpis.communityGroupsCount} Grupos Técnicos</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Empresas Ops</span>
            <span className="text-xl font-black text-slate-900">{kpis.opsCompaniesCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">{kpis.opsActiveWorkersCount} Trabajadores</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auditoría</span>
            <span className="text-xl font-black text-slate-900">{kpis.totalSecurityEvents}</span>
            <span className="text-[10px] text-slate-500 block">Eventos Criptográficos</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clientes OIDC</span>
            <span className="text-xl font-black text-blue-600">{kpis.oidcActiveClientsCount}</span>
            <span className="text-[10px] text-slate-500 block">Integraciones Válidas</span>
          </div>
        </div>
      </div>

      {/* 2. Grid de los 5 Productos del Ecosistema */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Productos & Plataformas del Ecosistema
          </h2>
          <span className="text-xs text-slate-400 font-medium">Arquitectura de Servicios Aislados</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Producto 1: Inthaly ID */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  <KeyRound size={20} />
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Operativo Soberano
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Inthaly ID</h3>
                <span className="text-[11px] font-mono text-slate-400">auth.inthaly.com · PostgreSQL 16</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Proveedor central de identidad del ecosistema Inthaly. Implementa autenticación Scrypt, sesiones ciegas, tokens OIDC y PKCE RFC 7636.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">{kpis.totalIdentities} Identidades Activas</span>
              <Link
                href="/products/inthaly-id"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <span>Administrar</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* Producto 2: Comunidad Inthaly */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <Compass size={20} />
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Operativo
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Comunidad Inthaly</h3>
                <span className="text-[11px] font-mono text-slate-400">comunidad.inthaly.com</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Red social profesional de la industria pesada y minería. Foros técnicos, perfiles soberanos y privacidad garantizada anti-monitoreo.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">{kpis.communityGroupsCount} Foros Especializados</span>
              <Link
                href="/products/comunidad"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <span>Supervisar</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* Producto 3: InthalyOps Multiempresa */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                  <Building2 size={20} />
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Operativo
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">InthalyOps Multiempresa</h3>
                <span className="text-[11px] font-mono text-slate-400">sistemaops.inthaly.com</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gestión operativa empresarial y minera: tareo, asistencias, cálculo de sobretiempos, cuadrillas y aislamiento estricto RLS.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">{kpis.opsCompaniesCount} Empresas Registradas</span>
              <Link
                href="/products/ops"
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700"
              >
                <span>Ver Empresas</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* Producto 4: Inthaly Academia */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <GraduationCap size={20} />
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  Satélite Autónomo
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Inthaly Academia</h3>
                <span className="text-[11px] font-mono text-slate-400">app.inthaly.com · Laravel 12</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plataforma de capacitación técnica y emisión de certificados SOMA con código QR. Base de datos MySQL aislada sin fusión.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Contrato OIDC Preparado</span>
              <Link
                href="/products/academia"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                <span>Inspeccionar</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* Producto 5: Inthaly Transporte */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black">
                  <Truck size={20} />
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  En Preparación
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Inthaly Transporte</h3>
                <span className="text-[11px] font-mono text-slate-400">transporte.inthaly.com</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Módulo para control de flotas, hojas de ruta de transporte de personal minero, fatiga y somnolencia y trazabilidad de conductores.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Diseño Modular</span>
              <Link
                href="/products/transporte"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                <span>Ver Hoja de Ruta</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* Tarjeta de Infraestructura Autogestionada (Etapa 1) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white rounded-2xl border border-slate-800 p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black">
                  <Server size={20} />
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Infra Propia
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-white">Infraestructura Autogestionada</h3>
                <span className="text-[11px] font-mono text-slate-400">PostgreSQL 16 + Redis 7 + MinIO</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aislamiento estricto de bases de datos, conexión PgBouncer, respaldos diarios con checksum SHA-256 y certificados Caddy TLS automáticos.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">4 Contenedores Activos</span>
              <Link
                href="/infrastructure"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300"
              >
                <span>Ver Telemetría</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
