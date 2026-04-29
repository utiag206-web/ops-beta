'use client'

import { Lock, Mail, User, Building2, AlertCircle, Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { register } from './actions'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [isPending, setIsPending] = useState(false)

  async function handleAction(formData: FormData) {
    setIsPending(true)
    
    const result = await register(formData)
    
    if (result?.error) {
      toast.error(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Left Side: Aesthetic Hero */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="text-blue-600" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">Inthaly<span className="text-blue-200">Ops</span></span>
          </div>
          
          <h2 className="text-5xl font-black leading-tight mb-6">
            La plataforma de gestión <br />
            <span className="text-blue-200 underline decoration-blue-400/50 underline-offset-8">inteligente</span> para tu equipo.
          </h2>
          <p className="text-xl text-blue-100 max-w-lg leading-relaxed">
            Optimiza tus operaciones, controla la asistencia y gestiona activos desde una sola interfaz premium y segura.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <h4 className="text-3xl font-black">99.9%</h4>
            <p className="text-blue-200 text-sm font-bold uppercase tracking-wider">Disponibilidad</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-3xl font-black">100%</h4>
            <p className="text-blue-200 text-sm font-bold uppercase tracking-wider">Seguro & Encriptado</p>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Empieza hoy</h1>
            <p className="text-slate-500 font-medium">Crea tu cuenta de administrador en segundos.</p>
          </div>

          <form action={handleAction} className="space-y-5">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Empresa</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      name="companyName"
                      type="text"
                      required
                      placeholder="Ej: Inthaly Corp"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Corporativo</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="tu@empresa.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Procesando...
                </>
              ) : (
                <>
                  Crear mi cuenta
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
              <p className="text-[11px] font-bold text-emerald-700">
                Al registrarte, aceptas nuestros términos de servicio y políticas de privacidad.
              </p>
            </div>

            <div className="text-center mt-8">
              <p className="text-slate-500 font-bold text-sm">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
