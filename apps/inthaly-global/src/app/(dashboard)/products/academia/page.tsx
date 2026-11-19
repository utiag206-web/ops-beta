import React from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Database,
  Lock,
  QrCode,
  ShieldAlert,
  Server,
  FileCheck
} from 'lucide-react'
import { getAdminAcademiaData } from '@/lib/data/ecosystem-data.service'

export const dynamic = 'force-dynamic'

export default async function AcademiaProductAdminPage() {
  const academia = await getAdminAcademiaData()

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
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Supervisión Inthaly Academia (LMS)</h1>
                <span className="text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  Satélite Autónomo
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">app.inthaly.com · Laravel 12 & MySQL 8.4 Autónomo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://app.inthaly.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Abrir Portal Academia</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Plataforma de formación técnica industrial y emisión de diplomas SOMA con validación por código QR. Diseñada como satélite autónomo bajo Laravel 12 / MySQL, garantizando total independencia sin acoplamiento de bases de datos.
        </p>
      </div>

      {/* 2. Banner de Aislamiento Estricto y No Fusión de Bases de Datos */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4.5 space-y-2">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-amber-700 shrink-0" />
          <h2 className="text-xs font-black text-amber-950 uppercase tracking-wider">
            Arquitectura Satélite: Cero Fusión de Bases de Datos
          </h2>
        </div>
        <p className="text-xs text-amber-950/90 leading-relaxed">
          Inthaly Academia opera con su propio motor MySQL 8.4 autónomo. Queda terminantemente prohibida la unión o fusión directa con las bases de datos PostgreSQL de Inthaly ID o Comunidad. Toda interacción inter-ecosistema se realiza exclusivamente mediante contratos de API y OIDC.
        </p>
      </div>

      {/* 3. Indicadores del Satélite */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Certificados SOMA Emitidos</span>
          <span className="text-lg font-black text-slate-900">{academia.totalCertificationsIssued}</span>
          <span className="text-[11px] text-emerald-600 font-bold block">100% Verificables con QR</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cursos Técnicos Activos</span>
          <span className="text-lg font-black text-amber-600">{academia.activeCoursesCount} Cursos</span>
          <span className="text-[11px] text-slate-500 block">SOMA, Mina, Mecánica</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stack Tecnológico</span>
          <span className="text-lg font-black text-slate-900">Laravel 12</span>
          <span className="text-[11px] text-slate-500 block">PHP 8.3 / MySQL 8.4</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contrato OIDC</span>
          <span className="text-lg font-black text-emerald-600">Preparado</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Cliente Confidencial</span>
        </div>
      </div>

      {/* 4. Especificación Técnica de Integración */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Contrato de Integración OIDC con Inthaly ID
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block">Parámetros del Cliente Satélite:</span>
            <div className="space-y-1 font-mono text-[11px] text-slate-600">
              <p><span className="text-slate-400">Client ID:</span> inthaly-academy-satellite</p>
              <p><span className="text-slate-400">Tipo de Cliente:</span> Confidencial (client_secret_hash)</p>
              <p><span className="text-slate-400">Redirect URI:</span> https://app.inthaly.com/auth/oidc/callback</p>
              <p><span className="text-slate-400">Scopes Permitidos:</span> openid, profile, email, academy.certifications</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block">Validación Criptográfica de Diplomas:</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Cada diploma emitido por Academia genera un token criptográfico HMAC-SHA256 con firma del docente responsable y timestamp inmutable, embebido directamente en el código QR del PDF impreso para auditorías de SUNAFIL o fiscalizaciones en mina.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
