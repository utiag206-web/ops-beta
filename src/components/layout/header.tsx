import { Bell } from 'lucide-react'
import { getUserSession } from '@/lib/auth'
import { UserDropdown } from './user-dropdown'
import { SidebarToggle } from './sidebar-toggle'

export async function Header() {
  const { extendedUser } = await getUserSession()
  
  let userName = extendedUser?.name || 'Usuario'
  const roleId = extendedUser?.role_id as string
  
  // Mapeo descriptivo para la UI
  const roleNames: Record<string, string> = {
    admin: 'Administrador',
    administracion: 'Administrador',
    gerente: 'Gerencia',
    jefe_area: 'Jefe de Área',
    almacen: 'Almacén',
    operaciones: 'Operaciones',
    trabajador: 'Trabajador',
    soma: 'Seguridad SOMA',
    cocina: 'Cocina'
  }
  
  const userRole = roleNames[roleId?.toLowerCase()] || 'Sin Rol'
  const userEmail = extendedUser?.email || ''
  
  const companyData = extendedUser?.companies
  const companyName = (Array.isArray(companyData) ? companyData[0]?.name : (companyData as any)?.name) || 'Mi Empresa'

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 md:gap-4">
        <SidebarToggle />
        <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
          <h1 className="text-lg md:text-xl font-bold text-slate-800 line-clamp-1">
            {companyName}
          </h1>
          <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest opacity-70 hidden sm:block">SISTEMA ERP</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notificaciones ocultas temporalmente por solicitud del usuario */}
        {/* 
        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        */}
        
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

        <UserDropdown 
          userName={userName + (userEmail ? ` (${userEmail})` : '')}
          userRole={userRole}
          initial={userName.charAt(0).toUpperCase()}
        />
      </div>
    </header>
  )
}
