import React from 'react'
import Link from 'next/link'
import {
  Compass,
  Users,
  ShieldCheck,
  Building2,
  ExternalLink,
  ArrowLeft,
  Lock,
  Globe,
  Tag,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react'
import { getAdminCommunityGroups } from '@/lib/data/ecosystem-data.service'

export const dynamic = 'force-dynamic'

export default async function ComunidadProductAdminPage() {
  const groups = await getAdminCommunityGroups()
  const totalMembers = groups.reduce((acc, g) => acc + g.membersCount, 0)

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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <Compass size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Supervisión de Comunidad Inthaly</h1>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Operativo Soberano
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">comunidad.inthaly.com · Esquema inthaly_community (PostgreSQL)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="http://localhost:3000/comunidad"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Abrir Muro Comunitario</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
            <a
              href="http://localhost:3000/comunidad/grupos"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <span>Ver Foros Especializados</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Red profesional y técnica especializada en la industria minera y pesada. Conecta personas, conocimientos y oportunidades laborales con estricta soberanía de datos y almacenamiento de multimedia en MinIO S3 sin sobrecargar la base de datos relacional.
        </p>
      </div>

      {/* 2. Banner de Garantía Inmutable de Privacidad (ADR-014) */}
      <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4.5 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-blue-600 shrink-0" />
          <h2 className="text-xs font-black text-blue-950 uppercase tracking-wider">
            Garantía Inmutable de Privacidad Comunitaria (ADR-014)
          </h2>
        </div>
        <p className="text-xs text-blue-900/90 leading-relaxed">
          Las consultas técnicas, participaciones en foros y postulaciones de los trabajadores están completamente desacopladas de sus empresas empleadoras en InthalyOps. Las empresas no tienen acceso a registros de actividad comunitaria, salvaguardando la libertad técnica de los profesionales.
        </p>
      </div>

      {/* 3. Indicadores de Comunidad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grupos Especializados</span>
          <span className="text-lg font-black text-slate-900">{groups.length} Foros</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Creación Abierta Activa</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Participación en Foros</span>
          <span className="text-lg font-black text-blue-600">{totalMembers} Profesionales</span>
          <span className="text-[11px] text-slate-500 block">SOMA, Mina, Mecánica</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Almacenamiento Multimedia</span>
          <span className="text-lg font-black text-slate-900">MinIO S3</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Cero BYTEA en PostgreSQL</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aislamiento Laboral</span>
          <span className="text-lg font-black text-emerald-600">100% Protegido</span>
          <span className="text-[11px] text-slate-500 block">Anti-Espionaje Empresarial</span>
        </div>
      </div>

      {/* 4. Lista de Grupos & Foros Especializados */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Comunidades de Práctica & Foros Técnicos ({groups.length})
            </h2>
            <p className="text-xs text-slate-500">Espacios colaborativos creados para resolución de fallas en campo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    {group.category}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                    {group.privacy === 'public' ? <Globe size={11} /> : <Lock size={11} />}
                    {group.privacy === 'public' ? 'Público' : 'Cerrado'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{group.name}</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2 mt-1">
                    {group.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {group.tags.map((t) => (
                    <span key={t} className="text-[10px] font-mono text-blue-600 bg-blue-50/80 px-1.5 py-0.2 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1">
                  <Users size={13} className="text-slate-400" />
                  {group.membersCount} miembros
                </span>
                <span className="text-[10px] text-emerald-600 uppercase">Activo</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
