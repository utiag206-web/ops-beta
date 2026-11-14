'use client'

import React from 'react'

export default function OfflineFallbackPage() {
  return (
    <div id="offline-fallback-container" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl text-center space-y-6">
        
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
          <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-6.364-2.636 9 9 0 010-12.728m12.728 0L3 21" />
          </svg>
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Modo Desconectado Activo
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white">
            INTHALY <span className="text-sky-400">OPS</span>
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esta pantalla se muestra porque la ruta solicitada no estaba en caché. Sin embargo, tus módulos Offline-First y tus datos locales siguen completamente seguros.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Garantía de Persistencia Local</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Las operaciones que registres en módulos offline quedarán en cola en tu dispositivo y se sincronizarán automáticamente al detectar conexión.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            id="btn-offline-dashboard"
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            ← Ir al Dashboard
          </button>
          <button
            type="button"
            id="btn-offline-retry"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-all active:scale-95"
          >
            ↻ Reintentar
          </button>
        </div>

      </div>

      <p className="text-[11px] text-slate-500 mt-8 font-medium">
        INTHALY OPS — Arquitectura Offline-First Enterprise
      </p>
    </div>
  )
}
