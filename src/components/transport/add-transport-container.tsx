'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddTransportModal } from './add-transport-modal'
import { useRouter } from 'next/navigation'

export function AddTransportContainer({ workers }: { workers: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
      >
        <Plus size={18} />
        Registrar Pasaje
      </button>

      {isOpen && (
        <AddTransportModal 
          workers={workers}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </>
  )
}
