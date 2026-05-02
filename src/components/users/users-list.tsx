'use client'

import { useState } from 'react'
import { AddUserModal } from './add-user-modal'
import { updateUserStatus, updateUserRole, updateUserArea } from '@/app/(dashboard)/users/actions'
import { Search, Shield, UserX, UserCheck, MoreVertical, ShieldAlert, BadgeCheck, UserPlus, Building } from 'lucide-react'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  name: string
  email: string
  role_id: string
  area: string
  status: string
  created_at: string
}

export function UsersList({ initialUsers, availableWorkers, currentUserRole }: { initialUsers: User[], availableWorkers: any[], currentUserRole?: string }) {
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const canManage = ['admin', 'gerente'].includes(currentUserRole || '')

  // Combine users and unlinked workers for a unified view
  const unifiedList = [
    ...initialUsers.map(u => ({ ...u, type: 'user' })),
    ...availableWorkers
      .filter(w => !initialUsers.some(u => (u as any).worker_id === w.id))
      .map(w => ({
        id: w.id,
        name: w.name,
        email: 'Sin cuenta',
        role_id: 'trabajador',
        area: '',
        status: 'no_account',
        type: 'worker',
        created_at: ''
      }))
  ]

  const filteredItems = unifiedList.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const res = await updateUserStatus(id, newStatus as 'active' | 'inactive')
    if (!res.success) alert(res.error)
    else router.refresh()
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    const res = await updateUserRole(id, newRole)
    if (!res.success) alert(res.error)
    else router.refresh()
  }

  const handleAreaChange = async (id: string, newArea: string) => {
    const res = await updateUserArea(id, newArea)
    if (!res.success) alert(res.error)
    else router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Shield className="text-blue-600" size={24} />
            </div>
            Gestión de Equipo
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Administra los accesos y roles de tu personal.</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100 active:scale-95"
          >
            <UserPlus size={20} strokeWidth={3} />
            <span>Invitar Usuario</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-white focus:border-blue-500 rounded-2xl outline-none text-slate-900 bg-white shadow-sm transition-all text-sm font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Nombre / Trabajador</th>
                <th className="py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Correo / Cuenta</th>
                <th className="py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Rol / Acceso</th>
                <th className="py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Área / Depto.</th>
                <th className="py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-6 px-8">
                    <div className="flex flex-col">
                      <span className="text-base font-black text-slate-800 uppercase tracking-tight">{item.name}</span>
                      {item.type === 'worker' && <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">Ficha Trabajador</span>}
                    </div>
                  </td>
                  <td className="py-6">
                    <span className={`text-sm font-bold ${item.type === 'worker' ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                      {item.email}
                    </span>
                  </td>
                  <td className="py-6">
                    {item.type === 'user' ? (
                        canManage ? (
                          <select 
                            defaultValue={item.role_id}
                            onChange={(e) => handleRoleChange(item.id, e.target.value)}
                            className="bg-transparent border-none text-blue-600 text-sm font-black uppercase tracking-tighter focus:ring-0 cursor-pointer p-0"
                          >
                            <option value="admin">Administrador</option>
                            <option value="gerente">Gerente</option>
                            <option value="administracion">Administración</option>
                            <option value="operaciones">Operaciones</option>
                            <option value="almacen">Almacén</option>
                            <option value="soma">SOMA / Seguridad</option>
                            <option value="jefe_area">Jefe de Área</option>
                            <option value="trabajador">Trabajador</option>
                          </select>
                        ) : (
                          <span className="text-xs font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md">
                            {item.role_id}
                          </span>
                        )
                    ) : (
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Sin acceso</span>
                    )}
                  </td>
                  <td className="py-6">
                    {item.type === 'user' ? (
                        canManage ? (
                          <select 
                            defaultValue={item.area}
                            onChange={(e) => handleAreaChange(item.id, e.target.value)}
                            className="bg-transparent border-none text-slate-600 text-xs font-bold uppercase tracking-tighter focus:ring-0 cursor-pointer p-0"
                          >
                            <option value="">Sin Asignar</option>
                            <option value="Gerencia General">Gerencia General</option>
                            <option value="Administración">Administración</option>
                            <option value="Operaciones">Operaciones</option>
                            <option value="Almacén y Mantenimiento">Almacén y Mant.</option>
                            <option value="Seguridad SOMA">Seguridad SOMA</option>
                            <option value="Cocina">Cocina</option>
                          </select>
                        ) : (
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                            {item.area || 'General'}
                          </span>
                        )
                    ) : (
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">-</span>
                    )}
                  </td>
                  <td className="py-6 text-center">
                    {item.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-emerald-100 shadow-sm">
                        <UserCheck size={12} /> Activo
                      </span>
                    ) : item.status === 'inactive' ? (
                      <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-slate-100 shadow-sm">
                        <UserX size={12} /> Inactivo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-amber-100 shadow-sm">
                        <Shield size={12} /> Sin acceso
                      </span>
                    )}
                  </td>
                  <td className="py-6 px-8 text-right">
                    <div className="flex items-center justify-end gap-2 transition-all">
                      {canManage && (
                        item.type === 'user' ? (
                          <button 
                            onClick={() => handleStatusToggle(item.id, item.status)}
                            className={`text-[10px] font-black px-4 py-2 rounded-xl border transition-all uppercase tracking-tighter shadow-sm ${
                              item.status === 'active' 
                              ? 'border-rose-100 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white' 
                              : 'border-emerald-100 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white'
                            }`}
                            title={item.status === 'active' ? 'Desactivar Usuario' : 'Activar Usuario'}
                          >
                            {item.status === 'active' ? 'Desactivar' : 'Activar'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="text-[10px] font-black px-4 py-2 rounded-xl border border-blue-100 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-tighter shadow-sm"
                            title="Invitar a crear cuenta"
                          >
                            Invitar
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-slate-400 font-bold">
                    No se encontraron usuarios o trabajadores registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        availableWorkers={availableWorkers}
      />
    </div>
  )
}
