import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'

export default function GlobalUsersPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/super-admin" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <Users size={32} />
          Usuarios Globales
        </h1>
      </div>
      <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
        <p className="text-slate-500 font-bold text-lg">Módulo de gestión de accesos maestros.</p>
        <p className="text-slate-400 mt-2">Actualmente los usuarios se visualizan en el panel lateral de la Consola Global.</p>
        <Link href="/super-admin" className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-slate-800 transition-all">
          Volver a Consola
        </Link>
      </div>
    </div>
  )
}
