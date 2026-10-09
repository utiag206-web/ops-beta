'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, Home, WifiOff } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isOffline, setIsOffline] = useState(false)

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

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          {isOffline ? <WifiOff size={32} /> : <AlertCircle size={32} />}
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black text-white">
            {isOffline ? 'Modo sin conexión' : 'Recuperación del sistema'}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isOffline 
              ? 'La aplicación se encuentra operando sin conexión a Internet. Puedes reintentar la carga o volver a la vista principal.'
              : 'Ocurrió un contratiempo temporal en la aplicación. Puedes recargar o volver a la vista principal.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              try {
                reset()
              } catch {
                window.location.reload()
              }
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-900/30"
          >
            <RefreshCw size={15} /> Reintentar
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/dashboard' }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-colors"
          >
            <Home size={15} /> Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}
