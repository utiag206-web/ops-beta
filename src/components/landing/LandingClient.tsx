'use client'

import { useState } from 'react'
import { LandingNavbar } from './LandingNavbar'
import { HeroSection } from './HeroSection'
import { WhatIsSection } from './WhatIsSection'
import { ModulesSection } from './ModulesSection'
import { SoftwareShowcase } from './SoftwareShowcase'
import { CtaFooterSection } from './CtaFooterSection'
import { DemoModal } from './DemoModal'

export function LandingClient() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)

  const handleOpenDemo = () => setIsDemoModalOpen(true)
  const handleCloseDemo = () => setIsDemoModalOpen(false)

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* 1. Header / Navbar */}
      <LandingNavbar onOpenDemo={handleOpenDemo} />

      <main>
        {/* BLOQUE 1 — HERO */}
        <HeroSection onOpenDemo={handleOpenDemo} />

        {/* BLOQUE 2 — QUÉ ES INTHALY OPS */}
        <WhatIsSection />

        {/* BLOQUE 3 — MÓDULOS */}
        <ModulesSection />

        {/* BLOQUE 4 — EL SOFTWARE */}
        <SoftwareShowcase />

        {/* BLOQUE 5 — LLAMADO A LA ACCIÓN (CTA) & FOOTER */}
        <CtaFooterSection onOpenDemo={handleOpenDemo} />
      </main>

      {/* Interactive Demo Request Modal */}
      <DemoModal isOpen={isDemoModalOpen} onClose={handleCloseDemo} />
    </div>
  )
}
