'use client'

import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { useActionState, useState, useEffect, Suspense } from 'react'
import { login } from './actions'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
 const [state, formAction, isPending] = useActionState(login, { error: '' })
 const searchParams = useSearchParams()
 const message = searchParams.get('message')

 const [email, setEmail] = useState('')
 const [rememberEmail, setRememberEmail] = useState(false)

 // Cargar correo recordado al montar el componente bajo consentimiento explícito
 useEffect(() => {
   try {
     const savedEmail = localStorage.getItem('remembered_email')
     if (savedEmail) {
       setEmail(savedEmail)
       setRememberEmail(true)
     }
   } catch (_) {}
 }, [])

 const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
   try {
     if (rememberEmail && email.trim()) {
       localStorage.setItem('remembered_email', email.trim())
     } else {
       localStorage.removeItem('remembered_email')
     }
   } catch (_) {}
 }

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
 <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
 {message && (
 <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700">
 <AlertCircle size={18} />
 <span>{message}</span>
 </div>
 )}

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
 value={email}
 onChange={(e) => setEmail(e.target.value.toLowerCase())}
 data-keep-case="true"
 autoCapitalize="none"
 autoCorrect="off"
 spellCheck="false"
 className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white keep-case lowercase-email"
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
 data-keep-case="true"
 className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-white keep-case"
 placeholder="••••••••"
 />
 </div>
 </div>
 
 {/* Checkbox Recordar mi correo bajo consentimiento explícito */}
 <div className="flex items-center justify-between text-xs pt-0.5">
 <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium hover:text-slate-900 transition-colors">
 <input
 type="checkbox"
 checked={rememberEmail}
 onChange={(e) => setRememberEmail(e.target.checked)}
 className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
 />
 <span>Recordar mi correo en este equipo</span>
 </label>
 </div>
 
 <button
 type="submit"
 disabled={isPending}
 className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
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

export default function LoginPage() {
 return (
 <Suspense fallback={
 <div className="min-h-screen flex items-center justify-center bg-slate-50">
 <Loader2 className="animate-spin text-blue-600" size={32} />
 </div>
 }>
 <LoginForm />
 </Suspense>
 )
}
