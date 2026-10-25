'use client'

import { useEffect } from 'react'

export function AppSplashCoordinator() {
  useEffect(() => {
    const splash = document.getElementById('inthaly-initial-splash')
    if (splash) {
      splash.style.transition = 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)'
      splash.style.opacity = '0'
      splash.style.pointerEvents = 'none'
      const timer = setTimeout(() => {
        splash.style.visibility = 'hidden'
        splash.style.zIndex = '-9999'
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [])

  return null
}
