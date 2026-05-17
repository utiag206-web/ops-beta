import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllCompanies, getAllUsers, getSystemStats } from './actions'
import { 
  Building2, Users, Shield, ShieldOff,
  Activity, ArrowUpRight, BadgeCheck,
  Globe, Server, Database, Building,
  ExternalLink, Plus, Search, FlaskConical, Globe2 
} from 'lucide-react'
import Link from 'next/link'
import { CompaniesList } from '@/components/super-admin/companies-list'
import { SuperAdminActions } from '@/components/super-admin/super-admin-actions'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const { extendedUser } = await getUserSession()

  const role = extendedUser?.role_id?.toLowerCase()
  if (role !== 'super_admin' && role !== 'superadmin') {
    redirect('/dashboard')
  }

  let companies: any[] = []
  let users: any[] = []
  let stats: any = { totalCompanies: 0, realCompanies: 0, testCompanies: 0, suspendedCompanies: 0, totalUsers: 0 }

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
    if (
      error.digest?.startsWith('NEXT_REDIRECT') || 
      error.message?.includes('NEXT_REDIRECT') ||
      error.digest === 'DYNAMIC_SERVER_USAGE' ||
      error.message?.includes('DYNAMIC_SERVER_USAGE') ||
      error.message?.includes('Dynamic server usage')
    ) {
      throw error
    }
    console.error("[SUPER_ADMIN_PAGE_CRITICAL] Failed to load global data:", error.message)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl text-white shadow-2xl shadow-slate-900/20">
              <Shield size={32} />
            </div>
            Consola de Administración Global
          </h1>
          <p className="text-slate-500 font-medium mt-1">Gestión integral de empresas, usuarios y recursos del Ecosistema Inthaly.</p>
        </div>

        <SuperAdminActions />
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Building2 size={24} />
          </div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Empresas Totales</p>
          <h3 className="text-4xl font-black text-slate-900 mt-1">{stats.totalCompanies}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Globe2 size={24} />
          </div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Empresas Reales</p>
          <h3 className="text-4xl font-black text-slate-900 mt-1">{stats.realCompanies}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <FlaskConical size={24} />
          </div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">De Prueba</p>
          <h3 className="text-4xl font-black text-slate-900 mt-1">{stats.testCompanies}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <ShieldOff size={24} />
          </div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Suspendidas</p>
          <h3 className="text-4xl font-black text-slate-900 mt-1">{stats.suspendedCompanies}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Users size={24} />
          </div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Usuarios Globales</p>
          <h3 className="text-4xl font-black text-slate-900 mt-1">{stats.totalUsers}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Companies List (Main Section) */}
        <div className="xl:col-span-2">
          <CompaniesList companies={companies} />
        </div>

        {/* Global Users List (Sidebar Section) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Accesos Globales</h2>
              <p className="text-slate-400 text-sm font-medium">Últimos usuarios registrados</p>
            </div>
            <Database size={20} className="text-slate-400" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[600px]">
            <div className="divide-y divide-slate-50">
              {users.slice(0, 10).map((user: any) => (
                <div key={user.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 leading-tight">{user.name}</span>
                      <span className="text-xs text-slate-400">{user.email}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      user.role_id === 'super_admin' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role_id}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                    <Building size={12} className="text-slate-300" />
                    <span>{user.companies?.name || 'SISTEMA'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
