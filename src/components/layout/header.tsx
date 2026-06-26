import { Bell, Building2 } from 'lucide-react'
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
 admin: 'Gerente General',
 administracion: 'Administración',
 gerente: 'Gerencia General',
 jefe_area: 'Jefe de Área',
 almacen: 'Logística',
 operaciones: 'Operaciones',
 trabajador: 'Colaborador',
 soma: 'Seguridad SOMA',
 cocina: 'Cocina'
 }
 
 let userRole = roleNames[roleId?.toLowerCase()] || 'Sin Rol'
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

 // FALLBACK CRÍTICO: Si el nombre está pero el logo no, intentamos un fetch directo para romper caché
 if (extendedUser?.company_id && !companyLogo) {
 const { createAdminClient } = await import('@/lib/supabase/server')
 const supabase = await createAdminClient()
 const { data: directComp } = await supabase
 .from('companies')
 .select('name, logo_url')
 .eq('id', extendedUser.company_id)
 .single()
 
 if (directComp) {
 companyName = directComp.name || companyName
 companyLogo = directComp.logo_url || null
 }
 }

 return (
 <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
 <div className="flex items-center gap-3 md:gap-4">
 <SidebarToggle />
 <div className="flex items-center gap-3">
 {companyLogo ? (
 <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center shrink-0">
 <img src={companyLogo} alt={companyName} className="w-full h-full object-contain" />
 </div>
 ) : (
 <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
 <Building2 size={20} className="text-white" />
 </div>
 )}
 <div className="flex flex-col md:flex-row md:items-baseline">
 <h1 className="text-lg md:text-xl font-bold text-slate-800 line-clamp-1 tracking-tight">
 {companyName}
 </h1>
 </div>
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
