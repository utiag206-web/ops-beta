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
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-500 min-h-screen pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 rounded-lg text-white shadow-md shadow-slate-900/15">
              <Shield size={20} />
            </div>
            Consola de Administración Global
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-normal mt-0.5">Gestión integral de empresas, solicitudes de demo, usuarios y recursos del Ecosistema Inthaly.</p>
        </div>

        <SuperAdminActions />
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-100 shadow-xs group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105">
            <Building2 size={18} />
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Empresas Totales</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{stats.totalCompanies}</h3>
        </div>

        <div className={`p-3.5 sm:p-4 rounded-xl border shadow-xs group transition-all ${
          (stats.pendingCompanies || 0) > 0 
            ? 'bg-amber-50/50 border-amber-200 ring-2 ring-amber-400/20' 
            : 'bg-white border-slate-100'
        }`}>
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105 ${
            (stats.pendingCompanies || 0) > 0 ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-amber-50 text-amber-700'
          }`}>
            <Clock size={18} />
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Solicitudes Pendientes</p>
          <h3 className={`text-xl sm:text-2xl font-black mt-0.5 ${
            (stats.pendingCompanies || 0) > 0 ? 'text-amber-700' : 'text-slate-900'
          }`}>
            {stats.pendingCompanies || 0}
          </h3>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-100 shadow-xs group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105">
            <Globe2 size={18} />
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Empresas Reales</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{stats.realCompanies}</h3>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-100 shadow-xs group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105">
            <FlaskConical size={18} />
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">De Prueba</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{stats.testCompanies}</h3>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-100 shadow-xs group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105">
            <ShieldOff size={18} />
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Suspendidas</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{stats.suspendedCompanies}</h3>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-100 shadow-xs group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105">
            <Users size={18} />
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Usuarios Globales</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{stats.totalUsers}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
        {/* Companies List (Main Section) */}
        <div className="xl:col-span-2">
          <CompaniesList companies={companies} />
        </div>

        {/* Global Users List (Sidebar Section) */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-full">
          <div className="p-4 sm:p-5 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Accesos Globales</h2>
              <p className="text-slate-400 text-xs font-medium">{users.length} usuarios registrados en el ecosistema</p>
            </div>
            <Database size={18} className="text-slate-400" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[600px]">
            <div className="divide-y divide-slate-50">
              {users.map((user: any) => {
                const isSuper = user.role_id?.toLowerCase() === 'super_admin' || user.role_id?.toLowerCase() === 'superadmin'
                return (
                  <div key={user.id} className={`p-6 hover:bg-slate-50 transition-colors ${isSuper ? 'bg-blue-50/30' : ''}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                          {isSuper && <Shield size={14} className="text-blue-600 shrink-0" />}
                          {user.name}
                        </span>
                        <span className="text-xs text-slate-400">{user.email}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase ${
                        isSuper ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role_id}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                      <Building size={12} className="text-slate-300" />
                      <span>{user.companies?.name || 'ECOSISTEMA GLOBAL'}</span>
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
