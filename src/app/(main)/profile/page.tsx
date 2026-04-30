export const dynamic = 'force-dynamic'

import { getUserSession } from '@/lib/auth'
import { UserCircle, Mail, Shield, Building, Calendar, CalendarClock, Coins, Bus, ShieldAlert, KeyRound } from 'lucide-react'
import { getPPEDeliveries } from '../ppe/actions'
import { getBonuses } from '../bonuses/actions'
import { getTransportPayments } from '../transport/actions'
import { getAttendance } from '../attendance/actions'
import { PPEList } from '@/components/ppe/ppe-list'
import { BonusList } from '@/components/bonuses/bonus-list'
import { TransportList } from '@/components/transport/transport-list'
import { AttendanceMarker } from '@/components/attendance/attendance-marker'
import { AttendanceList } from '@/components/attendance/attendance-list'
import { AccountForm } from '@/components/profile/account-form'

export default async function ProfilePage() {
  const { extendedUser, user } = await getUserSession()

  if (!extendedUser) return null

  let companyName = (extendedUser.companies as any)?.name || 'Empresa'
  
  const [ppeDeliveries, bonuses, transportPayments, attendanceHistory] = extendedUser.worker_id 
    ? await Promise.all([
        getPPEDeliveries(extendedUser.worker_id),
        getBonuses(extendedUser.worker_id),
        getTransportPayments(extendedUser.worker_id),
        getAttendance(extendedUser.worker_id)
      ])
    : [[], [], [], []]

  const today = new Date().toISOString().split('T')[0]
  const todayRecord = attendanceHistory.find((r: any) => r.date === today)

  return (
    <div className="space-y-12 pb-20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Mi Cuenta</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Gestiona tu identidad y seguridad en el sistema.</p>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 px-5 py-2.5 rounded-2xl border border-blue-100">
          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
          <span className="text-blue-700 font-black text-xs tracking-widest uppercase">Sesión Protegida</span>
        </div>
      </div>

      {/* Perfil Banner */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 h-40 px-10 flex items-end">
          <div className="translate-y-12 flex items-end gap-6 pb-2">
            <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-2xl">
              <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 flex items-center justify-center text-4xl font-black border border-blue-200">
                {extendedUser.name?.charAt(0).toUpperCase()}
              </div>
            </div>
             <div className="mb-4">
                <h2 className="text-3xl font-black text-white drop-shadow-md">
                  {extendedUser.name}
                </h2>
                <p className="text-slate-800 font-bold flex items-center gap-2 mt-1.5 text-sm">
                  <Mail size={16} className="text-indigo-600" />
                  {extendedUser.email} {extendedUser.area ? <span className="mx-1 text-slate-300">|</span> : ''} {extendedUser.area}
                </p>
             </div>
          </div>
        </div>

        <div className="pt-20 pb-10 px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-50">
            <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-all hover:border-blue-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                <Building size={22} />
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</span>
                <span className="text-sm font-black text-slate-700">{companyName}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-all hover:border-blue-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 border border-slate-100">
                <Shield size={22} />
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol de Sistema</span>
                <span className="text-sm font-black text-slate-700 capitalize">{extendedUser?.role_id?.replace('_', ' ') || 'Usuario'}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-all hover:border-blue-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 border border-slate-100">
                <CalendarClock size={22} />
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Miembro Desde</span>
                <span className="text-sm font-black text-slate-700">
                  {new Date((user as any).created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Cuenta */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-800 px-2">Configuración Detallada</h3>
        <AccountForm user={extendedUser} />
      </div>

    </div>
  )
}
