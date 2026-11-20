'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Home, Layers, Users, Building2, Briefcase, 
  MessageSquare, Bookmark, User, ShieldCheck
} from 'lucide-react'

export interface CommunitySidebarProps {
  activeTab?: 'inicio' | 'explorar' | 'red' | 'grupos' | 'oportunidades' | 'guardados' | 'perfil'
  onSelectTab?: (tab: 'inicio' | 'explorar' | 'red' | 'oportunidades' | 'guardados') => void
  groupsCount?: number
  savedCount?: number
  networkCount?: number
  onOpenMessages?: () => void
}

export default function CommunitySidebar({
  activeTab = 'inicio',
  onSelectTab,
  groupsCount = 4,
  savedCount = 0,
  networkCount = 6,
  onOpenMessages
}: CommunitySidebarProps) {
  return (
    <aside className="hidden lg:block lg:col-span-3 space-y-3 select-none">
      <div className="sticky top-20 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        
        {/* Título de Navegación Inthaly */}
        <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            Navegación
          </h2>
          <span className="text-[10px] font-mono text-slate-400">INTHALY</span>
        </div>

        {/* Ítems de Navegación Profesional y Distintivos */}
        <nav className="space-y-1 text-xs font-bold">
          
          {/* 1. Inicio */}
          {onSelectTab ? (
            <button
              type="button"
              onClick={() => onSelectTab('inicio')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'inicio'
                  ? 'border-l-4 border-blue-600 bg-blue-50/90 text-blue-700 pl-3 font-black rounded-r-xl'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Home size={18} className={activeTab === 'inicio' ? 'text-blue-700' : 'text-slate-500'} />
              <span>Inicio</span>
            </button>
          ) : (
            <Link
              href="/comunidad"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'inicio'
                  ? 'border-l-4 border-blue-600 bg-blue-50/90 text-blue-700 pl-3 font-black rounded-r-xl'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Home size={18} className={activeTab === 'inicio' ? 'text-blue-700' : 'text-slate-500'} />
              <span>Inicio</span>
            </Link>
          )}

          {/* 2. Explorar (Icono distintivo Layers / Capas de Conocimiento) */}
          {onSelectTab ? (
            <button
              type="button"
              onClick={() => onSelectTab('explorar')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'explorar'
                  ? 'border-l-4 border-blue-600 bg-blue-50/90 text-blue-700 pl-3 font-black rounded-r-xl'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers size={18} className={activeTab === 'explorar' ? 'text-blue-700' : 'text-slate-500'} />
              <span>Explorar</span>
            </button>
          ) : (
            <Link
              href="/comunidad"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Layers size={18} className="text-slate-500" />
              <span>Explorar</span>
            </Link>
          )}

          {/* 3. Mi red */}
          {onSelectTab ? (
            <button
              type="button"
              onClick={() => onSelectTab('red')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'red'
                  ? 'border-l-4 border-blue-600 bg-blue-50/90 text-blue-700 pl-3 font-black rounded-r-xl'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={18} className={activeTab === 'red' ? 'text-blue-700' : 'text-slate-500'} />
                <span>Mi red</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {networkCount}
              </span>
            </button>
          ) : (
            <Link
              href="/comunidad"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Users size={18} className="text-slate-500" />
                <span>Mi red</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {networkCount}
              </span>
            </Link>
          )}

          {/* 4. Grupos (Enlace activo si estamos en /comunidad/grupos) */}
          <Link
            href="/comunidad/grupos"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'grupos'
                ? 'border-l-4 border-blue-600 bg-blue-50/90 text-blue-700 pl-3 font-black rounded-r-xl'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 size={18} className={activeTab === 'grupos' ? 'text-blue-700' : 'text-slate-500'} />
              <span>Grupos</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {groupsCount}
            </span>
          </Link>

          {/* 5. Oportunidades */}
          {onSelectTab ? (
            <button
              type="button"
              onClick={() => onSelectTab('oportunidades')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'oportunidades'
                  ? 'border-l-4 border-blue-600 bg-blue-50/90 text-blue-700 pl-3 font-black rounded-r-xl'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase size={18} className={activeTab === 'oportunidades' ? 'text-blue-700' : 'text-slate-500'} />
                <span>Oportunidades</span>
              </div>
              <span className="text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                Bolsa
              </span>
            </button>
          ) : (
            <Link
              href="/comunidad"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Briefcase size={18} className="text-slate-500" />
                <span>Oportunidades</span>
              </div>
              <span className="text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                Bolsa
              </span>
            </Link>
          )}

          {/* 6. Mensajes */}
          <button
            type="button"
            onClick={onOpenMessages ? onOpenMessages : () => {}}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className="text-slate-500" />
              <span>Mensajes</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>

          {/* 7. Guardados */}
          {onSelectTab ? (
            <button
              type="button"
              onClick={() => onSelectTab('guardados')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'guardados'
                  ? 'border-l-4 border-blue-600 bg-blue-50/90 text-blue-700 pl-3 font-black rounded-r-xl'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bookmark size={18} className={activeTab === 'guardados' ? 'text-blue-700' : 'text-slate-500'} />
                <span>Guardados</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {savedCount}
              </span>
            </button>
          ) : (
            <Link
              href="/comunidad"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bookmark size={18} className="text-slate-500" />
                <span>Guardados</span>
              </div>
            </Link>
          )}

          {/* 8. Mi perfil */}
          <Link
            href="/comunidad/perfil"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'perfil'
                ? 'border-l-4 border-blue-600 bg-blue-50/90 text-blue-700 pl-3 font-black rounded-r-xl'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <User size={18} className={activeTab === 'perfil' ? 'text-blue-700' : 'text-slate-500'} />
            <span>Mi perfil</span>
          </Link>

        </nav>

        {/* Garantía de Privacidad Soberana Inthaly */}
        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>Privacidad Garantizada</span>
          </div>
          <p className="leading-tight text-slate-400">
            Tus consultas técnicas y mensajes comunitarios no son monitoreados por tu empleador.
          </p>
        </div>

      </div>
    </aside>
  )
}
