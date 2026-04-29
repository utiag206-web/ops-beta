import { ShieldCheck, LayoutDashboard, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-8 h-20 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter">Inthaly<span className="text-blue-600">Ops</span></span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-700">{user.email}</p>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Administrador</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 border border-slate-200">
            {user.email?.[0].toUpperCase()}
          </div>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 shadow-sm text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl mx-auto flex items-center justify-center mb-8">
            <LayoutDashboard size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Bienvenido al Panel de Control</h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto mb-10 leading-relaxed font-medium">
            Tu cuenta ha sido configurada correctamente. Estás viendo la versión estable de producción.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Estado del Sistema', value: 'Operativo', color: 'text-emerald-500' },
              { label: 'Empresa', value: 'InthalyOps Corp', color: 'text-blue-600' },
              { label: 'Nivel de Acceso', value: 'Total / Admin', color: 'text-indigo-600' }
            ].map((stat, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100/50">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <Link 
            href="/login" 
            className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </Link>
        </div>
      </main>
    </div>
  )
}
