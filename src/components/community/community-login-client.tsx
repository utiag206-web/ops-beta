'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { loginIdentityAction, authorizeOidcFlowAction } from '@/app/(id)/actions'
import { toast } from 'sonner'

export default function CommunityLoginClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Autenticación directa e inicio de sesión OIDC en Comunidad
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error('Ingresa tu correo y contraseña')
      return
    }

    setIsLoading(true)
    try {
      // 1. Iniciar sesión en Inthaly ID
      const loginRes = await loginIdentityAction({
        email: email.trim(),
        password,
        userAgent: navigator.userAgent
      })

      if (!loginRes.success || !loginRes.data) {
        toast.error(loginRes.error || 'Credenciales inválidas')
        return
      }

      // 2. Autorizar sesión OIDC para Comunidad
      const oidcRes = await authorizeOidcFlowAction({
        clientId: 'inthaly-community-web',
        redirectUri: 'http://localhost:3000/comunidad/callback',
        scope: 'openid profile email community.write'
      })

      if (oidcRes.success && oidcRes.data) {
        router.push(oidcRes.data.redirectUrl)
      } else {
        router.push('/comunidad')
      }
    } catch {
      toast.error('Error de conexión con Inthaly ID')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-[85vh] flex flex-col items-center justify-center px-4 py-8">
      {/* Tarjeta de Inicio de Sesión estilo LinkedIn Contemporáneo */}
      <div className="w-full max-w-[390px] bg-white rounded-2xl border border-slate-200/90 shadow-xl p-7 sm:p-8 space-y-6">
        
        {/* Encabezado y Marca */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              IN
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              Inthaly <span className="text-blue-600">Comunidad</span>
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Iniciar sesión
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Mantente al día en tu red profesional de minería e industria.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email o Correo Electrónico"
              required
              className="w-full text-xs sm:text-sm px-3.5 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
            />
          </div>

          <div className="space-y-1 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              className="w-full text-xs sm:text-sm px-3.5 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 pr-10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex justify-start pt-0.5">
            <Link
              href="/id/recuperar"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-full shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? 'Accediendo a la red...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Separador */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">o continuar con</span>
          </div>
        </div>

        {/* Acceso Soberano Directo */}
        <Link
          href="/id/login?client_id=inthaly-community-web&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcomunidad%2Fcallback"
          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-full border border-slate-300 transition-colors flex items-center justify-center gap-2"
        >
          <ShieldCheck size={14} className="text-blue-600" />
          <span>Portal Central Inthaly ID</span>
        </Link>

        {/* Registro y Pie */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            ¿Nuevo en Comunidad Inthaly?{' '}
            <Link
              href="/id/register?client_id=inthaly-community-web&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcomunidad%2Fcallback"
              className="font-bold text-blue-600 hover:underline"
            >
              Únete ahora
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
