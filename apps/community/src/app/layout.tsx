import React from 'react'
import Link from 'next/link'
import { Home, Users, Shield, ArrowLeft } from 'lucide-react'
import CommunityNavbar from '@/components/community/community-navbar'
import './globals.css'

export const metadata = {
  title: 'Comunidad Inthaly — Red Profesional Industrial',
  description: 'Red social profesional y de conocimiento técnico para la industria pesada y minería.'
}

export default function CommunityRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#f0f2f5] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white antialiased">
        {/* Cabecera Superior estilo Facebook Contemporáneo */}
        <CommunityNavbar />

        {/* Área de Contenido Principal */}
        <main className="flex-1 w-full max-w-[1920px] mx-auto pb-16 md:pb-6">
          {children}
        </main>

        {/* Navegación Inferior Móvil (Ergonómica y Limpia) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 flex items-center justify-around py-2 px-2 shadow-lg">
          <Link 
            href="/" 
            className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-blue-600 py-1 px-3 rounded-xl bg-blue-50/80"
          >
            <Home size={18} />
            <span>Inicio</span>
          </Link>
          <Link 
            href="/grupos" 
            className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 py-1 px-3"
          >
            <Users size={18} />
            <span>Grupos</span>
          </Link>
          <Link 
            href="/perfil" 
            className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 py-1 px-3"
          >
            <Shield size={18} />
            <span>Perfil</span>
          </Link>
          <a 
            href="http://localhost:3000/dashboard" 
            className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-500 hover:text-blue-600 py-1 px-3"
          >
            <ArrowLeft size={18} />
            <span>InthalyOps</span>
          </a>
        </nav>
      </body>
    </html>
  )
}
