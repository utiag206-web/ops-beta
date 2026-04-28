"use client";

import Link from "next/link";
import { 
  BrainCircuit, 
  ArrowLeft, 
  Mail, 
  Lock, 
  EyeOff,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simular carga
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 selection:bg-blue-100 selection:text-blue-900">
      {/* Background Blobs */}
      <div className="blob top-[-10%] left-[-10%] opacity-30" />
      <div className="blob bottom-[-10%] right-[-10%] opacity-20" />

      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <Link 
          href="/" 
          className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver al inicio
        </Link>

        {/* Login Card */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white/70 p-8 shadow-2xl shadow-blue-100 backdrop-blur-xl lg:p-10">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <BrainCircuit className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900">
              Bienvenido de nuevo
            </h1>
            <p className="text-slate-500 font-medium">
              Ingresa tus credenciales para acceder a InthalyOps
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Correo electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input 
                  type="email" 
                  required
                  placeholder="nombre@empresa.com"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-slate-700">
                  Contraseña
                </label>
                <a href="#" className="text-xs font-bold text-blue-600 hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button 
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <EyeOff className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-1">
              <input 
                type="checkbox" 
                id="remember" 
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="text-sm font-medium text-slate-600 select-none">
                Recordar mi sesión
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="group relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 disabled:opacity-70 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Ingresar
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            ¿No tienes una cuenta?{" "}
            <a href="#" className="font-bold text-blue-600 hover:underline">
              Contacta a soporte
            </a>
          </div>
        </div>

        {/* Footer Info */}
        <p className="mt-8 text-center text-xs font-medium text-slate-400">
          © {new Date().getFullYear()} InthalyOps. Sistema de Gestión de Operaciones.
        </p>
      </div>
    </div>
  );
}
