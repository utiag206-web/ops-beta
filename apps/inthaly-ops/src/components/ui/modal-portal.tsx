'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ModalPortalProps {
  children: React.ReactNode
}

/**
 * ModalPortal
 * Renders modal content directly into document.body to escape any CSS containing blocks
 * (transforms, filters, will-change, overflow-hidden, or layout wrappers).
 * Guarantees fixed inset-0 covers 100vw x 100vh of the entire monitor viewport,
 * correctly dimming the sidebar, header, and centering dialogs on screen.
 */
export function ModalPortal({ children }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || typeof document === 'undefined') {
    return null
  }

  return createPortal(children, document.body)
}
