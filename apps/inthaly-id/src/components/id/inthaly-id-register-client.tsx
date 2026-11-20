'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Lock, Mail, User, ShieldCheck, ArrowRight, 
  Check, Eye, EyeOff, Shield, Sparkles 
} from 'lucide-react'
import { registerIdentityAction, authorizeOidcFlowAction } from '@/app/(id)/actions'
import { toast } from 'sonner'

export default function InthalyIdRegisterClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const scope = searchParams.get('scope') || 'openid profile email'

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Medidor simple de complejidad de clave
  const hasMinLength = password.length >= 8
  const hasNumberOrSymbol = /[\d\W]/.test(password)
  const hasUpperCase = /[A-Z]/.test(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim() || !email.trim() || !password) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    if (!hasMinLength) {
      toast.error('La contraseña debe tener mínimo 8 caracteres')
      return
    }

    if (!passwordsMatch) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (!agreeTerms) {
      toast.error('Debes aceptar los términos y soberanía de datos')
      return
    }

    setIsLoading(true)
    try {
      const res = await registerIdentityAction({
        email,
        password,
        displayName,
        userAgent: navigator.userAgent
      })

      if (res.success && res.data) {
        toast.success(`¡Cuenta Inthaly ID creada para ${res.data.identity.display_name}!`)

        // Flujo OIDC
        if (clientId && redirectUri) {
          const oidcRes = await authorizeOidcFlowAction({
            clientId,
            redirectUri,
            scope
          })
          if (oidcRes.success && oidcRes.data) {
            router.push(oidcRes.data.redirectUrl)
            return
          }
        }

        router.push('/id/cuenta')
      } else {
        toast.error(res.error || 'Error al crear la cuenta')
      }
    } catch {
      toast.error('Error de comunicación con el servicio de identidad')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-5">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-md shadow-blue-600/25">
            ID
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Crear tu identidad <span className="text-blue-600">Inthaly ID</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Accede a todas las herramientas técnicas e industriales con una única cuenta global.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User size={13} className="text-slate-400" /> Nombre Completo y Título Profesional
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej: Ing. Marco Antonio Ramos"
              required
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

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
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Lock size={13} className="text-slate-400" /> Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Lock size={13} className="text-slate-400" /> Confirmar Contraseña
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Validadores visuales */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-500">
            <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-bold' : ''}`}>
              <Check size={11} className={hasMinLength ? 'text-emerald-600' : 'text-slate-300'} />
              8+ caracteres
            </span>
            <span className={`flex items-center gap-1 ${hasNumberOrSymbol ? 'text-emerald-600 font-bold' : ''}`}>
              <Check size={11} className={hasNumberOrSymbol ? 'text-emerald-600' : 'text-slate-300'} />
              Número o símbolo
            </span>
            <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-emerald-600 font-bold' : ''}`}>
              <Check size={11} className={hasUpperCase ? 'text-emerald-600' : 'text-slate-300'} />
              Mayúscula
            </span>
            <span className={`flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600 font-bold' : ''}`}>
              <Check size={11} className={passwordsMatch ? 'text-emerald-600' : 'text-slate-300'} />
              Coinciden
            </span>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mt-0.5"
            />
            <label htmlFor="terms" className="text-[11px] text-slate-600 leading-tight cursor-pointer">
              Acepto los <span className="font-bold text-slate-900">Términos de Servicio</span> y la política de{' '}
              <span className="font-bold text-slate-900">Soberanía de Datos e Independencia Laboral</span>.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'Registrando identidad...' : 'Registrar Identidad Global'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            ¿Ya tienes una cuenta Inthaly ID?{' '}
            <Link href="/id/login" className="font-black text-blue-600 hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
