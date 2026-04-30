'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddBonusModal } from './add-bonus-modal'
import { useRouter } from 'next/navigation'

export function AddBonusContainer({ workers }: { workers: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-amber-700 transition-all shadow-md active:scale-95"
      >
        <Plus size={18} />
        Registrar Bono
      </button>

      {isOpen && (
        <AddBonusModal 
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
