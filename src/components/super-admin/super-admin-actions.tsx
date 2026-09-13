'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateCompanyModal } from '@/components/super-admin/create-company-modal'

export function SuperAdminActions() {
 const [isModalOpen, setIsModalOpen] = useState(false)

 return (
 <>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => setIsModalOpen(true)}
 className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 cursor-pointer"
 >
 <Plus size={16} strokeWidth={2.5} />
 Nueva Empresa
 </button>
 </div>

 <CreateCompanyModal 
 isOpen={isModalOpen} 
 onClose={() => setIsModalOpen(false)} 
 />
 </>
 )
}
