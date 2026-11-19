'use client'

import React from 'react'
import {
  ExternalLink,
  Shield,
  Bell,
  RefreshCw,
  Search
} from 'lucide-react'

export function AdminHeader() {
  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-tight text-slate-800">INTHALY GLOBAL</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-500">Centro de Control & Administración</span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          Entorno Aislado
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Acceso Rápido a Productos Administrados */}
        <div className="hidden md:flex items-center gap-1.5">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
          >
            <span>InthalyOps</span>
            <ExternalLink size={11} className="opacity-60" />
          </a>
          <a
            href="http://localhost:3000/comunidad"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
          >
            <span>Comunidad</span>
            <ExternalLink size={11} className="opacity-60" />
          </a>
          <a
            href="http://localhost:3000/id/cuenta"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
          >
            <span>Inthaly ID</span>
            <ExternalLink size={11} className="opacity-60" />
          </a>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          title="Refrescar métricas del ecosistema"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw size={15} />
        </button>

        <div className="flex items-center gap-1.5 pl-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-bold text-slate-700">En Línea</span>
        </div>
      </div>
    </header>
  )
}
