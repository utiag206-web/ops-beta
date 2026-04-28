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
      <div className="blob top-[-10%] left-[-10%] opacity-50" />
      <div className="blob bottom-[-10%] right-[-10%] opacity-30" />

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
              href="/login" 
              className="flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:scale-95"
            >
              Solicitar Demo
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
                  Lanzamiento v2.0 disponible
                </div>
                
                <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl xl:text-7xl">
                  Gestiona tu equipo con <span className="text-gradient">inteligencia</span>
                </h1>
                
                <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0 lg:text-xl">
                  Control de trabajadores, asistencia, productividad y operaciones en una sola plataforma robusta y fácil de usar.
                </p>
                
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Link 
                    href="/login" 
                    className="group flex h-14 items-center justify-center gap-2 rounded-full bg-blue-600 px-8 text-lg font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300"
                  >
                    Empezar Ahora
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link 
                    href="/login" 
                    className="flex h-14 items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-lg font-semibold text-slate-900 transition-all hover:bg-slate-50"
                  >
                    Ver Tour
                  </Link>
                </div>

                <div className="mt-8 flex items-center justify-center gap-8 grayscale opacity-50 lg:justify-start">
                  <Zap className="h-8 w-8" />
                  <Globe className="h-8 w-8" />
                  <Lock className="h-8 w-8" />
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
                <div className="animate-float relative z-10 overflow-hidden rounded-2xl border border-white/20 bg-white/50 p-2 shadow-2xl backdrop-blur-sm">
                  <Image 
                    src="/images/landing-hero.png" 
                    alt="InthalyOps Dashboard" 
                    width={1000} 
                    height={800} 
                    className="rounded-xl shadow-inner"
                    priority
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-600/10 blur-2xl" />
                <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />
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

        {/* How it Works Section */}
        <section id="how-it-works" className="bg-slate-50 py-32">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <div className="relative rounded-3xl bg-slate-900 p-8 shadow-2xl overflow-hidden">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-3/4 rounded bg-slate-800" />
                    <div className="h-4 w-1/2 rounded bg-slate-800" />
                    <div className="h-32 w-full rounded bg-blue-600/20 flex items-center justify-center">
                       <LayoutDashboard className="h-12 w-12 text-blue-500 opacity-50" />
                    </div>
                    <div className="h-4 w-full rounded bg-slate-800" />
                  </div>
                  {/* Glass Card Overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 glass rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-16 w-16 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <h2 className="mb-8 text-4xl font-black text-slate-900">
                  ¿Cómo funciona <span className="text-blue-600">InthalyOps</span>?
                </h2>
                <div className="space-y-8">
                  {[
                    { step: "01", title: "Configura tu cuenta", desc: "Define departamentos, roles y niveles de acceso en minutos." },
                    { step: "02", title: "Importa tu equipo", desc: "Carga masiva de trabajadores y asignación de activos." },
                    { step: "03", title: "Empieza a gestionar", desc: "Monitorea asistencia, tareas y reportes desde cualquier lugar." }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-200">
                        {step.step}
                      </div>
                      <div>
                        <h4 className="mb-2 text-xl font-bold text-slate-900">{step.title}</h4>
                        <p className="text-slate-600">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-blue-600 px-8 py-20 text-center shadow-2xl shadow-blue-200 lg:px-20 lg:py-28">
              {/* Pattern Background */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
              
              <div className="relative z-10">
                <h2 className="mb-6 text-4xl font-black text-white sm:text-5xl lg:text-6xl">
                  Impulsa tu empresa hoy
                </h2>
                <p className="mx-auto mb-12 max-w-2xl text-xl text-blue-100">
                  Únete a cientos de empresas que ya están transformando su gestión operativa con InthalyOps.
                </p>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link 
                    href="/login" 
                    className="flex h-16 items-center justify-center rounded-full bg-white px-10 text-lg font-bold text-blue-600 shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    Comenzar Gratis
                  </Link>
                  <Link 
                    href="/login" 
                    className="flex h-16 items-center justify-center rounded-full border-2 border-blue-400 px-10 text-lg font-bold text-white transition-all hover:bg-blue-500"
                  >
                    Hablar con Ventas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white pt-24 pb-12">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid gap-16 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Inthaly<span className="text-blue-600">Ops</span>
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                La plataforma líder en gestión operativa para empresas modernas en Latinoamérica.
              </p>
            </div>
            
            <div>
              <h5 className="mb-6 font-bold text-slate-900">Producto</h5>
              <ul className="space-y-4 text-sm font-medium text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Características</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Seguridad</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Mobile App</a></li>
              </ul>
            </div>

            <div>
              <h5 className="mb-6 font-bold text-slate-900">Empresa</h5>
              <ul className="space-y-4 text-sm font-medium text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Carreras</a></li>
              </ul>
            </div>

            <div>
              <h5 className="mb-6 font-bold text-slate-900">Legal</h5>
              <ul className="space-y-4 text-sm font-medium text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-20 border-t border-slate-100 pt-12 text-center text-sm font-medium text-slate-400">
            <p>© {new Date().getFullYear()} InthalyOps. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
