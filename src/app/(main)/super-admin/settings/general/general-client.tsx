'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Globe2, Save, UploadCloud, PaintBucket, X, Image as ImageIcon } from 'lucide-react'
import { updateGlobalSettings, GlobalSettingsData, uploadEcosystemAsset } from './actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface GeneralSettingsClientProps {
  initialData: GlobalSettingsData | null
}

export function GeneralSettingsClient({ initialData }: GeneralSettingsClientProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  // ESTADO REAL - Conectado a la base de datos (global_settings)
  const [settings, setSettings] = useState<GlobalSettingsData>({
    ecosystem_name: initialData?.ecosystem_name || 'INTHALY OPS',
    ecosystem_logo: initialData?.ecosystem_logo || '',
    ecosystem_favicon: initialData?.ecosystem_favicon || '',
    ecosystem_commercial_name: initialData?.ecosystem_commercial_name || '',
    ecosystem_description: initialData?.ecosystem_description || '',
    default_language: initialData?.default_language || 'es',
    default_timezone: initialData?.default_timezone || 'America/Lima',
    default_currency: initialData?.default_currency || 'PEN',
    default_date_format: initialData?.default_date_format || 'DD/MM/YYYY',
    default_number_format: initialData?.default_number_format || 'es-PE',
    brand_color: initialData?.brand_color || '#2563eb'
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'ecosystem_logo' | 'ecosystem_favicon') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen')
      return
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB')
      return
    }

    const isLogo = field === 'ecosystem_logo'
    isLogo ? setIsUploadingLogo(true) : setIsUploadingFavicon(true)
    const loadingId = toast.loading('Subiendo imagen al servidor...')

    try {
      const id = isLogo ? 'logo' : 'favicon'
      
      const formData = new FormData()
      formData.append('id', id)
      formData.append('file', file)
      
      // Llamar al Server Action usando FormData estándar
      const { success, url, error } = await uploadEcosystemAsset(formData)

      if (!success || !url) throw new Error(error || 'Error desconocido al subir el asset')

      setSettings(prev => ({ ...prev, [field]: url }))
      toast.success('Imagen subida y URL actualizada', { id: loadingId })
    } catch (err: any) {
      console.error('Error uploading image:', err)
      toast.error(err.message || 'Error al subir la imagen a la base de datos', { id: loadingId })
    } finally {
      isLogo ? setIsUploadingLogo(false) : setIsUploadingFavicon(false)
      // Limpiar input
      if (isLogo && logoInputRef.current) logoInputRef.current.value = ''
      if (!isLogo && faviconInputRef.current) faviconInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    // Validaciones básicas
    if (!settings.ecosystem_name.trim()) {
      toast.error('El nombre del ecosistema es obligatorio')
      return
    }

    setIsSaving(true)
    
    // Llamada real al Server Action
    const result = await updateGlobalSettings(settings)
    
    setIsSaving(false)
    
    if (result.success) {
      toast.success('Configuración global actualizada')
    } else {
      toast.error(result.error || 'Ocurrió un error al guardar')
    }
  }

  const inputClasses = "h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50 focus:bg-white"
  const labelClasses = "text-xs font-bold text-slate-500 mb-1.5 block tracking-tight uppercase"

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      
      {/* Navigation */}
      <div>
        <Link 
          href="/super-admin/settings"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Configuración
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Configuración General</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Identidad institucional y preferencias regionales del ecosistema.</p>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-full sm:w-auto justify-center"
          >
            <Save size={18} />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Identidad del Ecosistema */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Identidad del Ecosistema</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Nombre, logo y colores base de la plataforma SaaS.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div className="md:col-span-2">
            <label className={labelClasses}>Nombre del Ecosistema</label>
            <input 
              type="text" 
              className={inputClasses} 
              value={settings.ecosystem_name}
              onChange={e => setSettings({...settings, ecosystem_name: e.target.value})}
              placeholder="Ej. INTHALY OPS"
            />
            <p className="text-[10px] text-slate-400 font-medium mt-1.5 ml-1">Este nombre aparecerá en correos globales y encabezados base.</p>
          </div>

          <div>
            <label className={labelClasses}>Logo Principal</label>
            <div className="mt-2 flex flex-col items-start gap-4">
              {settings.ecosystem_logo ? (
                <div className="relative group rounded-xl border border-slate-200 bg-white p-2 h-24 w-full flex items-center justify-center overflow-hidden">
                  <img src={settings.ecosystem_logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => setSettings({...settings, ecosystem_logo: ''})}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 shadow-sm"
                      title="Eliminar logo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 transition-colors p-4 h-24 w-full flex flex-col items-center justify-center cursor-pointer text-slate-500 group"
                >
                  <UploadCloud size={24} className="mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-xs font-medium">Subir Imagen (Máx 2MB)</span>
                </div>
              )}
              <input 
                ref={logoInputRef}
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={e => handleFileUpload(e, 'ecosystem_logo')}
                disabled={isUploadingLogo}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Favicon</label>
            <div className="mt-2 flex flex-col items-start gap-4">
              {settings.ecosystem_favicon ? (
                <div className="relative group rounded-xl border border-slate-200 bg-white p-2 h-24 w-full flex items-center justify-center overflow-hidden">
                  <img src={settings.ecosystem_favicon} alt="Favicon" className="h-10 w-10 object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => setSettings({...settings, ecosystem_favicon: ''})}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 shadow-sm"
                      title="Eliminar favicon"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => faviconInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 transition-colors p-4 h-24 w-full flex flex-col items-center justify-center cursor-pointer text-slate-500 group"
                >
                  <UploadCloud size={24} className="mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-xs font-medium">Subir Favicon (Máx 2MB)</span>
                </div>
              )}
              <input 
                ref={faviconInputRef}
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={e => handleFileUpload(e, 'ecosystem_favicon')}
                disabled={isUploadingFavicon}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Color de Marca Principal</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                className="h-11 w-14 rounded-xl cursor-pointer bg-slate-50 border border-slate-200 p-1"
                value={settings.brand_color}
                onChange={e => setSettings({...settings, brand_color: e.target.value})}
              />
              <div className="relative flex-1">
                <input 
                  type="text" 
                  className={`${inputClasses} pl-10`} 
                  value={settings.brand_color}
                  onChange={e => setSettings({...settings, brand_color: e.target.value})}
                  placeholder="#000000"
                />
                <PaintBucket size={16} className="absolute left-3 top-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferencias Regionales */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Globe2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Preferencias Regionales</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Formatos por defecto para nuevas empresas e usuarios.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          <div>
            <label className={labelClasses}>Idioma Predeterminado</label>
            <select 
              className={inputClasses}
              value={settings.default_language}
              onChange={e => setSettings({...settings, default_language: e.target.value})}
            >
              <option value="es">Español (Latinoamérica)</option>
              <option value="en">English (US)</option>
              <option value="pt">Português (Brasil)</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>Zona Horaria Base</label>
            <select 
              className={inputClasses}
              value={settings.default_timezone}
              onChange={e => setSettings({...settings, default_timezone: e.target.value})}
            >
              <option value="America/Lima">America/Lima (UTC-5)</option>
              <option value="America/Bogota">America/Bogota (UTC-5)</option>
              <option value="America/Santiago">America/Santiago (UTC-4)</option>
              <option value="America/Mexico_City">America/Mexico_City (UTC-6)</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>Moneda Predeterminada</label>
            <select 
              className={inputClasses}
              value={settings.default_currency}
              onChange={e => setSettings({...settings, default_currency: e.target.value})}
            >
              <option value="PEN">Soles (PEN - S/)</option>
              <option value="USD">Dólar (USD - $)</option>
              <option value="EUR">Euro (EUR - €)</option>
              <option value="MXN">Peso Mexicano (MXN - $)</option>
              <option value="COP">Peso Colombiano (COP - $)</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>Formato de Fecha</label>
            <select 
              className={inputClasses}
              value={settings.default_date_format}
              onChange={e => setSettings({...settings, default_date_format: e.target.value})}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Ej. 31/12/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (Ej. 12/31/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (Ej. 2026-12-31)</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>Formato Numérico</label>
            <select 
              className={inputClasses}
              value={settings.default_number_format}
              onChange={e => setSettings({...settings, default_number_format: e.target.value})}
            >
              <option value="es-PE">1.000,00 (Punto mil, coma decimal)</option>
              <option value="en-US">1,000.00 (Coma mil, punto decimal)</option>
            </select>
          </div>
        </div>
      </div>

    </div>
  )
}
