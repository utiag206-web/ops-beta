'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/components/providers/sidebar-provider'

export function SidebarToggle() {
  const { toggle } = useSidebar()
  
  return (
    <button 
      onClick={toggle}
      className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
    >
      <Menu size={24} />
    </button>
  )
}
