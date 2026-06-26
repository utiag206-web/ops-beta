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
 className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
 >
 <Plus size={20} strokeWidth={3} />
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
