import React from 'react'
import Link from 'next/link'
import {
  Compass,
  ArrowLeft,
  Users,
  MessageSquare,
  ShieldAlert,
  HardDrive,
  ExternalLink,
  Layers
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function CommunityProductAdminPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/overview" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            <Compass size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Administración de Comunidad Inthaly</h1>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Red Profesional Operativa
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">comunidad.inthaly.com · Esquema inthaly_community (PostgreSQL)</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Red social profesional técnica enfocada en minería e industria. Incluye perfiles soberanos, foros de fallas en faena, políticas de desconexión en 3 niveles y almacenamiento de evidencias en MinIO S3.
        </p>
      </div>

      {/* Indicadores Clave de Comunidad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estilo & Enfoque</span>
          <span className="text-lg font-black text-slate-900">Técnico Industrial</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Sin patrones de ocio</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Almacenamiento Multimedia</span>
          <span className="text-lg font-black text-blue-600">MinIO S3</span>
          <span className="text-[11px] text-slate-500 block">Bucket community-media</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Privacidad Laboral</span>
          <span className="text-lg font-black text-slate-900">ADR-COM-001</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Desconexión en 3 niveles</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base de Datos</span>
          <span className="text-lg font-black text-emerald-600">PostgreSQL 16</span>
          <span className="text-[11px] text-emerald-600 font-bold block">Segregada de Inthaly ID</span>
        </div>
      </div>

      {/* Foros Especializados y Comunidades de Práctica */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Categorías de Foros y Práctica</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Seguridad y Salud (SOMA)</span>
            <span className="text-[11px] text-slate-500">IPERC, estándares de faena y análisis de incidentes.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Mantenimiento Mecánico</span>
            <span className="text-[11px] text-slate-500">Línea amarilla, manuales técnicos y flota pesada.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Geología y Perforación</span>
            <span className="text-[11px] text-slate-500">Mallas de voladura, geomecánica y control de taludes.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Transporte y Carga</span>
            <span className="text-[11px] text-slate-500">Rutas de convoyes y logística de concentrados.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
