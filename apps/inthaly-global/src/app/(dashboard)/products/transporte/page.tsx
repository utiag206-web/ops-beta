import React from 'react'
import Link from 'next/link'
import {
  Truck,
  ArrowLeft,
  Clock,
  Layers,
  MapPin,
  ShieldAlert
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function TransporteProductAdminPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/overview" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black">
            <Truck size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Inthaly Transporte</h1>
              <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                Espacio Arquitectónico Reservado
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">transporte.inthaly.com · Futuro Producto</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Módulo preparado para incorporar progresivamente la gestión de conductores, rutas de transporte de mineral, convoyes en alta montaña y logística de personal de faena.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-2xs text-center space-y-3 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <Clock size={24} />
        </div>
        <h3 className="text-sm font-black text-slate-900">Módulo en Preparación</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          La estructura de INTHALY GLOBAL está lista para incorporar la administración de Transporte en cuanto se inicie su ciclo de construcción, sin requerir refactors en la consola.
        </p>
      </div>
    </div>
  )
}
