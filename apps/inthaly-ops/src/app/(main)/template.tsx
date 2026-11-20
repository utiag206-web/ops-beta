'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

/**
 * MainTemplate
 * Hardware-accelerated page entry transitions (slide-up + fade-in).
 * Dynamically re-triggers on every module navigation via unique pathname key.
 * Preserves sidebar and header in DashboardLayout without unmounting or flickering.
 */
export default function MainTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="nth-page-enter w-full space-y-2.5 sm:space-y-3">
      {children}
    </div>
  )
}
