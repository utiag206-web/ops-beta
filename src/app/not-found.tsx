import Link from 'next/link'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-4">
      <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-indigo-50 flex flex-col items-center text-center max-w-lg w-full">
        <div className="bg-rose-50 p-6 rounded-3xl mb-8 animate-pulse">
          <AlertCircle className="w-16 h-16 text-rose-500" />
        </div>
        
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Página No Encontrada</h2>
        
        <p className="text-slate-500 text-lg leading-relaxed mb-10 font-medium">
          Lo sentimos, el módulo o registro que buscas no existe o ha sido movido.
        </p>

        <Link 
          href="/dashboard"
          className="flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl transition-all shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Home className="w-6 h-6" />
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}
