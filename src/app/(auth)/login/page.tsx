'use client'

export const dynamic = 'force-dynamic'

import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { useActionState } from 'react'
import { login } from './actions'
import Link from 'next/link'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, { error: null })

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center bg-gradient-to-r from-blue-800 to-blue-600">
          <div className="w-16 h-16 bg-white rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <span className="text-3xl font-bold text-blue-700">IO</span>
          </div>
          <h1 className="text-2xl font-bold text-white">InthalyOps</h1>
          <p className="text-blue-100 mt-2">Acceso a la plataforma</p>
        </div>
        
        <div className="p-8">
          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className={`p-3 border rounded-lg flex items-center gap-2 text-sm ${
                (state as any).code === 'weak_password' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <AlertCircle size={18} />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                  placeholder="tu@empresa.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                ¿No tienes una cuenta?{' '}
                <Link href="/register" className="text-blue-600 font-bold hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
