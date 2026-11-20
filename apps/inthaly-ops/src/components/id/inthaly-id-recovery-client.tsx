'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import { requestPasswordResetAction, resetPasswordWithTokenAction } from '@/app/(id)/actions'
import { toast } from 'sonner'

export default function InthalyIdRecoveryClient() {
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState<'request' | 'sent' | 'reset' | 'done'>('request')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      const res = await requestPasswordResetAction(email)
      if (res.success && res.data) {
        setStatusMessage(res.data.message)
        setStep('sent')
        toast.success('Solicitud procesada con éxito.')
      } else {
        toast.error('Error al procesar la solicitud')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetToken.trim()) {
      toast.error('Ingresa el token de recuperación recibido')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error('La contraseña debe tener mínimo 8 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const res = await resetPasswordWithTokenAction(resetToken.trim(), newPassword)
      if (res.success) {
        setStep('done')
        toast.success('¡Contraseña actualizada correctamente!')
      } else {
        toast.error(res.error || 'Token inválido, expirado o ya utilizado')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-5">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">

        {step === 'request' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl mx-auto border border-amber-200">
                <KeyRound size={22} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Recuperar acceso
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Ingresa el correo registrado con tu Inthaly ID para recibir las instrucciones de restablecimiento.
              </p>
            </div>

            <form onSubmit={handleRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@empresa.com"
                  required
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? 'Procesando...' : 'Enviar Enlace de Recuperación'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between">
              <Link href="/id/login" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                <ArrowLeft size={13} /> Volver a Iniciar Sesión
              </Link>
              <button
                type="button"
                onClick={() => setStep('reset')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Ya tengo un código
              </button>
            </div>
          </>
        )}

        {step === 'sent' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black mx-auto border border-emerald-200">
              <Mail size={22} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">Instrucciones enviadas</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {statusMessage}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1">
              <p className="text-[11px] text-slate-600 flex items-start gap-1.5 font-medium">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                Por salvaguarda de seguridad, los enlaces de recuperación expiran en 60 minutos y son estrictamente de un solo uso.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('reset')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ingresar código de restablecimiento
              </button>
              <Link
                href="/id/login"
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors inline-block"
              >
                Regresar al inicio de sesión
              </Link>
            </div>
          </div>
        )}

        {step === 'reset' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl mx-auto border border-blue-200">
                <Lock size={22} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Establecer nueva contraseña
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Ingresa el código o token de recuperación y define tu nueva contraseña segura.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound size={13} className="text-slate-400" /> Código o Token de Recuperación
                </label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Pega el token recibido"
                  required
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-400" /> Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft size={13} /> Solicitar un nuevo enlace
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-2xl mx-auto border border-emerald-200">
              <CheckCircle2 size={30} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">¡Contraseña actualizada!</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Tu clave ha sido reestablecida con éxito y todas las sesiones previas han sido cerradas por precaución.
              </p>
            </div>
            <Link
              href="/id/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all"
            >
              Iniciar Sesión con tu Inthaly ID <ArrowRight size={14} />
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
