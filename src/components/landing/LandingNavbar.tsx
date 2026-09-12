'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'

interface LandingNavbarProps {
  onOpenDemo: () => void
}

export function LandingNavbar({ onOpenDemo }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-blue-900/40 bg-[#06122e]/95 backdrop-blur-md shadow-xl shadow-black/20'
          : 'border-b border-blue-900/20 bg-[#06122e]/90 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105 border border-blue-400/30">
            <Image
              src="/logo-ops.png"
              alt="INTHALY OPS Logo"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white">
              INTHALY <span className="text-blue-400">OPS</span>
            </span>
            <span className="text-[10px] font-bold tracking-wider text-blue-200 uppercase">
              Sistema de Gestión Empresarial
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#que-es"
            className="text-sm font-semibold text-slate-200 transition-colors hover:text-white"
          >
            Plataforma
          </a>
          <a
            href="#modulos"
            className="text-sm font-semibold text-slate-200 transition-colors hover:text-white"
          >
            Módulos
          </a>
          <a
            href="#software"
            className="text-sm font-semibold text-slate-200 transition-colors hover:text-white"
          >
            El Software
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white"
          >
            Acceder
          </Link>
          <button
            onClick={onOpenDemo}
            className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 transition-all duration-200 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-blue-400/30"
          >
            <span>Solicitar demostración</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white transition-colors hover:bg-white/10 md:hidden cursor-pointer"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-blue-900/50 bg-[#06122e]/98 backdrop-blur-xl px-4 pt-2 pb-6 shadow-2xl md:hidden animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-3">
            <a
              href="#que-es"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-base font-semibold text-slate-200 hover:bg-white/10"
            >
              Plataforma
            </a>
            <a
              href="#modulos"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-base font-semibold text-slate-200 hover:bg-white/10"
            >
              Módulos
            </a>
            <a
              href="#software"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-base font-semibold text-slate-200 hover:bg-white/10"
            >
              El Software
            </a>
            <hr className="my-1 border-blue-900/40" />
            <Link
              href="/login"
              className="rounded-xl px-3.5 py-2.5 text-center text-base font-bold text-white hover:bg-white/10"
            >
              Acceder
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                onOpenDemo()
              }}
              className="rounded-xl bg-blue-600 py-3 text-center text-base font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 cursor-pointer border border-blue-400/30"
            >
              Solicitar demostración
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
