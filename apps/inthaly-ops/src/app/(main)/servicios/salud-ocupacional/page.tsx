import React from 'react'
import { Activity, Clock, ShieldCheck, HeartHandshake, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Salud Ocupacional | INTHALY OPS',
  description: 'Gestión de salud ocupacional, exámenes médicos y legajo de salud preventiva.',
}

export default function SaludOcupacionalPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} /> Volver al Centro de Control
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 sm:p-12 text-center shadow-sm relative overflow-hidden">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner mb-6">
          <Activity size={40} />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black uppercase tracking-wider mb-3">
          <Clock size={12} /> Próxima Activación
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Clínica & Salud Ocupacional
        </h1>

        <p className="text-slate-500 text-sm max-w-lg mx-auto mt-3 leading-relaxed">
          Este módulo se encuentra en fase de homologación médica y parametrización de fichas clínicas anuales (EMO), triajes y descansos médicos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8 text-left">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <ShieldCheck size={20} className="text-blue-600 mb-2" />
            <p className="text-xs font-black text-slate-800">Exámenes Médicos (EMO)</p>
            <p className="text-[11px] text-slate-500 mt-1">Control de aptitudes médicas periódicas y de retiro.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Activity size={20} className="text-emerald-600 mb-2" />
            <p className="text-xs font-black text-slate-800">Triaje y Consultas</p>
            <p className="text-[11px] text-slate-500 mt-1">Registro de signos vitales y atenciones tópicas en faena.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <HeartHandshake size={20} className="text-indigo-600 mb-2" />
            <p className="text-xs font-black text-slate-800">Descansos Médicos</p>
            <p className="text-[11px] text-slate-500 mt-1">Sincronización directa con el control de tareo y subsidios.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
