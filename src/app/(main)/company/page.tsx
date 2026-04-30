'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Save, MapPin, Phone, Upload, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { getCompanyProfile, updateCompanyProfile } from './actions'

export default function CompanyProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    contact_email: '',
    tax_id: '',
    industry: '',
    timezone: 'UTC-5',
    working_hours: '',
    logo_url: ''
  })

  useEffect(() => {
    async function loadData() {
      const profile = await getCompanyProfile()
      if (profile) {
        setFormData({
          name: profile.name || '',
          address: profile.address || '',
          phone: profile.phone || '',
          contact_email: profile.contact_email || '',
          tax_id: profile.tax_id || '',
          industry: profile.industry || '',
          timezone: profile.timezone || 'UTC-5',
          working_hours: profile.working_hours || '',
          logo_url: profile.logo_url || ''
        })
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const result = await updateCompanyProfile(formData)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Perfil de empresa actualizado correctamente.' })
      router.refresh()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al actualizar.' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Identidad Corporativa</h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Centraliza y gestiona los datos oficiales de tu organización.</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          <span className="text-blue-700 font-bold text-sm tracking-wide uppercase">Configuración Activa</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Sections */}
        <div className="lg:col-span-2 space-y-8">
          {message && (
            <div className={`p-5 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-100' : 'bg-rose-50 text-rose-700 border-2 border-rose-100'
            }`}>
              <div className={`p-2 rounded-xl ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              </div>
              <p className="text-base font-black leading-tight">{message.text}</p>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
              <div className="bg-blue-600 p-3.5 rounded-2xl text-white shadow-lg shadow-blue-200">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Información General</h3>
                <p className="text-sm font-medium text-slate-500 tracking-tight">Datos principales requeridos para la operación del sistema.</p>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Razón Social *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-slate-800 font-bold transition-all outline-none text-base placeholder:text-slate-300"
                    placeholder="Ej. Corporación Inthaly S.A.C."
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">ID Fiscal / RUC</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-slate-800 font-bold transition-all outline-none text-base placeholder:text-slate-300"
                    placeholder="20123456789"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dirección Matriz *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    required
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl p-4 pl-12 text-slate-800 font-bold transition-all outline-none text-base placeholder:text-slate-300"
                    placeholder="Av. Javier Prado Este 1234, San Isidro, Lima"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">E-mail Corporativo *</label>
                  <input
                    required
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-slate-800 font-bold transition-all outline-none text-base placeholder:text-slate-300"
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Teléfono Central *</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-slate-800 font-bold transition-all outline-none text-base placeholder:text-slate-300"
                    placeholder="+51 987 654 321"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Extended Details */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
              <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
                <Upload size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Detalles Operativos</h3>
                <p className="text-sm font-medium text-slate-500 tracking-tight">Personalización del entorno y logística empresarial.</p>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sector / Industria</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-slate-800 font-bold transition-all outline-none text-base"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Minera">Minería y Energía</option>
                    <option value="Construcción">Construcción</option>
                    <option value="Servicios">Servicios Generales</option>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Transporte">Transporte y Logística</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Zona Horaria</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-slate-800 font-bold transition-all outline-none text-base"
                  >
                    <option value="UTC-5">Perú, Colombia (UTC-5)</option>
                    <option value="UTC-4">Chile, Bolivia (UTC-4)</option>
                    <option value="UTC-3">Argentina, Brasil (UTC-3)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Horario Laboral Sugerido</label>
                <input
                  type="text"
                  value={formData.working_hours}
                  onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-slate-800 font-bold transition-all outline-none text-base placeholder:text-slate-300"
                  placeholder="Ej. Lunes a Viernes 08:30 - 18:00"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Logo Institucional</label>
                <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-blue-400 transition-all group">
                  <div className="w-32 h-32 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <Building2 size={40} className="text-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">Actualizar Logo</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">Formatos: PNG, JPG o SVG. Tamaño máx: 2MB.</p>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <label className="cursor-pointer bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm">
                        <Upload size={14} strokeWidth={3} />
                        Seleccionar Archivo
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setSaving(true)
                              const upData = new FormData()
                              upData.append('file', file)
                              const { uploadCompanyLogo } = await import('./actions')
                              const res = await uploadCompanyLogo(upData)
                              if (res.success && res.url) {
                                setFormData({ ...formData, logo_url: res.url })
                                setMessage({ type: 'success', text: 'Logo actualizado correctamente.' })
                              } else {
                                setMessage({ type: 'error', text: res.error || 'Error al subir.' })
                              }
                              setSaving(false)
                            }
                          }}
                        />
                      </label>
                      {formData.logo_url && (
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, logo_url: '' })}
                          className="bg-rose-50 hover:bg-rose-100 border-2 border-rose-100 text-rose-600 px-5 py-2.5 rounded-xl text-xs font-black transition-all"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Tips */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-8">
            <h4 className="text-xl font-black text-slate-800 mb-2">Guardar Cambios</h4>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-snug">Asegúrate de que la información sea verídica antes de confirmar.</p>
            
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-50 text-white p-5 rounded-2xl font-black transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 group"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-b-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Save size={24} className="group-hover:scale-110 transition-transform" />
                  <span>Confirmar y Guardar</span>
                </>
              )}
            </button>

            <div className="mt-8 space-y-4 pt-8 border-t border-slate-50">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  Los datos se reflejan automáticamente en el Dashboard.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={14} />
                </div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  Campos marcados con (*) son obligatorios para desbloquear módulos operativos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
