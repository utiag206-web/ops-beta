'use client'

import React from 'react'

/**
 * OnboardingCheck component
 * 
 * Simplified to be completely passive. It no longer redirects or shows overlays.
 * This prevents the "dark overlay" error reported by the user while maintaining 
 * the component structure in the layout.
 */
export function OnboardingCheck({ children }: { children: React.ReactNode, userRole?: string }) {
  return <React.Fragment>{children}</React.Fragment>
}
