import { Bell, Building2 } from 'lucide-react'
import { getUserSession } from '@/lib/auth'
import { UserDropdown } from './user-dropdown'
import { SidebarToggle } from './sidebar-toggle'
import { ROLE_NAMES } from '@/lib/constants'
import { INDUSTRIES_METADATA } from '@/lib/operating-profiles'

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
  const industryKey = extendedUser?.company_industry
  const industryMeta = industryKey && (INDUSTRIES_METADATA as any)[industryKey]
  const industryLabel = industryMeta?.officialLabel || (extendedUser?.companies as any)?.industry || null

  return (
    <header className="h-11 sm:h-12 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-5 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3">
        <SidebarToggle />
        <div className="flex items-center gap-2">
          {companyLogo ? (
            <div className="w-7 h-7 rounded-md overflow-hidden border border-slate-100 shadow-2xs bg-slate-50 flex items-center justify-center shrink-0">
              <img src={companyLogo} alt={companyName} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs shadow-blue-200 shrink-0">
              <Building2 size={15} className="text-white" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <h1 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 tracking-tight">
              {companyName}
            </h1>
            {industryLabel && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                {industryLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

        <UserDropdown 
          userName={userName}
          userRole={userRole}
          initial={userName.charAt(0).toUpperCase()}
        />
      </div>
    </header>
  )
}
