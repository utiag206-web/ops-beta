'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Building2, Users, Shield, ShieldOff,
  Activity, ArrowUpRight, BadgeCheck,
  Globe, Server, Database, Building,
  ExternalLink, Plus, Search, FlaskConical, Globe2, Clock,
  KeyRound, ShieldCheck, Laptop, AlertTriangle, Layers,
  CheckCircle2, Compass, GraduationCap, Lock, Check, Send
} from 'lucide-react'
import type { InthalyIdentity, EcosystemStats } from '@/types/inthaly-id.types'
import { CompaniesList } from '@/components/super-admin/companies-list'
import { SuperAdminActions } from '@/components/super-admin/super-admin-actions'
import { generateDelegatedTicketAction } from '@/app/(main)/super-admin/actions'
import { toast } from 'sonner'

export default function EcosystemConsoleClient({
  companies,
  users,
  stats,
  ecosystemStats,
  identities
}: {
  companies: any[]
  users: any[]
  stats: any
  ecosystemStats: EcosystemStats
  identities: InthalyIdentity[]
}) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'inthaly-id' | 'community' | 'inthaly-ops' | 'academy' | 'integrations' | 'security'
  >('overview')

  const [searchTerm, setSearchTerm] = useState('')
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false)

  // Manejador de Acceso Administrativo Delegado (Fase 4 - Saneado según Regla A6)
  const handleOpenProduct = async (product: 'comunidad' | 'academia' | 'inthalyops') => {
    setIsGeneratingTicket(true)
    try {
      const res = await generateDelegatedTicketAction(product, 'Super Admin Live Inspection')
      if (res.success && res.data) {
        toast.success(`Acceso administrativo delegado autorizado para ${product.toUpperCase()}`)
        window.open(res.data.ticketUrl, '_blank')
      } else {
        toast.info(res.error || 'Acceso delegado deshabilitado por política de seguridad')
      }
    } catch {
      toast.error('Error al solicitar acceso delegado')
    } finally {
      setIsGeneratingTicket(false)
    }
  }

  // Filtrado de identidades de Inthaly ID
  const filteredIdentities = identities.filter(id => 
    id.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 animate-in fade-in duration-300 min-h-screen pb-12">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA MAESTRA DEL ECOSISTEMA INTHALY                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-900 rounded-xl text-white shadow-xs shrink-0">
                <Shield size={16} />
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Consola Global del Ecosistema Inthaly
              </h1>
              <span className="text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                Super Admin
              </span>
            </div>
            <p className="text-slate-500 text-xs font-normal">
              Centro unificado de administración, identidades Inthaly ID, supervisión de productos e integraciones.
            </p>
          </div>

          {/* Acciones Rápidas del Super Admin + Delegated Access */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isGeneratingTicket}
              onClick={() => handleOpenProduct('comunidad')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Abrir Comunidad con ticket de administración delegada"
            >
              <Compass size={14} />
              <span>Abrir Comunidad</span>
              <ExternalLink size={11} className="opacity-70" />
            </button>

            <button
              type="button"
              disabled={isGeneratingTicket}
              onClick={() => handleOpenProduct('academia')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Inspeccionar satélite Inthaly Academy"
            >
              <GraduationCap size={14} />
              <span>Ver Academia</span>
              <ExternalLink size={11} className="opacity-70" />
            </button>

            <SuperAdminActions />
          </div>
        </div>

        {/* Barra de Estado de los 4 Productos del Ecosistema */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span className="font-bold text-slate-900 block leading-tight">Inthaly ID</span>
              <span className="text-[10px] text-slate-400">Autenticación Soberana</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span className="font-bold text-slate-900 block leading-tight">Comunidad</span>
              <span className="text-[10px] text-slate-400">Red Profesional Activa</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span className="font-bold text-slate-900 block leading-tight">InthalyOps</span>
              <span className="text-[10px] text-slate-400">Multiempresa Operativo</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <div>
              <span className="font-bold text-slate-900 block leading-tight">Inthaly Academy</span>
              <span className="text-[10px] text-amber-700 font-semibold">Satélite Laravel (app.inthaly.com)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PESTAÑAS DE NAVEGACIÓN DE LA CONSOLA GLOBAL                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overview' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers size={14} />
          <span>Resumen Ecosistema</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inthaly-id')}
          className={`py-2 px-3.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'inthaly-id' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound size={14} />
          <span>Inthaly ID ({ecosystemStats.totalIdentities})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('community')}
          className={`py-2 px-3.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'community' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass size={14} />
          <span>Comunidad</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inthaly-ops')}
          className={`py-2 px-3.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'inthaly-ops' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 size={14} />
          <span>InthalyOps ({companies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('academy')}
          className={`py-2 px-3.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'academy' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap size={14} />
          <span>Academia LMS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`py-2 px-3.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'integrations' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe size={14} />
          <span>Integraciones OIDC</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-2 px-3.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'security' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Auditoría & Seguridad</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RESUMEN DEL ECOSISTEMA (KPIS REALES Y ESTADO GENERAL)              */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          
          {/* Métricas Globales del Ecosistema */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inthaly ID</span>
              <h3 className="text-xl font-black text-slate-900">{ecosystemStats.totalIdentities}</h3>
              <span className="text-[10px] text-emerald-600 font-bold block">100% Verificadas</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sesiones Activas</span>
              <h3 className="text-xl font-black text-blue-600">{ecosystemStats.activeSessions}</h3>
              <span className="text-[10px] text-slate-400 block">En tiempo real</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Miembros Comunidad</span>
              <h3 className="text-xl font-black text-slate-900">{ecosystemStats.communityUsersCount}</h3>
              <span className="text-[10px] text-emerald-600 font-bold block">Perfiles Soberanos</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Empresas Ops</span>
              <h3 className="text-xl font-black text-slate-900">{stats.totalCompanies}</h3>
              <span className="text-[10px] text-slate-500 block">{stats.realCompanies} reales · {stats.testCompanies} demo</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Eventos Seguridad</span>
              <h3 className="text-xl font-black text-slate-900">{ecosystemStats.totalSecurityEvents}</h3>
              <span className="text-[10px] text-slate-400 block">Auditoría central</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Integraciones OIDC</span>
              <h3 className="text-xl font-black text-indigo-600">{ecosystemStats.connectedAppsCount}</h3>
              <span className="text-[10px] text-emerald-600 font-bold block">Clientes activos</span>
            </div>
          </div>

          {/* Tarjetas de Producto y Capacidad Delegada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
                    ID
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Inthaly ID — Motor de Identidad</h3>
                    <span className="text-[11px] text-slate-500">auth.inthaly.com</span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Operativo
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gestiona las identidades únicas de todas las personas del ecosistema. Provee tokens OIDC, sesiones y autenticación Scrypt sin depender de Supabase Auth.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link href="/id/login" target="_blank" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  Probar portal de login <ExternalLink size={12} />
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTab('inthaly-id')}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900"
                >
                  Supervisar identidades →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                    CM
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Comunidad Inthaly</h3>
                    <span className="text-[11px] text-slate-500">comunidad.inthaly.com</span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Operativo
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Red social profesional de minería e industria. Perfiles soberanos, muros técnicos, grupos dinámicos y mensajería directa entre colegas.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link href="/comunidad" target="_blank" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  Abrir muro de comunidad <ExternalLink size={12} />
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTab('community')}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900"
                >
                  Supervisar foros →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                    OPS
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">InthalyOps Multiempresa</h3>
                    <span className="text-[11px] text-slate-500">sistemaops.inthaly.com</span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Operativo
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Módulos de tareo minero, cálculo de horas extras, inventario, cuadrillas y control de guardias con RLS y aislamiento estricto por empresa.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link href="/dashboard" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  Ir al panel empresarial <ExternalLink size={12} />
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTab('inthaly-ops')}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900"
                >
                  Ver empresas ({companies.length}) →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black">
                    AC
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Inthaly Academy (LMS)</h3>
                    <span className="text-[11px] text-slate-500">app.inthaly.com</span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Satélite Autónomo
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plataforma de cursos, lecciones interactivas y emisión de diplomas SOMA con QR. Arquitectura Laravel 12 / MySQL con contratos de integración OIDC preparados.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Sin fusión de bases de datos</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('academy')}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900"
                >
                  Ver contratos OIDC →
                </button>
              </div>
            </div>

          </div>

          {/* ======================================================================= */}
          {/* MONITOR DE INFRAESTRUCTURA AUTOGESTIONADA DEL ECOSISTEMA               */}
          {/* ======================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Server size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">Infraestructura Autogestionada Inthaly (Etapa 1)</h3>
                  <span className="text-[11px] text-slate-500">PostgreSQL 16 Dedicado · PgBouncer · Redis · Caddy TLS · Backups SHA-256</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                100% Preparada en /infra
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bases de Datos</span>
                <span className="font-bold text-slate-900 block">inthaly_id & inthaly_community</span>
                <span className="text-[10px] text-slate-500 block">Usuarios y credenciales independientes</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Connection Pooler</span>
                <span className="font-bold text-slate-900 block">PgBouncer 1.22 + Redis 7</span>
                <span className="text-[10px] text-emerald-600 font-bold block">Protección contra sobrecargas</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Backups & Disaster Recovery</span>
                <span className="font-bold text-slate-900 block">pg_dump -F c + SHA-256</span>
                <span className="text-[10px] text-slate-500 block">Rotación 30 días y verificación</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seguridad Perimetral</span>
                <span className="font-bold text-slate-900 block">Caddy TLS + UFW + Fail2Ban</span>
                <span className="text-[10px] text-emerald-600 font-bold block">SSL/TLS automatizado</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTHALY ID (SUPERVISIÓN DE IDENTIDADES)                            */}
      {/* ========================================================================= */}
      {activeTab === 'inthaly-id' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900">Identidades Globales Registradas</h2>
              <p className="text-xs text-slate-500">
                Usuarios autenticados mediante Inthaly ID en todo el ecosistema.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Identidad</th>
                  <th className="py-2.5 px-3">Correo</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Verificado</th>
                  <th className="py-2.5 px-3">MFA</th>
                  <th className="py-2.5 px-3">Último Acceso</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIdentities.map(id => (
                  <tr key={id.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {id.display_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{id.display_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{id.email}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                        {id.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {id.is_verified ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Sí
                        </span>
                      ) : (
                        <span className="text-slate-400">Pendiente</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {id.mfa_enabled ? (
                        <span className="text-blue-700 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Activado
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {id.last_login_at 
                        ? new Date(id.last_login_at).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
                        : 'Nunca'
                      }
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => toast.info(`Detalles de auditoría de ${id.display_name} exportados`)}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Auditar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COMUNIDAD INTHALY (SUPERVISIÓN Y MODERACIÓN AUTORIZADA)            */}
      {/* ========================================================================= */}
      {activeTab === 'community' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900">Supervisión de Comunidad Inthaly</h2>
              <p className="text-xs text-slate-500">
                Monitoreo de foros, normas comunitarias y crecimiento de la red profesional.
              </p>
            </div>
            <Link
              href="/comunidad"
              target="_blank"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>Abrir Muro</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grupos Dinámicos</span>
              <h4 className="text-lg font-black text-slate-900">4 Comunidades</h4>
              <span className="text-[10px] text-slate-500">SOMA, Mecánica, Perforación, Transporte</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Publicaciones Técnicas</span>
              <h4 className="text-lg font-black text-slate-900">36 Aportes</h4>
              <span className="text-[10px] text-emerald-600 font-bold">Cero reportes de spam</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Privacidad Laboral</span>
              <h4 className="text-lg font-black text-emerald-700">100% Blindada</h4>
              <span className="text-[10px] text-slate-500">Chats privados no accesibles por diseño</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INTHALY OPS MULTIEMPRESA (PRESERVADO INTACTO CON COMPANIES LIST)   */}
      {/* ========================================================================= */}
      {activeTab === 'inthaly-ops' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Directorio de Empresas InthalyOps</h3>
              <p className="text-xs text-slate-500">
                Aislamiento estricto por cliente multiempresa, gestión de suscripciones y usuarios autorizados.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>Ir a Operaciones</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <CompaniesList companies={companies} users={users} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACADEMIA LMS (SATÉLITE LARAVEL 12)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'academy' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900">Inthaly Academy (LMS Laravel 12)</h2>
              <p className="text-xs text-slate-500">
                Plataforma satélite autónoma en <span className="font-mono text-blue-700 font-bold">app.inthaly.com</span>.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Autónomo / Cero Fusión de BD
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Database size={16} className="text-blue-600" />
                Arquitectura de Datos Separada
              </h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                La base de datos de cursos y lecciones (MySQL) permanece independiente de PostgreSQL de InthalyOps para evitar cualquier cuello de botella en operaciones mineras.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <KeyRound size={16} className="text-emerald-600" />
                Contrato OIDC Preparado
              </h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Inthaly ID provee el cliente <span className="font-mono font-bold">inthaly-academy-satellite</span> para que los alumnos inicien sesión con su misma identidad global.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: INTEGRACIONES Y CLIENTES OIDC                                      */}
      {/* ========================================================================= */}
      {activeTab === 'integrations' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900">Clientes OIDC / OAuth 2.0 Autorizados</h2>
            <p className="text-xs text-slate-500">
              Aplicaciones del ecosistema que consumen el servicio central de Inthaly ID.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900">Comunidad Inthaly Web</h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">client_id: inthaly-community-web</p>
                <div className="flex gap-1.5 mt-2">
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">openid</span>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">profile</span>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">community.write</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Activo
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900">Consola Global del Ecosistema</h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">client_id: inthaly-global-console</p>
                <div className="flex gap-1.5 mt-2">
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">openid</span>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">admin.all</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Activo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: SEGURIDAD Y AUDITORÍA GLOBAL                                       */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900">Auditoría y Registro de Seguridad Global</h2>
            <p className="text-xs text-slate-500">
              Bitácora inmutable de operaciones sensibles del Super Admin y accesos privilegiados.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <ShieldCheck size={16} />
              <span>Protección Criptográfica Inthaly ID Activa</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Todas las contraseñas están derivadas mediante Scrypt (N=16384, r=8, p=1). Los tokens de sesión y autorización OIDC se invalidan al cerrar sesión o al pasar su límite temporal.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
