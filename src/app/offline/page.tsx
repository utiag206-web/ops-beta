'use client'

import React from 'react'
import Link from 'next/link'
import { WifiOff, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react'

export default function OfflineFallbackPage() {
  return (
    <div id="offline-fallback-container" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl text-center space-y-6">
        
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
          <WifiOff size={32} className="animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Modo Desconectado Activo
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            INTHALY OPS OFFLINE
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Esta pantalla se muestra porque la ruta solicitada no estaba en cache. Sin embargo, tus modulos Offline-First y tus datos locales siguen completamente seguros.
          </p>
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-medium text-slate-200">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Garantia de Persistencia Local</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Las operaciones que registres en modulos offline quedaran en cola en tu dispositivo y se sincronizaran automaticamente al detectar conexion.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            id="btn-offline-dashboard"
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20"
          >
            <ArrowLeft size={16} /> Ir al Dashboard
          </button>
          <button
            type="button"
            id="btn-offline-retry"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-all"
          >
            <RefreshCw size={16} /> Reintentar
          </button>
        </div>

      </div>

      <p className="text-xs text-slate-500 mt-8">
        INTHALY OPS — Arquitectura Offline-First Enterprise
      </p>
    </div>
  )
}
