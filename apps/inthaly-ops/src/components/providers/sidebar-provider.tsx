'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface SidebarContextType {
 isOpen: boolean
 setIsOpen: (open: boolean) => void
 toggle: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
 const [isOpen, setIsOpen] = useState(false)
 const pathname = usePathname()

 // Close sidebar when route changes on mobile
 useEffect(() => {
 setIsOpen(false)
 }, [pathname])

 // Prevent scrolling when sidebar is open on mobile
 // Optimized to only apply on mobile-like viewports
 useEffect(() => {
 if (isOpen && window.innerWidth < 1024) {
 document.body.style.overflow = 'hidden'
 } else {
 document.body.style.overflow = 'unset'
 }
 
 // Explicit cleanup for all scenarios
 return () => {
 document.body.style.overflow = 'unset'
 }
 }, [isOpen])

 // Auto-close on resize to desktop
 useEffect(() => {
 const handleResize = () => {
 if (window.innerWidth >= 1024) {
 setIsOpen(false)
 }
 }
 window.addEventListener('resize', handleResize)
 return () => window.removeEventListener('resize', handleResize)
 }, [])

 const toggle = () => setIsOpen(prev => !prev)

 return (
 <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
 {children}
 </SidebarContext.Provider>
 )
}

export function useSidebar() {
 const context = useContext(SidebarContext)
 if (context === undefined) {
 throw new Error('useSidebar must be used within a SidebarProvider')
 }
 return context
}
