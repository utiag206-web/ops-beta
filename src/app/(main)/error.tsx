'use client'

import React, { useState } from 'react'
import { WifiOff, RefreshCw, ArrowLeft, AlertCircle, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

export default function MainSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false
  const [showDetails, setShowDetails] = useState(false)

  const isChunkError = Boolean(
    error?.name === 'ChunkLoadError' ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Failed to fetch dynamically imported module')
  )

  const handleRetry = async () => {
    if (isChunkError) {
      if (typeof caches !== 'undefined') {
        try {
          const keys = await caches.keys()
          await Promise.all(
            keys.filter(k => k.includes('-rsc-') || k.includes('-pages-') || k.includes('-static-'))
                .map(k => caches.delete(k))
          )
        } catch (_) {}
      }
      window.location.reload()
      return
    }

    try {
      reset()
    } catch {
      window.location.reload()
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[65vh]">
      <div className="max-w-lg w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-8 text-center shadow-lg space-y-6 animate-in fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          {isOffline ? <WifiOff size={32} /> : isChunkError ? <Layers size={32} /> : <AlertCircle size={32} />}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">
            {isOffline 
              ? 'Sección no disponible sin conexión' 
              : isChunkError 
              ? 'Recompilación de módulo requerida'
              : 'Inconveniente al cargar esta sección'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isOffline
              ? 'Esta sección requiere conexión a Internet para consultar o procesar datos en vivo del servidor. Puedes seguir utilizando el menú lateral para acceder a los módulos con soporte Offline.'
              : isChunkError
              ? 'El servidor de desarrollo recompiló este módulo con nuevos identificadores de script. Haz clic en «Recargar módulo» para sincronizar la versión actual.'
              : 'Ocurrió un contratiempo temporal al procesar el contenido de esta sección. Puedes reintentar la operación o volver al panel principal.'}
          </p>
        </div>

        {error && (
          <div className="text-left bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[11px] font-mono text-rose-500 dark:text-rose-400 break-words space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span>Detalles del error</span>
              <button 
                type="button" 
                onClick={() => setShowDetails(!showDetails)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white inline-flex items-center gap-1 text-[10px]"
              >
                {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showDetails ? 'Ocultar' : 'Ver más'}
              </button>
            </div>
            <p className="text-slate-700 dark:text-slate-300">{error.name || 'Error'}: {error.message || 'Error no especificado'}</p>
            {error.digest && <p className="text-slate-400 text-[10px]">Digest: {error.digest}</p>}
            {showDetails && error.stack && (
              <pre className="text-[9px] text-slate-500 dark:text-slate-400 whitespace-pre-wrap max-h-36 overflow-y-auto font-mono mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <RefreshCw size={14} /> {isChunkError ? 'Recargar módulo' : 'Reintentar'}
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
