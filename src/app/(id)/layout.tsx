import React from 'react'
import Link from 'next/link'
import { ShieldCheck, Lock, Globe } from 'lucide-react'

export const metadata = {
  title: 'Inthaly ID — Identidad y Seguridad Global',
  description: 'Servicio soberano de identidad, autenticación y sesiones del Ecosistema Inthaly.'
}

export default function InthalyIdLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Barra Superior Minimalista de Seguridad */}
      <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/id/login" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
            ID
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight text-slate-900 leading-none">
              Inthaly <span className="text-blue-600">ID</span>
            </span>
            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider mt-0.5">
              Identidad Global
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Conexión Cifrada</span>
          </div>
          <Link
            href="/comunidad"
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors hidden sm:inline"
          >
            Ir a Comunidad
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        {children}
      </main>

      {/* Footer Soberano */}
      <footer className="py-4 px-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-400 space-y-1">
        <p className="font-medium">
          Inthaly ID · Centro Soberano de Autenticación del Ecosistema Industrial
        </p>
        <p className="text-[11px] text-slate-400">
          Tus credenciales están protegidas con Scrypt de memoria intensiva y arquitectura OIDC descentralizada.
        </p>
      </footer>
    </div>
  )
}
