'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * NavigationProgressBar
 * Enterprise-grade micro-indicator for instant tactile feedback on route transitions.
 * Eliminates the perception of unresponsiveness by rendering within 0ms of user click.
 */
export function NavigationProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Reset progress when path or query string completes transition
  useEffect(() => {
    if (isNavigating) {
      setProgress(100)
      const timer = setTimeout(() => {
        setIsNavigating(false)
        setProgress(0)
        delete document.body.dataset.navigating
      }, 200)
      return () => {
        clearTimeout(timer)
        delete document.body.dataset.navigating
      }
    } else {
      delete document.body.dataset.navigating
    }
  }, [pathname, searchParams])

  // Global click interceptor for instant 0ms perception
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Ignore right clicks or keyboard modifiers (cmd/ctrl click opens new tab)
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const target = (e.target as HTMLElement).closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (!href) return

      // Ignore hash links, external links, downloads, and target="_blank"
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        target.getAttribute('target') === '_blank' ||
        target.hasAttribute('download')
      ) {
        return
      }

      // Check if link points to same-origin
      try {
        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return

        // If clicking exactly the current path and query, no transition needed
        const currentUrl = window.location.pathname + window.location.search
        const targetUrl = url.pathname + url.search
        if (currentUrl === targetUrl) return

        // Instant feedback: start bar immediately and mark body as navigating
        document.body.dataset.navigating = 'true'
        setIsNavigating(true)
        setProgress(25)
      } catch {
        // Invalid URL, ignore
      }
    }

    document.addEventListener('click', handleDocumentClick, { capture: true })
    return () => document.removeEventListener('click', handleDocumentClick, { capture: true })
  }, [])

  // Smoothly increment progress while waiting for RSC payload
  useEffect(() => {
    if (!isNavigating) return

    const t1 = setTimeout(() => setProgress((p) => (p < 60 ? 60 : p)), 120)
    const t2 = setTimeout(() => setProgress((p) => (p < 85 ? 85 : p)), 350)
    const t3 = setTimeout(() => setProgress((p) => (p < 95 ? 95 : p)), 900)

    // Safety timeout in case navigation is aborted or fails
    const safetyTimer = setTimeout(() => {
      setIsNavigating(false)
      setProgress(0)
      delete document.body.dataset.navigating
    }, 8000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(safetyTimer)
    }
  }, [isNavigating])

  if (!isNavigating && progress === 0) return null

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 shadow-sm transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '150ms' : '250ms',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  )
}

