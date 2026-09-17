import { Bell, Building2 } from 'lucide-react'
import { getUserSession } from '@/lib/auth'
import { UserDropdown } from './user-dropdown'
import { SidebarToggle } from './sidebar-toggle'
import { ROLE_NAMES } from '@/lib/constants'

export async function Header() {
 const { extendedUser } = await getUserSession()
 
 let userName = extendedUser?.display_name || 'Usuario'
 const roleId = extendedUser?.role_id as string
 
 const userRoleBase = roleId ? (ROLE_NAMES[roleId.toLowerCase()] || roleId) : 'Sin Rol'
 let userRole = userRoleBase
 if (extendedUser?.is_impersonating) {
 userRole = 'Auditoría de Sistemas'
 } else if (extendedUser?.area) {
 let cleanArea = extendedUser.area
 if (cleanArea === 'Almacén y Mantenimiento') {
 cleanArea = 'Mecánica'
 }
 if (userRole.toLowerCase() !== cleanArea.toLowerCase()) {
 userRole = `${userRole} · ${cleanArea}`
 }
 }
 const userEmail = extendedUser?.display_email || ''
 
 let companyName = extendedUser?.company_name || 'Empresa'
 let companyLogo = extendedUser?.company_logo || null

  return (
    <header className="h-14 sm:h-15 bg-white border-b border-slate-200 px-3 sm:px-5 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <SidebarToggle />
        <div className="flex items-center gap-2.5">
          {companyLogo ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-slate-100 shadow-xs bg-slate-50 flex items-center justify-center shrink-0">
              <img src={companyLogo} alt={companyName} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0">
              <Building2 size={18} className="text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-sm sm:text-base font-bold text-slate-800 line-clamp-1 tracking-tight">
              {companyName}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

        <UserDropdown 
          userName={userName}
          userRole={userRole}
          initial={userName.charAt(0).toUpperCase()}
        />
      </div>
    </header>
  )
}
