import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllCompanies, getAllUsers, getSystemStats } from './actions'
import { 
  Building2, Users, Shield, ShieldOff,
  Activity, ArrowUpRight, BadgeCheck,
  Globe, Server, Database, Building,
  ExternalLink, Plus, Search, FlaskConical, Globe2, Clock 
} from 'lucide-react'
import Link from 'next/link'
import { CompaniesList } from '@/components/super-admin/companies-list'
import { SuperAdminActions } from '@/components/super-admin/super-admin-actions'

export default async function SuperAdminPage() {
  const { extendedUser } = await getUserSession()

  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    redirect('/dashboard')
  }

  let companies: any[] = []
  let users: any[] = []
  let stats: any = { 
    totalCompanies: 0, 
    realCompanies: 0, 
    testCompanies: 0, 
    suspendedCompanies: 0, 
    pendingCompanies: 0, 
    totalUsers: 0 
  }

  try {
    const [companiesRes, usersRes, statsRes] = await Promise.all([
      getAllCompanies(),
      getAllUsers(),
      getSystemStats()
    ])
    companies = companiesRes
    users = usersRes
    stats = statsRes
  } catch (error: any) {
    console.error("[SUPER_ADMIN_PAGE_CRITICAL] Failed to load global data:", error.message)
  }

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-500 min-h-screen pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <div className="p-1.5 bg-slate-900 rounded-md text-white shadow-2xs">
              <Shield size={16} />
            </div>
            Consola de Administración Global
          </h1>
          <p className="text-slate-500 text-[11px] sm:text-xs font-normal mt-0.5">Gestión integral de empresas, solicitudes de demo, usuarios y recursos del Ecosistema Inthaly.</p>
        </div>

        <SuperAdminActions />
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-2xs group">
          <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
            <Building2 size={15} />
          </div>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Empresas Totales</p>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 leading-none">{stats.totalCompanies}</h3>
        </div>

        <div className={`p-2.5 sm:p-3 rounded-xl border shadow-2xs group transition-all ${
          (stats.pendingCompanies || 0) > 0 
            ? 'bg-amber-50/50 border-amber-200 ring-2 ring-amber-400/20' 
            : 'bg-white border-slate-100'
        }`}>
          <div className={`w-7 h-7 rounded-md flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
            (stats.pendingCompanies || 0) > 0 ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20' : 'bg-amber-50 text-amber-700'
          }`}>
            <Clock size={15} />
          </div>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Solicitudes Pendientes</p>
          <h3 className={`text-lg sm:text-xl font-black mt-0.5 leading-none ${
            (stats.pendingCompanies || 0) > 0 ? 'text-amber-700' : 'text-slate-900'
          }`}>
            {stats.pendingCompanies || 0}
          </h3>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-2xs group">
          <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
            <Globe2 size={15} />
          </div>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Empresas Reales</p>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 leading-none">{stats.realCompanies}</h3>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-2xs group">
          <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-md flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
            <FlaskConical size={15} />
          </div>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">De Prueba</p>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 leading-none">{stats.testCompanies}</h3>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-2xs group">
          <div className="w-7 h-7 bg-rose-50 text-rose-600 rounded-md flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
            <ShieldOff size={15} />
          </div>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Suspendidas</p>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 leading-none">{stats.suspendedCompanies}</h3>
        </div>

        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-2xs group">
          <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
            <Users size={15} />
          </div>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Usuarios Globales</p>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 leading-none">{stats.totalUsers}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Companies List (Main Section) */}
        <div className="xl:col-span-2">
          <CompaniesList companies={companies} />
        </div>

        {/* Global Users List (Sidebar Section) */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-2xs overflow-hidden flex flex-col h-full">
          <div className="p-3 sm:p-3.5 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Accesos Globales</h2>
              <p className="text-slate-400 text-[10px] font-medium">{users.length} usuarios registrados en el ecosistema</p>
            </div>
            <Database size={15} className="text-slate-400" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[520px]">
            <div className="divide-y divide-slate-50">
              {users.map((user: any) => {
                const isSuper = user.role_id?.toLowerCase() === 'super_admin' || user.role_id?.toLowerCase() === 'superadmin'
                return (
                  <div key={user.id} className={`px-3 py-2 hover:bg-slate-50 transition-colors ${isSuper ? 'bg-blue-50/30' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-slate-800 leading-tight flex items-center gap-1 truncate">
                          {isSuper && <Shield size={12} className="text-blue-600 shrink-0" />}
                          {user.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase shrink-0 ${
                        isSuper ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role_id}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-500 font-medium truncate">
                      <Building size={10} className="text-slate-300 shrink-0" />
                      <span className="truncate">{user.companies?.name || 'ECOSISTEMA GLOBAL'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
