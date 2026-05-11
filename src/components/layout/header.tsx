import { Bell } from 'lucide-react'
import { getUserSession } from '@/lib/auth'
import { UserDropdown } from './user-dropdown'
import { SidebarToggle } from './sidebar-toggle'

export async function Header() {
  const { extendedUser } = await getUserSession()
  
  let userName = extendedUser?.display_name || 'Usuario'
  const roleId = extendedUser?.role_id as string
  
  // Mapeo descriptivo para la UI (Corporate Executive Terms)
  const roleNames: Record<string, string> = {
    super_admin: 'Super Administrador',
    superadmin: 'Super Administrador',
    admin: 'Administración',
    administracion: 'Administración',
    gerente: 'Gerencia General',
    jefe_area: 'Jefe de Operaciones',
    almacen: 'Control Logístico',
    operaciones: 'Gestión Operativa',
    trabajador: 'Colaborador',
    soma: 'Gestión HSEC',
    cocina: 'Servicios de Alimentación'
  }
  
  let userRole = roleNames[roleId?.toLowerCase()] || 'Sin Rol'
  if (extendedUser?.is_impersonating) {
    userRole = 'Auditoría de Sistemas'
  }
  const userEmail = extendedUser?.display_email || ''
  
  const companyData = extendedUser?.companies
  const companyName = (Array.isArray(companyData) ? companyData[0]?.name : (companyData as any)?.name) || 'Empresa'

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 md:gap-4">
        <SidebarToggle />
        <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
          <h1 className="text-lg md:text-xl font-bold text-slate-800 line-clamp-1 uppercase tracking-tight">
            {companyName}
          </h1>
          <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest opacity-70 hidden sm:block">SISTEMA ERP</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

        <UserDropdown 
          userName={userName}
          userRole={userRole}
          initial={userName.charAt(0).toUpperCase()}
        />
      </div>
    </header>
  )
}
