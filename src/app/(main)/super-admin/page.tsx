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
    <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-500 min-h-screen pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <div className="p-1 bg-slate-900 rounded-md text-white shadow-2xs shrink-0">
              <Shield size={14} />
            </div>
            Consola de Administración Global
          </h1>
          <p className="text-slate-500 text-[10px] sm:text-[11px] font-normal mt-0.5">Gestión integral de empresas, solicitudes de demo, usuarios y recursos del Ecosistema Inthaly.</p>
        </div>

        <SuperAdminActions />
      </div>

      {/* Global Metrics - Ultra Compact Horizontal SaaS Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="bg-white px-2.5 py-1.5 sm:py-2 rounded-lg border border-slate-100 shadow-2xs group flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <Building2 size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider truncate leading-tight">Empresas Totales</p>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none mt-0.5">{stats.totalCompanies}</h3>
          </div>
        </div>

        <div className={`px-2.5 py-1.5 sm:py-2 rounded-lg border shadow-2xs group flex items-center gap-2.5 transition-all ${
          (stats.pendingCompanies || 0) > 0 
            ? 'bg-amber-50/60 border-amber-200 ring-1 ring-amber-400/30' 
            : 'bg-white border-slate-100'
        }`}>
          <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
            (stats.pendingCompanies || 0) > 0 ? 'bg-amber-500 text-white shadow-2xs shadow-amber-500/20' : 'bg-amber-50 text-amber-700'
          }`}>
            <Clock size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider truncate leading-tight">Solicitudes Pend.</p>
            <h3 className={`text-base sm:text-lg font-black leading-none mt-0.5 ${
              (stats.pendingCompanies || 0) > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {stats.pendingCompanies || 0}
            </h3>
          </div>
        </div>

        <div className="bg-white px-2.5 py-1.5 sm:py-2 rounded-lg border border-slate-100 shadow-2xs group flex items-center gap-2.5">
          <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <Globe2 size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider truncate leading-tight">Empresas Reales</p>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none mt-0.5">{stats.realCompanies}</h3>
          </div>
        </div>

        <div className="bg-white px-2.5 py-1.5 sm:py-2 rounded-lg border border-slate-100 shadow-2xs group flex items-center gap-2.5">
          <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <FlaskConical size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider truncate leading-tight">De Prueba</p>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none mt-0.5">{stats.testCompanies}</h3>
          </div>
        </div>

        <div className="bg-white px-2.5 py-1.5 sm:py-2 rounded-lg border border-slate-100 shadow-2xs group flex items-center gap-2.5">
          <div className="w-7 h-7 bg-rose-50 text-rose-600 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <ShieldOff size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider truncate leading-tight">Suspendidas</p>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none mt-0.5">{stats.suspendedCompanies}</h3>
          </div>
        </div>

        <div className="bg-white px-2.5 py-1.5 sm:py-2 rounded-lg border border-slate-100 shadow-2xs group flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <Users size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider truncate leading-tight">Usuarios Globales</p>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none mt-0.5">{stats.totalUsers}</h3>
          </div>
        </div>
      </div>

      {/* Main Directory Area - Full Width */}
      <div className="w-full">
        <CompaniesList companies={companies} users={users} />
      </div>
    </div>
  )
}
