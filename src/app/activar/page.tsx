import { ShieldCheck, KeyRound, ArrowRight } from 'lucide-react'
import { verifyAndActivateToken } from './actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ActivarPageProps {
  searchParams: Promise<{ t?: string; token?: string; token_hash?: string }>
}

export default async function ActivarPage({ searchParams }: ActivarPageProps) {
  const params = await searchParams
  const token = params.t || params.token || params.token_hash || ''

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Enlace No Válido</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            No se detectó un código de activación válido en la solicitud. Si ya creaste tu contraseña, ingresa directamente.
          </p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-200"
          >
            <span>Ir al Inicio de Sesión</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        {/* Header Visual */}
        <div className="p-8 text-center bg-gradient-to-r from-blue-900 to-blue-600 text-white relative">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-3 border border-white/20">
            <ShieldCheck className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">INTHALY OPS</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 font-medium">
            Activación de Cuenta y Primer Acceso
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-bold text-slate-800">
              ¡Tu acceso ya está listo!
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Para ingresar por primera vez a la plataforma, confirma la activación y establece tu contraseña personal de acceso.
            </p>
          </div>

          <form action={verifyAndActivateToken.bind(null, token)}>
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-98 cursor-pointer hover:shadow-xl"
            >
              <KeyRound size={16} />
              <span>Activar Cuenta y Crear mi Contraseña</span>
            </button>
          </form>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              🔒 Enlace seguro y encriptado de uso único. Al activarlo, serás redirigido para configurar tu contraseña personal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
