'use client'

import { createContext, useContext, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface GlobalSettings {
  ecosystem_name: string
  ecosystem_logo?: string
  ecosystem_favicon?: string
  brand_color?: string
}

const defaultSettings: GlobalSettings = {
  ecosystem_name: 'INTHALY OPS',
  brand_color: '#2563eb'
}

const GlobalSettingsContext = createContext<GlobalSettings>(defaultSettings)

export function GlobalSettingsProvider({ settings, children }: { settings: GlobalSettings | null, children: React.ReactNode }) {
  const pathname = usePathname()

  // Aplicar variable CSS global para el color de la marca en TODO el sistema
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (settings?.brand_color) {
        document.documentElement.style.setProperty('--brand-primary', settings.brand_color)
      } else {
        document.documentElement.style.removeProperty('--brand-primary')
      }
    }
  }, [settings?.brand_color])

  return (
    <GlobalSettingsContext.Provider value={settings || defaultSettings}>
      {children}
    </GlobalSettingsContext.Provider>
  )
}

export const useGlobalSettings = () => useContext(GlobalSettingsContext)
