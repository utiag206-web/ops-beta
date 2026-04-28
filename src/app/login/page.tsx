"use client";

import Link from "next/link";
import { 
  BrainCircuit, 
  ArrowLeft, 
  Mail, 
  Lock, 
  EyeOff,
  ChevronRight,
  ShieldCheck,
  Zap,
  LayoutDashboard
} from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simular autenticación empresarial
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Immersive Background Elements */}
      <div className="blob top-[-10%] left-[-10%] opacity-40 animate-pulse" />
      <div className="blob bottom-[-10%] right-[-10%] opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #2563eb 1px, transparent 0)", backgroundSize: "48px 48px" }} />

      <div className="relative z-10 w-full max-w-[1100px] px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Left Side: Branding & Info (Hidden on mobile) */}
          <div className="hidden lg:flex flex-col gap-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-200">
                <BrainCircuit className="h-7 w-7" />
              </div>
              <span className="text-3xl font-black tracking-tight text-slate-900">
                Inthaly<span className="text-blue-600">Ops</span>
              </span>
            </div>

            <div className="space-y-6">
              <h2 className="text-5xl font-black leading-[1.1] text-slate-900">
                El futuro de la <span className="text-gradient">gestión operativa</span> comienza aquí.
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed max-w-md">
                Accede a tu panel centralizado para monitorear el talento, la productividad y los activos de tu empresa en tiempo real.
              </p>
            </div>

            <div className="grid gap-6">
              {[
                { icon: ShieldCheck, text: "Seguridad de grado empresarial", color: "text-emerald-500" },
                { icon: Zap, text: "Acceso instantáneo a reportes", color: "text-amber-500" },
                { icon: LayoutDashboard, text: "Panel de control inteligente", color: "text-blue-500" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 transition-transform group-hover:scale-110`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <span className="font-bold text-slate-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Login Card */}
          <div className="mx-auto w-full max-w-md">
            {/* Back to Home Link */}
            <div className="mb-8 flex justify-between items-center">
               <Link 
                href="/" 
                className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-blue-600"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Volver a la web
              </Link>
              <div className="lg:hidden flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-black text-slate-900">InthalyOps</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-white bg-white/80 p-8 shadow-[0_20px_50px_rgba(37,99,235,0.1)] backdrop-blur-2xl lg:p-12">
              <div className="mb-10">
                <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900">
                  Iniciar Sesión
                </h1>
                <p className="text-slate-500 font-semibold">
                  Bienvenido al Centro de Control de Operaciones
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">
                    Correo corporativo
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                    <input 
                      type="email" 
                      required
                      placeholder="usuario@empresa.com"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white/50 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-black text-slate-700">
                      Contraseña
                    </label>
                    <a href="#" className="text-xs font-bold text-blue-600 hover:underline">
                      ¿Olvidaste tu clave?
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white/50 pl-12 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <EyeOff className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-1">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      id="remember" 
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-slate-200 bg-white transition-all checked:bg-blue-600 checked:border-blue-600 focus:ring-offset-0 focus:ring-0"
                    />
                    <svg className="absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100 left-0.5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <label htmlFor="remember" className="text-sm font-bold text-slate-600 cursor-pointer select-none">
                    Mantener sesión iniciada
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="group relative flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 text-lg font-black text-white shadow-2xl shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-400 hover:-translate-y-0.5 disabled:opacity-70 active:translate-y-0"
                >
                  {isLoading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
                  ) : (
                    <>
                      Ingresar al Sistema
                      <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 text-center text-sm font-bold text-slate-500">
                ¿Problemas para acceder?{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Contactar a soporte
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Brand Footer */}
        <div className="mt-16 flex flex-col items-center justify-center gap-6 border-t border-slate-200 pt-8 text-slate-400 lg:flex-row lg:justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} InthalyOps Tech Solutions.
          </p>
          <div className="flex gap-8 text-xs font-black uppercase tracking-widest">
             <a href="#" className="hover:text-blue-600">Privacidad</a>
             <a href="#" className="hover:text-blue-600">Términos</a>
             <a href="#" className="hover:text-blue-600">SLA</a>
          </div>
        </div>
      </div>
    </div>
  );
}
