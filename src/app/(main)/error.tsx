'use client'

import React from 'react'
import { WifiOff, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function MainSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[65vh]">
      <div className="max-w-lg w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-8 text-center shadow-lg space-y-6 animate-in fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          {isOffline ? <WifiOff size={32} /> : <AlertCircle size={32} />}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">
            {isOffline ? 'Sección no disponible sin conexión' : 'Inconveniente al cargar esta sección'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isOffline
              ? 'Esta sección requiere conexión a Internet para consultar o procesar datos en vivo del servidor. Puedes seguir utilizando el menú lateral para acceder a los módulos con soporte Offline.'
              : 'Ocurrió un contratiempo temporal al procesar el contenido de esta sección. Puedes reintentar la operación o volver al panel principal.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <RefreshCw size={14} /> Reintentar
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            <ArrowLeft size={14} /> Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
