'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Search, Home, Users, UserCheck, Bookmark, 
  Plus, MessageCircle, Bell, Grid, Shield, 
  ArrowLeft, Settings, LogOut, ChevronDown, 
  Sparkles, ExternalLink, ShieldCheck, Check
} from 'lucide-react'

export default function CommunityNavbar() {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(3)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifMenuRef = useRef<HTMLDivElement>(null)
  const createMenuRef = useRef<HTMLDivElement>(null)

  // Cerrar menús al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navTabs = [
    {
      id: 'feed',
      label: 'Inicio',
      href: '/comunidad',
      icon: Home,
      isActive: pathname === '/comunidad'
    },
    {
      id: 'groups',
      label: 'Grupos',
      href: '/comunidad/grupos',
      icon: Users,
      isActive: pathname.startsWith('/comunidad/grupos')
    },
    {
      id: 'profile',
      label: 'Mi Perfil',
      href: '/comunidad/perfil',
      icon: Shield,
      isActive: pathname.startsWith('/comunidad/perfil')
    }
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="w-full px-3 md:px-4 h-14 flex items-center justify-between gap-2">
        
        {/* ========================================================================= */}
        {/* LADO IZQUIERDO: BRAND + SEARCH CÁPSULA (FACEBOOK CONTEMPORARY PATTERN)     */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <Link href="/comunidad" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-sm group-hover:scale-105 transition-transform">
              IN
            </div>
            <div className="hidden xl:flex flex-col">
              <span className="font-black text-sm tracking-tight text-slate-900 leading-none">
                Comunidad <span className="text-blue-600">Inthaly</span>
              </span>
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider mt-0.5">
                Red Industrial
              </span>
            </div>
          </Link>

          {/* Cápsula de Búsqueda estilo Facebook Web */}
          <div className="relative">
            <div className="flex items-center bg-[#f0f2f5] hover:bg-[#e4e6e9] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 rounded-full transition-all px-3 py-2 w-10 sm:w-60 md:w-64 border border-transparent">
              <Search size={16} className="text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Buscar en Comunidad Inthaly..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hidden sm:inline-block w-full bg-transparent text-xs text-slate-800 placeholder-slate-500 ml-2 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTRO: PESTAÑAS PRINCIPALES CON INDICADOR ACTIVO AZUL (3PX BOTTOM BAR)   */}
        {/* ========================================================================= */}
        <nav className="hidden md:flex items-center justify-center flex-1 max-w-xl h-full px-2 gap-1 sm:gap-2">
          {navTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`relative flex items-center justify-center h-full px-6 lg:px-10 rounded-lg group transition-colors ${
                  tab.isActive 
                    ? 'text-blue-600' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title={tab.label}
              >
                <Icon size={24} strokeWidth={tab.isActive ? 2.5 : 2} />
                
                {/* Barra indicadora inferior azul activa */}
                {tab.isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-md" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ========================================================================= */}
        {/* LADO DERECHO: ACCIONES CIRCULARES + PERFIL CON DROPDOWN                    */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Botón InthalyOps Volver */}
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-3 py-2 rounded-full border border-slate-200 transition-colors"
            title="Volver a Sistema Operativo InthalyOps"
          >
            <ArrowLeft size={13} />
            <span className="hidden lg:inline">InthalyOps</span>
          </Link>

          {/* Botón Circular: Menú Crear (+) */}
          <div className="relative" ref={createMenuRef}>
            <button
              type="button"
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isCreateMenuOpen ? 'bg-blue-100 text-blue-700' : 'bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-800'
              }`}
              title="Crear contenido o grupo"
            >
              <Plus size={20} />
            </button>

            {isCreateMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Crear</span>
                </div>
                <Link
                  href="/comunidad"
                  onClick={() => setIsCreateMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Publicación Técnica</h4>
                    <p className="text-[11px] text-slate-500">Comparte en el muro de la comunidad</p>
                  </div>
                </Link>
                <Link
                  href="/comunidad/grupos"
                  onClick={() => setIsCreateMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Grupo o Foro</h4>
                    <p className="text-[11px] text-slate-500">Crea un espacio para tu especialidad</p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Botón Circular: Mensajería Messenger */}
          <Link
            href="/comunidad"
            className="w-10 h-10 rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-800 flex items-center justify-center transition-colors relative cursor-pointer"
            title="Mensajes Directos"
          >
            <MessageCircle size={19} />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              1
            </span>
          </Link>

          {/* Botón Circular: Notificaciones */}
          <div className="relative" ref={notifMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen)
                setUnreadNotifications(0)
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative cursor-pointer ${
                isNotificationsOpen ? 'bg-blue-100 text-blue-700' : 'bg-[#e4e6eb] hover:bg-[#d8dadf] text-slate-800'
              }`}
              title="Notificaciones de Comunidad"
            >
              <Bell size={19} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">Notificaciones</h3>
                  <span className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">Ver todas</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      ER
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-800 leading-snug">
                        <span className="font-bold">Elena Rodríguez</span> reaccionó a tu aporte sobre anticongelantes.
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">Hace 2 horas</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      CF
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-800 leading-snug">
                        <span className="font-bold">Carlos Flores</span> quiere conectar profesionalmente contigo.
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">Hace 4 horas</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                      JQ
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-800 leading-snug">
                        <span className="font-bold">Jorge Quispe</span> publicó en <span className="font-bold">Mecánica Pesada</span>.
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">Hace 1 día</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Menú Usuario Circular / Avatar con Dropdown */}
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-blue-500/50 transition-all cursor-pointer"
              title="Cuenta y Opciones"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs ring-2 ring-white">
                CM
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Perfil card en dropdown */}
                <Link
                  href="/comunidad/perfil"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    CM
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black text-slate-900 truncate">Ing. Carlos Mendoza</h4>
                    <p className="text-[11px] text-slate-500 truncate">Ver y administrar tu perfil</p>
                  </div>
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <Link
                  href="/comunidad/grupos"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Users size={16} className="text-slate-500" />
                  <span>Mis Grupos y Foros</span>
                </Link>

                <Link
                  href="/comunidad/perfil"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ShieldCheck size={16} className="text-blue-600" />
                  <span>Privacidad y Salvaguardas</span>
                </Link>

                <Link
                  href="/id/cuenta"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center font-black text-[9px]">
                    ID
                  </div>
                  <span>Gestionar Inthaly ID</span>
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <Link
                  href="/comunidad/login"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <LogOut size={16} className="text-slate-400" />
                  <span>Cambiar de Cuenta Inthaly ID</span>
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <Link
                  href="/dashboard"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ArrowLeft size={16} />
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
