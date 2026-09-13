'use client'

import { Lock, Mail, User, Building2, AlertCircle, Loader2, ArrowRight, CheckCircle2, ShieldCheck, Clock } from 'lucide-react'
import { useActionState } from 'react'
import { register } from './actions'
import Link from 'next/link'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, { error: '' })

  if ((state as any)?.pendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-xs">
            <Clock size={32} />
          </div>
          <div>
            <span className="inline-flex px-3 py-0.5 rounded-full text-[11px] font-black tracking-wider bg-amber-100/80 text-amber-800 border border-amber-200 mb-2.5">
              SOLICITUD EN REVISIÓN
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Registro Empresarial Recibido
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Hemos registrado la empresa <strong className="text-slate-800">{(state as any)?.companyName}</strong> y la cuenta administradora asociada a <strong className="text-slate-800">{(state as any)?.email}</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-2.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Por políticas de seguridad corporativa, cada nueva instancia requiere validación y activación por el <strong>Área Corporativa de INTHALY OPS</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Tan pronto sea aprobada, recibirás la confirmación para iniciar sesión con tus credenciales.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <Link
              href="/"
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors text-center"
            >
              Volver a Inicio
            </Link>
            <Link
              href="/login"
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-200 text-center"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left Side: Aesthetic Hero */}
      <div className="hidden lg:flex flex-col justify-between p-8 xl:p-12 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md">
              <span className="font-bold text-blue-700 text-base">IO</span>
            </div>
            <span className="text-xl font-black tracking-tight">Inthaly<span className="text-blue-200">Ops</span></span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black leading-tight mb-4">
            La plataforma de gestión <br />
            <span className="text-blue-200 underline decoration-blue-400/50 underline-offset-4">inteligente</span> para tu empresa.
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-md leading-relaxed">
            Optimiza tus operaciones, controla la asistencia y gestiona activos desde una sola suite conectada y segura.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
          <div className="space-y-1">
            <h4 className="text-2xl font-black">99.9%</h4>
            <p className="text-blue-200 text-xs font-bold tracking-normal">Disponibilidad</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-black">100%</h4>
            <p className="text-blue-200 text-xs font-bold tracking-normal">Seguro & Encriptado</p>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10">
        <div className="w-full max-w-sm sm:max-w-md space-y-5">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Empieza hoy</h1>
            <p className="text-slate-500 text-xs font-medium">Crea tu cuenta de administrador corporativo en segundos.</p>
          </div>

          <form action={formAction} className="space-y-3.5">
            {state?.error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="font-bold">{state.error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 tracking-tight ml-0.5">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 tracking-tight ml-0.5">Nombre de la Empresa</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    name="companyName"
                    type="text"
                    required
                    placeholder="Ej: Inthaly Corp"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 tracking-tight ml-0.5">Correo Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="tu@empresa.com"
                    data-keep-case="true"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm font-medium text-slate-800 keep-case lowercase-email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 tracking-tight ml-0.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    data-keep-case="true"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm font-medium text-slate-800 keep-case"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-3 cursor-pointer text-xs sm:text-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>Crear mi cuenta corporativa</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="flex items-center gap-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
              <p className="text-[10px] sm:text-[11px] font-medium text-emerald-700">
                Al registrarte, aceptas nuestros términos de servicio y políticas de privacidad empresarial.
              </p>
            </div>

            <div className="text-center mt-5">
              <p className="text-slate-500 text-xs font-medium">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-bold">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
