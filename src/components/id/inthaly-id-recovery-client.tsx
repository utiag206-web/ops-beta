'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { requestPasswordResetAction, resetPasswordWithTokenAction } from '@/app/(id)/actions'
import { toast } from 'sonner'

export default function InthalyIdRecoveryClient() {
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request')
  const [isLoading, setIsLoading] = useState(false)

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      const res = await requestPasswordResetAction(email)
      if (res.success && res.data) {
        setResetToken(res.data.resetToken)
        setStep('reset')
        toast.success('Token de recuperación generado con éxito.')
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
    if (!newPassword || newPassword.length < 8) {
      toast.error('La contraseña debe tener mínimo 8 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const res = await resetPasswordWithTokenAction(resetToken, newPassword)
      if (res.success) {
        setStep('done')
        toast.success('¡Contraseña actualizada correctamente!')
      } else {
        toast.error(res.error || 'Token inválido o expirado')
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
                {isLoading ? 'Enviando enlace...' : 'Generar Enlace de Recuperación'}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link href="/id/login" className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5">
                <ArrowLeft size={14} /> Volver a Iniciar Sesión
              </Link>
            </div>
          </>
        )}

        {step === 'reset' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl mx-auto border border-blue-200">
                <Lock size={22} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Crear nueva contraseña
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Ingresa una contraseña segura de mínimo 8 caracteres para tu cuenta Inthaly ID.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-0.5">
                <span className="font-bold text-slate-700 block">Token de validación:</span>
                <span className="font-mono text-[10px] break-all text-blue-600">{resetToken}</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? 'Actualizando...' : 'Establecer Nueva Contraseña'}
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-black text-slate-900">¡Contraseña restablecida!</h2>
            <p className="text-xs text-slate-500">
              Tu identidad Inthaly ID ahora está protegida con tu nueva clave. Todas las sesiones anteriores fueron cerradas por seguridad.
            </p>
            <Link
              href="/id/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all"
            >
              <span>Iniciar Sesión Ahora</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
