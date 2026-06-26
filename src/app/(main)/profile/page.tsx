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

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
 const { extendedUser, user } = await getUserSession()

 if (!extendedUser) return null

 let companyName = extendedUser.company_name || 'Empresa'
 
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
 <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Mi Cuenta</h1>
 <p className="text-slate-500 font-medium text-lg mt-1">Configuración de identidad y seguridad operacional.</p>
 </div>
 <div className="flex flex-col items-end gap-2">
 {extendedUser.is_impersonating ? (
 <div className="flex items-center gap-3 bg-amber-50 px-5 py-2.5 rounded-2xl border border-amber-100 shadow-sm">
 <div className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-pulse" />
 <div className="flex flex-col">
 <span className="text-amber-700 font-bold text-xs tracking-tight">Modo Auditoría</span>
 <span className="text-[10px] font-bold text-amber-600/70">CONTEXTO DE EMPRESA ACTIVO</span>
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-3 bg-blue-50 px-5 py-2.5 rounded-2xl border border-blue-100">
 <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
 <span className="text-blue-700 font-bold text-xs tracking-tight">Sesión Protegida</span>
 </div>
 )}
 </div>
 </div>

 {extendedUser.is_impersonating && (
 <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 opacity-10 scale-150">
 <ShieldAlert size={120} />
 </div>
 <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
 <Shield size={32} className="text-amber-400" />
 </div>
 <div>
 <h3 className="text-xl font-bold">Control Operativo de Infraestructura</h3>
 <p className="text-slate-400 font-medium mt-1 max-w-2xl">
 Has iniciado sesión con privilegios globales en <span className="text-white font-bold">{companyName}</span>. 
 Para garantizar la integridad de los registros, la edición de datos maestros de cuenta está restringida en este modo.
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Perfil Banner */}
 <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
 <div className="bg-gradient-to-r from-blue-700 to-blue-900 h-auto py-14 md:h-40 md:py-0 px-4 md:px-10 flex items-center md:items-end">
 <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 pb-0 md:pb-2 px-2 md:px-10 w-full text-center md:text-left">
 <div className="w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[2rem] bg-white p-1.5 md:p-2 shadow-2xl max-md:transform-none md:translate-y-12 shrink-0">
 <div className="w-full h-full rounded-[1.2rem] md:rounded-[1.5rem] bg-slate-50 text-slate-700 flex items-center justify-center text-3xl md:text-4xl font-bold border border-slate-200">
 {extendedUser.name?.charAt(0).toUpperCase() || 'U'}
 </div>
 </div>
 <div className="mb-0 md:mb-6 mt-3 md:mt-0">
 <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
 {extendedUser.name}
 </h2>
 <p className="text-blue-100/80 font-bold flex items-center justify-center md:justify-start gap-2 mt-2 text-[10px] md:text-xs tracking-tight">
 <Mail size={12} className="text-blue-300" />
 {extendedUser.email}
 </p>
 </div>
 </div>
 </div>

 <div className="pt-8 md:pt-20 pb-6 md:pb-10 px-6 md:px-10">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-50">
 <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-all hover:border-blue-100">
 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
 <Building size={22} />
 </div>
 <div>
 <span className="block text-[10px] font-black text-slate-400 tracking-tight">Empresa</span>
 <span className="text-sm font-black text-slate-700">{companyName}</span>
 </div>
 </div>

 <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-all hover:border-blue-100">
 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 border border-slate-100">
 <Shield size={22} />
 </div>
 <div>
 <span className="block text-[10px] font-black text-slate-400 tracking-tight">Rol de Sistema</span>
 <span className="text-sm font-black text-slate-700 capitalize">{extendedUser?.role_id?.replace('_', ' ') || 'Usuario'}</span>
 </div>
 </div>

 <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 transition-all hover:border-blue-100">
 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 border border-slate-100">
 <CalendarClock size={22} />
 </div>
 <div>
 <span className="block text-[10px] font-black text-slate-400 tracking-tight">Miembro Desde</span>
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
 <div className={extendedUser.is_impersonating ?"opacity-60 pointer-events-none grayscale-[0.5]" : ""}>
 <AccountForm key={`${extendedUser.name}-${extendedUser.email}`} user={extendedUser} />
 </div>
 </div>

 </div>
 )
}
