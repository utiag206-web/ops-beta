'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

/**
 * AuthTemplate
 * Smooth hardware-accelerated slide-up entrance for authentication screens.
 */
export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="nth-page-enter w-full">
      {children}
    </div>
  )
}

