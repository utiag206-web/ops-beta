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
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* ========================================================================= */}
        {/* LADO IZQUIERDO: BRAND CORPORATIVO INTHALY                                 */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/comunidad" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center font-black text-white text-base shadow-xs group-hover:bg-blue-800 transition-colors">
              IN
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-slate-900 leading-none">
                INTHALY <span className="text-blue-700 font-extrabold text-xs uppercase ml-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200/70">Comunidad</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
                Red Profesional & Industrial
              </span>
            </div>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* LADO DERECHO: 4 ICONOS LIMPIOS [ 🔍 ] [ 🔔 ] [ 💬 ] [ 👤 ]               */}
        {/* Estructura recomendada: media_1794887984001_d6397a3c.png                  */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* 1. Buscador Rápido (Lupa) */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5 w-48 sm:w-64 border border-blue-400 animate-in fade-in duration-150">
                <Search size={15} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar colegas, foros, temas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) setIsSearchOpen(false)
                  }}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 ml-2 focus:outline-none"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Buscar en la red"
              >
                <Search size={17} />
              </button>
            )}
          </div>

          {/* 2. Notificaciones (Campana) */}
          <div className="relative" ref={notifMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen)
                setUnreadNotifications(0)
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative cursor-pointer ${
                isNotificationsOpen ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Notificaciones profesionales"
            >
              <Bell size={17} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
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
                        <span className="font-bold">Elena Rodríguez</span> marcó como útil tu consulta sobre IPERC.
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

          {/* 3. Mensajería Directa (Burbuja de Chat) */}
          <Link
            href="/comunidad"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors relative cursor-pointer"
            title="Mensajes directos y consultas técnicas"
          >
            <MessageCircle size={17} />
          </Link>

          {/* 4. Perfil Profesional (Avatar) con Dropdown */}
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-blue-500/50 transition-all cursor-pointer"
              title="Mi perfil y opciones"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs ring-2 ring-white">
                CM
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  href="/comunidad/perfil"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
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
