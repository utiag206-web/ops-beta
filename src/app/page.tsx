import Image from "next/image";
import Link from "next/link";
import { 
  Users, 
  BarChart3, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  LayoutDashboard,
  Zap,
  Globe,
  Lock
} from "lucide-react";

export const metadata = {
  title: "InthalyOps | Gestión Inteligente de Equipos",
  description: "Plataforma moderna para la gestión de trabajadores, asistencia, productividad y operaciones empresariales.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Inthaly<span className="text-blue-600">Ops</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600">Beneficios</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600">Cómo funciona</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden text-sm font-semibold text-slate-900 transition-colors hover:text-blue-600 sm:block"
            >
              Ingresar
            </Link>
            <Link 
              href="/register" 
              className="flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:scale-95"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-32 lg:pb-48">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div className="flex flex-col gap-8 text-center lg:text-left">
                <div className="inline-flex self-center lg:self-start items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                  </span>
                  Sistema de Gestión Profesional
                </div>
                
                <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl xl:text-7xl">
                  Gestiona tu equipo con <span className="text-blue-600">inteligencia</span>
                </h1>
                
                <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0 lg:text-xl">
                  Control de trabajadores, asistencia, productividad y operaciones en una sola plataforma robusta y fácil de usar.
                </p>
                
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Link 
                    href="/register" 
                    className="group flex h-14 items-center justify-center gap-2 rounded-full bg-blue-600 px-8 text-lg font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300"
                  >
                    Empezar Ahora
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link 
                    href="/login" 
                    className="flex h-14 items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-lg font-semibold text-slate-900 transition-all hover:bg-slate-50"
                  >
                    Ingresar
                  </Link>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
                <div className="relative z-10 overflow-hidden rounded-2xl border border-white/20 bg-white/50 p-2 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in duration-700">
                   {/* Placeholder for dashboard preview */}
                   <div className="aspect-[4/3] bg-slate-100 rounded-xl flex items-center justify-center border border-dashed border-slate-300">
                      <LayoutDashboard className="w-24 h-24 text-slate-200" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white py-32">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="mb-20 text-center">
              <h2 className="mb-4 text-3xl font-black text-slate-900 sm:text-4xl">
                Todo lo que necesitas en un solo lugar
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                InthalyOps está diseñado para simplificar la complejidad operativa y potenciar el talento de tu empresa.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Control de personal",
                  desc: "Gestión completa de perfiles, contratos y roles.",
                  icon: Users,
                  color: "bg-blue-50 text-blue-600"
                },
                {
                  title: "Reportes en tiempo real",
                  desc: "Métricas avanzadas para decisiones basadas en datos.",
                  icon: BarChart3,
                  color: "bg-indigo-50 text-indigo-600"
                },
                {
                  title: "IA para productividad",
                  desc: "Algoritmos inteligentes para optimizar flujos.",
                  icon: BrainCircuit,
                  color: "bg-cyan-50 text-cyan-600"
                },
                {
                  title: "Gestión simple y segura",
                  desc: "Encriptación de grado bancario y acceso intuitivo.",
                  icon: ShieldCheck,
                  color: "bg-emerald-50 text-emerald-600"
                }
              ].map((feature, i) => (
                <div key={i} className="group relative rounded-3xl border border-slate-100 bg-white p-8 transition-all hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-50">
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} transition-transform group-hover:scale-110`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BrainCircuit className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">InthalyOps</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} InthalyOps. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
