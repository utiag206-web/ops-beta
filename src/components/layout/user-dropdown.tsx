'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { UserCircle, Settings, LogOut, ChevronDown } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'

export function UserDropdown({ 
  userName, 
  userRole, 
  initial 
}: { 
  userName: string, 
  userRole: string,
  initial: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200"
      >
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-sm">
          {initial}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-slate-700 leading-none">{userName}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{userRole}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-100 z-50">
          <div className="px-4 py-3 border-b border-slate-50 mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mi Cuenta</p>
          </div>
          
          <Link 
            href="/profile" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
          >
            <UserCircle size={18} />
            Mi Perfil
          </Link>
          
          <Link 
            href="/settings" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium opacity-50 cursor-not-allowed"
          >
            <Settings size={18} />
            Configuración
          </Link>
          
          <div className="h-px bg-slate-50 my-1 mx-2"></div>
          
          <form action={logout}>
            <button 
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
