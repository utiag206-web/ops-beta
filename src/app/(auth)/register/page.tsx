import Link from 'next/link'
import { ShieldAlert, ArrowRight, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Acceso Corporativo Exclusivo | INTHALY OPS',
  description: 'El registro a INTHALY OPS está restringido a empresas con invitación o demostración comercial autorizada.',
}

export default function RegisterClosedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
          <Building2 size={32} />
        </div>

        <div className="space-y-2">
          <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-black tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            ACCESO PRIVADO / EMPRESARIAL
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Registro Abierto Deshabilitado
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            Por directiva de seguridad y control multitenant, el acceso a <strong className="text-slate-800">INTHALY OPS</strong> no permite autoregistro público.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              <strong>¿Ya eres cliente o colaborador?</strong> Si tu empresa ya fue dada de alta, utiliza tus credenciales institucionales o el enlace de activación que te fue enviado.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldAlert className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              <strong>¿Deseas implementar INTHALY OPS en tu empresa?</strong> Puedes solicitar una demostración personalizada con nuestro equipo comercial para activar tu instancia corporativa.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/login"
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>Iniciar Sesión</span>
          </Link>
          <Link
            href="/?demo=true"
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-200 inline-flex items-center justify-center gap-2"
          >
            <span>Solicitar Demostración</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
