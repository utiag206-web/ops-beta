'use client'

import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import { useActionState, useState } from 'react'
import { updatePassword, ResetPasswordState } from './actions'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, {} as ResetPasswordState)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Visual */}
        <div className="p-8 text-center bg-gradient-to-r from-blue-800 to-blue-600 text-white">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-xs rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-3 border border-white/20">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Establecer Contraseña</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Crea tu clave segura para acceder a INTHALY OPS
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {state?.success ? (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900">¡Contraseña Establecida!</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {state.message}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-left">
                <p className="text-[11px] text-slate-500 leading-normal">
                  Tu cuenta ha sido confirmada y activada con éxito en los servidores de INTHALY OPS.
                </p>
              </div>

              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-200"
              >
                <span>Ingresar a la Plataforma</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Por motivos de seguridad, ingresa y confirma la nueva contraseña con la que ingresarás al sistema.
              </p>

              {state?.error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="font-medium">{state.error}</span>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-keep-case="true"
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm keep-case"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-keep-case="true"
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white text-xs sm:text-sm keep-case"
                    placeholder="Repite la contraseña"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[11px] font-medium text-slate-600">Recomendaciones:</p>
                <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-0.5">
                  <li>Al menos 6 caracteres de longitud.</li>
                  <li>Combina letras y números para mayor seguridad.</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer text-xs sm:text-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Guardando contraseña...
                  </>
                ) : (
                  'Guardar Contraseña y Continuar'
                )}
              </button>

              <div className="pt-3 border-t border-slate-100 text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
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
