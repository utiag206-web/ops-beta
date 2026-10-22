'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, Home, WifiOff, ChevronDown, ChevronUp, Layers } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isOffline, setIsOffline] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const isChunkError = Boolean(
    error?.name === 'ChunkLoadError' ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Failed to fetch dynamically imported module')
  )

  useEffect(() => {
    console.error('[GLOBAL_ERROR_CAPTURED]', error)
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine)
    }

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [error])

  const handleRetry = async () => {
    // Si es un ChunkLoadError por recompilación o reinicio del servidor, limpiar caché y recargar
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

  const handleGoHome = () => {
    window.location.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          {isOffline ? <WifiOff size={32} /> : isChunkError ? <Layers size={32} /> : <AlertCircle size={32} />}
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black text-white">
            {isOffline 
              ? 'Modo sin conexión' 
              : isChunkError 
              ? 'Recompilación de módulo' 
              : 'Recuperación del sistema'}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isOffline 
              ? 'La aplicación se encuentra operando sin conexión a Internet. Puedes reintentar la carga o volver a la vista principal.'
              : isChunkError
              ? 'El servidor de desarrollo recompiló o actualizó este módulo. Haz clic en «Recargar módulo» para cargar la versión actual.'
              : 'Ocurrió un contratiempo temporal en la aplicación. Puedes recargar o volver a la vista principal.'}
          </p>
        </div>

        {error && (
          <div className="text-left bg-slate-950/70 border border-slate-700/60 rounded-xl p-3 text-[11px] font-mono text-rose-300 break-words space-y-1">
            <div className="flex items-center justify-between text-rose-400 font-bold">
              <span>Detalles del error</span>
              <button 
                type="button" 
                onClick={() => setShowDetails(!showDetails)}
                className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-[10px]"
              >
                {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showDetails ? 'Ocultar' : 'Ver más'}
              </button>
            </div>
            <p className="text-slate-300">{error.name || 'Error'}: {error.message || 'Error no especificado'}</p>
            {error.digest && <p className="text-slate-500 text-[10px]">Digest: {error.digest}</p>}
            {showDetails && error.stack && (
              <pre className="text-[9px] text-slate-400 whitespace-pre-wrap max-h-40 overflow-y-auto font-mono mt-2 pt-2 border-t border-slate-800">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-900/30"
          >
            <RefreshCw size={15} /> {isChunkError ? 'Recargar módulo' : 'Reintentar'}
          </button>
          <button
            type="button"
            onClick={handleGoHome}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-colors"
          >
            <Home size={15} /> Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}
