'use client'

import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react'
import { useActionState, useState } from 'react'
import { sendPasswordResetEmail, ForgotPasswordState } from './actions'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(sendPasswordResetEmail, {} as ForgotPasswordState)
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Visual */}
        <div className="p-8 text-center bg-gradient-to-r from-blue-800 to-blue-600 text-white">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-xs rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-3 border border-white/20">
            <KeyRound className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Recuperar Contraseña</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Restablece el acceso a tu cuenta corporativa
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {state?.success ? (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900">Enlace Enviado</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {state.message}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-left">
                <p className="text-[11px] text-slate-500 leading-normal">
                  <strong className="text-slate-700">Nota de seguridad:</strong> El enlace expirará automáticamente en 24 horas. Si no visualizas el correo en tu bandeja principal, verifica la carpeta de correo no deseado (spam).
                </p>
              </div>

              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-colors shadow-sm"
              >
                <ArrowLeft size={16} />
                Volver a Iniciar Sesión
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Ingresa el correo electrónico asociado a tu cuenta institucional. Te enviaremos un enlace seguro para crear una nueva contraseña.
              </p>

              {state?.error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="font-medium">{state.error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    data-keep-case="true"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm keep-case lowercase-email"
                    placeholder="tu@empresa.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer text-xs sm:text-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Enviando enlace...
                  </>
                ) : (
                  'Enviar enlace de recuperación'
                )}
              </button>

              <div className="pt-3 border-t border-slate-100 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
