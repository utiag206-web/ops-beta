import React from 'react'
import Link from 'next/link'
import {
  Truck,
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Layers,
  FileText,
  AlertTriangle,
  Compass
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function TransporteProductAdminPage() {
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
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Supervisión Inthaly Transporte</h1>
                <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  En Hoja de Ruta
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">transporte.inthaly.com · Módulo en Preparación</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Plataforma especializada en transporte de personal minero, logística terrestre y gestión de flotas. Diseñada para operar de forma modular y desacoplada dentro del ecosistema tecnológico INTHALY.
        </p>
      </div>

      {/* 2. Pilares de Arquitectura de Transporte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MapPin size={18} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Rutas & Puntos de Relevo</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Planificación de subidas y bajadas de campamentos mineros a gran altitud (4,000+ msnm), con control de paradas técnicas obligatorias.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Control de Fatiga y Somnolencia</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Registro de horas de sueño, pruebas sensoriales y cumplimiento de descansos legales para conductores de unidades de traslado de cuadrillas.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldCheck size={18} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Inspección Técnica Pre-Uso</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Checklist digital antes de cada servicio: frenos, neumáticos de nieve/barro, cinturones de seguridad y equipo de radio comunicación minera.
          </p>
        </div>
      </div>
    </div>
  )
}
