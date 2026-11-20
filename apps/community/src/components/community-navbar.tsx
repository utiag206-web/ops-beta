'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search, Users, MessageSquare, Bell,
  ArrowLeft, LogOut, ChevronDown,
  ExternalLink, ShieldCheck, User, Home, Shield
} from 'lucide-react'

export default function CommunityNavbar() {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(2)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifMenuRef = useRef<HTMLDivElement>(null)

  // Determinar pestaña activa según pathname
  const isFeed = pathname === '/comunidad'
  const isGroups = pathname.startsWith('/comunidad/grupos')
  const isProfile = pathname.startsWith('/comunidad/perfil')

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
      <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">

        {/* ========================================================================= */}
        {/* 1. LADO IZQUIERDO: LOGO E IDENTIDAD CORPORATIVA INTHALY                   */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/comunidad" className="flex items-center gap-2.5 group">
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
              <span className="hidden sm:inline text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">
                Red Profesional & Industrial
              </span>
            </div>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTRO: NAVEGACIÓN SUPERIOR PRINCIPAL + BUSCADOR                        */}
        {/* Resuelve: Retorno claro al Feed/Inicio desde cualquier vista y balance    */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center max-w-2xl mx-1 sm:mx-4">

          {/* Barra de Búsqueda Rápida */}
          <div className="relative w-full max-w-xs hidden md:block">
            <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colegas o foros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 rounded-full border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-inner transition-all outline-none"
            />
          </div>

          {/* Pestañas de Navegación Superior Visibles */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/70">
            {/* 1. Feed Principal / Inicio */}
            <Link
              href="/comunidad"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isFeed
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              title="Ir al Feed Principal"
            >
              <Home size={15} />
              <span className="hidden sm:inline">Feed Principal</span>
            </Link>

            {/* 2. Grupos & Foros */}
            <Link
              href="/comunidad/grupos"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isGroups
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              title="Explorar Grupos Técnicos"
            >
              <Users size={15} />
              <span className="hidden sm:inline">Grupos & Foros</span>
            </Link>

            {/* 3. Mi Perfil */}
            <Link
              href="/comunidad/perfil"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isProfile
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              title="Ver Mi Perfil Profesional"
            >
              <User size={15} />
              <span className="hidden sm:inline">Mi Perfil</span>
            </Link>
          </nav>

        </div>

        {/* ========================================================================= */}
        {/* 3. LADO DERECHO: ACCIONES LIMPIAS CON RELIEVE Y ESTILO CORPORATIVO        */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

          {/* Botón Volver a InthalyOps */}
          <Link
            href="/dashboard"
            className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-colors shadow-2xs"
            title="Volver a Sistema Operativo InthalyOps"
          >
            <ArrowLeft size={13} />
            <span>InthalyOps</span>
          </Link>

          {/* Notificaciones */}
          <div className="relative" ref={notifMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen)
                setUnreadNotifications(0)
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative cursor-pointer border ${isNotificationsOpen
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
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ER
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-800">
                        <span className="font-bold">Elena Rodríguez</span> comentó en el foro <span className="font-semibold text-blue-700">SOMA & Seguridad</span>.
                      </p>
                      <span className="text-[10px] text-slate-400">Hace 15 min</span>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      JQ
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-800">
                        <span className="font-bold">Jorge Quispe</span> guardó tu manual técnico de motores Cummins.
                      </p>
                      <span className="text-[10px] text-slate-400">Hace 1 hora</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mensajes Directos / Chat */}
          <Link
            href="/comunidad"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-2xs transition-all cursor-pointer"
            title="Mensajes comunitarios"
          >
            <MessageSquare size={16} />
          </Link>

          {/* Menú de Perfil Ejecutivo (Pill con relieve) */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-700 text-white font-black text-xs flex items-center justify-center ring-1 ring-white">
                CM
              </div>
              <span className="hidden sm:inline text-xs font-bold text-slate-800 max-w-[85px] truncate">
                Carlos M.
              </span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">Ing. Carlos Mendoza</p>
                  <p className="text-[10px] text-slate-500 truncate">carlos.mendoza@inthaly.com</p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded mt-1.5 w-fit">
                    <ShieldCheck size={12} /> Identidad Inthaly ID Activa
                  </div>
                </div>

                <div className="py-1 text-xs font-semibold text-slate-700">
                  <Link
                    href="/comunidad/perfil"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors"
                  >
                    <User size={14} className="text-slate-400" />
                    <span>Mi Perfil Profesional</span>
                  </Link>
                  <Link
                    href="/comunidad/grupos"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors"
                  >
                    <Users size={14} className="text-slate-400" />
                    <span>Mis Grupos y Foros</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition-colors text-blue-700 font-bold"
                  >
                    <ExternalLink size={14} />
                    <span>Ir a InthalyOps</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1">
                  <Link
                    href="/comunidad/perfil"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold"
                  >
                    <LogOut size={14} />
                    <span>Ajustes de Privacidad & Salida</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  )
}
