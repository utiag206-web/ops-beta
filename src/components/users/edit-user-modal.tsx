'use client'

import { useState } from 'react'
import { X, Loader2, Save, Mail, Key, UserCircle, ShieldAlert } from 'lucide-react'
import { updateUserProfile, updateUserEmail, updateUserPassword } from '@/app/(main)/users/actions'
import { toast } from 'sonner'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: {
    id: string
    name: string
    email: string
    area: string
  } | null
}

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'auth'>('profile')
  const [formData, setFormData] = useState({
    name: user?.name || '',
    area: user?.area || '',
    email: user?.email || '',
    password: ''
  })

  // Sync state when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        area: user.area,
        email: user.email,
        password: ''
      })
    }
  }, [user])

  if (!isOpen || !user) return null

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await updateUserProfile(user.id, { name: formData.name, area: formData.area })
    setLoading(false)
    if (res.success) {
      toast.success('Perfil actualizado correctamente')
      onSuccess()
    } else {
      toast.error(res.error || 'Error al actualizar perfil')
    }
  }

  const handleUpdateAuth = async (type: 'email' | 'password') => {
    setLoading(true)
    let res
    if (type === 'email') {
      res = await updateUserEmail(user.id, formData.email)
    } else {
      if (!formData.password || formData.password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres')
        setLoading(false)
        return
      }
      res = await updateUserPassword(user.id, formData.password)
    }
    setLoading(false)
    if (res.success) {
      toast.success(type === 'email' ? 'Correo actualizado' : 'Contraseña actualizada')
      if (type === 'email') onSuccess()
    } else {
      toast.error(res.error || 'Error en la actualización')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Editar Usuario</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Gestiona los detalles de acceso y perfil.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-slate-50 bg-white">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Datos de Perfil
          </button>
          <button 
            onClick={() => setActiveTab('auth')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'auth' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Seguridad y Acceso
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'profile' ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Nombre Completo</label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    required
                    type="text"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 pl-12 text-sm font-bold transition-all outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Área / Departamento</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                  value={formData.area}
                  onChange={e => setFormData({...formData, area: e.target.value})}
                >
                  <option value="">Sin Asignar</option>
                  <option value="Gerencia General">Gerencia General</option>
                  <option value="Administración">Administración</option>
                  <option value="Operaciones">Operaciones</option>
                  <option value="Almacén y Mantenimiento">Almacén y Mant.</option>
                  <option value="Seguridad SOMA">Seguridad SOMA</option>
                  <option value="Cocina">Cocina</option>
                </select>
              </div>
              <button 
                disabled={loading}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Actualizar Perfil
              </button>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                <ShieldAlert className="text-amber-600 shrink-0" size={20} />
                <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase">
                  Los cambios de correo y contraseña afectan el inicio de sesión del usuario de forma inmediata.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Correo Electrónico</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="email"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 pl-12 text-sm font-bold transition-all outline-none"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <button 
                      onClick={() => handleUpdateAuth('email')}
                      disabled={loading}
                      className="bg-slate-800 text-white px-6 rounded-2xl font-black text-xs hover:bg-black transition-all disabled:opacity-50"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-50">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Nueva Contraseña</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 pl-12 text-sm font-bold transition-all outline-none"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                    <button 
                      onClick={() => handleUpdateAuth('password')}
                      disabled={loading}
                      className="bg-slate-800 text-white px-6 rounded-2xl font-black text-xs hover:bg-black transition-all disabled:opacity-50"
                    >
                      Resetear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
