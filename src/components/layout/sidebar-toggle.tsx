'use client'

import { Menu, X } from 'lucide-react'
import { useSidebar } from '@/components/providers/sidebar-provider'

export function SidebarToggle() {
  const { isOpen, toggle } = useSidebar()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <button 
      onClick={toggle}
      className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all active:scale-95 z-50"
      aria-label={isOpen ? "Close Menu" : "Open Menu"}
    >
      {isOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  )
}
