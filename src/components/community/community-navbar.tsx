'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Search, Users, MessageSquare, Bell, 
  ArrowLeft, LogOut, ChevronDown, 
  ExternalLink, ShieldCheck, User
} from 'lucide-react'

export default function CommunityNavbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(2)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifMenuRef = useRef<HTMLDivElement>(null)

  // Cerrar menús al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
        
        {/* ========================================================================= */}
        {/* 1. LADO IZQUIERDO: LOGO E IDENTIDAD CORPORATIVA INTHALY                   */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/comunidad" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-700 flex items-center justify-center font-black text-white text-base shadow-sm ring-1 ring-blue-500/20 group-hover:scale-105 transition-transform">
              IN
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-slate-900 leading-none">
                  INTHALY
                </span>
                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80 leading-none">
                  Comunidad
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">
                Red Profesional & Industrial
              </span>
            </div>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTRO: BARRA DE BÚSQUEDA PERMANENTE CON PROFUNDIDAD Y RELIEVE         */}
        {/* ========================================================================= */}
        <div className="flex-1 max-w-lg mx-2 hidden sm:block">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar colegas, conocimientos, foros o empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 rounded-full border border-slate-200/80 focus:border-blue-500 focus:ring-3 focus:ring-blue-100/70 shadow-inner transition-all outline-none"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. LADO DERECHO: ACCIONES LIMPIAS CON RELIEVE Y ESTILO CORPORATIVO        */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Botón Volver a InthalyOps */}
          <Link
            href="/dashboard"
            className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-colors shadow-2xs"
            title="Volver a Sistema Operativo InthalyOps"
          >
            <ArrowLeft size={13} />
            <span>InthalyOps</span>
          </Link>

          {/* 1. Notificaciones (Campana con relieve) */}
          <div className="relative" ref={notifMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen)
                setUnreadNotifications(0)
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative cursor-pointer border ${
                isNotificationsOpen 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs' 
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 shadow-2xs'
              }`}
              title="Notificaciones profesionales"
            >
              <Bell size={16} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Notificaciones</h3>
                  <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">Marcar leídas</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      ER
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-800 leading-snug">
                        <span className="font-bold">Elena Rodríguez</span> marcó como útil tu consulta sobre IPERC continuo.
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">Hace 2 horas</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      CF
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-800 leading-snug">
                        <span className="font-bold">Carlos Flores</span> aceptó tu solicitud de conexión profesional.
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">Hace 4 horas</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Mensajería Directa (Burbuja con relieve) */}
          <Link
            href="/comunidad"
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center transition-all relative cursor-pointer shadow-2xs"
            title="Mensajes directos y consultas técnicas"
          >
            <MessageSquare size={16} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </Link>

          {/* 3. Perfil Profesional Ejecutivo (Avatar + Nombre + Chevron) */}
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 transition-all cursor-pointer shadow-2xs"
              title="Mi cuenta y opciones"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                CM
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline max-w-[110px] truncate">
                Carlos M.
              </span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  href="/comunidad/perfil"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    CM
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black text-slate-900 truncate">Ing. Carlos Mendoza</h4>
                    <p className="text-[11px] text-slate-500 truncate">Ver mi perfil profesional (CV)</p>
                  </div>
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <Link
                  href="/comunidad/grupos"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Users size={15} className="text-slate-500" />
                  <span>Grupos & Foros Especializados</span>
                </Link>

                <Link
                  href="/comunidad/perfil"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ShieldCheck size={15} className="text-blue-600" />
                  <span>Privacidad & Salvaguardas</span>
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <Link
                  href="/dashboard"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowLeft size={14} />
                    <span>Volver a InthalyOps</span>
                  </div>
                  <ExternalLink size={12} className="text-slate-400" />
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
