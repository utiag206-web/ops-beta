'use client'

import { useState } from 'react'
import { User, Mail, Lock, Save, KeyRound, CheckCircle2, AlertCircle, Building } from 'lucide-react'
import { updateProfile, updatePassword } from '@/app/(main)/profile/actions'
import { toast } from 'sonner'

interface AccountFormProps {
  user: any
}

export function AccountForm({ user }: AccountFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || ''
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await updateProfile(formData)
    if (res.success) {
      toast.success('Perfil actualizado correctamente')
    } else {
      toast.error(res.error || 'Error al actualizar perfil')
    }
    setLoading(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    const res = await updatePassword(password)
    if (res.success) {
      toast.success('Contraseña actualizada correctamente')
      setPassword('')
      setConfirmPassword('')
    } else {
      toast.error(res.error || 'Error al cambiar contraseña')
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Perfil Personal */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-full relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex items-center gap-5 mb-10">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-100 transform -rotate-6 group-hover:rotate-0 transition-transform">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Datos Personales</h3>
            <p className="text-sm font-semibold text-slate-400">Información básica de tu perfil operativo.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-8 flex-1">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre Completo</label>
            <div className="relative group/input">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" size={20} />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-[1.5rem] p-5 pl-14 text-slate-900 font-bold transition-all outline-none shadow-sm placeholder:text-slate-300"
                placeholder="Nombre completo..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Correo Electrónico Corporativo</label>
            <div className="relative group/input">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" size={20} />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-blue-50/50 border-2 border-blue-100/50 focus:border-blue-600 focus:bg-white rounded-[1.5rem] p-5 pl-14 text-blue-900 font-black transition-all outline-none shadow-sm"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Área / Departamento (Solo Lectura)</label>
            <div className="relative group/input">
              <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                value={user.area || 'Sin asignar'}
                readOnly
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 pl-14 text-slate-500 font-bold transition-all outline-none shadow-sm cursor-not-allowed opacity-75"
              />
            </div>
            <div className="flex items-start gap-2 ml-1">
              <AlertCircle size={14} className="text-blue-400 mt-0.5" />
              <p className="text-[10px] text-slate-400 font-medium italic leading-normal">
                Su área administrativa es gestionada por RRHH. Contacte al administrador para correcciones.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-[1.5rem] font-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-100"
          >
            <Save size={22} />
            Actualizar Perfil
          </button>
        </form>
      </div>

      {/* Seguridad */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-full relative overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center gap-5 mb-10">
          <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg shadow-emerald-100 transform rotate-6 group-hover:rotate-0 transition-transform">
            <KeyRound size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Acceso y Seguridad</h3>
            <p className="text-sm font-semibold text-slate-400">Protege tu cuenta con una contraseña fuerte.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-8 flex-1">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nueva Contraseña</label>
            <div className="relative group/input">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-[1.5rem] p-5 pl-14 text-slate-900 font-bold transition-all outline-none shadow-sm placeholder:text-slate-300"
                placeholder="Introducir nueva clave..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Re-escribir Contraseña</label>
            <div className="relative group/input">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" size={20} />
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white rounded-[1.5rem] p-5 pl-14 text-slate-900 font-bold transition-all outline-none shadow-sm placeholder:text-slate-300"
                placeholder="Confirmar clave..."
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-[1.5rem] font-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-100"
          >
            <KeyRound size={22} />
            Cambiar Contraseña
          </button>
        </form>

        <div className="mt-10 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex gap-4">
          <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
             <AlertCircle className="text-slate-400" size={16} />
          </div>
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
            Recomendamos cambiar tu contraseña periódicamente. Usa una mezcla de letras, números y símbolos.
          </p>
        </div>
      </div>
    </div>
  )
}
