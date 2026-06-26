import { getUserSession } from '@/lib/auth'
import { stopImpersonation } from '../super-admin/actions'

export default async function DiagPage() {
 const session = await getUserSession()
 
 return (
 <div className="p-10 space-y-6">
 <h1 className="text-3xl font-black">Diagnóstico de Sesión</h1>
 <div className="bg-slate-900 text-emerald-400 p-8 rounded-[2rem] font-mono text-sm overflow-auto max-h-[80vh]">
 <pre>{JSON.stringify({
 auth_user: session.user?.email,
 auth_id: session.user?.id,
 extended_user: {
 email: session.extendedUser?.email,
 role_id: session.extendedUser?.role_id,
 company_id: session.extendedUser?.company_id,
 active_company_id: session.extendedUser?.active_company_id,
 is_impersonating: session.extendedUser?.is_impersonating,
 display_name: session.extendedUser?.display_name
 }
 }, null, 2)}</pre>
 </div>
 <div className="flex gap-4">
 <form action={async () => {
 'use server'
 await stopImpersonation()
 }}>
 <button type="submit" className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:bg-rose-700 transition-all">
 Restaurar Contexto Global (Limpiar Cookies)
 </button>
 </form>
 <a href="/dashboard" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">Ir a Dashboard</a>
 <a href="/super-admin" className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl font-black">Consola Global SaaS</a>
 </div>
 </div>
 )
}
