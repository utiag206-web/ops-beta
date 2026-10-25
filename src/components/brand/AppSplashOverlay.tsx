'use client'

import { useState, useEffect } from 'react'
import { InthalyIsotype } from '@/components/brand/InthalyLogo'

/**
 * AppSplashOverlay
 * Provides an approved, elegant 1.2s corporate splash experience on cold start,
 * holding the brand identity and animated progress bar with smooth fade-out into Dashboard.
 * Does not re-trigger during internal module navigation.
 */
export function AppSplashOverlay() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible')

  useEffect(() => {
    // Hold splash visible for 1200ms so brand identity is appreciated with dignity
    const holdTimer = setTimeout(() => {
      setPhase('fading')
      // After fade-out transition (400ms), completely remove from DOM tree
      const removeTimer = setTimeout(() => {
        setPhase('gone')
      }, 400)
      return () => clearTimeout(removeTimer)
    }, 1200)

    return () => clearTimeout(holdTimer)
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      aria-hidden="true"
      style={{
        transition: 'opacity 400ms ease-out',
        opacity: phase === 'fading' ? 0 : 1,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-[#06122e] via-[#0b1b3d] to-[#1e3a8a] text-white select-none px-4"
    >
      <div className="flex flex-col items-center justify-center space-y-5">
        {/* Centered Clean Vector Isotype */}
        <InthalyIsotype size={96} className="transform transition-transform animate-pulse" />

        {/* Wordmark matching approved corporate branding */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Inthaly<span className="text-sky-400">Ops</span>
          </h1>
          <p className="text-xs font-medium tracking-wide text-blue-200/75">
            Operaciones que impulsan tu gente y tu negocio
          </p>
        </div>

        {/* Sleek indeterminate loader bar */}
        <div className="w-28 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
          <div className="w-full h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
