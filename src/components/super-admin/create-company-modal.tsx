'use client'

import { useState } from 'react'
import { 
 Building2, Plus, X, User, Mail, Lock, 
 Shield, CheckCircle2, Loader2, Copy 
} from 'lucide-react'
import { createCompany } from '@/app/(main)/super-admin/actions'
import { useRouter } from 'next/navigation'

interface CreateCompanyModalProps {
 isOpen: boolean
 onClose: () => void
}

export function CreateCompanyModal({ isOpen, onClose }: CreateCompanyModalProps) {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [success, setSuccess] = useState<any>(null)
 const [error, setError] = useState<string | null>(null)
 
 const [formData, setFormData] = useState({
 name: '',
 adminName: '',
 adminEmail: '',
 adminPassword: '',
 is_test: false
 })

 if (!isOpen) return null

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 setError(null)

 try {
 const res = await createCompany(formData)
 if (res.error) {
 setError(res.error)
 } else {
 setSuccess(res)
 router.refresh()
 }
 } catch (err: any) {
 setError(err.message || 'Error inesperado')
 } finally {
 setLoading(false)
 }
 }

 const copyToClipboard = (text: string) => {
 navigator.clipboard.writeText(text)
 alert('Copiado al portapapeles')
 }

 if (success) {
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
 <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
 <div className="p-10 text-center">
 <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
 <CheckCircle2 size={40} />
 </div>
 <h2 className="text-3xl font-black text-slate-900 mb-2">¡Empresa Creada!</h2>
 <p className="text-slate-500 font-medium mb-8">La infraestructura ha sido inicializada correctamente.</p>
 
 <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 border border-slate-100 mb-8">
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight mb-1">Empresa</p>
 <p className="font-bold text-slate-900">{success.data.name}</p>
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 tracking-tight mb-1">Email Administrador</p>
 <p className="font-bold text-slate-900">{formData.adminEmail}</p>
 </div>
 <div className="relative">
 <p className="text-[10px] font-black text-slate-400 tracking-tight mb-1">Contraseña Temporal</p>
 <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
 <code className="font-mono font-bold text-slate-700">{success.password}</code>
 <button 
 onClick={() => copyToClipboard(success.password)}
 className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
 >
 <Copy size={16} />
 </button>
 </div>
 </div>
 </div>

 <button 
 onClick={onClose}
 className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
 >
 Cerrar y Continuar
 </button>
 </div>
 </div>
 </div>
 )
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
 <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
 <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/10">
 <Building2 size={24} />
 </div>
 <div>
 <h2 className="text-xl font-black text-slate-900 leading-none">Nueva Empresa</h2>
 <p className="text-slate-400 text-sm font-medium mt-1">Configurar nueva instancia del ecosistema</p>
 </div>
 </div>
 <button 
 onClick={onClose}
 className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
 >
 <X size={24} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-8 space-y-8" autoComplete="off">
 {error && (
 <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
 <X size={18} className="shrink-0" />
 {error}
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="col-span-1 md:col-span-2 space-y-2">
 <label className="text-[10px] font-black text-slate-400 tracking-tight ml-4">Nombre de la Empresa</label>
 <div className="relative">
 <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
 <input 
 required
 type="text"
 placeholder="Ej: Constructora Horizonte SAC"
 value={formData.name}
 onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
 autoComplete="new-company-name"
 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[10px] font-black text-slate-400 tracking-tight ml-4">Nombre Administrador</label>
 <div className="relative">
 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
 <input 
 required
 type="text"
 placeholder="Nombre completo"
 value={formData.adminName}
 onChange={(e) => setFormData(prev => ({...prev, adminName: e.target.value}))}
 autoComplete="new-admin-fullname"
 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[10px] font-black text-slate-400 tracking-tight ml-4">Email Principal</label>
 <div className="relative">
 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
 <input 
 required
 type="email"
 placeholder="admin@empresa.com"
 value={formData.adminEmail}
 onChange={(e) => setFormData(prev => ({...prev, adminEmail: e.target.value}))}
 autoComplete="new-admin-email"
 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
 />
 </div>
 </div>

 <div className="col-span-1 md:col-span-2 space-y-2">
 <label className="text-[10px] font-black text-slate-400 tracking-tight ml-4 flex justify-between items-center">
 <span>Contraseña (Opcional)</span>
 <span className="text-slate-300 lowercase font-medium">Dejar vacío para auto-generar</span>
 </label>
 <div className="relative">
 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
 <input 
 type="password"
 placeholder="••••••••••••"
 value={formData.adminPassword}
 onChange={(e) => setFormData(prev => ({...prev, adminPassword: e.target.value}))}
 autoComplete="new-admin-password"
 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
 />
 </div>
 </div>

 <div className="col-span-1 md:col-span-2">
 <label className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl cursor-pointer transition-colors border-2 border-transparent focus-within:border-slate-900 group">
 <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
 formData.is_test ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'
 }`}>
 {formData.is_test && <CheckCircle2 size={16} className="text-white" />}
 </div>
 <input 
 type="checkbox" 
 className="hidden"
 checked={formData.is_test}
 onChange={(e) => setFormData(prev => ({...prev, is_test: e.target.checked}))}
 />
 <div className="flex flex-col">
 <span className="text-sm font-black text-slate-900">Empresa de Prueba</span>
 <span className="text-[10px] font-medium text-slate-400 tracking-normal">Habilita la eliminación futura y marca como entorno de desarrollo</span>
 </div>
 </label>
 </div>
 </div>

 <div className="pt-4 flex flex-col md:flex-row gap-4">
 <button 
 type="button"
 onClick={onClose}
 className="flex-1 px-6 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all"
 >
 Cancelar
 </button>
 <button 
 disabled={loading}
 className="flex-[2] bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {loading ? (
 <>
 <Loader2 size={20} className="animate-spin" />
 <span>Inicializando Ecosistema...</span>
 </>
 ) : (
 <>
 <Shield size={20} />
 <span>Crear e Inicializar Empresa</span>
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 )
}
