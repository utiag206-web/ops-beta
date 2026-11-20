import React from 'react'
import Link from 'next/link'
import { Shield, CheckCircle2, XCircle, ArrowLeft, Info, Users, Sparkles, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function InvitationLandingPage({ params }: PageProps) {
  const { token } = await params

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 px-4 space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-6">
        
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-md shadow-blue-500/20">
          <Sparkles size={32} />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Invitación Voluntaria de Empresa
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-3 tracking-tight">
            Te han invitado a sumarte a Comunidad Inthaly
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
            Tu empresa empleadora te sugiere activar tu perfil profesional para participar en comunidades de práctica técnica sobre minería, maquinaria pesada y seguridad con colegas de todo el país.
          </p>
        </div>

        {/* GARANTÍA INVIOLABLE DE SOBERANÍA PERSONAL */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-black text-blue-900 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-blue-600" />
            Principio de Libertad e Independencia (ADR-013)
          </p>
          <ul className="text-[11px] text-blue-800/80 list-disc list-inside space-y-1 leading-relaxed">
            <li>Aceptar o rechazar esta invitación es <strong className="text-slate-900">100% voluntario</strong>.</li>
            <li>Rechazarla <strong className="text-slate-900">NO afecta en nada</strong> tu contrato de trabajo, tu tareo ni tu sueldo.</li>
            <li>Tu empresa <strong className="text-slate-900">NO tiene acceso</strong> a tus contactos ni mensajes en Comunidad.</li>
          </ul>
        </div>

        {/* BOTONES DE DECISIÓN SOBERANA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href="/comunidad/perfil"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <CheckCircle2 size={15} />
            <span>Aceptar y Activar Perfil</span>
          </Link>

          <Link
            href="/dashboard"
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-200"
          >
            <XCircle size={15} className="text-slate-400" />
            <span>No me interesa por ahora</span>
          </Link>
        </div>

      </div>
    </div>
  )
}
