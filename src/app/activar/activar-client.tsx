'use client'

import { useState, useActionState } from 'react'
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'
import { activateAndSetPassword, ActivateState } from './actions'

interface ActivarClientProps {
  token: string
}

export default function ActivarClient({ token }: ActivarClientProps) {
  const [state, formAction, isPending] = useActionState(activateAndSetPassword, {} as ActivateState)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900">Enlace Incompleto</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              No se detectó un código de activación válido en la solicitud. Si ya estableciste tu contraseña, puedes iniciar sesión directamente.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-200"
          >
            <LogIn size={14} />
            <span>Ir al Inicio de Sesión</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        {/* Header Visual */}
        <div className="p-8 text-center bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 text-white relative">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-3 border border-white/20">
            <ShieldCheck className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">INTHALY OPS</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 font-medium">
            Establecer Contraseña — Primer Acceso
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {state?.success ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs animate-in zoom-in-50 duration-300">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900">¡Contraseña Establecida!</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {state.message}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 text-left">
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  ✓ Tu cuenta corporativa ha sido verificada y activada exitosamente en INTHALY OPS. Ya puedes ingresar al panel de control.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl cursor-pointer"
                >
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 font-semibold py-2 px-4 text-xs transition-colors"
                >
                  <span>Ir al Login tradicional</span>
                </Link>
              </div>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="token" value={token} />

              <div className="space-y-1 text-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">
                  Crea tu Contraseña Personal
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Por seguridad, establece la clave secreta con la que ingresarás a INTHALY OPS.
                </p>
              </div>

              {state?.error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5 text-rose-700 text-xs leading-relaxed">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{state.error}</span>
                  </div>

                  {state.isUsedOrExpired && (
                    <Link
                      href="/login"
                      className="w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-xs"
                    >
                      <LogIn size={13} />
                      <span>Ir al Inicio de Sesión</span>
                    </Link>
                  )}
                </div>
              )}

              {/* Nueva Contraseña */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Guardando Contraseña...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Establecer Contraseña y Acceder</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  🔒 Enlace seguro y encriptado de un solo uso. Tu sesión quedará autenticada tras guardar tu contraseña.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
