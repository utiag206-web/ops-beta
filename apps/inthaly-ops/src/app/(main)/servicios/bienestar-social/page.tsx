import React from 'react'
import { HeartHandshake, Clock, Users, Gift, Smile, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Bienestar Social | INTHALY OPS',
  description: 'Gestión de bienestar social, soporte familiar, beneficios e integración de colaboradores.',
}

export default function BienestarSocialPage() {
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
        <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner mb-6">
          <HeartHandshake size={40} />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-black uppercase tracking-wider mb-3">
          <Clock size={12} /> Próxima Activación
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Bienestar Social & Clima Laboral
        </h1>

        <p className="text-slate-500 text-sm max-w-lg mx-auto mt-3 leading-relaxed">
          Módulo de asistencia al trabajador, visitas domiciliarias, canal de apoyo socioemocional y administración de subsidios de EsSalud.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8 text-left">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Users size={20} className="text-indigo-600 mb-2" />
            <p className="text-xs font-black text-slate-800">Casos Sociales</p>
            <p className="text-[11px] text-slate-500 mt-1">Seguimiento individual a colaboradores en situación vulnerable.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Gift size={20} className="text-amber-600 mb-2" />
            <p className="text-xs font-black text-slate-800">Beneficios y Convenios</p>
            <p className="text-[11px] text-slate-500 mt-1">Programas de alimentación, becas e incentivos familiares.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Smile size={20} className="text-emerald-600 mb-2" />
            <p className="text-xs font-black text-slate-800">Clima & Encuestas</p>
            <p className="text-[11px] text-slate-500 mt-1">Medición periódica de satisfacción laboral en unidades remotas.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
