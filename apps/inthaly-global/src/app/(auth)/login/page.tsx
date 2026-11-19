'use client'

import React, { useActionState, useState } from 'react'
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles, KeyRound } from 'lucide-react'
import { loginAdminAction, type LoginActionState } from './actions'

const initialState: LoginActionState = {}

export default function GlobalLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAdminAction, initialState)
  const [email, setEmail] = useState('admin@inthaly.com')
  const [password, setPassword] = useState('SuperAdmin2026!')

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        
        {/* Cabecera */}
        <div className="p-8 text-center bg-slate-900 border-b border-slate-800 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg mx-auto shadow-md shadow-blue-900/30">
            IN
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">INTHALY GLOBAL</h1>
            <span className="text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
              Admin
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Centro Único de Control y Administración del Ecosistema
          </p>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
            <Shield size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Autenticación Soberana</span>
              <span className="text-[11px] text-blue-700">Acceso protegido mediante Inthaly ID con cifrado Scrypt y tokens blindados.</span>
            </div>
          </div>

          {state?.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-bold">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Correo Institucional</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@inthaly.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Contraseña Maestra</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isPending ? 'Validando credenciales...' : 'Acceder a la Consola Global'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Opción OIDC SSO Directa */}
          <div className="pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-bold uppercase">O bien</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <a
              href="http://localhost:3000/api/oidc/authorize?client_id=inthaly-global-console&redirect_uri=http://localhost:3001/callback&response_type=code&scope=openid%20profile%20email%20admin.all"
              className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={14} className="text-blue-600" />
              <span>Continuar con Inthaly ID (OIDC SSO)</span>
            </a>
          </div>

          <div className="pt-1 text-center">
            <span className="text-[10px] text-slate-400">
              Sesión administrativa segura con cookie HTTP-Only y SameSite=Lax.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
